# Track A (launch now) + Sandbox B (payment practice)

Use **Track A** for the public story while Dodo bank verification is pending. Use **Sandbox B** to rehearse the full funnel with **test_mode** only—no real money.

Firebase Hosting project: **`money-machine-247`**. Backend: **VPS API** ([ARCHITECTURE.md](./ARCHITECTURE.md), [VPS_API.md](./VPS_API.md)).

---

## Track A — Marketing + Chrome Web Store (do this first)

### What goes live

- Home, trust pages, `/billing`, psychology copy, `makemoney@flipur.trade`, logo, `og.png`
- **No requirement** for Dodo live or bank approval
- Pricing page **can** stay visible; checkout only works after Sandbox B API + Dodo test keys

### Deploy (hosting only — safest rollback)

```bash
npm run deploy:web
```

Equivalent:

```bash
npm run build:web
npx firebase-tools deploy --only hosting:web --project money-machine-247
```

### Track A smoke test (5 minutes)

| # | Check | Pass? |
|---|--------|-------|
| 1 | https://flipur.trade/ — positioning / CTAs | |
| 2 | Add to Chrome → Chrome Web Store listing opens | |
| 3 | `/about`, `/security`, `/billing`, `/support` load | |
| 4 | Footer — Billing & cancellation, Privacy, Terms | |
| 5 | `/og.png` — share card | |
| 6 | Email links → `makemoney@flipur.trade` | |
| 7 | Support chat bubble opens (n8n) | |

### Rollback Track A

Firebase Console → Hosting → **Release history** → Roll back.

---

## Sandbox B — Dodo test_mode end-to-end funnel

**Important:** Test and live Dodo are **separate**. Use **test** API keys (`dodo_test_…`), **test** product IDs, and **test** webhook secret. Do **not** set `DODO_PAYMENTS_ENVIRONMENT=live_mode` until bank/KYC is complete.

API defaults to **test_mode** unless `DODO_PAYMENTS_ENVIRONMENT=live_mode` in VPS `api/.env`.

### Phase 0 — Dodo dashboard (test mode)

1. Dodo → **Test mode**.
2. **Products** — monthly + yearly Flipur Pro; copy **`pdt_…`** IDs (test ≠ live).
3. **API keys** — test bearer token.
4. **Webhooks** — after API is public:

   - `https://api.flipur.trade/api/webhooks/dodo`
   - Events: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`
   - Copy **webhook signing secret**

Docs: [Dodo testing process](https://docs.dodopayments.com/miscellaneous/testing-process)

### Phase 1 — VPS API secrets (test values only)

On VPS `/var/www/flipur-api/.env`:

```env
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=dodo_test_…
DODO_PAYMENTS_WEBHOOK_KEY=…
DODO_FLIPUR_PRODUCT_ID_MONTHLY=pdt_…
DODO_FLIPUR_PRODUCT_ID_YEARLY=pdt_…
FLIPUR_SITE_ORIGIN=https://flipur.trade
```

```bash
pm2 restart flipur-api
curl https://api.flipur.trade/health
```

Local practice with API on laptop:

```env
# apps/web/.env.local
VITE_API_BASE=http://localhost:8080
```

```bash
npm run dev:api
npm run dev:web
```

### Phase 2 — Web app env (build)

`apps/web/.env.local` / `.env.production`:

- `VITE_API_BASE=https://api.flipur.trade` (or localhost for local)
- Optional Firebase web config if admin/auth features need it
- Optional: `VITE_DODO_CUSTOMER_PORTAL_URL`

```bash
npm run deploy:web
```

### Phase 3 — Backend for checkout + affiliates

API must already be on the VPS ([VPS_API.md](./VPS_API.md)). No `firebase deploy --only functions`.

Confirm:

```bash
curl https://api.flipur.trade/health
curl -s -o /dev/null -w "%{http_code}" -X POST https://api.flipur.trade/api/affiliate/pricing
```

### Phase 4 — End-to-end funnel (practice script)

#### A. Discover → install (Track A)

| Step | Action |
|------|--------|
| A1 | Open https://flipur.trade/ |
| A2 | **Add to Chrome for free** → CWS |
| A3 | Install extension (extension repo) |

#### B. Free trial (extension)

| Step | Action |
|------|--------|
| B1 | Use Flipur on ProjectX / Delta / TradingView / Match-Trader |
| B2 | Complete **5 free flips** |

#### C. Pricing → Dodo checkout

| Step | Action | Notes |
|------|--------|--------|
| C1 | `/pricing` | Same email as extension |
| C2 | Monthly/yearly, auto-renew | |
| C3 | Submit → Dodo checkout | Errors: API env, product IDs, CORS |
| C4 | Pay with **test card** | e.g. `4242…4242`, exp `06/32`, CVV `123` |
| C5 | `/checkout/success` | Uses `FLIPUR_SITE_ORIGIN` |

Decline test: `4000 0000 0000 0002`.

#### D. Webhook

| Step | Action |
|------|--------|
| D1 | Dodo → webhook deliveries → **200** |
| D2 | `pm2 logs flipur-api` |
| D3 | Affiliate conversion only if coupon on checkout |

#### E. Pro unlock (extension)

| Step | Action |
|------|--------|
| E1 | Same email at checkout + extension |
| E2 | Reload trading tab |
| E3 | 6th flip → Pro |

#### F. Affiliate sandbox (optional)

| Step | Action |
|------|--------|
| F1 | `/?ref=TESTCODE` |
| F2 | `/affiliate/register` |
| F3 | Onboard in admin `/affiliate-master` |
| F4 | Partner `/affiliate/login` |
| F5 | Checkout with coupon → dashboard conversion |

Payouts remain **manual** — [AFFILIATE_SETUP.md](../AFFILIATE_SETUP.md).

### Phase 5 — When bank verification completes (live)

1. Dodo → copy/recreate products in **Live**.
2. Replace VPS `.env` with **live** API key, webhook secret, **live** product IDs.
3. Set `DODO_PAYMENTS_ENVIRONMENT=live_mode`.
4. Point Live webhook at `https://api.flipur.trade/api/webhooks/dodo`.
5. `pm2 restart flipur-api` → small real charge → cancel in portal.
6. [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md).

---

## Firebase CLI login (hosting only)

```bash
npx firebase-tools login
npx firebase-tools use money-machine-247
```

---

## Quick reference — ports

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Web dev |
| http://localhost:5174 | Admin dev |
| http://localhost:8080 | API local default (`PORT`) |
| https://api.flipur.trade | API production (host **8082** behind Traefik) |
| https://flipur.trade | Public site |

---

## What to tell the market today

- **Yes:** Install free from Chrome, psychology story, support `makemoney@flipur.trade`
- **Not yet (until live Dodo):** “Subscribe now with real money” in paid ads
- **Practice:** Sandbox B with test cards only
