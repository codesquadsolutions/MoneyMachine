import { ingestCrmLead } from "./crmService.js";

/**
 * Public CRM lead upsert for chat / Meta Lead Ads / forms.
 * Auth: CRM_INGEST_SECRET via header x-crm-secret or body.secret
 */
export async function handleCrmIngest(req, res) {
  try {
    const secret = process.env.CRM_INGEST_SECRET || "";
    const provided = req.get("x-crm-secret") || req.body?.secret || "";
    if (!secret || provided !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const lead = await ingestCrmLead(req.body || {});
    return res.json({ ok: true, leadId: lead.id, lead });
  } catch (err) {
    console.error("[crm-ingest]", err);
    return res.status(err.status || 500).json({ error: err.message || "Ingest failed" });
  }
}
