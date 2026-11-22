export const FUNNEL_STAGES = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "contacted", label: "Contacted" },
  { id: "invited", label: "Invited" },
  { id: "converted", label: "Converted" },
  { id: "lost", label: "Lost" },
];

export const LEAD_SOURCES = [
  { id: "website", label: "Website" },
  { id: "meta", label: "Meta ads" },
  { id: "instagram", label: "Instagram" },
  { id: "chat", label: "Chatbot" },
  { id: "affiliate", label: "Affiliate" },
  { id: "manual", label: "Manual" },
];

export const LEAD_TYPES = [
  { id: "customer", label: "Customer" },
  { id: "affiliate_interest", label: "Affiliate interest" },
];

export const CALL_STATUSES = [
  { id: "none", label: "None" },
  { id: "queued", label: "Queued" },
  { id: "reached", label: "Reached" },
  { id: "no_answer", label: "No answer" },
  { id: "callback", label: "Callback" },
];

export const STALE_NEW_HOURS = 24;
export const STALE_CONTACTED_DAYS = 7;

export function stageLabel(id) {
  return FUNNEL_STAGES.find((s) => s.id === id)?.label || id || "—";
}

export function sourceLabel(id) {
  return LEAD_SOURCES.find((s) => s.id === id)?.label || id || "—";
}

export function inferSourceFromUtm({ utmSource, utmMedium, utmCampaign } = {}) {
  const src = String(utmSource || "").toLowerCase();
  const med = String(utmMedium || "").toLowerCase();
  if (src.includes("instagram") || src === "ig" || med.includes("instagram")) return "instagram";
  if (src.includes("facebook") || src.includes("meta") || src === "fb" || med === "paid_social" || med === "cpc") {
    return "meta";
  }
  if (src.includes("chat") || med.includes("chat")) return "chat";
  if (utmSource || utmMedium || utmCampaign) return "meta";
  return "website";
}
