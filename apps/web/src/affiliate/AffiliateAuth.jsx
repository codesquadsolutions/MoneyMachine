import { createContext, useContext, useEffect, useState } from "react";

const AffiliateAuthContext = createContext(null);
const TOKEN_KEY = "flipur_affiliate_token";
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/$/, "");

export function AffiliateAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!token) {
        setUser(null);
        setReady(true);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/api/affiliate/me`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || "Session expired");
        if (!cancelled) setUser(json.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = {
    user,
    ready,
    token,
    firebaseReady: true,
    async login(email, password) {
      const response = await fetch(`${API_BASE}/api/affiliate/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Could not sign in.");
      localStorage.setItem(TOKEN_KEY, json.token);
      setToken(json.token);
      setUser({
        uid: json.profile.id,
        email: json.profile.email,
        displayName: json.profile.displayName,
      });
    },
    async logout() {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setUser(null);
    },
  };

  return <AffiliateAuthContext.Provider value={value}>{children}</AffiliateAuthContext.Provider>;
}

export function useAffiliateAuth() {
  const ctx = useContext(AffiliateAuthContext);
  if (!ctx) throw new Error("useAffiliateAuth outside provider");
  return ctx;
}
