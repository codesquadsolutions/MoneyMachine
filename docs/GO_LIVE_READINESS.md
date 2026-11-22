# Flipur launch readiness

Last updated: November 2026 — stack is **Firebase Hosting + VPS Express/Postgres** (not Cloud Functions).  
See [ARCHITECTURE.md](./ARCHITECTURE.md) and [VPS_API.md](./VPS_API.md).

## URLs

| Item | URL |
|------|-----|
| Public | https://flipur.trade |
| Hosting fallback | https://money-machine-247.web.app |
| Admin | https://money-machine-247-admin.web.app |
| API | https://api.flipur.trade |
| API health | https://api.flipur.trade/health |
| Dodo webhook | `https://api.flipur.trade/api/webhooks/dodo` |

Firebase project: **`money-machine-247`** (`.firebaserc`). Older docs mentioning `flipur-404bd` / `cloudfunctions.net` are obsolete.

---

## Readiness scorecard (codebase + ops review)

| Area | Status | ~% |
|------|--------|-----|
| Marketing site | Live on flipur.trade | **95%** |
| Custom domain + SSL | Live (watch AAAA / Hostinger IPv6 — [FIX_FLIPUR_SSL_INCognito.md](./FIX_FLIPUR_SSL_INCognito.md)) | **90%** |
| API + Postgres | Live (`flipur-api` pm2, health OK) | **90%** |
| Dodo checkout + webhooks | Implemented on Express; confirm Live dashboard points at API URL | **85%** |
| Chrome extension Pro | Outside this repo — reconfirm same-email pay → Pro | **operator** |
| Affiliate funnel | Built on Postgres API | **75%** |
| Docs / ops alignment | Updated to VPS stack | **80%** |
| Automated tests / CI | None | **5%** |
| Auth / secrets hygiene | Rotate any committed `VITE_ADMIN_PASSWORD`; keep secrets on VPS only | **40%** |

| Milestone | ~% |
|-----------|-----|
| **Public marketing** | **~95%** |
| **Pay → Pro golden path** | **~85%** (confirm Live webhook + extension) |
| **Clean ops / security launch** | **~60%** |

Soft-launch capable. Fix secrets + webhook confirmation before calling it a clean ops launch.

---

## Your next moves (human)

1. Confirm Dodo **Live** webhook URL is `https://api.flipur.trade/api/webhooks/dodo` (not any `cloudfunctions.net` URL).
2. Confirm `DODO_PAYMENTS_*` + product IDs on VPS `api/.env` match Live mode; `pm2 restart flipur-api`.
3. Rotate admin passwords if they were ever committed or shared; do **not** bake `VITE_ADMIN_PASSWORD` into production builds.
4. Smoke test: pricing → checkout → `/checkout/success` → extension Pro (same email).
5. Optional: set `VITE_DODO_CUSTOMER_PORTAL_URL` and redeploy web.
6. Optional: tighten or disable internal 100% coupons in Dodo Live.

---

## Repo / Agent

| Item | Location |
|------|----------|
| API env | VPS `/var/www/flipur-api/.env` (gitignored locally as `api/.env`) |
| API template | `api/.env.example` |
| Web/admin API base | `VITE_API_BASE=https://api.flipur.trade` |
| Deploy web | `npm run deploy:web` |
| Deploy admin | `npm run deploy:admin` |
| Restart API | `pm2 restart flipur-api` — [VPS_API.md](./VPS_API.md) |
| Legacy Functions | `functions/` — **do not deploy** for Flipur |

Full checklist: [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md).
