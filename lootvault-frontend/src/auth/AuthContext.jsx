import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const generation = useRef(0);
  const [loading, setLoading] = useState(true); // true until the initial /me check finishes

  // On first load, ask the backend if there's already a valid session
  // (e.g. the player refreshed the page). Runs once.
  useEffect(() => {
    const request = ++generation.current;
    authApi.getCurrentPlayer()
      .then(value => { if (generation.current === request) setPlayer(value); })
      .catch(() => { if (generation.current === request) setPlayer(null); })
      .finally(() => { if (generation.current === request) setLoading(false); });
    const expire = () => { generation.current++; setPlayer(null); setLoading(false); };
    window.addEventListener("lootvault:session-expired", expire);
    return () => window.removeEventListener("lootvault:session-expired", expire);
  }, []);

  async function login(username, password) {
    const request = ++generation.current;
    const loggedInPlayer = await authApi.login(username, password);
    if (generation.current === request) { setPlayer(loggedInPlayer); setLoading(false); }
    return loggedInPlayer;
  }

  async function register(username, email, password) {
    await authApi.register(username, email, password);
    return login(username, password); // register doesn't start a session, so log in right after
  }

  async function logout() {
    generation.current++;
    try { await authApi.logout(); } catch (error) { if (error.status !== 401) throw error; }
    setPlayer(null);
  }
  async function devLogin(phrase) {
    const request = ++generation.current;
    const testPlayer = await authApi.devLogin(phrase);
    if (generation.current === request) { setPlayer(testPlayer); setLoading(false); }
    return testPlayer;
  }

  const value = { player, loading, login, register, logout, devLogin };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and consumer hook intentionally share their context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
