# Flipur pricing — local preview & Dodo products

Checkout calls the **VPS/local Express API** (`POST /api/affiliate/checkout`), not Cloud Functions.

## Dodo product IDs

Defaults in `api/src/lib/dodoProducts.js` (override with env on the VPS):

| Plan | Default product ID |
|------|--------------------|
| Flipur Monthly | `pdt_0NrnAEMVHEHIPPRE5YBy9` |
| Flipur Yearly | `pdt_0NrnDvQ7nR9YtbY3Qd67A` |

On VPS `/var/www/flipur-api/.env`:

```env
DODO_FLIPUR_PRODUCT_ID_MONTHLY=pdt_…
DODO_FLIPUR_PRODUCT_ID_YEARLY=pdt_…
DODO_PAYMENTS_API_KEY=…
DODO_PAYMENTS_ENVIRONMENT=test_mode   # or live_mode
FLIPUR_SITE_ORIGIN=https://flipur.trade
```

```bash
pm2 restart flipur-api
```

Test vs live product IDs are **different**. Older docs that listed `pdt_0NrZte2…` / `pdt_0NreUeew…` may refer to a previous Dodo catalog — always trust the IDs currently in Dodo + VPS env.

## Local pricing page

```bash
npm run dev:api
npm run dev:web
```

- Home: http://localhost:5173/
- Pricing: http://localhost:5173/pricing

`apps/web/.env.local`:

```env
VITE_API_BASE=http://localhost:8080
```

Chrome Web Store default listing id is in `apps/web/src/content/download.js`.

## Production

- Site: https://flipur.trade/pricing
- API: `VITE_API_BASE=https://api.flipur.trade`
- Webhook: [STEP3_WEBHOOK.md](./STEP3_WEBHOOK.md)
- Full go-live: [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md)
