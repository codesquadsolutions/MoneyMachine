# Flipur pricing — local preview & Dodo products

## Dodo product IDs

| Plan | Product ID |
|------|------------|
| Flipur Monthly | `pdt_0NrZte2dnYENTpGvfHKde` |
| Flipur Yearly | `pdt_0NreUeewB7yZnO1EoWQoF` |

Defaults live in `functions/affiliate/dodoProducts.js`. Override in production with Firebase secrets:

```bash
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_MONTHLY
firebase functions:secrets:set DODO_FLIPUR_PRODUCT_ID_YEARLY
```

Paste the IDs above when prompted.

## Local pricing page

From repo root:

```bash
npm run dev:web
```

Open:

- **Home (download CTA):** http://localhost:5173/  
- **Pricing (Pro, after free trial):** http://localhost:5173/pricing  

Chrome Web Store default: Flipur listing in `apps/web/src/content/download.js` (`kdoalnknajmofjfcjblghjglihimncil`).

Checkout calls deployed Cloud Functions (`createCheckoutSession`). You need:

- `apps/web/.env.local` with Firebase web config (see `apps/web/.env.example`)
- Functions deployed with `DODO_PAYMENTS_API_KEY` and product secrets (or defaults in `dodoProducts.js`)

Optional emulator: set `VITE_USE_FUNCTIONS_EMULATOR=true` in `.env.local` and run the Functions emulator.

## Production

After deploy: https://flipur.trade/pricing
