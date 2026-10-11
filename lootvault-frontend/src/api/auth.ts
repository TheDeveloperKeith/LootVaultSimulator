import type { Player } from "../types/game";
import { ApiError, api } from "./client";

export const register = (username: string, email: string, password: string) =>
  api.post<Player>("/api/auth/register", { username, email, password });

export const login = (username: string, password: string) =>
  api.post<Player>("/api/auth/login", { username, password });

export const logout = () => api.post<void>("/api/auth/logout");
export const devStatus = () => api.get<{ enabled: boolean }>("/api/auth/dev-status");
export const devLogin = (phrase: string) => api.post<Player>("/api/auth/dev", { phrase });

// Called on app load to check for an existing session (e.g. after a refresh).
// Resolves to null instead of throwing on a 401, since "not logged in" is
// an expected outcome here, not an error.
export async function getCurrentPlayer() {
  try {
    return await api.get<Player>("/api/auth/me");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}
