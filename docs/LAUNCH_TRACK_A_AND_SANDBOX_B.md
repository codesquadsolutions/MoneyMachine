# Track A (launch now) + Sandbox B (payment practice)

Use **Track A** for the public story while Dodo bank verification is pending. Use **Sandbox B** to rehearse the full funnel with **test_mode** only—no real money.

Project: `flipur-404bd` (see `.firebaserc`). See [FLIPUR_FIREBASE_NEXT_STEPS.md](./FLIPUR_FIREBASE_NEXT_STEPS.md).

---

## Track A — Marketing + Chrome Web Store (do this first)

### What goes live

- Home, trust pages, `/billing`, psychology copy, `makemoney@flipur.trade`, logo, `og.png`
- **No requirement** for Dodo live or bank approval
- Pricing page **can** stay visible; checkout only works after Sandbox B Functions deploy

### Deploy (hosting only — safest rollback)

From repo root, after [Firebase CLI login](#firebase-cli-login):

```bash
npm run deploy:web
```

Equivalent to:

```bash
npm run build:web
npx firebase-tools deploy --only hosting:web
```

### Track A smoke test (5 minutes)

| # | Check | Pass? |
|---|--------|-------|
| 1 | https://flipur.trade/ — pill “Psychological trading software for execution” | |
| 2 | Add to Chrome → Chrome Web Store listing opens | |
| 3 | `/about`, `/security`, `/billing`, `/support` load | |
| 4 | Footer — Billing & cancellation, Privacy, Terms | |
| 5 | `/og.png` — share card (not tiny logo only) | |
| 6 | Email links → `makemoney@flipur.trade` | |

### Rollback Track A

Firebase Console → Hosting → **Release history** → Roll back to previous release.

---

## Sandbox B — Dodo test_mode end-to-end funnel

**Important:** Test and live Dodo are **separate**. Use **test** API keys (`dodo_test_…`), **test** product IDs, and **test** webhook secret. Do **not** set `DODO_PAYMENTS_ENVIRONMENT=live_mode` until bank/KYC is complete.

Your Functions default to **test_mode** unless `DODO_PAYMENTS_ENVIRONMENT=live_mode`:

```12:14:functions/affiliate/dodo.js
function environment() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
}
```

### Phase 0 — Dodo dashboard (test mode)

1. Log in to Dodo → switch to **Test mode** (not Live).
2. **Products** — create or note **monthly** and **yearly** Flipur Pro products; copy **`pdt_…` IDs** (test IDs ≠ live IDs in `dodoProducts.js`).
3. **API keys** — create/copy **test** bearer token (`dodo_test_…`).
4. **Webhooks** — add endpoint (after Functions deploy):
   - `https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook`
   - Events: `payment.succeeded`, `subscription.active`, `subscription.renewed` (and `refund.succeeded` if listed)
   - Copy **webhook signing secret** for test mode.

Docs: [Dodo testing process](https://docs.dodopayments.com/miscellaneous/testing-process)

### Phase 1 — Firebase secrets (test values only)

```bash
npx firebase-tools login
cd functions && npm install && cd ..
npx firebase-tools functions:secrets:set DODO_PAYMENTS_API_KEY
npx firebase-tools functions:secrets:set DODO_PAYMENTS_WEBHOOK_KEY
npx firebase-tools functions:secrets:set DODO_FLIPUR_PRODUCT_ID_MONTHLY
npx firebase-tools functions:secrets:set DODO_FLIPUR_PRODUCT_ID_YEARLY
```

Paste **test** key, **test** webhook secret, **test** monthly/yearly product IDs.

Optional: `DODO_AUTORENEW_DISCOUNT_CODE` if you use the auto-renew discount at checkout.

**Do not set `DODO_PAYMENTS_ENVIRONMENT=live_mode`** for sandbox practice.

**Return URL after checkout:** set Cloud Functions env `FLIPUR_SITE_ORIGIN`:

- Practice on live site: `https://flipur.trade`
- Practice on localhost pricing with deployed Functions: `http://localhost:5173`

(Google Cloud Console → Cloud Functions → `createCheckoutSession` / related gen2 functions → **Environment variables**, or redeploy after adding `FLIPUR_SITE_ORIGIN` in your deployment config.)

### Phase 2 — Web app env (build)

Create `apps/web/.env.local` from `apps/web/.env.example`:

- All `VITE_FIREBASE_*` from Firebase Console → Project settings → Your apps
- Authorized domains: `localhost`, `flipur.trade`
- Optional: `VITE_DODO_CUSTOMER_PORTAL_URL` (test portal URL from Dodo, if available)

Rebuild/redeploy web after changing env:

```bash
npm run deploy:web
```

### Phase 3 — Deploy backend for checkout + affiliates

```bash
npm run build:web
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions,hosting:web
```

For **Track A only**, hosting alone is enough. For **checkout practice**, you need **functions** (at minimum `createCheckoutSession`, `dodoWebhook`, `submitAffiliateInterest`).

### Phase 4 — End-to-end funnel (practice script)

Run in order. Check each box.

#### A. Discover → install (Track A)

| Step | Action | Notes |
|------|--------|--------|
| A1 | Open https://flipur.trade/ (or localhost:5173) | |
| A2 | Click **Add to Chrome for free** | Should open CWS listing |
| A3 | Install extension | Extension repo — not this website |

#### B. Free trial (extension)

| Step | Action | Notes |
|------|--------|--------|
| B1 | Use Flipur on a supported platform | ProjectX, Delta, TradingView, Match-Trader |
| B2 | Complete **5 free flips** | Paywall before flip 6 is in **extension** |

#### C. Pricing → Dodo checkout (Sandbox B)

| Step | Action | Notes |
|------|--------|--------|
| C1 | Visit `/pricing` | Same email you will use in extension |
| C2 | Choose monthly/yearly, auto-renew on/off | |
| C3 | Submit email → redirect to **Dodo checkout** | If error: Functions secrets, product IDs, Firebase config |
| C4 | Pay with **test card** (test mode only) | e.g. `4242 4242 4242 4242`, exp **06/32**, CVV **123** |
| C5 | Land on `/checkout/success` | Return URL uses `FLIPUR_SITE_ORIGIN` |

Decline test: `4000 0000 0000 0002` (test mode).

#### D. Webhook (your backend)

| Step | Action | Notes |
|------|--------|--------|
| D1 | Dodo dashboard → webhook deliveries | Should show 200 from `dodoWebhook` |
| D2 | Firebase Functions logs | `dodoWebhook`, `createCheckoutSession` |
| D3 | Firestore | `webhookDedup` docs; `affiliateConversions` **only if** affiliate coupon on checkout |

#### E. Pro unlock (extension + entitlement)

| Step | Action | Notes |
|------|--------|--------|
| E1 | Same email at checkout as in extension | |
| E2 | Restart Chrome / reload trading tab | |
| E3 | Attempt **6th flip** | Pro should unlock — **verified in extension repo**, not this site |

If E fails, fix entitlement in extension/Dodo before going live.

#### F. Affiliate sandbox (optional)

| Step | Action | Notes |
|------|--------|--------|
| F1 | Visitor opens `/?ref=TESTCODE` | Ref stored 30 days in browser |
| F2 | Partner applies at `/affiliate/register` | Needs Functions `submitAffiliateInterest` |
| F3 | You **onboard** in admin `/affiliate-master` | `npm run dev:admin` + deployed `affiliateAdmin` |
| F4 | Partner logs in `/affiliate/login` | After you send password reset |
| F5 | Customer checks out with that coupon | Conversion in partner dashboard if webhook + coupon match |

Payouts remain **manual** per [AFFILIATE_SETUP.md](../AFFILIATE_SETUP.md).

### Phase 5 — When bank verification completes (live)

1. Dodo → **copy products** test → live (or recreate in live).
2. Replace Firebase secrets with **live** API key, webhook secret, **live** product IDs.
3. Set `DODO_PAYMENTS_ENVIRONMENT=live_mode` on Functions (only then).
4. Run the same funnel once with a **small real** charge; cancel auto-renew in portal.
5. See [PRODUCTION_GO_LIVE.md](./PRODUCTION_GO_LIVE.md).

---

## Firebase CLI login

```bash
npx firebase-tools login
```

If it shows a URL + code:

```bash
npx firebase-tools login PASTE_CODE_HERE
```

Then retry `npm run deploy:web`.

---

## Quick reference — ports

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Dev (latest source) |
| http://localhost:4173 | Production build preview (`npm --prefix apps/web run preview`) |
| https://flipur.trade | Public site (after hosting deploy) |

---

## What to tell the market today

- **Yes:** “Install free from Chrome,” psychology story, support `makemoney@flipur.trade`
- **Not yet (until live Dodo):** “Subscribe now with real money” in paid ads
- **Practice:** Sandbox B checklist above with test cards only
