import { Link, useNavigate } from "react-router-dom";
import { money } from "../affiliateApi";
import { FUNNEL_STAGES, sourceLabel, stageLabel } from "./constants";
import { useCrm } from "./CrmContext";

function formatShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ActionRow({ lead, reason, onOpen }) {
  return (
    <button className="action-row" type="button" onClick={() => onOpen(lead.id)}>
      <div>
        <strong>{lead.name || lead.email || lead.phone || "Lead"}</strong>
        <span>{reason}</span>
      </div>
      <em>
        {stageLabel(lead.stage)} · {sourceLabel(lead.source)}
      </em>
    </button>
  );
}

export function CrmDashboard() {
  const navigate = useNavigate();
  const { metrics, affiliateSummary, loading, syncing, error, lastSyncedAt, syncAll, leads } = useCrm();

  function openLead(id) {
    navigate(`/leads?id=${encodeURIComponent(id)}`);
  }

  const actions = [
    ...metrics.unworked.map((lead) => ({ lead, reason: "New — needs first touch" })),
    ...metrics.stale
      .filter((lead) => !metrics.unworked.some((u) => u.id === lead.id))
      .map((lead) => ({ lead, reason: lead.reason || "Needs follow-up" })),
    ...metrics.chatLeads
      .filter((lead) => !metrics.unworked.some((u) => u.id === lead.id) && !metrics.stale.some((s) => s.id === lead.id))
      .map((lead) => ({ lead, reason: "Chat lead awaiting follow-up" })),
    ...metrics.affiliateOpen
      .filter(
        (lead) =>
          !metrics.unworked.some((u) => u.id === lead.id) &&
          !metrics.stale.some((s) => s.id === lead.id) &&
          !metrics.chatLeads.some((c) => c.id === lead.id),
      )
      .map((lead) => ({ lead, reason: "Affiliate interest open" })),
  ].slice(0, 12);

  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Decision dashboard</h1>
          <p className="note">
            One view of leads, funnel health, and what to do next.
            {lastSyncedAt ? ` Synced ${formatShort(lastSyncedAt)}.` : ""}
          </p>
        </div>
        <div className="page-head-actions">
          <button className="btn s" type="button" disabled={syncing || loading} onClick={() => syncAll()}>
            {syncing ? "Syncing…" : "Sync leads"}
          </button>
          <Link className="btn p" to="/leads">
            Open leads
          </Link>
        </div>
      </div>

      {error ? <p className="err">{error}</p> : null}
      {loading && !leads.length ? <p className="note">Loading CRM…</p> : null}

      <div className="kpi-grid">
        <article className="card kpi">
          <span>New today</span>
          <b>{metrics.newToday}</b>
        </article>
        <article className="card kpi">
          <span>New (7d)</span>
          <b>{metrics.new7d}</b>
        </article>
        <article className="card kpi">
          <span>Converted (7d)</span>
          <b>{metrics.converted7d}</b>
        </article>
        <article className="card kpi">
          <span>Conv. rate (7d)</span>
          <b>{metrics.conversionRate}%</b>
        </article>
        <article className="card kpi">
          <span>Total leads</span>
          <b>{metrics.total}</b>
        </article>
        <article className="card kpi">
          <span>Call queue</span>
          <b>{metrics.callQueue.length}</b>
        </article>
        <article className="card kpi">
          <span>Pending payout</span>
          <b>{money(affiliateSummary?.pendingPayoutCents)}</b>
        </article>
        <article className="card kpi">
          <span>Open aff. leads</span>
          <b>{affiliateSummary?.affiliateLeads ?? metrics.affiliateOpen.length}</b>
        </article>
      </div>

      <div className="dash-grid">
        <section className="card dash-panel">
          <div className="panel-head">
            <h2>Action queue</h2>
            <span className="note sm">{actions.length} items</span>
          </div>
          {actions.length === 0 ? (
            <p className="empty-state">Nothing urgent. Sync leads or check the funnel.</p>
          ) : (
            <div className="action-list">
              {actions.map(({ lead, reason }) => (
                <ActionRow key={`${lead.id}-${reason}`} lead={lead} reason={reason} onOpen={openLead} />
              ))}
            </div>
          )}
        </section>

        <section className="card dash-panel">
          <div className="panel-head">
            <h2>Funnel snapshot</h2>
            <Link className="note sm" to="/funnel">
              Manage funnel
            </Link>
          </div>
          <div className="funnel-bars">
            {FUNNEL_STAGES.map((stage) => {
              const value = metrics.byStage[stage.id] || 0;
              const max = Math.max(1, ...FUNNEL_STAGES.map((s) => metrics.byStage[s.id] || 0));
              return (
                <div key={stage.id} className="funnel-bar-row">
                  <span>{stage.label}</span>
                  <div className="funnel-bar-track">
                    <div className="funnel-bar-fill" style={{ width: `${Math.round((value / max) * 100)}%` }} />
                  </div>
                  <b>{value}</b>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card dash-panel">
          <div className="panel-head">
            <h2>Source mix</h2>
            <Link className="note sm" to="/campaigns">
              Campaigns
            </Link>
          </div>
          <div className="source-list">
            {Object.keys(metrics.bySource).length === 0 ? (
              <p className="empty-state">No sources yet.</p>
            ) : (
              Object.entries(metrics.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div key={source} className="source-row">
                    <span>{sourceLabel(source)}</span>
                    <b>{count}</b>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="card dash-panel">
          <div className="panel-head">
            <h2>Call queue</h2>
            <span className="note sm">Ready for AI telecalling later</span>
          </div>
          {metrics.callQueue.length === 0 ? (
            <p className="empty-state">No call-ready leads (need phone + qualified/contacted).</p>
          ) : (
            <div className="action-list">
              {metrics.callQueue.map((lead) => (
                <ActionRow
                  key={lead.id}
                  lead={lead}
                  reason={`${lead.phone} · ${lead.callStatus === "none" ? "not called" : lead.callStatus}`}
                  onOpen={openLead}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
