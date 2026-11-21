export const adminEmail = "admin@flipur.trade";
export const defaultCommissionBps = 1500; // 15%
export const affiliateClaim = "affiliate";

export const PUBLIC_SITE_ORIGIN = "https://flipur.trade";
export const STAGING_SITE_ORIGIN = "https://flipur-404bd.web.app";

function trimOrigin(url) {
  return String(url || "").replace(/\/$/, "");
}

/** Checkout return URLs, affiliate share links, password-reset links */
function defaultSiteOrigin() {
  if (process.env.FLIPUR_SITE_ORIGIN) return trimOrigin(process.env.FLIPUR_SITE_ORIGIN);
  if (process.env.GCLOUD_PROJECT === "flipur-404bd") return STAGING_SITE_ORIGIN;
  return PUBLIC_SITE_ORIGIN;
}

export const siteOrigin = defaultSiteOrigin();

export const conversionStatuses = new Set(["pending", "approved", "paid", "reversed"]);
export const affiliateStatuses = new Set(["pending", "active", "suspended"]);
export const leadStatuses = new Set(["new", "contacted", "rejected", "onboarded"]);
export const ticketStatuses = new Set(["open", "in_progress", "resolved"]);
