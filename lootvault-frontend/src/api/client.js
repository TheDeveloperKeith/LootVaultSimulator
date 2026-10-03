// Thin fetch wrapper. Every call includes the session cookie and throws
// a real Error (with the server's message) on non-2xx responses, so
// callers can just try/catch instead of checking response.ok everywhere.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include", // sends the session cookie
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  // 204 No Content (e.g. logout) has no body to parse.
  const hasBody = response.status !== 204;
  const raw = hasBody ? await response.text() : "";
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* CORS errors can be plain text. */ }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/")) window.dispatchEvent(new Event("lootvault:session-expired"));
    const message = raw.trim() === "Invalid CORS request"
      ? `The server rejected this browser address (${window.location.origin}). Check the backend's allowed frontend origins.`
      : data?.error || data?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  if (options.method === "POST" && !path.startsWith("/api/auth/")) {
    window.dispatchEvent(new Event("lootvault:wallet-changed"));
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
