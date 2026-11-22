# Step 3 — Verify Dodo webhooks (10 minutes)

Checkout **1** and **2** (site + checkout session) are done. This step confirms Dodo can talk to the **VPS Express API** after a payment.

## What the webhook does (this repo)

| Does | Does not |
|------|----------|
| Verifies Dodo signature (Standard Webhooks) | Unlock Pro in the Chrome extension |
| Records **affiliate** sales when checkout used a `?ref=` coupon | Charge cards |
| Dedupes events in Postgres `webhook_dedup` | Replace Dodo customer portal |

**Normal checkout without affiliate code:** webhook still returns **HTTP 200** with `skipped: no_coupon` (or equivalent) — that is OK.

Handler: `api/src/routes/webhook.js` → `POST /api/webhooks/dodo`.

---

## 1) Dodo dashboard

1. Open [Dodo dashboard](https://app.dodopayments.com) → **Test mode** or **Live** (must match `DODO_PAYMENTS_ENVIRONMENT` on the VPS).
2. **Developers** → **Webhooks**.
3. Endpoint URL must be exactly:

   ```
   https://api.flipur.trade/api/webhooks/dodo
   ```

   **Do not** use old Cloud Functions URLs like  
   `https://us-central1-….cloudfunctions.net/dodoWebhook`.

4. Signing secret must match VPS `api/.env` → `DODO_PAYMENTS_WEBHOOK_KEY`.

5. Subscribe to at least:

   - `payment.succeeded`
   - `subscription.active`
   - `subscription.renewed`
   - `refund.succeeded` (recommended)

6. **Save** the webhook.

---

## 2) Trigger a delivery

Either:

- **Resend** an event from a recent Flipur payment, or  
- Use Dodo’s **Send test webhook** for `payment.succeeded` (if available).

---

## 3) What “good” looks like

In Dodo **Webhook deliveries**:

- **Status:** `200`
- Body examples: `{"received":true,…}` / duplicate / skipped no_coupon / affiliate ok

On the VPS:

```bash
pm2 logs flipur-api --lines 80
curl -s https://api.flipur.trade/health
```

You should **not** see repeated `Invalid signature` after a real Dodo delivery.

---

## If you get 401 Invalid signature

1. Webhook signing secret in Dodo ≠ VPS `DODO_PAYMENTS_WEBHOOK_KEY`.
2. Update VPS `.env`, then:

   ```bash
   pm2 restart flipur-api
   ```

3. Resend the event from Dodo.

Verification uses the **Standard Webhooks** library on the **raw** request body (`express.raw` mounted only on `/api/webhooks`).

---

## If you get 400 Missing raw body

Something stripped or parsed the body before signature verify. Confirm nginx/Traefik is not rewriting the POST body, and that the request hits Express `/api/webhooks/dodo` (raw middleware in `api/src/index.js`).

---

## If you get connection / TLS errors

1. `curl https://api.flipur.trade/health` from your laptop.
2. On VPS: `pm2 status`, `curl http://127.0.0.1:8082/health`, `docker ps | grep flipur`.
3. See [VPS_API.md](./VPS_API.md).

---

## Next step

**Step 4:** Chrome extension Pro unlock — same email as checkout, 6th flip. See [GO_LIVE_READINESS.md](./GO_LIVE_READINESS.md).
