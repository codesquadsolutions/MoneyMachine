/** Display-only catalog; checkout totals follow Dodo + selected discounts. */
export const PRICING = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    listUsd: 49,
    promoPercent: 50,
    autoRenewExtraPercent: 5,
    interval: "month",
    blurb: "Recurring monthly. One subscription, every supported platform.",
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    listUsd: 499,
    promoPercent: 50,
    autoRenewExtraPercent: 5,
    interval: "year",
    blurb: "Recurring yearly. Billed once per year; renews automatically unless you cancel.",
  },
};

export function priceAfterPromo(listUsd, promoPercent) {
  return Math.round(listUsd * (1 - promoPercent / 100) * 100) / 100;
}

export function priceWithAutoRenew(baseAfterPromo, autoPercent) {
  return Math.round(baseAfterPromo * (1 - autoPercent / 100) * 100) / 100;
}

export function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function planTotals(planKey, autoRenew) {
  const plan = PRICING[planKey];
  if (!plan) return null;
  const afterPromo = priceAfterPromo(plan.listUsd, plan.promoPercent);
  const total = autoRenew ? priceWithAutoRenew(afterPromo, plan.autoRenewExtraPercent) : afterPromo;
  return { listUsd: plan.listUsd, afterPromo, total, autoRenew, plan };
}
