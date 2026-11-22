import {
  affiliateAdminLogin,
  affiliateAdminRequest,
  getAdminApiToken,
  setAdminApiToken,
} from "../affiliateApi";
import { STALE_CONTACTED_DAYS, STALE_NEW_HOURS } from "./constants";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");

async function crmRequest(action, body = {}) {
  let token = getAdminApiToken();
  if (!token) {
    const user = import.meta.env.VITE_ADMIN_USER || "admin";
    const password = import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD || "";
    if (password) {
      await affiliateAdminLogin(user, password);
      token = getAdminApiToken();
    }
  }

  const response = await fetch(`${API_BASE}/api/crm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  if (response.status === 401) {
    setAdminApiToken("");
  }
  if (!response.ok) throw new Error(json.error || "CRM request failed.");
  return json;
}

export function normalizeLead(raw = {}) {
  return {
    id: raw.id || "",
    name: raw.name || "",
    email: String(raw.email || "").trim().toLowerCase(),
    phone: raw.phone || "",
    source: raw.source || "website",
    type: raw.type || "customer",
    stage: raw.stage || "new",
    utmSource: raw.utmSource || "",
    utmMedium: raw.utmMedium || "",
    utmCampaign: raw.utmCampaign || "",
    fbclid: raw.fbclid || "",
    callStatus: raw.callStatus || "none",
    lastCallAt: raw.lastCallAt || "",
    preferredLanguage: raw.preferredLanguage || "",
    waitlistId: raw.waitlistId || "",
    affiliateLeadId: raw.affiliateLeadId || "",
    affiliateId: raw.affiliateId || "",
    chatSessionId: raw.chatSessionId || "",
    platform: raw.platform || "",
    note: raw.note || "",
    firstTouchAt: raw.firstTouchAt || raw.createdAt || "",
    lastTouchAt: raw.lastTouchAt || raw.createdAt || "",
    stageUpdatedAt: raw.stageUpdatedAt || raw.createdAt || "",
    nextActionAt: raw.nextActionAt || "",
    createdAt: raw.createdAt || "",
  };
}

export async function loadCrmLeads() {
  const body = await crmRequest("leadsList");
  return (body.leads || []).map(normalizeLead);
}

export async function loadCampaigns() {
  const body = await crmRequest("campaignsList");
  return body.campaigns || [];
}

export async function saveCampaign(fields) {
  const body = await crmRequest("campaignSave", { campaign: fields });
  return body.campaigns || [];
}

export async function upsertCrmLead(input, opts = {}) {
  const body = await crmRequest("leadUpsert", {
    lead: input,
    activityText: opts.activityText,
    activityType: opts.activityType || "system",
  });
  return normalizeLead(body.lead || {});
}

export async function updateLeadFields(leadId, fields, activity) {
  const body = await crmRequest("leadUpdate", { leadId, fields, activity });
  return normalizeLead(body.lead || {});
}

export async function setLeadStage(leadId, stage, fromStage) {
  const body = await crmRequest("leadSetStage", { leadId, stage, fromStage });
  return normalizeLead(body.lead || {});
}

export async function addLeadActivity(leadId, activity) {
  if (activity?.type === "note" || !activity?.type) {
    return crmRequest("leadAddNote", { leadId, text: activity?.text || "" });
  }
  return updateLeadFields(leadId, {}, activity);
}

export async function loadLeadActivities(leadId) {
  const body = await crmRequest("leadActivities", { leadId });
  return body.activities || [];
}

export async function loadWaitlist() {
  const body = await crmRequest("waitlistList");
  return body.people || [];
}

export async function updateWaitlistPerson(id, platform) {
  const body = await crmRequest("waitlistUpdate", { id, platform });
  return body.people || [];
}

export async function inviteWaitlist(ids) {
  const body = await crmRequest("waitlistInvite", { ids });
  return body.people || [];
}

export async function removeWaitlistPerson(id) {
  const body = await crmRequest("waitlistRemove", { id });
  return body.people || [];
}

export async function syncCrm() {
  return crmRequest("sync");
}

export function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function buildDecisionMetrics(leads = []) {
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = now - 7 * dayMs;

  const byStage = Object.fromEntries(["new", "qualified", "contacted", "invited", "converted", "lost"].map((s) => [s, 0]));
  const bySource = {};
  let newToday = 0;
  let new7d = 0;
  let converted7d = 0;

  const stale = [];
  const callQueue = [];
  const unworked = [];

  for (const lead of leads) {
    byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
    bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    const created = new Date(lead.firstTouchAt || lead.createdAt).getTime();
    if (created >= todayStart.getTime()) newToday += 1;
    if (created >= weekAgo) new7d += 1;
    if (lead.stage === "converted" && new Date(lead.stageUpdatedAt || 0).getTime() >= weekAgo) converted7d += 1;

    if (lead.stage === "new" && hoursSince(lead.lastTouchAt || lead.firstTouchAt) >= STALE_NEW_HOURS) {
      stale.push({ ...lead, reason: "Unworked new lead" });
      unworked.push(lead);
    } else if (
      (lead.stage === "contacted" || lead.stage === "qualified") &&
      hoursSince(lead.lastTouchAt || lead.stageUpdatedAt) >= STALE_CONTACTED_DAYS * 24
    ) {
      stale.push({ ...lead, reason: "Stale follow-up" });
    }

    if (
      lead.phone &&
      (lead.stage === "qualified" || lead.stage === "contacted") &&
      (lead.callStatus === "none" || lead.callStatus === "callback" || lead.callStatus === "queued")
    ) {
      callQueue.push(lead);
    }
  }

  const conversionRate = new7d ? Math.round((converted7d / new7d) * 100) : 0;

  return {
    total: leads.length,
    byStage,
    bySource,
    newToday,
    new7d,
    converted7d,
    conversionRate,
    stale: stale.slice(0, 20),
    unworked: unworked.slice(0, 20),
    callQueue: callQueue.slice(0, 20),
    chatLeads: leads.filter((l) => l.source === "chat" && (l.stage === "new" || l.stage === "qualified")).slice(0, 20),
    affiliateOpen: leads
      .filter((l) => l.type === "affiliate_interest" && l.stage !== "converted" && l.stage !== "lost")
      .slice(0, 20),
  };
}

// Kept for any leftover imports
export async function syncWaitlistIntoCrm() {
  return syncCrm();
}
export async function syncAffiliateLeadsIntoCrm() {
  return syncCrm();
}

export { affiliateAdminRequest }; // used by dashboard/context patterns
