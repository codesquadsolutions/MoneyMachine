const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");
const base =
  import.meta.env.VITE_AFFILIATE_ADMIN_URL || `${API_BASE}/api/affiliate-admin`;
const TOKEN_KEY = "flipur_admin_api_token";

export function getAdminApiToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminApiToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function affiliateAdminLogin(username, password) {
  const response = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Admin login failed.");
  setAdminApiToken(json.token);
  return json;
}

export async function affiliateAdminRequest(action, body = {}) {
  if (!base) throw new Error("Set VITE_API_BASE or VITE_AFFILIATE_ADMIN_URL.");
  let token = getAdminApiToken();
  if (!token) {
    const user = import.meta.env.VITE_ADMIN_USER || "admin";
    const password = import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD || "";
    if (password) {
      await affiliateAdminLogin(user, password);
      token = getAdminApiToken();
    }
  }
  const response = await fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  if (response.status === 401 && action !== "login") {
    setAdminApiToken("");
  }
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

export function money(cents) {
  return ((Number(cents) || 0) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}
