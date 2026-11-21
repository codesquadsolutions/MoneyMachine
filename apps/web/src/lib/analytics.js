/** Optional analytics loader — set VITE_ANALYTICS_SCRIPT to a script URL (Plausible, GA4 gtag loader, etc.). */
export function initAnalytics() {
  const src = (import.meta.env.VITE_ANALYTICS_SCRIPT || "").trim();
  if (!src) return;
  if (document.querySelector(`script[data-flipur-analytics]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.setAttribute("data-flipur-analytics", "true");
  document.head.appendChild(script);
}
