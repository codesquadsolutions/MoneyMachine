import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FUNNEL_STAGES, sourceLabel, stageLabel } from "./constants";
import { useCrm } from "./CrmContext";

export function CrmFunnel() {
  const { leads, moveStage, error, setError, loading } = useCrm();
  const [busyId, setBusyId] = useState("");
  const [typeFilter, setTypeFilter] = useState("customer");

  const columns = useMemo(() => {
    const map = Object.fromEntries(FUNNEL_STAGES.map((s) => [s.id, []]));
    for (const lead of leads) {
      if (typeFilter === "customer" && lead.type === "affiliate_interest") continue;
      if (typeFilter === "affiliate_interest" && lead.type !== "affiliate_interest") continue;
      const stage = map[lead.stage] ? lead.stage : "new";
      map[stage].push(lead);
    }
    return map;
  }, [leads, typeFilter]);

  async function move(lead, stage) {
    if (lead.stage === stage) return;
    setBusyId(lead.id);
    setError("");
    try {
      await moveStage(lead.id, stage, lead.stage);
    } catch (err) {
      setError(err.message || "Could not move lead.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Funnel</h1>
          <p className="note">Move leads through stages. Decisions stay visible on the dashboard.</p>
        </div>
        <div className="page-head-actions">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Funnel type">
            <option value="customer">Customer funnel</option>
            <option value="affiliate_interest">Affiliate interest</option>
            <option value="all">All types</option>
          </select>
          <Link className="btn s" to="/leads">
            Leads list
          </Link>
        </div>
      </div>

      {error ? <p className="err">{error}</p> : null}
      {loading && !leads.length ? <p className="note">Loading funnel…</p> : null}

      <div className="funnel-board">
        {FUNNEL_STAGES.map((stage) => (
          <section key={stage.id} className="funnel-column card">
            <header className="funnel-column-head">
              <h2>{stage.label}</h2>
              <b>{columns[stage.id]?.length || 0}</b>
            </header>
            <div className="funnel-column-body">
              {(columns[stage.id] || []).length === 0 ? (
                <p className="empty-state tight">Empty</p>
              ) : (
                (columns[stage.id] || []).map((lead) => (
                  <article key={lead.id} className="funnel-card">
                    <div className="funnel-card-top">
                      <strong>{lead.name || lead.email || lead.phone || "Lead"}</strong>
                      <span className={`badge source-${lead.source}`}>{sourceLabel(lead.source)}</span>
                    </div>
                    <p className="muted sm">{lead.email || lead.phone}</p>
                    {lead.utmCampaign ? <p className="muted sm">{lead.utmCampaign}</p> : null}
                    <label className="move-label">
                      Move to
                      <select
                        value={lead.stage}
                        disabled={busyId === lead.id}
                        onChange={(e) => move(lead, e.target.value)}
                        aria-label={`Move ${lead.email || lead.name}`}
                      >
                        {FUNNEL_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {stageLabel(s.id)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Link className="btn s sm" to={`/leads?id=${encodeURIComponent(lead.id)}`}>
                      Open
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
