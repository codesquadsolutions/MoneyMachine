import { Webhook } from "standardwebhooks";

/**
 * Raw body bytes as Dodo signed them (never re-JSON.stringify a parsed object).
 * @param {import("firebase-functions/v2/https").Request} req
 */
export function readWebhookRawBody(req) {
  if (req.rawBody && req.rawBody.length) {
    return Buffer.isBuffer(req.rawBody) ? req.rawBody.toString("utf8") : String(req.rawBody);
  }
  if (typeof req.body === "string" && req.body.length) {
    return req.body;
  }
  return null;
}

/**
 * @param {string} signingSecret whsec_… from Dodo dashboard
 * @param {string} rawBody
 * @param {Record<string, string>} headers
 */
export function verifyDodoWebhookEvent(signingSecret, rawBody, headers) {
  const wh = new Webhook(signingSecret);
  return wh.verify(rawBody, headers);
}
