import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FUNNEL_STAGES, sourceLabel } from "./constants";
import { useCrm } from "./CrmContext";

function initials(lead) {
  const name = String(lead.name || lead.email || "?").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTouch(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CrmFunnel() {
  const { leads, moveStage, error, setError, loading } = useCrm();
  const [busyId, setBusyId] = useState("");
  const [typeFilter, setTypeFilter] = useState("customer");
  const [draggingId, setDraggingId] = useState("");
  const [overStage, setOverStage] = useState("");
  const [optimistic, setOptimistic] = useState({}); // leadId -> stage

  const columns = useMemo(() => {
    const map = Object.fromEntries(FUNNEL_STAGES.map((s) => [s.id, []]));
    for (const lead of leads) {
      if (typeFilter === "customer" && lead.type === "affiliate_interest") continue;
      if (typeFilter === "affiliate_interest" && lead.type !== "affiliate_interest") continue;
      const stage = optimistic[lead.id] || (map[lead.stage] ? lead.stage : "new");
      map[stage].push(lead);
    }
    return map;
  }, [leads, typeFilter, optimistic]);

  async function move(lead, stage) {
    if (!lead || lead.stage === stage && !optimistic[lead.id]) return;
    const from = optimistic[lead.id] || lead.stage;
    if (from === stage) return;
    setBusyId(lead.id);
    setError("");
    setOptimistic((prev) => ({ ...prev, [lead.id]: stage }));
    try {
      await moveStage(lead.id, stage, from);
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
    } catch (err) {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
      setError(err.message || "Could not move lead.");
    } finally {
      setBusyId("");
    }
  }

  function onDragStart(event, lead) {
    setDraggingId(lead.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lead.id);
    event.dataTransfer.setData("application/x-flipur-lead", lead.id);
  }

  function onDragEnd() {
    setDraggingId("");
    setOverStage("");
  }

  function onDragOverColumn(event, stageId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overStage !== stageId) setOverStage(stageId);
  }

  function onDropColumn(event, stageId) {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-flipur-lead") || event.dataTransfer.getData("text/plain");
    setOverStage("");
    setDraggingId("");
    const lead = leads.find((row) => row.id === id);
    if (lead) move(lead, stageId);
  }

  return (
    <div className="crm-page funnel-page">
      <div className="page-head">
        <div>
          <h1>Funnel</h1>
          <p className="note">Drag cards between stages. Drop to update the pipeline instantly.</p>
        </div>
        <div className="page-head-actions">
          <div className="seg">
            {[
              ["customer", "Customers"],
              ["affiliate_interest", "Affiliates"],
              ["all", "All"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={typeFilter === id ? "on" : undefined}
                onClick={() => setTypeFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <Link className="btn s" to="/leads">
            Leads list
          </Link>
        </div>
      </div>

      {error ? <p className="err">{error}</p> : null}
      {loading && !leads.length ? <p className="note">Loading funnel…</p> : null}

      <div className="funnel-hint" aria-hidden="true">
        <span className="funnel-hint-grip" />
        Drag a lead card into another column to change stage
      </div>

      <div className="funnel-board" role="list">
        {FUNNEL_STAGES.map((stage) => {
          const rows = columns[stage.id] || [];
          const isOver = overStage === stage.id;
          return (
            <section
              key={stage.id}
              className={`funnel-column card stage-${stage.id}${isOver ? " drop-target" : ""}`}
              onDragOver={(e) => onDragOverColumn(e, stage.id)}
              onDragLeave={() => {
                if (overStage === stage.id) setOverStage("");
              }}
              onDrop={(e) => onDropColumn(e, stage.id)}
            >
              <header className="funnel-column-head">
                <div>
                  <h2>{stage.label}</h2>
                  <span className="funnel-col-sub">{rows.length} lead{rows.length === 1 ? "" : "s"}</span>
                </div>
                <b className="funnel-count">{rows.length}</b>
              </header>

              <div className="funnel-column-body">
                {rows.length === 0 ? (
                  <div className={`funnel-dropzone${isOver ? " on" : ""}`}>
                    {isOver ? "Drop here" : "Drop leads here"}
                  </div>
                ) : (
                  rows.map((lead) => {
                    const dragging = draggingId === lead.id;
                    const busy = busyId === lead.id;
                    return (
                      <article
                        key={lead.id}
                        className={`funnel-card${dragging ? " dragging" : ""}${busy ? " busy" : ""}`}
                        draggable={!busy}
                        onDragStart={(e) => onDragStart(e, lead)}
                        onDragEnd={onDragEnd}
                        role="listitem"
                      >
                        <div className="funnel-card-grip" aria-hidden="true" title="Drag">
                          <span />
                          <span />
                        </div>
                        <div className="funnel-avatar" aria-hidden="true">
                          {initials(lead)}
                        </div>
                        <div className="funnel-card-copy">
                          <strong title={lead.name || lead.email || ""}>
                            {lead.name || lead.email || lead.phone || "Lead"}
                          </strong>
                          <p className="muted" title={lead.email || lead.phone || ""}>
                            {lead.email || lead.phone || "No contact"}
                          </p>
                          <div className="funnel-card-meta">
                            <span className={`badge source-${lead.source}`}>{sourceLabel(lead.source)}</span>
                            {lead.lastTouchAt ? <span className="chip muted">{formatTouch(lead.lastTouchAt)}</span> : null}
                          </div>
                        </div>
                        <Link
                          className="funnel-open"
                          to={`/leads?id=${encodeURIComponent(lead.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          draggable={false}
                          title="Open lead"
                        >
                          Open
                        </Link>
                      </article>
                    );
                  })
                )}
                {rows.length > 0 && isOver ? <div className="funnel-dropzone on inline">Drop to move here</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
