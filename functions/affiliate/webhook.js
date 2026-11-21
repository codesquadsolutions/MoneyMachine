import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { dodoWebhookKey } from "./dodo.js";
import { processAffiliateSale } from "./sales.js";
import { readWebhookRawBody, verifyDodoWebhookEvent } from "./verifyWebhook.js";

const cors = false;

export const dodoWebhook = onRequest(
  { region: "us-central1", secrets: [dodoWebhookKey], cors, maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const signingSecret = dodoWebhookKey.value();
    if (!signingSecret) {
      res.status(503).json({ error: "Webhook signing secret is not configured." });
      return;
    }

    const rawBody = readWebhookRawBody(req);
    if (!rawBody) {
      console.error("dodo webhook: missing raw body (signature cannot be verified)");
      res.status(400).json({ error: "Missing raw body." });
      return;
    }

    const webhookId = String(req.get("webhook-id") || "");
    const db = getFirestore();
    if (webhookId) {
      const seen = await db.collection("webhookDedup").doc(webhookId).get();
      if (seen.exists) {
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
      const hint = err?.message || String(err);
      console.error("dodo webhook verify failed", hint);
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const result = await processAffiliateSale(event, webhookId);

    if (webhookId) {
      await db.collection("webhookDedup").doc(webhookId).set({
        type: event.type,
        result,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    res.json({ received: true, ...result });
  },
);
