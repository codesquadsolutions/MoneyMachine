const KEY = "flipur_attr";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || Date.now() - Number(data.at || 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function captureAttributionFromSearch(search) {
  const params = new URLSearchParams(search);
  const utmSource = (params.get("utm_source") || "").trim();
  const utmMedium = (params.get("utm_medium") || "").trim();
  const utmCampaign = (params.get("utm_campaign") || "").trim();
  const fbclid = (params.get("fbclid") || "").trim();
  if (!utmSource && !utmMedium && !utmCampaign && !fbclid) return read();

  const payload = {
    utmSource,
    utmMedium,
    utmCampaign,
    fbclid,
    at: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

export function getStoredAttribution() {
  const data = read();
  if (!data) {
    return { utmSource: "", utmMedium: "", utmCampaign: "", fbclid: "", source: "website" };
  }
  const src = String(data.utmSource || "").toLowerCase();
  const med = String(data.utmMedium || "").toLowerCase();
  let source = "website";
  if (src.includes("instagram") || src === "ig" || med.includes("instagram")) source = "instagram";
  else if (src.includes("facebook") || src.includes("meta") || src === "fb" || data.fbclid || med === "paid_social") {
    source = "meta";
  } else if (src || med || data.utmCampaign) source = "meta";

  return {
    utmSource: data.utmSource || "",
    utmMedium: data.utmMedium || "",
    utmCampaign: data.utmCampaign || "",
    fbclid: data.fbclid || "",
    source,
  };
}
