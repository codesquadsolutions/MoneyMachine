import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAffiliateAuth } from "./AffiliateAuth.jsx";

export function AffiliateLogin() {
  const { login, firebaseReady } = useAffiliateAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!firebaseReady) throw new Error("Firebase is not configured.");
      await login(email, password);
      navigate("/affiliate/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="w aff gate-page">
      <form className="card aff-form" onSubmit={submit}>
        <h1>Partner sign in</h1>
        <p className="lead sm">For onboarded affiliates only. Use the login details we sent you.</p>
        <label>
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error ? <p className="err">{error}</p> : null}
        <button className="btn p" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="foot sm">
          Want to partner? <Link to="/affiliate/register">Show interest</Link>
        </p>
      </form>
    </main>
  );
}
