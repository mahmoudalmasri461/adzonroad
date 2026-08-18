/**
 * Where the API lives, and the tokens used to talk to it.
 *
 * The base URL is build-time configuration: local dev talks to the LocalDB-backed API on 5080,
 * Vercel builds get the deployed origin injected as `VITE_API_BASE_URL`.
 */

const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;

/**
 * Where the API lives.
 *
 * Three cases, because this build has to run in three places:
 *
 *   unset        local development - the Vite server is on 5183, the API on 5080
 *   empty        same origin as the page, which is how every deployment serves it
 *   a URL        an explicit override, for pointing a local frontend at a deployed API
 *
 * The empty case exists so a deployed bundle carries no hostname at all. Baking one in meant
 * rebuilding the frontend every time the API moved, and a stale value fails silently - the site
 * loads and every request goes somewhere that no longer exists.
 */
export const API_BASE_URL: string =
  configured === undefined
    ? 'http://localhost:5080'
    : configured === ''
      ? window.location.origin
      : configured;

const ACCESS_TOKEN_KEY = 'adz.accessToken';
const REFRESH_TOKEN_KEY = 'adz.refreshToken';
const SESSION_KEY = 'adz.session';

/**
 * Access token for API and hub calls.
 *
 * A single accessor rather than a value read once, because SignalR asks again on every reconnect —
 * a connection dropped for an hour must not come back waving an expired token.
 */
export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * The refresh token, which is the long-lived credential and the one that actually matters.
 *
 * It rotates on every use, and the server treats a replayed revoked token as theft — it revokes
 * the whole chain. Nothing here may use it speculatively.
 */
export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** The signed-in user, as JSON. Read at startup so a page reload is not a sign-out. */
export function getStoredSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredSession(value: string | null): void {
  if (value) localStorage.setItem(SESSION_KEY, value);
  else localStorage.removeItem(SESSION_KEY);
}

export function clearStoredAuth(): void {
  setAccessToken(null);
  setRefreshToken(null);
  setStoredSession(null);
}
