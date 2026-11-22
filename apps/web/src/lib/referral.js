const KEY = "flipur_ref";
const VISITOR_KEY = "flipur_visitor";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");

function getVisitorKey() {
  try {
    let key = localStorage.getItem(VISITOR_KEY);
    if (!key) {
      key = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(VISITOR_KEY, key);
    }
    return key;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

const recording = new Set();

function recordLinkOpen(code) {
  if (!code || recording.has(code)) return;
  recording.add(code);

  fetch(`${API_BASE}/api/affiliate/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, visitorKey: getVisitorKey() }),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        recording.delete(code);
        throw new Error("Could not record referral open.");
      }
    })
    .catch(() => {
      recording.delete(code);
    });
}

export function captureReferralFromSearch(search) {
  const params = new URLSearchParams(search);
  const ref = (params.get("ref") || params.get("coupon") || "").trim().toUpperCase();
  if (!ref) return "";
  recordLinkOpen(ref);
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: ref, at: Date.now() }));
  } catch {
    /* ignore */
  }
  return ref;
}

export function getStoredReferral() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return "";
    const data = JSON.parse(raw);
    if (!data?.code) return "";
    if (Date.now() - Number(data.at || 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return "";
    }
    return String(data.code).toUpperCase();
  } catch {
    return "";
  }
}
