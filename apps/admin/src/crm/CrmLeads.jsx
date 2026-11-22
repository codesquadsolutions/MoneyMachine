import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CALL_STATUSES, FUNNEL_STAGES, LEAD_SOURCES, LEAD_TYPES, sourceLabel, stageLabel } from "./constants";
import { useCrm } from "./CrmContext";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  source: "manual",
  type: "customer",
  stage: "new",
  note: "",
};

export function CrmLeads() {
  const { leads, loading, error, setError, createLead, moveStage, patchLead, noteLead, loadLeadActivities } = useCrm();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(params.get("id") || "");
  const [activities, setActivities] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [phoneDraft, setPhoneDraft] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads
      .filter((lead) => {
        if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
        if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
        if (typeFilter !== "all" && lead.type !== typeFilter) return false;
        if (!needle) return true;
        return `${lead.name} ${lead.email} ${lead.phone} ${lead.utmCampaign}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => String(b.lastTouchAt).localeCompare(String(a.lastTouchAt)));
  }, [leads, query, sourceFilter, stageFilter, typeFilter]);

  const selected = leads.find((lead) => lead.id === selectedId) || null;

  useEffect(() => {
    const id = params.get("id") || "";
    if (id) setSelectedId(id);
  }, [params]);

  useEffect(() => {
    if (!selectedId) {
      setActivities([]);
      setPhoneDraft("");
      return undefined;
    }
    const current = leads.find((lead) => lead.id === selectedId);
    setPhoneDraft(current?.phone || "");
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps -- seed phone only when opening a lead

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    loadLeadActivities(selectedId)
      .then((rows) => {
        if (!cancelled) setActivities(rows);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, loadLeadActivities, leads]);

  function openLead(id) {
    setSelectedId(id);
    setParams(id ? { id } : {});
  }

  async function run(work) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Leads</h1>
          <p className="note">Automatic inbox from website, ads, chat, and affiliates — plus manual add.</p>
        </div>
        <div className="page-head-actions">
          <button className="btn p" type="button" onClick={() => setShowCreate(true)}>
            Add lead
          </button>
        </div>
      </div>

      {error ? <p className="err">{error}</p> : null}

      <div className="crm-tools" role="search">
        <input
          placeholder="Search name, email, phone, campaign"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Source filter">
          <option value="all">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} aria-label="Stage filter">
          <option value="all">All stages</option>
          {FUNNEL_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Type filter">
          <option value="all">All types</option>
          {LEAD_TYPES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className={selected ? "leads-layout open" : "leads-layout"}>
        <div className="tw leads-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Last touch</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr className="empty">
                  <td colSpan={5}>Loading leads…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="empty">
                  <td colSpan={5}>No leads yet. Sync from dashboard or add one.</td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className={lead.id === selectedId ? "selected" : undefined} onClick={() => openLead(lead.id)}>
                    <td data-label="Name">{lead.name || "—"}</td>
                    <td data-label="Contact">
                      <div className="stack-text">
                        <span>{lead.email || "—"}</span>
                        {lead.phone ? <span className="muted">{lead.phone}</span> : null}
                      </div>
                    </td>
                    <td data-label="Source">
                      <span className={`badge source-${lead.source}`}>{sourceLabel(lead.source)}</span>
                    </td>
                    <td data-label="Stage">
                      <span className={`badge stage-${lead.stage}`}>{stageLabel(lead.stage)}</span>
                    </td>
                    <td data-label="Last touch">{formatDate(lead.lastTouchAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <aside className="card lead-drawer">
            <div className="lead-drawer-head">
              <div>
                <h2>{selected.name || selected.email || "Lead"}</h2>
                <p className="note sm">
                  {sourceLabel(selected.source)} · {selected.type === "affiliate_interest" ? "Affiliate interest" : "Customer"}
                </p>
              </div>
              <button className="btn s sm" type="button" onClick={() => openLead("")}>
                Close
              </button>
            </div>

            <div className="lead-fields">
              <label>
                Stage
                <select
                  value={selected.stage}
                  disabled={busy}
                  onChange={(e) => run(() => moveStage(selected.id, e.target.value, selected.stage))}
                >
                  {FUNNEL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input
                  value={phoneDraft}
                  disabled={busy}
                  onBlur={() => {
                    const phone = phoneDraft.trim();
                    if (phone === (selected.phone || "")) return;
                    run(() => patchLead(selected.id, { phone }, { type: "note", text: "Phone updated" }));
                  }}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="+91…"
                />
              </label>
              <label>
                Call status
                <select
                  value={selected.callStatus || "none"}
                  disabled={busy}
                  onChange={(e) =>
                    run(() =>
                      patchLead(
                        selected.id,
                        { callStatus: e.target.value, lastCallAt: e.target.value === "none" ? "" : new Date().toISOString() },
                        { type: "call", text: `Call status → ${e.target.value}` },
                      ),
                    )
                  }
                >
                  {CALL_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="lead-meta">
              <p>
                <span>Email</span> {selected.email || "—"}
              </p>
              <p>
                <span>Campaign</span> {selected.utmCampaign || "—"}
              </p>
              <p>
                <span>UTM</span> {[selected.utmSource, selected.utmMedium].filter(Boolean).join(" / ") || "—"}
              </p>
              <p>
                <span>First touch</span> {formatDate(selected.firstTouchAt)}
              </p>
            </div>

            <form
              className="note-form"
              onSubmit={(e) => {
                e.preventDefault();
                const text = note.trim();
                if (!text) return;
                run(async () => {
                  await noteLead(selected.id, text);
                  setNote("");
                  setActivities(await loadLeadActivities(selected.id));
                });
              }}
            >
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={3} />
              <button className="btn p sm" type="submit" disabled={busy || !note.trim()}>
                Save note
              </button>
            </form>

            <div className="activity-list">
              <h3>Activity</h3>
              {activities.length === 0 ? (
                <p className="empty-state">No activity yet.</p>
              ) : (
                activities.map((item) => (
                  <article key={item.id} className="activity-item">
                    <div className="row">
                      <strong>{item.type}</strong>
                      <span>{formatDate(item.at)}</span>
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {showCreate ? (
        <div className="modal" onClick={() => !busy && setShowCreate(false)}>
          <form
            className="card dialog create-lead"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const lead = await createLead(form);
                setShowCreate(false);
                setForm(emptyForm);
                openLead(lead.id);
              });
            }}
          >
            <h2>Add lead</h2>
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={!form.phone} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Source
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {LEAD_TYPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} />
            </label>
            <div className="actions">
              <button className="btn s" type="button" disabled={busy} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn p" type="submit" disabled={busy}>
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
