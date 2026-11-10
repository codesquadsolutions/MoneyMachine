import { useState } from "react";
import { Link } from "react-router-dom";
import { callAffiliate } from "../lib/callables.js";

export function AffiliateRegister() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    instagram: "",
    youtube: "",
    snapchat: "",
    website: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await callAffiliate("submitAffiliateInterest", form);
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit your application.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="w aff gate-page">
        <div className="card aff-form">
          <h1>Thanks for your interest</h1>
          <p className="lead sm">
            We received your details. Our team will review your channels and reach out by email. When you are approved,
            we will send your affiliate code and dashboard login steps.
          </p>
          <Link className="btn p" to="/">
            Back to Flipur
          </Link>
          <p className="foot sm">
            Already onboarded? <Link to="/affiliate/login">Partner sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w aff gate-page">
      <form className="card aff-form" onSubmit={submit}>
        <h1>Partner with Flipur</h1>
        <p className="lead sm">
          Tell us how to reach you. We onboard affiliates personally—no password needed on this step.
        </p>
        <label>
          Full name
          <input required value={form.displayName} onChange={(e) => setField("displayName", e.target.value)} autoComplete="name" />
        </label>
        <label>
          Email
          <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" />
        </label>
        <label>
          Instagram
          <input value={form.instagram} onChange={(e) => setField("instagram", e.target.value)} placeholder="@handle or profile URL" />
        </label>
        <label>
          YouTube
          <input value={form.youtube} onChange={(e) => setField("youtube", e.target.value)} placeholder="Channel URL or handle" />
        </label>
        <label>
          Snapchat
          <input value={form.snapchat} onChange={(e) => setField("snapchat", e.target.value)} placeholder="@handle" />
        </label>
        <label>
          Website
          <input value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://" />
        </label>
        <label>
          Anything else? <span className="opt">(optional)</span>
          <textarea value={form.note} onChange={(e) => setField("note", e.target.value)} rows={3} placeholder="Audience, niche, how you promote tools…" />
        </label>
        <p className="muted sm">Share at least one of Instagram, YouTube, Snapchat, or website.</p>
        {error ? <p className="err">{error}</p> : null}
        <button className="btn p" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Show interest"}
        </button>
        <p className="foot sm">
          Already onboarded? <Link to="/affiliate/login">Partner sign in</Link>
        </p>
      </form>
    </main>
  );
}
