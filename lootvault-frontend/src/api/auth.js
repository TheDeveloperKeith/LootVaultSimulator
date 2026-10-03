import { api } from "./client";

export const register = (username, email, password) =>
  api.post("/api/auth/register", { username, email, password });

export const login = (username, password) =>
  api.post("/api/auth/login", { username, password });

export const logout = () => api.post("/api/auth/logout");

// Called on app load to check for an existing session (e.g. after a refresh).
// Resolves to null instead of throwing on a 401, since "not logged in" is
// an expected outcome here, not an error.
export async function getCurrentPlayer() {
  try {
    return await api.get("/api/auth/me");
  } catch (err) {
    if (err.status === 401 || err.status === 403) return null;
    throw err;
  }
}
