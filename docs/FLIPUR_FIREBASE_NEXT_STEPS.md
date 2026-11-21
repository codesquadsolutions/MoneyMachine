# Flipur on Firebase (`flipur-404bd`) — what’s done vs what you do

Your new project: **flipur-404bd** (Gmail: flipurtrade).

## Already configured in this repo (by Cursor)

- `.firebaserc` → default project `flipur-404bd`
- `apps/web/.env.local` → Firebase web config (Vite reads this automatically; you do not edit `.env.example`)
- Dodo defaults stay in **test_mode** until you set live

## Your live URLs after deploy

| What | URL |
|------|-----|
| Public site | https://flipur-404bd.web.app |
| Public site (alt) | https://flipur-404bd.firebaseapp.com |
| Admin (after admin deploy) | https://flipur-404bd-admin.web.app |
| Webhook (Dodo test) | `https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook` |
| Custom domain later | flipur.trade → add in Hosting when ready |

## Checkout (sandbox)

- Staging site: https://flipur-404bd.web.app/pricing → should open **Dodo test checkout** (not red INTERNAL).
- Return URL after pay: `https://flipur-404bd.web.app/checkout/success`
- Webhook: `https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook` (test mode in Dodo dashboard)

If **Monthly** shows the wrong plan name on Dodo, swap or fix `DODO_FLIPUR_PRODUCT_ID_MONTHLY` / `_YEARLY` in `.local/dodo-test-secrets.txt` and run `.\scripts\import-dodo-test-secrets.ps1` + `npm run deploy:sandbox-backend`.

## If secrets fail: “must be on the Blaze plan”

Firebase **Functions secrets** need Blaze **and** billing linked (not just creating the project).

1. Open: https://console.firebase.google.com/project/flipur-404bd/usage/details  
2. **Upgrade** → choose **Blaze** → add payment method → finish.  
3. Wait **2–5 minutes**, then run `.\scripts\set-dodo-sandbox-secrets.ps1` again.

Until Blaze is active, you can still run **`npm run deploy:web`** (website only — checkout will not work yet).

## The only 2 things only you can do

### 1) Dodo test secrets (easiest: one small file)

1. Copy `.local/dodo-test-secrets.example` → `.local/dodo-test-secrets.txt`
2. Paste your **test** API key and webhook key from Dodo (two lines only).
3. Run:

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\TS\X\claude\MoneyMachine
.\scripts\import-dodo-test-secrets.ps1
npm run deploy:sandbox-backend
```

Alternative: `.\scripts\set-dodo-sandbox-secrets.ps1` (paste at each prompt).

Affiliate admin password (after deploy): see `.local/operator-login.txt` on your PC (not in git).

Then in **Dodo dashboard (test mode)** → Webhooks → URL = line above.

### 2) Test checkout

Open https://flipur-404bd.web.app/pricing (or localhost:5173 after `npm run dev:web`)

Card: `4242 4242 4242 4242` · 06/32 · CVV 123

## Commands reference

```powershell
npm run dev:web              # local site
npm run deploy:web           # hosting only
npm run deploy:sandbox-backend  # hosting + firestore + functions
```

## Connect flipur.trade

**Full checklist:** [DOMAIN_CONNECT_FLIPUR_TRADE.md](./DOMAIN_CONNECT_FLIPUR_TRADE.md)

Short version: Firebase Hosting → add `flipur.trade` → DNS at registrar → Auth authorized domain → then set `FLIPUR_SITE_ORIGIN=https://flipur.trade` in `functions/.env.flipur-404bd` and redeploy.
