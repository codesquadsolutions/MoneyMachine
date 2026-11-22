import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");

const quietErrors = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/popup-blocked",
]);

async function waitlistStatus(email) {
  const response = await fetch(`${API_BASE}/api/waitlist/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return false;
  return Boolean(body.joined);
}

async function waitlistJoin(payload) {
  const response = await fetch(`${API_BASE}/api/waitlist/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Could not join the waitlist.");
  return body;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);
  const [ready, setReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    (async () => {
      const [{ auth, firebaseReady: configured }, { onAuthStateChanged }] = await Promise.all([
        import("./firebase"),
        import("firebase/auth"),
      ]);
      if (cancelled) return;
      setFirebaseReady(configured);
      if (!configured) {
        setReady(true);
        return;
      }
      unsub = onAuthStateChanged(auth, async (next) => {
        setUser(next);
        if (!next) {
          setJoined(false);
          setReady(true);
          return;
        }
        try {
          setJoined(await waitlistStatus(next.email));
        } catch {
          setJoined(false);
        }
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  async function join() {
    const [{ auth, googleProvider, firebaseReady: configured }, { signInWithPopup }] = await Promise.all([
      import("./firebase"),
      import("firebase/auth"),
    ]);
    if (!configured) {
      throw new Error("Add your Firebase web config to .env.local to turn on the waitlist.");
    }
    let current = auth.currentUser;
    if (!current) {
      const cred = await signInWithPopup(auth, googleProvider);
      current = cred.user;
    }
    if (!current.email) {
      throw new Error("Your Google account has no email address we can store.");
    }
    const { getStoredAttribution } = await import("./lib/attribution.js");
    const attr = getStoredAttribution();
    await waitlistJoin({
      email: current.email,
      displayName: current.displayName || "",
      photoURL: current.photoURL || "",
      firebaseUid: current.uid,
      source: attr.source || "website",
      utmSource: attr.utmSource || "",
      utmMedium: attr.utmMedium || "",
      utmCampaign: attr.utmCampaign || "",
      fbclid: attr.fbclid || "",
    });
    setUser(current);
    setJoined(true);
  }

  async function leave() {
    const [{ auth, firebaseReady: configured }, { signOut }] = await Promise.all([
      import("./firebase"),
      import("firebase/auth"),
    ]);
    if (configured && auth) await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, joined, ready, join, leave, firebaseReady, quietErrors }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
