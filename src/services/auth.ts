import {
  API_BASE_URL,
  clearStoredAuth,
  getAccessToken,
  getRefreshToken,
  getStoredSession,
  setAccessToken,
  setRefreshToken,
  setStoredSession,
} from './apiConfig';

/**
 * Signing in, staying signed in, and signing out.
 *
 * Two sign-in paths exist because the API has two: portal accounts authenticate with an email,
 * drivers with a mobile number, and the portal endpoint refuses drivers outright. The role tabs on
 * the login form choose which endpoint to call — but they do not decide what the user *is*. That
 * comes back from the server, and it is what the app routes on.
 */

export type PortalRole = 'SuperAdmin' | 'Admin' | 'Advertiser' | 'FleetManager' | 'Driver';

export interface Session {
  userId: string;
  displayName: string;
  roles: string[];
  /** Only present for drivers, who have a driver record separate from their user account. */
  driverId?: string;
  /** When the access token expires. Stored so a stale session can be recognised on startup. */
  expiresAtUtc: string;
}

/** Thrown when the server refuses the sign-in, carrying its own wording rather than a generic one. */
export class SignInError extends Error {
  readonly status: number;
  /** Set on a 403: the account exists but is not cleared to sign in yet. */
  readonly accountStatus?: string;

  constructor(status: number, message: string, accountStatus?: string) {
    super(message);
    this.name = 'SignInError';
    this.status = status;
    this.accountStatus = accountStatus;
  }

  get isAwaitingReview() {
    return this.status === 403;
  }
}

interface PortalLoginResponse {
  token: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: string;
  displayName: string;
  roles: string[];
}

interface DriverLoginResponse {
  token: string;
  driverId: string;
  driverName: string;
  firstName: string;
  region: string;
  refreshToken: string;
  expiresAtUtc: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // A network failure is not a rejected credential, and saying so saves someone retyping a
    // password that was never wrong.
    throw new SignInError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (response.ok) return (await response.json()) as T;

  const problem = await response.json().catch(() => null);
  const message =
    problem?.message ?? problem?.error ?? problem?.title ?? 'Sign-in failed. Please try again.';

  throw new SignInError(response.status, message, problem?.status);
}

/** Portal sign-in: admins, advertisers, fleet managers. */
export async function signInToPortal(email: string, password: string): Promise<Session> {
  const response = await post<PortalLoginResponse>('/api/v1/auth/portal/login', { email, password });

  return persist({
    userId: response.userId,
    displayName: response.displayName || email,
    roles: response.roles,
    expiresAtUtc: response.expiresAtUtc,
  }, response.token, response.refreshToken);
}

/**
 * Driver sign-in, by mobile number.
 *
 * Separate because the driver identity is a driver record, not just a user account, and because
 * the portal endpoint refuses drivers by design — they belong in the app.
 */
export async function signInAsDriver(mobileNumber: string, password: string): Promise<Session> {
  const response = await post<DriverLoginResponse>('/api/auth/login', { mobileNumber, password });

  return persist({
    userId: response.driverId,
    displayName: response.driverName || response.firstName,
    roles: ['Driver'],
    driverId: response.driverId,
    expiresAtUtc: response.expiresAtUtc,
  }, response.token, response.refreshToken);
}

function persist(session: Session, accessToken: string, refreshToken: string): Session {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  setStoredSession(JSON.stringify(session));
  return session;
}

/**
 * Ends the session.
 *
 * The local state is cleared whatever the server says. A logout that fails silently and leaves a
 * session behind is worse than one that clears the browser and cannot reach the server: the
 * refresh token is revoked on the next successful call either way, and the person in front of the
 * screen is signed out now.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
  } catch {
    /* Offline. Clearing locally is still the right thing. */
  } finally {
    clearStoredAuth();
  }
}

/**
 * The session left over from a previous visit, if any.
 *
 * An expired access token is not treated as no session — the refresh token outlives it by weeks,
 * and the first API call will renew it. Only a missing or unreadable session counts as signed out.
 */
export function restoreSession(): Session | null {
  const raw = getStoredSession();
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Session;
    if (!session?.userId || !Array.isArray(session.roles)) return null;

    // Without a refresh token there is no way back once the access token lapses, so treat the
    // session as gone rather than letting the user find out mid-task.
    if (!getRefreshToken()) return null;

    return session;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------- routing

const ROLE_LANDING: Array<[string, string]> = [
  ['SuperAdmin', '/admin'],
  ['Admin', '/admin'],
  ['Advertiser', '/advertiser'],
  ['FleetManager', '/taxi-company'],
  ['Driver', '/driver'],
];

/**
 * Where a signed-in user belongs, decided from the roles the server issued.
 *
 * Not from the tab they picked on the login form. That tab is a hint about which endpoint to call;
 * treating it as the answer would land an advertiser who clicked "Admin" on an admin dashboard,
 * where every request would fail and the UI would have implied access that does not exist.
 *
 * Order matters: a user holding several roles goes to the most privileged surface.
 */
export function landingFor(roles: readonly string[]): string {
  for (const [role, path] of ROLE_LANDING) {
    if (roles.includes(role)) return path;
  }

  // Authenticated but holding nothing the portal knows how to show.
  return '/';
}

/** Whether a session may see a given area, used by the route guard. */
export function canReach(roles: readonly string[], path: string): boolean {
  if (path.startsWith('/admin')) return roles.some((r) => r === 'SuperAdmin' || r === 'Admin');
  if (path.startsWith('/advertiser')) return roles.includes('Advertiser') || isPlatformAdmin(roles);
  if (path.startsWith('/taxi-company')) return roles.includes('FleetManager') || isPlatformAdmin(roles);
  if (path.startsWith('/driver')) return roles.includes('Driver') || isPlatformAdmin(roles);

  return true;
}

/**
 * Admins can view any tenant surface, which is how support actually works. This only governs what
 * the UI offers — every endpoint enforces its own permissions independently, so a wrong answer
 * here shows an empty page rather than someone else's data.
 */
function isPlatformAdmin(roles: readonly string[]): boolean {
  return roles.includes('SuperAdmin') || roles.includes('Admin');
}
