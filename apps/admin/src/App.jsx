import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "./firebase";

const adminEmail = "admin@flipur.trade";

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

function normalizePerson(person) {
  return {
    id: person.id,
    name: person.name || "",
    email: person.email || "",
    platform: person.platform || "",
    status: person.status === "invited" ? "invited" : "waiting",
    createdAt: person.createdAt || "",
  };
}

function fromDoc(item) {
  const data = item.data();
  const created = data.createdAt?.toDate?.();
  return normalizePerson({
    id: item.id,
    name: data.displayName || data.name || "",
    email: data.email || "",
    platform: data.platform || "",
    status: data.status,
    createdAt: created ? created.toISOString() : "",
  });
}

async function localServerReady() {
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => null);
    return response.ok && body?.ok === true;
  } catch {
    return false;
  }
}

async function loadPeople() {
  const snap = await getDocs(collection(db, "waitlist"));
  return snap.docs.map(fromDoc);
}

function removeMessage(err) {
  const message = String(err?.message || "").trim();
  if (!message || message.toLowerCase() === "internal") return "Could not remove that person.";
  return message;
}

async function save(action, extra = {}) {
  if (action === "remove") {
    if (String(extra.email || "").trim().toLowerCase() === adminEmail) {
      throw new Error("The admin account can't be removed.");
    }
    if (await localServerReady()) {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/waitlist/remove-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ id: extra.id, email: extra.email }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not delete that sign-in.");
    }
    await deleteDoc(doc(db, "waitlist", extra.id));
  } else if (action === "update") {
    await updateDoc(doc(db, "waitlist", extra.id), { platform: extra.platform });
  } else if (action === "invite") {
    await Promise.all((extra.ids || []).map((id) => updateDoc(doc(db, "waitlist", id), { status: "invited" })));
  } else {
    throw new Error("Unknown action.");
  }
  return { people: await loadPeople() };
}

function loginMessage(error) {
  if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password" || error?.code === "auth/user-not-found") {
    return "Wrong username or password.";
  }
  if (error?.code === "auth/unauthorized-domain") return "This site is not allowed to sign in yet.";
  return error?.message || "Could not sign in.";
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setReady(true);
      return undefined;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (user?.email === adminEmail) {
        try {
          setPeople(await loadPeople());
          setError("");
          setAuthed(true);
        } catch (err) {
          setError(err.message || "Could not load the waitlist.");
          setAuthed(true);
        }
      } else {
        if (user) await signOut(auth);
        setAuthed(false);
        setPeople([]);
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
  if (!firebaseReady) return <LocalAdmin />;
  if (!authed) return <Login onSubmit={signIn} />;

  return (
    <Dashboard
      people={people}
      query={query}
      setQuery={setQuery}
      source="firestore"
      call={save}
      onChange={setPeople}
      onError={setError}
      error={error}
      onSignOut={() => signOut(auth)}
    />
  );
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

function Dashboard({ people, query, setQuery, source, call, onChange, onError, error, onSignOut }) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [deletesSignIn, setDeletesSignIn] = useState(false);

  useEffect(() => {
    let ignore = false;
    localServerReady().then((ready) => {
      if (!ignore) setDeletesSignIn(source !== "local" && ready);
    });
    return () => {
      ignore = true;
    };
  }, [source]);

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
    onError("");
    setBusy(true);
    try {
      const body = await work();
      onChange(body.people || []);
    } catch (err) {
      onError(removeMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const lines = ["name,email,platform,status,createdAt"];
    for (const person of filtered) {
      lines.push([person.name, person.email, person.platform, person.status, person.createdAt].map(csvCell).join(","));
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
    <main className="w admin">
      <header className="bar">
        <a className="logo" href="/">
          <img src="/logo.png" alt="" />
          Flipur Trade<span> admin</span>
        </a>
        <button className="btn s sm" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </header>
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
      {source === "local" ? (
        <p className="note">This list is the local file, not the Google waitlist.</p>
      ) : null}
      <div className="tools">
        <input
          placeholder="Search name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
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
                        run(() => call("update", { id: person.id, platform: next }));
                      }}
                    >
                      {person.platform && !platforms.some((item) => item.id === person.platform) ? (
                        <option value={person.platform}>{platformLabel(person.platform)}</option>
                      ) : null}
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
                      <button
                        className="btn s sm"
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingRemove(person)}
                      >
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
        <div className="modal" onClick={() => { if (!busy) setPendingRemove(null); }}>
          <div
            className="card dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="remove-title">Remove this person?</h2>
            <p>
              {`${pendingRemove.name || pendingRemove.email} will be taken off the waitlist${
                deletesSignIn ? ", and their Firebase sign-in will be deleted." : "."
              }`}
            </p>
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
                  run(() => call("remove", { id: person.id, email: person.email }));
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Stat({ label, value, pressed, onClick }) {
  return (
    <button className={pressed ? "card stat on" : "card stat"} type="button" aria-pressed={pressed} onClick={onClick}>
      <b>{value}</b>
      <span>{label}</span>
    </button>
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

const localSourceKey = "flipur-admin-source";

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
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

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
    <Dashboard
      people={people}
      query={query}
      setQuery={setQuery}
      source="local"
      call={localCall}
      onChange={setPeople}
      onError={setError}
      error={error}
      onSignOut={async () => {
        await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
        sessionStorage.removeItem(localSourceKey);
        setAuthed(false);
        setPeople([]);
      }}
    />
  );
}
