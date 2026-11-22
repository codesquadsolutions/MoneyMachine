import { useMemo, useState } from "react";
import { useCrm } from "./CrmContext";
import { sourceLabel } from "./constants";

const empty = {
  name: "",
  channel: "meta",
  utmSource: "",
  utmMedium: "paid_social",
  utmCampaign: "",
  notes: "",
  active: true,
};

export function CrmCampaigns() {
  const { campaigns, leads, createCampaign, error, setError } = useCrm();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const map = {};
    for (const lead of leads) {
      const key = (lead.utmCampaign || "").toLowerCase();
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [leads]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createCampaign(form);
      setForm(empty);
    } catch (err) {
      setError(err.message || "Could not save campaign.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <p className="note">Track Meta ads and Instagram boosts with UTM tags. Lead counts update automatically.</p>
        </div>
      </div>

      {error ? <p className="err">{error}</p> : null}

      <div className="campaigns-layout">
        <form className="card campaign-form" onSubmit={submit}>
          <h2>Add campaign</h2>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Channel
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="meta">Meta ads</option>
              <option value="instagram">Instagram boost</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            utm_source
            <input
              value={form.utmSource}
              onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
              placeholder="facebook / instagram"
            />
          </label>
          <label>
            utm_medium
            <input value={form.utmMedium} onChange={(e) => setForm({ ...form, utmMedium: e.target.value })} />
          </label>
          <label>
            utm_campaign
            <input
              value={form.utmCampaign}
              onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
              placeholder="ig_boost_apr"
              required
            />
          </label>
          <label>
            Notes
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </label>
          <p className="note sm">
            Example link: <code>{`https://flipur.trade/?utm_source=${form.utmSource || "instagram"}&utm_medium=${form.utmMedium || "paid_social"}&utm_campaign=${form.utmCampaign || "boost1"}`}</code>
          </p>
          <button className="btn p" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save campaign"}
          </button>
        </form>

        <div className="campaign-list">
          {campaigns.length === 0 ? (
            <p className="empty-state">No campaigns yet. Add Meta / Instagram boosts here before you spend.</p>
          ) : (
            campaigns.map((campaign) => {
              const key = (campaign.utmCampaign || "").toLowerCase();
              const leadCount = counts[key] || 0;
              return (
                <article key={campaign.id} className="card campaign-card">
                  <div className="row">
                    <h3>{campaign.name}</h3>
                    <span className={`badge source-${campaign.channel === "instagram" ? "instagram" : "meta"}`}>
                      {campaign.channel}
                    </span>
                  </div>
                  <p className="muted sm">
                    {campaign.utmSource} / {campaign.utmMedium} / {campaign.utmCampaign}
                  </p>
                  <p>
                    <strong>{leadCount}</strong> leads tagged
                  </p>
                  {campaign.notes ? <p className="note sm">{campaign.notes}</p> : null}
                </article>
              );
            })
          )}

          <section className="card campaign-card">
            <h3>Untagged / organic sources</h3>
            <div className="source-list">
              {["website", "chat", "affiliate", "manual"].map((source) => {
                const count = leads.filter((l) => l.source === source).length;
                if (!count) return null;
                return (
                  <div key={source} className="source-row">
                    <span>{sourceLabel(source)}</span>
                    <b>{count}</b>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
