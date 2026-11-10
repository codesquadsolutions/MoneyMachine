const KEY = "flipur_ref";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function captureReferralFromSearch(search) {
  const params = new URLSearchParams(search);
  const ref = (params.get("ref") || params.get("coupon") || "").trim().toUpperCase();
  if (!ref) return "";
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
