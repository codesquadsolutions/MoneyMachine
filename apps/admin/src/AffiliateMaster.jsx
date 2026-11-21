import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { affiliateAdminRequest, money } from "./affiliateApi";

export function AffiliateMaster({ onSignOut }) {
  const [data, setData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState(null);
  const [reply, setReply] = useState(null);
  const [onboard, setOnboard] = useState(null);
  const [onboardResult, setOnboardResult] = useState(null);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const summary = await affiliateAdminRequest("summary");
      setData(summary);
      const ticketBody = await affiliateAdminRequest("tickets");
      setTickets(ticketBody.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const affiliates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows = (data?.affiliates || []).filter((r) => r.kind !== "lead");
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (needle) rows = rows.filter((r) => `${r.displayName} ${r.email} ${r.couponCode}`.toLowerCase().includes(needle));
    return rows;
  }, [data, query, statusFilter]);

  async function run(work) {
    setBusy(true);
    setError("");
    try {
      await work();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="w admin aff-master">
      <header className="bar">
        <Link className="logo" to="/">
          <img src="/logo.png" alt="" />
          Flipur<span> affiliate master</span>
        </Link>
        <nav className="admin-links">
          <Link to="/">Waitlist</Link>
          <Link to="/affiliate-master" className="on">
            Affiliates
          </Link>
        </nav>
        <button
          className="btn s sm"
          type="button"
          onClick={() => (onSignOut ? onSignOut() : auth && signOut(auth))}
        >
          Sign out
        </button>
      </header>

      <div className="stats pair">
        <Stat label="Revenue (affiliate)" value={money(data?.totalRevenueCents)} />
        <Stat label="Commissions" value={money(data?.totalCommissionCents)} />
        <Stat label="Pending payout" value={money(data?.pendingPayoutCents)} />
        <Stat label="Paid out" value={money(data?.paidCommissionCents)} />
        <Stat label="Conversions" value={data?.totalConversions ?? 0} />
        <Stat label="Active affiliates" value={data?.activeAffiliates ?? 0} />
        <Stat label="Open leads" value={data?.affiliateLeads ?? 0} />
      </div>

      <section className="aff-leads">
        <h2>Interest leads</h2>
        <p className="note sm">Applicants who submitted the public form. Contact them, then onboard to create login + coupon.</p>
        <LeadTable
          leads={(data?.leads || []).filter((l) => l.status === "new" || l.status === "contacted")}
          busy={busy}
          onContact={(lead) => run(() => affiliateAdminRequest("markLeadContacted", { leadId: lead.id }))}
          onReject={(lead) => run(() => affiliateAdminRequest("rejectLead", { leadId: lead.id }))}
          onOnboard={setOnboard}
        />
      </section>

      <h2 className="aff-section-title">Onboarded affiliates</h2>
      <div className="tools">
        <input placeholder="Search affiliate" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error ? <p className="err">{error}</p> : null}
      {busy ? <p className="note">Loading…</p> : null}

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Code</th>
              <th>Rate</th>
              <th>Conv.</th>
              <th>Revenue</th>
              <th>Commission</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 ? (
              <tr className="empty">
                <td colSpan={9}>No affiliates yet.</td>
              </tr>
            ) : (
              affiliates.map((row) => (
                <tr key={row.id}>
                  <td>{row.displayName}</td>
                  <td>{row.email}</td>
                  <td>{row.couponCode}</td>
                  <td>{(row.commissionRateBps / 100).toFixed(1)}%</td>
                  <td>{row.conversions}</td>
                  <td>{money(row.revenueCents)}</td>
                  <td>{money(row.commissionCents)}</td>
                  <td>
                    <span className={`badge ${row.status}`}>{row.status}</span>
                  </td>
                  <td className="actions">
                    {row.status === "pending" ? (
                      <button className="btn s sm" type="button" disabled={busy} onClick={() => run(() => affiliateAdminRequest("approve", { affiliateId: row.id }))}>
                        Approve
                      </button>
                    ) : null}
                    <button className="btn s sm" type="button" disabled={busy} onClick={() => setEdit(row)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConversionPayoutSection
        conversions={data?.conversions || []}
        busy={busy}
        onMarkPaid={(ids) => run(() => affiliateAdminRequest("markConversionsPaid", { conversionIds: ids }))}
      />

      <section className="aff-ticket-admin">
        <h2>Support tickets</h2>
        <div className="ticket-grid">
          {tickets.map((t) => (
            <article key={t.id} className="card ticket">
              <div className="row">
                <strong>{t.subject}</strong>
                <span className={`badge ${t.status}`}>{t.status}</span>
              </div>
              <p className="sm">{t.message}</p>
              <p className="sm muted">
                {t.affiliateName} · {t.affiliateEmail}
              </p>
              {t.adminReply ? <p className="reply sm">Reply: {t.adminReply}</p> : null}
              <button className="btn s sm" type="button" onClick={() => setReply(t)}>
                Reply
              </button>
            </article>
          ))}
        </div>
      </section>

      {edit ? (
        <EditAffiliateModal affiliate={edit} busy={busy} onClose={() => setEdit(null)} onSave={(fields) => run(() => affiliateAdminRequest("update", { affiliateId: edit.id, ...fields }))} />
      ) : null}
      {reply ? (
        <ReplyTicketModal ticket={reply} busy={busy} onClose={() => setReply(null)} onSave={(fields) => run(() => affiliateAdminRequest("replyTicket", { ticketId: reply.id, ...fields }))} />
      ) : null}
      {onboard ? (
        <OnboardLeadModal
          lead={onboard}
          busy={busy}
          onClose={() => setOnboard(null)}
          onDone={async (fields) => {
            setError("");
            setBusy(true);
            try {
              const body = await affiliateAdminRequest("onboardLead", { leadId: onboard.id, ...fields });
              setOnboard(null);
              setOnboardResult(body.onboard || null);
              await load();
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
      {onboardResult ? (
        <OnboardResultModal result={onboardResult} onClose={() => setOnboardResult(null)} />
      ) : null}
    </main>
  );
}

function ConversionPayoutSection({ conversions, busy, onMarkPaid }) {
  const [selected, setSelected] = useState(() => new Set());
  const unpaid = useMemo(
    () => (conversions || []).filter((c) => c.status === "pending" || c.status === "approved"),
    [conversions],
  );

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === unpaid.length) return new Set();
      return new Set(unpaid.map((c) => c.id));
    });
  }

  async function markSelected() {
    const ids = [...selected];
    if (!ids.length) return;
    await onMarkPaid(ids);
    setSelected(new Set());
  }

  return (
    <section className="aff-payouts">
      <h2 className="aff-section-title">Commission payouts</h2>
      <p className="note sm">
        Pay affiliates manually, then mark conversions as paid so dashboards stop counting them as pending.
      </p>
      <div className="tools">
        <button className="btn s sm" type="button" disabled={busy || !unpaid.length} onClick={toggleAll}>
          {selected.size === unpaid.length && unpaid.length ? "Clear selection" : "Select unpaid"}
        </button>
        <button className="btn p sm" type="button" disabled={busy || !selected.size} onClick={markSelected}>
          Mark selected paid ({selected.size})
        </button>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Affiliate</th>
              <th>Code</th>
              <th>Order</th>
              <th>Sale</th>
              <th>Commission</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {(conversions || []).length === 0 ? (
              <tr className="empty">
                <td colSpan={8}>No conversions yet.</td>
              </tr>
            ) : (
              (conversions || []).slice(0, 80).map((row) => {
                const unpaidRow = row.status === "pending" || row.status === "approved";
                return (
                  <tr key={row.id}>
                    <td>
                      {unpaidRow ? (
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} disabled={busy} />
                      ) : null}
                    </td>
                    <td>
                      {row.affiliateName || "—"}
                      <div className="sm muted">{row.affiliateEmail}</div>
                    </td>
                    <td>{row.couponCode || "—"}</td>
                    <td className="sm">{row.orderId}</td>
                    <td>{money(row.saleAmountCents)}</td>
                    <td>{money(row.commissionAmountCents)}</td>
                    <td>
                      <span className={`badge ${row.status}`}>{row.status}</span>
                    </td>
                    <td className="sm muted">{row.orderAt || row.createdAt || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LeadTable({ leads, busy, onContact, onReject, onOnboard }) {
  if (!leads.length) {
    return <p className="muted sm">No open leads.</p>;
  }
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Channels</th>
            <th>Note</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.displayName}</td>
              <td>{lead.email}</td>
              <td className="channels sm">
                {[
                  lead.instagram && `IG: ${lead.instagram}`,
                  lead.youtube && `YT: ${lead.youtube}`,
                  lead.snapchat && `SC: ${lead.snapchat}`,
                  lead.linkedin && `LI: ${lead.linkedin}`,
                  lead.discord && `DC: ${lead.discord}`,
                  lead.telegram && `TG: ${lead.telegram}`,
                  lead.website,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </td>
              <td>{lead.note || "—"}</td>
              <td>
                <span className={`badge ${lead.status}`}>{lead.status}</span>
              </td>
              <td className="actions">
                {lead.status === "new" ? (
                  <button className="btn s sm" type="button" disabled={busy} onClick={() => onContact(lead)}>
                    Mark contacted
                  </button>
                ) : null}
                <button className="btn p sm" type="button" disabled={busy} onClick={() => onOnboard(lead)}>
                  Onboard
                </button>
                <button className="btn s sm" type="button" disabled={busy} onClick={() => onReject(lead)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OnboardLeadModal({ lead, onClose, onDone, busy }) {
  const [couponCode, setCouponCode] = useState("");
  const [commissionRateBps, setCommissionRateBps] = useState(1500);
  const [activateNow, setActivateNow] = useState(true);

  return (
    <div className="modal" onClick={() => !busy && onClose()}>
      <form
        className="card dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          await onDone({ couponCode, commissionRateBps, activateNow });
        }}
      >
        <h2>Onboard {lead.displayName}</h2>
        <p className="sm muted">{lead.email}</p>
        <label>
          Coupon code <span className="opt">(optional)</span>
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Auto-generated if empty" />
        </label>
        <label>
          Commission rate (bps, 1500 = 15%)
          <input type="number" value={commissionRateBps} onChange={(e) => setCommissionRateBps(Number(e.target.value))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} />
          Activate code immediately (live for checkout)
        </label>
        <p className="sm muted">
          Creates their Firebase login. Send them the password-reset link from the next screen so they choose a password.
        </p>
        <div className="actions">
          <button className="btn s" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn p" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create affiliate"}
          </button>
        </div>
      </form>
    </div>
  );
}

function OnboardResultModal({ result, onClose }) {
  const [msg, setMsg] = useState("");
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("Copy failed");
    }
  }
  return (
    <div className="modal" onClick={onClose}>
      <div className="card dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Onboarding complete</h2>
        <p className="sm">
          Email <strong>{result.email}</strong> with coupon <strong>{result.couponCode}</strong> and the temporary
          password below. They sign in at the partner login page.
        </p>
        <label>
          Share link
          <input readOnly value={result.shareUrl || ""} onFocus={(e) => e.target.select()} />
        </label>
        <button className="btn s sm" type="button" onClick={() => copy(result.shareUrl || "")}>
          Copy share link
        </button>
        <label>
          Login URL
          <input readOnly value={result.loginUrl || ""} onFocus={(e) => e.target.select()} />
        </label>
        {result.temporaryPassword ? (
          <>
            <label>
              Temporary password
              <input readOnly value={result.temporaryPassword} onFocus={(e) => e.target.select()} />
            </label>
            <button className="btn s sm" type="button" onClick={() => copy(result.temporaryPassword)}>
              Copy password
            </button>
          </>
        ) : (
          <p className="err sm">Password was not returned—onboard again or reset from the API.</p>
        )}
        {msg ? <p className="ok sm">{msg}</p> : null}
        <div className="actions">
          <button className="btn p" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <button className="card stat on" type="button" disabled>
      <b>{value}</b>
      <span>{label}</span>
    </button>
  );
}

function EditAffiliateModal({ affiliate, onClose, onSave, busy }) {
  const [couponCode, setCouponCode] = useState(affiliate.couponCode || "");
  const [commissionRateBps, setCommissionRateBps] = useState(affiliate.commissionRateBps || 1500);
  const [status, setStatus] = useState(affiliate.status || "pending");

  return (
    <div className="modal" onClick={() => !busy && onClose()}>
      <form
        className="card dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ couponCode, commissionRateBps, status });
          onClose();
        }}
      >
        <h2>Edit affiliate</h2>
        <label>
          Coupon code
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
        </label>
        <label>
          Commission rate (bps, 1500 = 15%)
          <input type="number" value={commissionRateBps} onChange={(e) => setCommissionRateBps(Number(e.target.value))} />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <div className="actions">
          <button className="btn s" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn p" type="submit" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function ReplyTicketModal({ ticket, onClose, onSave, busy }) {
  const [adminReply, setAdminReply] = useState(ticket.adminReply || "");
  const [status, setStatus] = useState(ticket.status || "in_progress");

  return (
    <div className="modal" onClick={() => !busy && onClose()}>
      <form
        className="card dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ adminReply, status });
          onClose();
        }}
      >
        <h2>Reply to ticket</h2>
        <p className="sm">{ticket.subject}</p>
        <label>
          Reply
          <textarea required rows={4} value={adminReply} onChange={(e) => setAdminReply(e.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <div className="actions">
          <button className="btn s" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn p" type="submit" disabled={busy}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
