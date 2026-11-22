import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { affiliateAdminRequest } from "../affiliateApi";
import {
  buildDecisionMetrics,
  loadCampaigns,
  loadCrmLeads,
  loadLeadActivities,
  saveCampaign,
  setLeadStage,
  syncCrm,
  updateLeadFields,
  upsertCrmLead,
  addLeadActivity,
} from "./crmApi";

const CrmContext = createContext(null);

export function CrmProvider({ children, enabled }) {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [affiliateSummary, setAffiliateSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    try {
      const [nextLeads, nextCampaigns] = await Promise.all([loadCrmLeads(), loadCampaigns()]);
      setLeads(nextLeads);
      setCampaigns(nextCampaigns);
      try {
        const summary = await affiliateAdminRequest("summary");
        setAffiliateSummary(summary);
      } catch {
        setAffiliateSummary(null);
      }
    } catch (err) {
      setError(err.message || "Could not load CRM.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const syncAll = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    setError("");
    try {
      const body = await syncCrm();
      setLeads((body.leads || []).map((row) => row));
      setCampaigns(body.campaigns || []);
      try {
        const summary = await affiliateAdminRequest("summary");
        setAffiliateSummary(summary);
      } catch {
        /* optional */
      }
      setLastSyncedAt(new Date().toISOString());
      await refresh();
    } catch (err) {
      setError(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) await syncAll();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const metrics = useMemo(() => buildDecisionMetrics(leads), [leads]);

  const value = useMemo(
    () => ({
      leads,
      campaigns,
      affiliateSummary,
      metrics,
      loading,
      syncing,
      error,
      setError,
      lastSyncedAt,
      refresh,
      syncAll,
      async createLead(fields) {
        const lead = await upsertCrmLead(fields, { activityType: "system", activityText: "Lead created manually" });
        await refresh();
        return lead;
      },
      async moveStage(leadId, stage, fromStage) {
        await setLeadStage(leadId, stage, fromStage);
        await refresh();
      },
      async patchLead(leadId, fields, activity) {
        await updateLeadFields(leadId, fields, activity);
        await refresh();
      },
      async noteLead(leadId, text) {
        await addLeadActivity(leadId, { type: "note", text });
        await refresh();
      },
      loadLeadActivities,
      async createCampaign(fields) {
        const next = await saveCampaign(fields);
        setCampaigns(next);
      },
    }),
    [leads, campaigns, affiliateSummary, metrics, loading, syncing, error, lastSyncedAt, refresh, syncAll],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
