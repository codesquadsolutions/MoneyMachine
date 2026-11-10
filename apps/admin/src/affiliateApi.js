import { auth } from "./firebase";

const base =
  import.meta.env.VITE_AFFILIATE_ADMIN_URL ||
  (import.meta.env.VITE_FIREBASE_PROJECT_ID
    ? `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/affiliateAdmin`
    : "");

export async function affiliateAdminRequest(action, body = {}) {
  if (!base) throw new Error("Set VITE_AFFILIATE_ADMIN_URL or VITE_FIREBASE_PROJECT_ID.");
  const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  const response = await fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

export function money(cents) {
  return ((Number(cents) || 0) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}
