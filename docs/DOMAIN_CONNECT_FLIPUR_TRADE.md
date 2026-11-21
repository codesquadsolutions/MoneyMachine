# Connect flipur.trade (your steps)

Code and SEO already assume **https://flipur.trade**. Staging stays at **https://flipur-404bd.web.app** until you finish DNS.

> **SSL errors in incognito / mobile?** See **[FIX_FLIPUR_SSL_INCognito.md](./FIX_FLIPUR_SSL_INCognito.md)** — usually a **wrong AAAA record** (Hostinger IPv6) while **A** points to Firebase.

## After you complete this checklist

| What | URL |
|------|-----|
| Public site | https://flipur.trade |
| Staging (optional) | https://flipur-404bd.web.app |
| Admin | https://flipur-404bd-admin.web.app or **admin.flipur.trade** (optional) |
| Dodo webhook | `https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook` (unchanged) |

---

## Phase 1 — Firebase Hosting (you, ~15 min + DNS wait)

1. Open [Firebase Hosting](https://console.firebase.google.com/project/flipur-404bd/hosting) → site **flipur-404bd** (web target).
2. **Add custom domain** → `flipur.trade`.
3. If offered, also add `www.flipur.trade` → redirect to apex (recommended).
4. Copy the **TXT** / **A** records Firebase shows.
5. At your **domain registrar** (where you bought flipur.trade), paste those DNS records.
6. Wait until Firebase shows **Connected** (often 15 min–48 h).

Optional admin subdomain:

1. Hosting site **flipur-404bd-admin** → Add custom domain → `admin.flipur.trade`
2. Add DNS at registrar.

---

## Phase 2 — Firebase Auth (you, ~2 min)

1. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/flipur-404bd/authentication/settings)
2. **Add domain:** `flipur.trade` (and `www.flipur.trade` if you use www).
3. Keep `flipur-404bd.web.app` and `localhost` for staging/dev.

Affiliate Google sign-in will not work on the custom domain until this is done.

---

## Phase 3 — Checkout return URL (you + one deploy)

Until this step, Dodo returns shoppers to **staging** after pay:

`https://flipur-404bd.web.app/checkout/success`

After **Phase 1** is green:

1. Edit `functions/.env.flipur-404bd` on your PC (gitignored). Add a second line:

```env
DODO_PAYMENTS_ENVIRONMENT=live_mode
FLIPUR_SITE_ORIGIN=https://flipur.trade
```

2. Redeploy functions:

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\TS\X\claude\MoneyMachine
npm run deploy:sandbox-backend
```

Confirm in deploy log: `Loaded environment variables from functions\.env.flipur-404bd`.

**Do not** set `FLIPUR_SITE_ORIGIN` before DNS is connected — the thank-you page would not load.

---

## Phase 4 — Smoke test (you, ~15 min)

On **https://flipur.trade** (not staging):

| # | Check |
|---|--------|
| 1 | Home, `/pricing`, `/faq` load with SSL |
| 2 | Pricing → checkout → pay (small amount or internal coupon) |
| 3 | Land on **https://flipur.trade/checkout/success** |
| 4 | Dodo webhook still **200** (Live dashboard → Webhooks) |
| 5 | Extension Pro still unlocks (same email) |
| 6 | Affiliate login at `/affiliate/login` (Google) |

---

## Phase 5 — Outside this repo (you)

| Service | Action |
|---------|--------|
| **Dodo Live** | Webhook URL unchanged; confirm events still deliver 200 |
| **Support chat widget** | Allow `https://flipur.trade` (and localhost for dev) on `my-bot.onrender.com` if your SDK uses an origin allowlist |
| **Chrome Web Store** | Listing links already point at flipur.trade in copy |
| **Internal 100% coupon** | Lower max uses or disable before public traffic |

---

## Rollback

Remove `FLIPUR_SITE_ORIGIN` from `functions/.env.flipur-404bd`, redeploy functions — checkout returns to staging success URL.

---

## Troubleshooting: `flipur.trade` shows old site, `.web.app` is new

**Symptoms:** `flipur-404bd.web.app` has the new logo and “Psychological trading software” title, but `https://flipur.trade` still shows the old hero (“Flip every order”) or old JS (`index-BGv4nRI6.js` instead of `index-DkMTUnu5.js`).

**What we verified:** DNS and TXT are correct (`hosting-site=flipur-404bd`). Both hostnames hit Firebase Hosting, but **`flipur.trade` can be pinned to an older Hosting release** (not a registrar “wrong server” issue).

**Fix (you, Firebase Console, ~10 min):**

1. [Hosting → site **flipur-404bd**](https://console.firebase.google.com/project/flipur-404bd/hosting/sites/flipur-404bd) → **Domains**.
2. Confirm `flipur.trade` status is **Connected** on site **flipur-404bd** (not another project).
3. **Remove** custom domain `flipur.trade` (do not delete DNS at registrar yet).
4. Wait 2–5 minutes.
5. **Add custom domain** `flipur.trade` again to site **flipur-404bd** (same TXT `hosting-site=flipur-404bd` should already exist at Hostinger).
6. When status is **Connected**, run from your PC:

   ```powershell
   npm run deploy:web
   ```

7. Hard-refresh `https://flipur.trade/` (`Ctrl+Shift+R`). Page title should match staging: **“Psychological trading software. Fix the click, not the chart.”**

**Hostinger:** Turn off any **Website builder / parked page** for `flipur.trade` so only Firebase A/AAAA records apply.

**Until fixed:** Use **https://flipur-404bd.web.app** for checkout tests (same backend; checkout return URL can still use `FLIPUR_SITE_ORIGIN` on `flipur.trade` after pay).

---

## What Agent / repo already did

- SEO, sitemap, canonicals → `flipur.trade`
- `functions/affiliate/constants.js` — `FLIPUR_SITE_ORIGIN` + staging fallback
- `functions/.env.example` — template for live env vars
- Admin CORS includes `admin.flipur.trade`
