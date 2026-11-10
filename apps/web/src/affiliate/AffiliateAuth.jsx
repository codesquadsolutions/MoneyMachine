import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, firebaseReady } from "../firebase";

const AffiliateAuthContext = createContext(null);

export function AffiliateAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setReady(true);
      return undefined;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  const value = {
    user,
    ready,
    firebaseReady,
    async register(email, password) {
      if (!auth) throw new Error("Firebase is not configured.");
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    },
    async login(email, password) {
      if (!auth) throw new Error("Firebase is not configured.");
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    async logout() {
      if (!auth) return;
      await signOut(auth);
    },
  };

  return <AffiliateAuthContext.Provider value={value}>{children}</AffiliateAuthContext.Provider>;
}

export function useAffiliateAuth() {
  const ctx = useContext(AffiliateAuthContext);
  if (!ctx) throw new Error("useAffiliateAuth outside provider");
  return ctx;
}
