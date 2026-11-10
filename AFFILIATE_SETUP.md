# Flipur affiliate system

## What was added

- **Firestore** collections: `affiliates`, `affiliateCodes`, `affiliateConversions`, `affiliateTickets`, `affiliateStatsDaily`, `webhookDedup`
- **Cloud Functions**: `registerAffiliate`, `getAffiliateDashboard`, `submitAffiliateTicket`, `createCheckoutSession`, `affiliateAdmin`, `dodoWebhook`
- **Web** (`apps/web`): `/affiliate/register` (interest form, no password), `/affiliate/login`, `/affiliate/dashboard`, `?ref=` capture
- **Firestore** `affiliateLeads` — public interest submissions; admin onboards via **Onboard** → Firebase user + coupon + password-reset link
- **Admin** (`apps/admin`): `/affiliate-master` leaderboard, approve/edit affiliates, ticket inbox

## Secrets (Firebase Functions)

```bash
firebase functions:secrets:set DODO_PAYMENTS_API_KEY
firebase functions:secrets:set DODO_PAYMENTS_WEBHOOK_KEY
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_MONTHLY
# Flipur Monthly: pdt_0NrZte2dnYENTpGvfHKde
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_YEARLY
# Flipur Yearly: pdt_0NreUeewB7yZnO1EoWQoF
# optional: firebase functions:secrets:set DODO_AUTORENEW_DISCOUNT_CODE
firebase functions:secrets:set ADMIN_PASSWORD   # existing waitlist admin
```

Optional env (Firebase runtime config or `.env` for emulators):

- `DODO_PAYMENTS_ENVIRONMENT=test_mode` (default) or `live_mode`
- `FLIPUR_SITE_ORIGIN=https://flipur.trade`

## Dodo webhook URL

After deploy:

`https://us-central1-<PROJECT_ID>.cloudfunctions.net/dodoWebhook`

Subscribe to at least: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`.

Pass affiliate codes at checkout via `discount_codes` on Checkout Sessions (`createCheckoutSession` callable reads stored `?ref=`).

## Deploy

```bash
npm install
npm --prefix functions install
npm run build
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

## Seed demo data

With Application Default Credentials:

```bash
cd functions && node scripts/seedAffiliates.js
```

## Local dev

- Web: `npm run dev:web` → affiliate routes on port 5173
- Admin: `npm run dev:admin` → `/affiliate-master` (needs deployed functions or emulators)
- Set `apps/admin/.env`: `VITE_FIREBASE_PROJECT_ID`, `VITE_AFFILIATE_ADMIN_URL` (optional override)
- Set `apps/web/.env`: Firebase web config; optional `VITE_USE_FUNCTIONS_EMULATOR=true`

## Payouts

Commissions are tracked in Firestore. Pay affiliates manually (PayPal, bank, etc.) and mark conversions `paid` in a future admin action (not automated in this MVP).
