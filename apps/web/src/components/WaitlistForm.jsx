import { useState } from "react";
import { useAuth } from "../auth";

export function WaitlistForm() {
  const { user, joined, ready, join, firebaseReady, quietErrors } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return null;

  if (joined && user) {
    const name = user.displayName ? user.displayName.split(" ")[0] : "";
    return (
      <p className="joined">
        You're on the list{name ? `, ${name}` : ""}. We'll email {user.email} when Flipur is ready to install.
      </p>
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await join();
    } catch (err) {
      if (!quietErrors.has(err.code)) {
        setError(err.message || "Could not join the waitlist. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="wait" onSubmit={onSubmit}>
      <button className="btn p" type="submit" disabled={busy || !firebaseReady}>
        {busy ? "Signing in…" : "Join the waitlist"}
      </button>
      <p className="hint">
        {firebaseReady
          ? "Uses your Google account. We store your email so we can send the install link. One subscription flips on every platform Flipur supports."
          : "Add your Firebase web config to .env.local to turn on the waitlist."}
      </p>
      {error ? <p className="err">{error}</p> : null}
    </form>
  );
}
