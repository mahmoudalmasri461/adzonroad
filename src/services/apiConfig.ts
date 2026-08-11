/**
 * Where the API lives, and how to prove who we are to it.
 *
 * The base URL is build-time configuration: local dev talks to the LocalDB-backed API on 5080,
 * Vercel builds get the deployed origin injected as `VITE_API_BASE_URL`.
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';

const TOKEN_KEY = 'adz.accessToken';

/**
 * Access token for API and hub calls.
 *
 * A single accessor rather than a value read once, because SignalR asks again on every reconnect —
 * a connection dropped for an hour must not come back waving an expired token.
 */
export function getAccessToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
