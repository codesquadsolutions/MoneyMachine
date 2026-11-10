import { FieldValue, getFirestore } from "firebase-admin/firestore";
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
  const raw =
    data.total_amount ??
    data.amount ??
    data.amount_cents ??
    data.billing_amount ??
    0;
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
  const db = getFirestore();
  const index = await db.collection("affiliateCodes").doc(normalized).get();
  if (!index.exists || index.data()?.active === false) return null;
  const affiliateId = index.data()?.affiliateId;
  if (!affiliateId) return null;
  const affiliate = await db.collection("affiliates").doc(affiliateId).get();
  if (!affiliate.exists) return null;
  const profile = affiliate.data();
  if (profile.status !== "active") return null;
  return { id: affiliateId, ...profile };
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

  const db = getFirestore();
  const convRef = db.collection("affiliateConversions").doc(orderKey);
  const existing = await convRef.get();
  if (existing.exists) {
    return { skipped: true, reason: "duplicate", conversionId: orderKey };
  }

  const saleAmountCents = extractAmountCents(event);
  const commissionAmountCents = commissionFromSale(saleAmountCents, affiliate.commissionRateBps);

  const orderAt =
    event?.timestamp || event?.data?.created_at || event?.data?.order_date || new Date().toISOString();

  await convRef.set({
    affiliateId: affiliate.id,
    orderId: orderKey,
    saleAmountCents,
    commissionAmountCents,
    currency: event?.data?.currency || "USD",
    couponCode,
    status: "pending",
    eventType: type,
    orderAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  const day = new Date().toISOString().slice(0, 10);
  const statsRef = db.collection("affiliateStatsDaily").doc(`${affiliate.id}_${day}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    const prev = snap.exists ? snap.data() : {};
    tx.set(
      statsRef,
      {
        affiliateId: affiliate.id,
        day,
        conversions: (prev.conversions || 0) + 1,
        saleAmountCents: (prev.saleAmountCents || 0) + saleAmountCents,
        commissionAmountCents: (prev.commissionAmountCents || 0) + commissionAmountCents,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return { ok: true, conversionId: orderKey, affiliateId: affiliate.id, commissionAmountCents };
}

async function reverseConversion(event, webhookId) {
  const paymentId =
    event?.data?.payment_id ||
    event?.data?.original_payment_id ||
    event?.data?.subscription_id ||
    "";
  if (!paymentId) return { skipped: true, reason: "no_payment_for_reversal" };
  const db = getFirestore();
  const ref = db.collection("affiliateConversions").doc(String(paymentId));
  const snap = await ref.get();
  if (!snap.exists) {
    const byOrder = await db
      .collection("affiliateConversions")
      .where("orderId", "==", String(paymentId))
      .limit(1)
      .get();
    if (byOrder.empty) return { skipped: true, reason: "conversion_not_found" };
    await byOrder.docs[0].ref.update({
      status: "reversed",
      reversedAt: FieldValue.serverTimestamp(),
      reversalWebhookId: webhookId || "",
    });
    return { ok: true, reversed: true };
  }
  await ref.update({
    status: "reversed",
    reversedAt: FieldValue.serverTimestamp(),
    reversalWebhookId: webhookId || "",
  });
  return { ok: true, reversed: true };
}
