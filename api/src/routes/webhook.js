import { Router } from "express";
import { query } from "../db.js";
import { processAffiliateSale } from "../lib/sales.js";
import { verifyDodoWebhookEvent } from "../lib/verifyWebhook.js";

const router = Router();

router.post("/dodo", async (req, res) => {
  const signingSecret = String(process.env.DODO_PAYMENTS_WEBHOOK_KEY || "").trim();
  if (!signingSecret) {
    res.status(503).json({ error: "Webhook signing secret is not configured." });
    return;
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));

  if (!rawBody.length) {
    res.status(400).json({ error: "Missing raw body." });
    return;
  }

  const webhookId = String(req.get("webhook-id") || "");
  if (webhookId) {
    const seen = await query(`SELECT id FROM webhook_dedup WHERE id = $1`, [webhookId]);
    if (seen.rows[0]) {
      res.json({ received: true, duplicate: true });
      return;
    }
  }

  const headerRecord = {
    "webhook-id": req.get("webhook-id") || "",
    "webhook-timestamp": req.get("webhook-timestamp") || "",
    "webhook-signature": req.get("webhook-signature") || "",
  };

  let event;
  try {
    event = verifyDodoWebhookEvent(signingSecret, rawBody, headerRecord);
  } catch (err) {
    console.error("dodo webhook verify failed", err?.message || err);
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const result = await processAffiliateSale(event, webhookId);
  if (webhookId) {
    await query(`INSERT INTO webhook_dedup (id, type, result_json) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [
      webhookId,
      event.type || "",
      JSON.stringify(result),
    ]);
  }
  res.json({ received: true, ...result });
});

export default router;
