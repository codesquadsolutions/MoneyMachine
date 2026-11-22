import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AffiliateMaster } from "./AffiliateMaster.jsx";
import { AdminLayout } from "./AdminLayout.jsx";
import { CrmProvider } from "./crm/CrmContext.jsx";
import { CrmDashboard } from "./crm/CrmDashboard.jsx";
import { CrmLeads } from "./crm/CrmLeads.jsx";
import { CrmFunnel } from "./crm/CrmFunnel.jsx";
import { CrmCampaigns } from "./crm/CrmCampaigns.jsx";
import { WaitlistPage } from "./crm/WaitlistPage.jsx";
import { auth, firebaseReady } from "./firebase";

const adminEmail = "admin@flipur.trade";
const localSourceKey = "flipur-admin-source";

function loginMessage(error) {
  if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password" || error?.code === "auth/user-not-found") {
    return "Wrong username or password.";
  }
  if (error?.code === "auth/unauthorized-domain") return "This site is not allowed to sign in yet.";
  return error?.message || "Could not sign in.";
}

function Login({ onSubmit }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="gate">
      <form className="card login" onSubmit={submit}>
        <img src="/logo.png" alt="" width="42" height="42" />
        <h1>Flipur Trade admin</h1>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="err">{error}</p> : null}
        <button className="btn p" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

async function localRequest(path, options) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  return readJson(response);
}

async function localCall(action, extra = {}) {
  if (action === "list") return localRequest("/api/waitlist");
  if (action === "remove") return localRequest(`/api/waitlist/${encodeURIComponent(extra.id)}`, { method: "DELETE" });
  if (action === "update") {
    return localRequest(`/api/waitlist/${encodeURIComponent(extra.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ platform: extra.platform }),
    });
  }
  if (action === "invite") {
    return localRequest("/api/waitlist/invite", { method: "POST", body: JSON.stringify({ ids: extra.ids }) });
  }
  throw new Error("Unknown action.");
}

function LocalAdmin() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sessionStorage.getItem(localSourceKey) === "local") {
        try {
          const body = await localCall("list");
          if (!cancelled) {
            setPeople(body.people || []);
            setAuthed(true);
          }
        } catch {
          sessionStorage.removeItem(localSourceKey);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(username, password) {
    await localRequest("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
    const body = await localCall("list");
    sessionStorage.setItem(localSourceKey, "local");
    setPeople(body.people || []);
    setAuthed(true);
  }

  if (!ready) return null;
  if (!authed) return <Login onSubmit={signIn} />;

  return (
    <Routes>
      <Route
        element={
          <AdminLayout
            onSignOut={async () => {
              await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
              sessionStorage.removeItem(localSourceKey);
              setAuthed(false);
              setPeople([]);
            }}
          />
        }
      >
        <Route path="/" element={<LocalCrmHome people={people} />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/leads" element={<LocalCrmHome people={people} />} />
        <Route path="/funnel" element={<LocalCrmHome people={people} />} />
        <Route path="/campaigns" element={<LocalCrmHome people={people} />} />
        <Route path="/affiliate-master" element={<AffiliateMaster embedded />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function LocalCrmHome({ people }) {
  return (
    <div className="crm-page">
      <div className="page-head">
        <div>
          <h1>Local admin</h1>
          <p className="note">
            Firebase is not configured here. Waitlist has {people.length} local rows. Use full CRM with Firebase admin
            login for automatic leads, funnel, and campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}

function FirebaseAdmin() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user?.email === adminEmail) {
        setAuthed(true);
      } else {
        if (user) await signOut(auth);
        setAuthed(false);
      }
      setReady(true);
    });
  }, []);

  async function signIn(username, password) {
    const email = username.trim().toLowerCase() === "admin" ? adminEmail : username.trim();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(loginMessage(err));
    }
  }

  if (!ready) return null;
  if (!authed) return <Login onSubmit={signIn} />;

  return (
    <CrmProvider enabled>
      <Routes>
        <Route element={<AdminLayout onSignOut={() => signOut(auth)} />}>
          <Route path="/" element={<CrmDashboard />} />
          <Route path="/leads" element={<CrmLeads />} />
          <Route path="/funnel" element={<CrmFunnel />} />
          <Route path="/campaigns" element={<CrmCampaigns />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/affiliate-master" element={<AffiliateMaster embedded />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CrmProvider>
  );
}

export default function App() {
  return <BrowserRouter>{firebaseReady ? <FirebaseAdmin /> : <LocalAdmin />}</BrowserRouter>;
}
