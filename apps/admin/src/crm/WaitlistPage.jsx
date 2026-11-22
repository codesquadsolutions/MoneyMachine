import { useEffect, useMemo, useState } from "react";
import {
  inviteWaitlist,
  loadWaitlist,
  removeWaitlistPerson,
  updateWaitlistPerson,
} from "./crmApi";

const platforms = [
  { id: "topstepx", label: "TopstepX" },
  { id: "tradingview", label: "TradingView" },
  { id: "both", label: "Both" },
];

const platformFilters = [
  ["all", "All"],
  ["topstepx", "TopstepX"],
  ["tradingview", "TradingView"],
  ["both", "Both"],
];

function platformLabel(id) {
  return platforms.find((item) => item.id === id)?.label || id || "—";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function Stat({ label, value, pressed, onClick }) {
  return (
    <button className={pressed ? "card stat on" : "card stat"} type="button" aria-pressed={pressed} onClick={onClick}>
      <b>{value}</b>
      <span>{label}</span>
    </button>
  );
}

export function WaitlistPage() {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  async function reload() {
    const rows = await loadWaitlist();
    setPeople(rows);
  }

  useEffect(() => {
    let cancelled = false;
    loadWaitlist()
      .then((rows) => {
        if (!cancelled) setPeople(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load waitlist.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingRemove) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setPendingRemove(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingRemove]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = people.filter((person) => {
      if (platformFilter !== "all" && person.platform !== platformFilter) return false;
      if (statusFilter !== "all" && person.status !== statusFilter) return false;
      if (!needle) return true;
      return `${person.name} ${person.email}`.toLowerCase().includes(needle);
    });
    rows.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    return rows;
  }, [people, query, platformFilter, statusFilter]);

  const counts = {
    all: people.length,
    topstepx: people.filter((person) => person.platform === "topstepx").length,
    tradingview: people.filter((person) => person.platform === "tradingview").length,
    both: people.filter((person) => person.platform === "both").length,
    waiting: people.filter((person) => person.status !== "invited").length,
    invited: people.filter((person) => person.status === "invited").length,
  };

  async function run(work) {
    setError("");
    setBusy(true);
    try {
      const next = await work();
      if (Array.isArray(next)) setPeople(next);
      else await reload();
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const lines = ["name,email,platform,status,source,createdAt"];
    for (const person of filtered) {
      lines.push(
        [person.name, person.email, person.platform, person.status, person.source, person.createdAt].map(csvCell).join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flipur-waitlist.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Waitlist</h1>
          <p className="note">Stored in Postgres. Rows sync into CRM leads automatically.</p>
        </div>
      </div>

      <div className="stats">
        {platformFilters.map(([id, label]) => (
          <Stat
            key={id}
            label={label}
            value={counts[id]}
            pressed={platformFilter === id}
            onClick={() => setPlatformFilter(id)}
          />
        ))}
      </div>
      <div className="stats pair">
        <Stat
          label="Waiting"
          value={counts.waiting}
          pressed={statusFilter === "waiting"}
          onClick={() => setStatusFilter((current) => (current === "waiting" ? "all" : "waiting"))}
        />
        <Stat
          label="Invited"
          value={counts.invited}
          pressed={statusFilter === "invited"}
          onClick={() => setStatusFilter((current) => (current === "invited" ? "all" : "invited"))}
        />
      </div>
      <div className="tools">
        <input placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button
          className="btn s"
          type="button"
          disabled={busy || !filtered.length}
          onClick={() =>
            run(() =>
              inviteWaitlist(
                filtered.filter((p) => p.status !== "invited").map((p) => p.id),
              ),
            )
          }
        >
          Invite filtered
        </button>
        <button className="btn s" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      {error ? <p className="err">{error}</p> : null}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="empty">
                <td colSpan={6}>No one has joined the waitlist yet.</td>
              </tr>
            ) : (
              filtered.map((person) => (
                <tr key={person.id}>
                  <td data-label="Name">{person.name}</td>
                  <td data-label="Email">{person.email}</td>
                  <td data-label="Platform">
                    <select
                      aria-label={`Platform for ${person.email || person.name}`}
                      value={person.platform}
                      disabled={busy}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === person.platform) return;
                        run(() => updateWaitlistPerson(person.id, next));
                      }}
                    >
                      {person.platform && !platforms.some((item) => item.id === person.platform) ? (
                        <option value={person.platform}>{platformLabel(person.platform)}</option>
                      ) : null}
                      <option value="">—</option>
                      {platforms.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Status">
                    <span className={person.status === "invited" ? "badge invited" : "badge waiting"}>
                      {person.status === "invited" ? "Invited" : "Waiting"}
                    </span>
                  </td>
                  <td data-label="Joined">{formatDate(person.createdAt)}</td>
                  <td className="actions">
                    <div className="row-actions">
                      <button className="btn s sm" type="button" disabled={busy} onClick={() => setPendingRemove(person)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pendingRemove ? (
        <div
          className="modal"
          onClick={() => {
            if (!busy) setPendingRemove(null);
          }}
        >
          <div
            className="card dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="remove-title">Remove this person?</h2>
            <p>{`${pendingRemove.name || pendingRemove.email} will be removed from the Postgres waitlist.`}</p>
            <div className="actions">
              <button className="btn s" type="button" onClick={() => setPendingRemove(null)} disabled={busy}>
                Cancel
              </button>
              <button
                className="btn danger"
                type="button"
                disabled={busy}
                onClick={() => {
                  const person = pendingRemove;
                  setPendingRemove(null);
                  run(() => removeWaitlistPerson(person.id));
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
