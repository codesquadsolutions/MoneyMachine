import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const quietErrors = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/popup-blocked",
]);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);
  const [ready, setReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    (async () => {
      const [{ auth, db, firebaseReady: configured }, { onAuthStateChanged }, { doc, getDoc }] = await Promise.all([
        import("./firebase"),
        import("firebase/auth"),
        import("firebase/firestore"),
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
          const snap = await getDoc(doc(db, "waitlist", next.uid));
          setJoined(snap.exists());
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

  async function join(platform) {
    const [{ auth, db, googleProvider, firebaseReady: configured }, { signInWithPopup }, { doc, getDoc, serverTimestamp, setDoc }] =
      await Promise.all([import("./firebase"), import("firebase/auth"), import("firebase/firestore")]);
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
    const ref = doc(db, "waitlist", current.uid);
    const existing = await getDoc(ref);
    const data = {
      email: current.email,
      displayName: current.displayName || "",
      photoURL: current.photoURL || "",
      platform,
    };
    if (!existing.exists()) data.createdAt = serverTimestamp();
    await setDoc(ref, data, { merge: true });
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
