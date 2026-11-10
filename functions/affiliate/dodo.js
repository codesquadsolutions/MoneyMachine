import DodoPayments from "dodopayments";
import { defineSecret } from "firebase-functions/params";
import { FLIPUR_DODO_PRODUCT_IDS } from "./dodoProducts.js";

export const dodoApiKey = defineSecret("DODO_PAYMENTS_API_KEY");
export const dodoWebhookKey = defineSecret("DODO_PAYMENTS_WEBHOOK_KEY");
export const dodoProductId = defineSecret("DODO_FLIPUR_PRODUCT_ID");
export const dodoProductIdMonthly = defineSecret("DODO_FLIPUR_PRODUCT_ID_MONTHLY");
export const dodoProductIdYearly = defineSecret("DODO_FLIPUR_PRODUCT_ID_YEARLY");
export const dodoAutorenewDiscountCode = defineSecret("DODO_AUTORENEW_DISCOUNT_CODE");

function environment() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
}

export function dodoClient() {
  const bearer = dodoApiKey.value();
  if (!bearer) return null;
  return new DodoPayments({
    bearerToken: bearer,
    environment: environment(),
    webhookKey: dodoWebhookKey.value() || undefined,
  });
}

/** @returns {Promise<string|null>} discount id */
export async function ensureDodoDiscount({ code, affiliateId, commissionBps }) {
  const client = dodoClient();
  if (!client) return null;
  const normalized = String(code).toUpperCase();
  try {
    const existing = await client.discounts.retrieveByCode(normalized);
    return existing.discount_id || existing.id || null;
  } catch {
    // not found — create
  }
  try {
    const created = await client.discounts.create({
      type: "percentage",
      amount: 500, // 5% customer discount default; commission is separate in our ledger
      code: normalized,
      metadata: { affiliateId, commissionBps: String(commissionBps) },
    });
    return created.discount_id || created.id || null;
  } catch (err) {
    console.error("dodo.discounts.create failed", err.message || err);
    return null;
  }
}

function resolveProductId(plan) {
  const yearly =
    dodoProductIdYearly.value() ||
    process.env.DODO_FLIPUR_PRODUCT_ID_YEARLY ||
    FLIPUR_DODO_PRODUCT_IDS.yearly;
  const monthly =
    dodoProductIdMonthly.value() ||
    dodoProductId.value() ||
    process.env.DODO_FLIPUR_PRODUCT_ID_MONTHLY ||
    FLIPUR_DODO_PRODUCT_IDS.monthly;
  if (plan === "yearly") return yearly || null;
  return monthly || null;
}

const AUTORENEW_PERCENT = 5;

/** Ensures a store-wide 5% code for auto-renew opt-in at checkout. */
export async function ensureAutorenewDiscount() {
  const client = dodoClient();
  if (!client) return null;
  const fromSecret = (dodoAutorenewDiscountCode.value() || "AUTORENEW5").trim().toUpperCase();
  try {
    const existing = await client.discounts.retrieveByCode(fromSecret);
    return existing.discount_id || existing.id || fromSecret;
  } catch {
    // not found
  }
  try {
    await client.discounts.create({
      type: "percentage",
      amount: AUTORENEW_PERCENT * 100,
      code: fromSecret,
      metadata: { flipur: "autorenew" },
    });
    return fromSecret;
  } catch (err) {
    console.error("dodo.autorenew discount failed", err.message || err);
    return fromSecret;
  }
}

export async function createFlipurCheckoutSession({
  email,
  name,
  discountCode,
  plan = "monthly",
  autoRenew = false,
}) {
  const client = dodoClient();
  const productId = resolveProductId(plan === "yearly" ? "yearly" : "monthly");
  if (!client || !productId) {
    const error = new Error("Checkout is not configured yet.");
    error.code = "failed-precondition";
    throw error;
  }
  const codes = [];
  if (autoRenew) {
    const autoCode = await ensureAutorenewDiscount();
    if (autoCode) codes.push(String(autoCode).toUpperCase());
  }
  if (discountCode) {
    codes.push(String(discountCode).toUpperCase());
  }

  const payload = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email, ...(name ? { name } : {}) },
    return_url: `${process.env.FLIPUR_SITE_ORIGIN || "http://localhost:5173"}/checkout/success`,
    metadata: {
      plan,
      auto_renew: String(autoRenew),
      ...(discountCode ? { referral_code: discountCode } : {}),
    },
    feature_flags: { allow_discount_code: true },
  };
  if (codes.length) {
    payload.discount_codes = [...new Set(codes)];
  }
  const session = await client.checkoutSessions.create(payload);
  return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
}
