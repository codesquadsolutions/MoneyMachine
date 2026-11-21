const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");
const TOKEN_KEY = "flipur_affiliate_token";

const NAME_TO_PATH = {
  submitAffiliateInterest: "/api/affiliate/interest",
  getAffiliateDashboard: "/api/affiliate/dashboard",
  submitAffiliateTicket: "/api/affiliate/ticket",
  createCheckoutSession: "/api/affiliate/checkout",
  getPricingCatalog: "/api/affiliate/pricing",
};

export async function callAffiliate(name, data = {}) {
  const path = NAME_TO_PATH[name];
  if (!path) throw new Error(`Unknown API action: ${name}`);

  const method = name === "getPricingCatalog" ? "GET" : "POST";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === "POST" ? JSON.stringify(data) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || `Request failed (${response.status})`);
  }
  return json;
}

export { API_BASE };
