# Flipur production golden path

**Launching before Dodo bank verification?** Start with [LAUNCH_TRACK_A_AND_SANDBOX_B.md](./LAUNCH_TRACK_A_AND_SANDBOX_B.md) (marketing deploy + test_mode funnel). Use this file when switching to **live** Dodo.

Use this checklist before calling paid checkout "live." Code changes alone do not deploy services.

## 1. Firebase deploy

```bash
npm run build
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

- Web: `apps/web/dist` (target `web`)
- Admin: `apps/admin/dist` (target `admin`)

## 2. Dodo secrets (Functions)

```bash
firebase functions:secrets:set DODO_PAYMENTS_API_KEY
firebase functions:secrets:set DODO_PAYMENTS_WEBHOOK_KEY
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_MONTHLY
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_YEARLY
```

Set `DODO_PAYMENTS_ENVIRONMENT=live_mode` in Firebase runtime when ready.

Webhook URL:

`https://us-central1-<PROJECT_ID>.cloudfunctions.net/dodoWebhook`

Events: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`

## 3. Web `.env` (build-time)

See [apps/web/.env.example](../apps/web/.env.example). Required for checkout callables: `VITE_FIREBASE_*`. Optional: `VITE_CHROME_WEB_STORE_URL`, `VITE_ANALYTICS_SCRIPT`, `VITE_DODO_CUSTOMER_PORTAL_URL`.

## 4. Golden path (test then live)

1. Open `https://flipur.trade/` → Add to Chrome (Web Store).
2. Complete 5 free flips in extension (extension repo).
3. Visit `/pricing` → checkout with test card (Dodo sandbox first).
4. Return to `/checkout/success` → Pro unlocks on 6th flip (verify extension entitlement).
5. Optional affiliate: `/?ref=CODE` → pricing → webhook → conversion in admin `/affiliate-master`.

## 5. Extension entitlement

Marketing copy assumes paywall before flip 6. Confirm extension validates Dodo subscription (license key, API, or your backend)—outside this repo.
