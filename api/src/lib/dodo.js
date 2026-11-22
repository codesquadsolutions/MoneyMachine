import DodoPayments from "dodopayments";
import { FLIPUR_DODO_PRODUCT_IDS } from "./dodoProducts.js";
import { siteOrigin } from "./constants.js";

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function environment() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
}

export function dodoClient() {
  const bearer = env("DODO_PAYMENTS_API_KEY");
  if (!bearer) return null;
  return new DodoPayments({
    bearerToken: bearer,
    environment: environment(),
    webhookKey: env("DODO_PAYMENTS_WEBHOOK_KEY") || undefined,
  });
}

export function dodoApiConfigured() {
  return Boolean(env("DODO_PAYMENTS_API_KEY"));
}

/** @returns {Promise<string|null>} discount id */
export async function ensureDodoDiscount({ code, affiliateId, commissionBps, required = false }) {
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
      amount: 500,
      code: normalized,
      metadata: { affiliateId, commissionBps: String(commissionBps) },
    });
    return created.discount_id || created.id || null;
  } catch (err) {
    console.error("dodo.discounts.create failed", err.message || err);
    if (required) {
      const error = new Error("Could not create the affiliate coupon in Dodo Payments. Try again after resolving the Dodo error.");
      error.code = "dodo_discount_create_failed";
      throw error;
    }
    return null;
  }
}

function resolveProductId(plan) {
  const yearly = env("DODO_FLIPUR_PRODUCT_ID_YEARLY") || FLIPUR_DODO_PRODUCT_IDS.yearly;
  const monthly =
    env("DODO_FLIPUR_PRODUCT_ID_MONTHLY") ||
    env("DODO_FLIPUR_PRODUCT_ID") ||
    FLIPUR_DODO_PRODUCT_IDS.monthly;
  if (plan === "yearly") return yearly || null;
  return monthly || null;
}

const AUTORENEW_PERCENT = 5;

async function discountCodeIfValid(client, code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;
  try {
    await client.discounts.retrieveByCode(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export async function ensureAutorenewDiscount() {
  const client = dodoClient();
  if (!client) return null;
  const fromEnv = (env("DODO_AUTORENEW_DISCOUNT_CODE") || "AUTORENEW5").toUpperCase();
  const existing = await discountCodeIfValid(client, fromEnv);
  if (existing) return existing;
  try {
    await client.discounts.create({
      type: "percentage",
      amount: AUTORENEW_PERCENT * 100,
      code: fromEnv,
      metadata: { flipur: "autorenew" },
    });
    return fromEnv;
  } catch (err) {
    console.error("dodo.autorenew discount failed", err.message || err);
    return null;
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
    if (autoCode) codes.push(autoCode);
  }
  if (discountCode) {
    const affiliateCode = await discountCodeIfValid(client, discountCode);
    if (affiliateCode) codes.push(affiliateCode);
  }

  const payload = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email, ...(name ? { name } : {}) },
    return_url: `${siteOrigin}/checkout/success`,
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
  try {
    const session = await client.checkoutSessions.create(payload);
    return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
  } catch (err) {
    const detail =
      err?.error?.message || err?.message || (typeof err === "string" ? err : "Dodo checkout failed");
    console.error("dodo.checkoutSessions.create", detail);
    const error = new Error(detail);
    error.code = "failed-precondition";
    throw error;
  }
}

export function productIdsConfigured() {
  return {
    monthly: Boolean(resolveProductId("monthly")),
    yearly: Boolean(resolveProductId("yearly")),
  };
}
