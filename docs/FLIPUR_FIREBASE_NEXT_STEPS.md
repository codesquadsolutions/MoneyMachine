# Firebase for Flipur (hosting + optional Auth)

**Current project:** `money-machine-247` (see `.firebaserc`).  
**Backend:** VPS Express + Postgres — **not** Cloud Functions. See [ARCHITECTURE.md](./ARCHITECTURE.md).

Older notes for project `flipur-404bd` and `deploy:sandbox-backend` are obsolete.

## What Firebase is used for

| Feature | Status |
|---------|--------|
| Hosting (`apps/web`, `apps/admin`) | **Yes** — primary deploy path |
| Auth Email/Password for admin shell | Optional / used when web config present |
| Firestore | Legacy / migration source; runtime data is **Postgres** |
| Cloud Functions | **Do not deploy** for Flipur go-live (`functions/` is legacy) |

## Live URLs after hosting deploy

| What | URL |
|------|-----|
| Public | https://flipur.trade |
| Hosting fallback | https://money-machine-247.web.app |
| Admin | https://money-machine-247-admin.web.app |
| API (not Firebase) | https://api.flipur.trade |
| Webhook (not Firebase) | `https://api.flipur.trade/api/webhooks/dodo` |

## Deploy hosting

```bash
npx firebase-tools login
npx firebase-tools use money-machine-247
npm run deploy:web
npm run deploy:admin
```

Ensure production env has `VITE_API_BASE=https://api.flipur.trade` before build.

## Checkout / Dodo

All checkout + webhook secrets live on the **VPS** (`api/.env`).  
Guide: [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md), [VPS_API.md](./VPS_API.md), [STEP3_WEBHOOK.md](./STEP3_WEBHOOK.md).

## Custom domain

[DOMAIN_CONNECT_FLIPUR_TRADE.md](./DOMAIN_CONNECT_FLIPUR_TRADE.md)  
SSL / AAAA issues: [FIX_FLIPUR_SSL_INCognito.md](./FIX_FLIPUR_SSL_INCognito.md)

## Admin login

[ADMIN_LOGIN_SETUP.md](./ADMIN_LOGIN_SETUP.md)
