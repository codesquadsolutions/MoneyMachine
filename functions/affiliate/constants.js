export const adminEmail = "admin@flipur.trade";
export const defaultCommissionBps = 1500; // 15%
export const affiliateClaim = "affiliate";
export const siteOrigin = process.env.FLIPUR_SITE_ORIGIN || "https://flipur.trade";

export const conversionStatuses = new Set(["pending", "approved", "paid", "reversed"]);
export const affiliateStatuses = new Set(["pending", "active", "suspended"]);
export const leadStatuses = new Set(["new", "contacted", "rejected", "onboarded"]);
export const ticketStatuses = new Set(["open", "in_progress", "resolved"]);
