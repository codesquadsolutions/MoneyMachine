import { query } from "../db.js";
import { commissionFromSale, normalizeCode } from "./util.js";

const COMMISSION_EVENTS = new Set([
  "payment.succeeded",
  "subscription.active",
  "subscription.renewed",
]);

const REVERSAL_EVENTS = new Set(["refund.succeeded"]);

export function extractOrderKey(event) {
  const data = event?.data || {};
  return (
    data.payment_id ||
    data.subscription_id ||
    data.id ||
    event?.data?.payload?.payment_id ||
    ""
  );
}

export function extractAmountCents(event) {
  const data = event?.data || {};
  const raw = data.total_amount ?? data.amount ?? data.amount_cents ?? data.billing_amount ?? 0;
  return Math.max(0, Math.floor(Number(raw) || 0));
}

export function extractCouponCode(event) {
  const data = event?.data || {};
  const meta = data.metadata || data.custom_data || {};
  if (meta.referral_code) return normalizeCode(meta.referral_code);
  if (meta.coupon_code) return normalizeCode(meta.coupon_code);
  const codes = data.discount_codes || data.discount_code;
  if (Array.isArray(codes) && codes.length) return normalizeCode(codes[0]);
  if (typeof codes === "string" && codes) return normalizeCode(codes);
  return "";
}

export async function lookupAffiliateByCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const { rows } = await query(
    `SELECT a.* FROM affiliate_codes c
     JOIN affiliates a ON a.id = c.affiliate_id
     WHERE c.code = $1 AND c.active = TRUE AND a.status = 'active'
     LIMIT 1`,
    [normalized],
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id,
    commissionRateBps: row.commission_rate_bps,
    couponCode: row.coupon_code,
    status: row.status,
  };
}

export async function processAffiliateSale(event, webhookId) {
  const type = String(event?.type || "");
  if (REVERSAL_EVENTS.has(type)) {
    return reverseConversion(event, webhookId);
  }
  if (!COMMISSION_EVENTS.has(type)) {
    return { skipped: true, reason: "event_type" };
  }

  const couponCode = extractCouponCode(event);
  if (!couponCode) return { skipped: true, reason: "no_coupon" };

  const affiliate = await lookupAffiliateByCode(couponCode);
  if (!affiliate) return { skipped: true, reason: "unknown_coupon" };

  const orderKey = String(extractOrderKey(event) || webhookId || "");
  if (!orderKey) return { skipped: true, reason: "no_order_id" };

  const existing = await query(`SELECT id FROM affiliate_conversions WHERE id = $1 OR order_id = $1 LIMIT 1`, [
    orderKey,
  ]);
  if (existing.rows[0]) {
    return { skipped: true, reason: "duplicate", conversionId: existing.rows[0].id };
  }

  const saleAmountCents = extractAmountCents(event);
  const commissionAmountCents = commissionFromSale(saleAmountCents, affiliate.commissionRateBps);
  const orderAt =
    event?.timestamp || event?.data?.created_at || event?.data?.order_date || new Date().toISOString();

  await query(
    `INSERT INTO affiliate_conversions (
      id, affiliate_id, order_id, sale_amount_cents, commission_amount_cents, currency, coupon_code, status, event_type, order_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9)`,
    [
      orderKey,
      affiliate.id,
      orderKey,
      saleAmountCents,
      commissionAmountCents,
      event?.data?.currency || "USD",
      couponCode,
      type,
      orderAt,
    ],
  );

  return { ok: true, conversionId: orderKey, affiliateId: affiliate.id, commissionAmountCents };
}

async function reverseConversion(event, webhookId) {
  const paymentId =
    event?.data?.payment_id ||
    event?.data?.original_payment_id ||
    event?.data?.subscription_id ||
    "";
  if (!paymentId) return { skipped: true, reason: "no_payment_for_reversal" };
  const result = await query(
    `UPDATE affiliate_conversions
     SET status = 'reversed', updated_at = NOW()
     WHERE id = $1 OR order_id = $1`,
    [String(paymentId)],
  );
  if (!result.rowCount) return { skipped: true, reason: "conversion_not_found" };
  return { ok: true, reversed: true, webhookId: webhookId || "" };
}
