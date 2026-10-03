import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true); // true until the initial /me check finishes

  // On first load, ask the backend if there's already a valid session
  // (e.g. the player refreshed the page). Runs once.
  useEffect(() => {
    authApi.getCurrentPlayer()
      .then(setPlayer)
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
    const expire = () => setPlayer(null);
    window.addEventListener("lootvault:session-expired", expire);
    return () => window.removeEventListener("lootvault:session-expired", expire);
  }, []);

  async function login(username, password) {
    const loggedInPlayer = await authApi.login(username, password);
    setPlayer(loggedInPlayer);
    return loggedInPlayer;
  }

  async function register(username, email, password) {
    await authApi.register(username, email, password);
    return login(username, password); // register doesn't start a session, so log in right after
  }

  async function logout() {
    await authApi.logout();
    setPlayer(null);
  }

  const value = { player, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and consumer hook intentionally share their context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
