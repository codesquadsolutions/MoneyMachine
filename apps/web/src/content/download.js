/** Free flips before the extension shows the Pro / checkout paywall (implemented in the Chrome extension). */
export const FREE_FLIP_LIMIT = 5;

/** Public Chrome Web Store listing (override with VITE_CHROME_WEB_STORE_URL). */
export const DEFAULT_CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/flipur-%E2%80%93-automated-trade/kdoalnknajmofjfcjblghjglihimncil";

const storeUrl = (import.meta.env.VITE_CHROME_WEB_STORE_URL || DEFAULT_CHROME_WEB_STORE_URL).trim();

export function chromeWebStoreUrl() {
  return storeUrl;
}

export function hasChromeWebStoreUrl() {
  return Boolean(storeUrl);
}

export const ADD_TO_CHROME_LABEL = "Add to Chrome for free";
