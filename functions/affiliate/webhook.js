import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { dodoApiKey, dodoWebhookKey, dodoClient } from "./dodo.js";
import { processAffiliateSale } from "./sales.js";

const cors = false;

export const dodoWebhook = onRequest(
  { region: "us-central1", secrets: [dodoApiKey, dodoWebhookKey], cors, maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const client = dodoClient();
    if (!client) {
      res.status(503).json({ error: "Dodo is not configured." });
      return;
    }

    const raw =
      req.rawBody?.toString?.() ||
      (typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));

    const webhookId = String(req.get("webhook-id") || "");
    const db = getFirestore();
    if (webhookId) {
      const seen = await db.collection("webhookDedup").doc(webhookId).get();
      if (seen.exists) {
        res.json({ received: true, duplicate: true });
        return;
      }
    }

    let event;
    try {
      event = client.webhooks.unwrap(raw, {
        headers: {
          "webhook-id": req.get("webhook-id") || "",
          "webhook-signature": req.get("webhook-signature") || "",
          "webhook-timestamp": req.get("webhook-timestamp") || "",
        },
      });
    } catch (err) {
      console.error("dodo webhook verify failed", err.message || err);
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
