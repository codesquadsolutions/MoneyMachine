import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAffiliateAuth } from "./AffiliateAuth.jsx";
import { callAffiliate } from "../lib/callables.js";
import { money, bpsToPercent } from "./format.js";

const ranges = [
  ["wow", "Week"],
  ["mom", "Month"],
  ["lifetime", "Lifetime"],
];

export function AffiliateDashboard() {
  const { user, ready, logout } = useAffiliateAuth();
  const [range, setRange] = useState("lifetime");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });
  const [copyMsg, setCopyMsg] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const body = await callAffiliate("getAffiliateDashboard", { range });
      setData(body);
    } catch (err) {
      setError(err.message || "Could not load dashboard.");
    } finally {
      setBusy(false);
    }
  }, [user, range]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) return null;
  if (!user) return <Navigate to="/affiliate/login" replace />;

  async function submitTicket(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await callAffiliate("submitAffiliateTicket", ticketForm);
      setTicketForm({ subject: "", message: "" });
      await load();
    } catch (err) {
      setError(err.message || "Could not send ticket.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Copy failed");
    }
  }

  const profile = data?.profile;
  const metrics = data?.metrics;

  return (
    <main className="w aff dash">
      <header className="aff-head">
        <Link className="logo sm" to="/">
          <img src="/logo.png" alt="" width={32} height={32} />
          Flipur affiliates
        </Link>
        <h1>Affiliate dashboard</h1>
        <button className="btn s sm" type="button" onClick={() => logout()}>
          Sign out
        </button>
      </header>
      <p className="lead sm aff-user">{profile?.displayName || user.email}</p>

      {profile?.status === "pending" ? (
        <p className="note aff">Your account is set up but not live yet. We will email you when your code is active.</p>
      ) : null}

      <div className="aff-tabs">
        {[
          ["overview", "Overview"],
          ["conversions", "Conversions"],
          ["support", "Support"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="aff-range">
            {ranges.map(([id, label]) => (
              <button key={id} type="button" className={range === id ? "on" : ""} onClick={() => setRange(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="aff-metrics">
            <Metric label="Lifetime earnings" value={money(metrics?.totalLifetimeEarningsCents)} />
            <Metric label="Pending payout" value={money(metrics?.pendingPayoutCents)} />
            <Metric label="Conversions (range)" value={metrics?.rangeConversions ?? "—"} />
            <Metric label="Commission rate" value={bpsToPercent(profile?.commissionRateBps)} />
          </div>
          <section className="card aff-ref">
            <h2>Referral tools</h2>
            <p className="sm muted">Share your link or code. Buyer PII is never shown—only order references and amounts.</p>
            <div className="aff-copy-row">
              <div>
                <span className="lbl">Coupon</span>
                <strong>{profile?.couponCode || "—"}</strong>
              </div>
              <button className="btn s sm" type="button" onClick={() => copy(profile?.couponCode || "")}>
                Copy code
              </button>
            </div>
            <div className="aff-copy-row">
              <div className="code-wrap">
                <span className="lbl">Link</span>
                <code>{profile?.shareUrl || "—"}</code>
              </div>
              <button className="btn s sm" type="button" onClick={() => copy(profile?.shareUrl || "")}>
                Copy link
              </button>
            </div>
            {copyMsg ? <p className="ok sm">{copyMsg}</p> : null}
          </section>
        </>
      )}

      {tab === "conversions" && (
        <ConversionsTable rows={data?.conversions} />
      )}

      {tab === "support" && (
        <div className="aff-support-grid">
          <form className="card aff-form" onSubmit={submitTicket}>
            <h2>New support request</h2>
            <label>
              Subject
              <input
                required
                value={ticketForm.subject}
                onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </label>
            <label>
              Message
              <textarea
                required
                rows={4}
                value={ticketForm.message}
                onChange={(e) => setTicketForm((p) => ({ ...p, message: e.target.value }))}
              />
            </label>
            <button className="btn p" type="submit" disabled={busy}>
              Submit
            </button>
          </form>
          <TicketList tickets={data?.tickets} />
        </div>
      )}

      {error ? <p className="err">{error}</p> : null}
      {busy && tab === "overview" ? <p className="muted sm">Loading…</p> : null}
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="card aff-metric">
      <span>{label}</span>
      <b>{value ?? "—"}</b>
    </div>
  );
}

function ConversionsTable({ rows }) {
  return (
    <div className="tw aff-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Order ref</th>
            <th>Sale</th>
            <th>Commission</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {!rows?.length ? (
            <tr className="empty">
              <td colSpan={5}>No conversions yet. Share your link to start earning.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td data-label="Date">{row.orderAt?.slice(0, 10) || "—"}</td>
                <td data-label="Order">{row.orderId}</td>
                <td data-label="Sale">{money(row.saleAmountCents)}</td>
                <td data-label="Commission">{money(row.commissionAmountCents)}</td>
                <td data-label="Status">
                  <span className={`badge ${row.status}`}>{row.status}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TicketList({ tickets }) {
  return (
    <div className="card aff-tickets">
      <h2>Past tickets</h2>
      {!tickets?.length ? <p className="muted sm">No tickets yet.</p> : null}
      <ul>
        {tickets?.map((t) => (
          <li key={t.id}>
            <div className="row">
              <strong>{t.subject}</strong>
              <span className={`badge ${t.status}`}>{t.status}</span>
            </div>
            <p className="sm">{t.message}</p>
            {t.adminReply ? <p className="reply sm">Reply: {t.adminReply}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
