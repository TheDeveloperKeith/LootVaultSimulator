// Session cookies authenticate the player; a session-bound token protects writes.
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
let csrfRequest;
function csrf() {
  if (!csrfRequest) csrfRequest = fetch("/api/auth/csrf", { credentials: "include" })
    .then(async response => { if (!response.ok) throw new ApiError(response.status, "Couldn't prepare a secure request. Refresh and try again."); return response.json(); })
    .catch(error => { csrfRequest = undefined; throw error; });
  return csrfRequest;
}
async function request(path, options = {}, retried = false) {
  const writing = !["GET", "HEAD"].includes(options.method || "GET");
  const token = writing ? await csrf() : null;
  const response = await fetch(path, {
    ...options, credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers, ...(token ? { [token.headerName]: token.token } : {}) },
  });
  const raw = response.status === 204 ? "" : await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* CORS diagnostics can be plain text. */ }
  if (!response.ok) {
    // This code is emitted by the CSRF filter before any controller mutation.
    // Only that rejection can safely retry a write automatically.
    if (response.status === 403 && data?.code === "CSRF_INVALID" && writing && !retried) {
      csrfRequest = undefined;
      return request(path, options, true);
    }
    if (response.status === 401 && !path.startsWith("/api/auth/")) window.dispatchEvent(new Event("lootvault:session-expired"));
    const message = raw.trim() === "Invalid CORS request"
      ? `This browser address (${window.location.origin}) is not allowed by the server. Use the configured frontend address.`
      : data?.error || data?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  if (writing && path.startsWith("/api/auth/")) csrfRequest = undefined;
  if (writing && !path.startsWith("/api/auth/") && !path.startsWith("/api/onboarding")) window.dispatchEvent(new Event("lootvault:wallet-changed"));
  return data;
}
export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
