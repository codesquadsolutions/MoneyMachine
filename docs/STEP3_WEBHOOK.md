# Step 3 — Verify Dodo webhooks (10 minutes)

Checkout **1** and **2** are done. This step confirms Dodo can talk to Firebase after a payment.

## What the webhook does (this repo)

| Does | Does not |
|------|----------|
| Verifies Dodo signature | Unlock Pro in the Chrome extension |
| Records **affiliate** sales when checkout used a `?ref=` coupon | Charge cards |
| Dedupes events in Firestore `webhookDedup` | Replace Dodo customer portal |

**Normal checkout without affiliate code:** webhook still returns **HTTP 200** with `skipped: no_coupon` — that is OK.

## 1) Dodo dashboard (test mode)

1. Open [Dodo dashboard](https://app.dodopayments.com) → **Test mode**.
2. **Developers** → **Webhooks** (or Notifications).
3. Endpoint URL must be exactly:

   ```
   https://us-central1-flipur-404bd.cloudfunctions.net/dodoWebhook
   ```

4. Signing secret must match what you put in Firebase as `DODO_PAYMENTS_WEBHOOK_KEY` (via `.local/dodo-test-secrets.txt` + import script).

5. Subscribe to events (minimum):

   - `payment.succeeded`
   - `subscription.active`
   - `subscription.renewed`
   - `refund.succeeded` (recommended)

6. **Save** the webhook.

## 2) Trigger a delivery

Either:

- **Resend** an event from your recent **Flipur Monthly** payment (best), or  
- Use Dodo’s **Send test webhook** for `payment.succeeded` (if available).

## 3) What “good” looks like

In Dodo **Webhook deliveries** for that endpoint:

- **Status:** `200` (or success)
- **Response body** (example): `{"received":true,"skipped":true,"reason":"no_coupon"}`  
  Affiliate checkout would show `"ok":true` instead.

## 4) Optional — Firebase

[Firebase Console → Functions → Logs](https://console.firebase.google.com/project/flipur-404bd/functions/logs) → filter `dodoWebhook`.  
You should **not** see `Invalid signature` after a real Dodo delivery.

## If you get 401 Invalid signature

1. Webhook signing secret in Dodo ≠ Firebase `DODO_PAYMENTS_WEBHOOK_KEY`.
2. Re-copy secret from Dodo into `.local/dodo-test-secrets.txt`.
3. Run `.\scripts\import-dodo-test-secrets.ps1` then `npx firebase-tools deploy --only functions:dodoWebhook`.

Verification uses the **Standard Webhooks** library (`standardwebhooks`) on the **raw** request body—not the old Dodo SDK `unwrap` helper.

## If you get 400 Missing raw body

Rare on Firebase; contact support or Agent to adjust the handler. Dodo must sign the exact bytes received.

## Next step

**Step 4:** Chrome extension Pro unlock — same email as checkout, 6th flip. See `GO_LIVE_READINESS.md`.
