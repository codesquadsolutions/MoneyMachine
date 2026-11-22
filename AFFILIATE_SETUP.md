# Flipur affiliate system

Backend is the **VPS Express + Postgres API** (`api/`). Legacy Cloud Functions under `functions/affiliate/` are **not** used for production.

## What exists

- **Postgres** tables for affiliates, codes, conversions, tickets, daily stats, webhook dedup (created by `api` `migrate()`)
- **API routes** under `/api/affiliate/*` and `/api/affiliate-admin`
- **Web** (`apps/web`): `/affiliate/register` (interest), `/affiliate/login`, `/affiliate/dashboard`, `?ref=` capture
- **Admin** (`apps/admin`): `/affiliate-master` — onboard, edit, tickets, mark commissions paid

## Secrets (VPS `api/.env`)

```env
ADMIN_USER=admin
ADMIN_PASSWORD=CHANGE_ME
JWT_SECRET=long-random-string
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_FLIPUR_PRODUCT_ID_MONTHLY=
DODO_FLIPUR_PRODUCT_ID_YEARLY=
DODO_PAYMENTS_ENVIRONMENT=test_mode
FLIPUR_SITE_ORIGIN=https://flipur.trade
```

Optional: `DODO_AUTORENEW_DISCOUNT_CODE` if you use that discount at checkout.

## Dodo webhook URL

`https://api.flipur.trade/api/webhooks/dodo`

Events: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`.

Affiliate codes are passed at checkout via discount/coupon from stored `?ref=` (see `createCheckoutSession` / `POST /api/affiliate/checkout`).

## Deploy

```bash
# Frontends
npm run deploy:web
npm run deploy:admin

# API — upload + restart on VPS (see docs/VPS_API.md)
pm2 restart flipur-api
```

## Local dev

```bash
npm run dev:api    # :8080
npm run dev:web    # :5173 affiliate routes
npm run dev:admin  # :5174 /affiliate-master
```

Set `VITE_API_BASE=http://localhost:8080` (and admin `VITE_AFFILIATE_ADMIN_URL`).

## Payouts

Commissions are tracked in Postgres. Pay affiliates manually (PayPal, bank, etc.), then in **Affiliate master → Commission payouts** select conversions and **Mark selected paid** so pending balances drop on the partner dashboard.

## Related

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/VPS_API.md](./docs/VPS_API.md)
- [docs/STEP3_WEBHOOK.md](./docs/STEP3_WEBHOOK.md)
- [docs/ADMIN_LOGIN_SETUP.md](./docs/ADMIN_LOGIN_SETUP.md)
