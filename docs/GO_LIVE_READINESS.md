# Flipur launch readiness

Last updated after **live** checkout (UPI + card), coupon, webhooks, and extension Pro on multiple machines.

## URLs

| Item | URL |
|------|-----|
| Public (staging host) | https://flipur-404bd.web.app |
| Public (brand — after DNS) | https://flipur.trade |
| Admin affiliates | https://flipur-404bd-admin.web.app |
| Dodo webhook | https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook |

**Connect domain:** [DOMAIN_CONNECT_FLIPUR_TRADE.md](./DOMAIN_CONNECT_FLIPUR_TRADE.md)

---

## Readiness scorecard

| Area | Status | ~% |
|------|--------|-----|
| Marketing site | Deployed | **95%** |
| Live Dodo checkout (USD, UPI, coupon) | **Verified** | **100%** |
| Success page | **Verified** | **100%** |
| Webhooks → subscription / Pro | **Verified** | **95%** |
| Chrome extension Pro | **Verified** (you) | **100%** |
| Custom domain `flipur.trade` | **DNS not connected** — repo ready | **15%** ops |
| Affiliate funnel | Built; scale testing optional | **75%** |

| Milestone | ~% |
|-----------|-----|
| **Pay → Pro (real money)** | **~97%** |
| **Public on flipur.trade** | **~60%** (DNS + `FLIPUR_SITE_ORIGIN` + smoke test) |

---

## Your next moves (human)

1. **[DOMAIN_CONNECT_FLIPUR_TRADE.md](./DOMAIN_CONNECT_FLIPUR_TRADE.md)** — Firebase custom domain + registrar DNS.
2. Firebase Auth → authorized domain `flipur.trade`.
3. When DNS is green → `FLIPUR_SITE_ORIGIN=https://flipur.trade` in `functions/.env.flipur-404bd` → redeploy.
4. Smoke test on `flipur.trade`.
5. Tighten or disable internal 100% coupon in Dodo Live.

---

## Repo / Agent

- Live env: `functions/.env.flipur-404bd` (`DODO_PAYMENTS_ENVIRONMENT=live_mode`)
- Template: `functions/.env.example`
- Secrets: `.\scripts\import-dodo-test-secrets.ps1` (live keys in `.local/`)
- Deploy: `npm run deploy:sandbox-backend`

Optional polish: `VITE_DODO_CUSTOMER_PORTAL_URL`, Tailwind content warning (cosmetic).
