export const PRICING_PLANS = {
  monthly: { listUsd: 49, promoPercent: 50, autoRenewExtraPercent: 5 },
  yearly: { listUsd: 499, promoPercent: 50, autoRenewExtraPercent: 5 },
};

export function normalizePlan(plan) {
  const key = String(plan || "monthly").toLowerCase();
  if (key === "year" || key === "annual" || key === "yearly") return "yearly";
  return "monthly";
}
