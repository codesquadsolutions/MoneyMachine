# Flipur production golden path

**Architecture:** Firebase Hosting (web + admin) + **VPS Express/Postgres API** + Dodo.  
Cloud Functions are **not** part of the live path. See [ARCHITECTURE.md](./ARCHITECTURE.md).

Practicing before Live Dodo? Use [LAUNCH_TRACK_A_AND_SANDBOX_B.md](./LAUNCH_TRACK_A_AND_SANDBOX_B.md).

Code changes alone do not deploy the API — update the VPS separately ([VPS_API.md](./VPS_API.md)).

---

## 1. Deploy frontends (Firebase Hosting)

Project: **`money-machine-247`**.

```bash
# from repo root
npm run build
npm run deploy:web
npm run deploy:admin
# optional rules if still used:
npm run deploy:firestore
```

- Web: `apps/web/dist` → hosting target `web`
- Admin: `apps/admin/dist` → hosting target `admin`

Production build must include:

```env
VITE_API_BASE=https://api.flipur.trade
# admin also:
VITE_AFFILIATE_ADMIN_URL=https://api.flipur.trade/api/affiliate-admin
```

Optional: `VITE_CHROME_WEB_STORE_URL`, `VITE_ANALYTICS_SCRIPT`, `VITE_DODO_CUSTOMER_PORTAL_URL`, `VITE_SUPPORT_CHAT_*`.

---

## 2. Dodo secrets (VPS `api/.env` — not Firebase Functions)

On the VPS:

```bash
cd /var/www/flipur-api   # or pm2 cwd for flipur-api
nano .env
```

Set:

| Variable | Purpose |
|----------|---------|
| `DODO_PAYMENTS_API_KEY` | Live or test bearer key |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Webhook signing secret |
| `DODO_FLIPUR_PRODUCT_ID_MONTHLY` | Live/test `pdt_…` |
| `DODO_FLIPUR_PRODUCT_ID_YEARLY` | Live/test `pdt_…` |
| `DODO_PAYMENTS_ENVIRONMENT` | `live_mode` or `test_mode` |
| `FLIPUR_SITE_ORIGIN` | `https://flipur.trade` (checkout return) |

Defaults (override via env) live in `api/src/lib/dodoProducts.js`:

| Plan | Default product ID |
|------|--------------------|
| Monthly | `pdt_0NrnAEMVHEHIPPRE5YBy9` |
| Yearly | `pdt_0NrnDvQ7nR9YtbY3Qd67A` |

Then:

```bash
pm2 restart flipur-api
curl https://api.flipur.trade/health
```

**Webhook URL (Dodo dashboard):**

`https://api.flipur.trade/api/webhooks/dodo`

Events: `payment.succeeded`, `subscription.active`, `subscription.renewed`, `refund.succeeded`

---

## 3. Golden path (test then live)

1. Open https://flipur.trade/ → Add to Chrome (Web Store).
2. Complete 5 free flips in the extension (extension repo).
3. Visit `/pricing` → checkout with matching email (test card in test_mode first).
4. Land on `/checkout/success` → Pro unlocks on 6th flip (verify in extension).
5. Optional affiliate: `/?ref=CODE` → pricing → webhook → conversion in admin `/affiliate-master`.

---

## 4. Extension entitlement

Marketing assumes paywall before flip 6. Confirm the extension validates the Dodo subscription (license key, API, or your backend) — **outside this repo**.

---

## 5. Quick ops cheat sheet

| Task | Command |
|------|---------|
| Redeploy site | `npm run deploy:web` |
| Redeploy admin | `npm run deploy:admin` |
| API logs | `pm2 logs flipur-api --lines 100` |
| Restart API | `pm2 restart flipur-api` |
| Health | `curl https://api.flipur.trade/health` |
| Webhook guide | [STEP3_WEBHOOK.md](./STEP3_WEBHOOK.md) |
| Full VPS | [VPS_API.md](./VPS_API.md) |
