import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canReach, landingFor, restoreSession, signInAsDriver, signInToPortal, SignInError } from './auth';

/** localStorage is a browser global; vitest runs in node here, so a minimal stand-in is enough. */
function installStorage() {
  const store = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });

  return store;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('where a signed-in user lands', () => {
  it('follows the roles the server issued', () => {
    expect(landingFor(['Advertiser'])).toBe('/advertiser');
    expect(landingFor(['FleetManager'])).toBe('/taxi-company');
    expect(landingFor(['Driver'])).toBe('/driver');
    expect(landingFor(['Admin'])).toBe('/admin');
  });

  it('sends a user holding several roles to the most privileged surface', () => {
    expect(landingFor(['Advertiser', 'SuperAdmin'])).toBe('/admin');
  });

  it('sends a user with no recognised role home rather than into a portal', () => {
    // Authenticated, but holding nothing the portal knows how to show.
    expect(landingFor([])).toBe('/');
    expect(landingFor(['SomethingNew'])).toBe('/');
  });
});

describe('what a session may reach', () => {
  it('keeps an advertiser out of the admin and fleet areas', () => {
    expect(canReach(['Advertiser'], '/advertiser/reports')).toBe(true);
    expect(canReach(['Advertiser'], '/admin')).toBe(false);
    expect(canReach(['Advertiser'], '/taxi-company/cars')).toBe(false);
  });

  it('lets an admin view tenant surfaces, which is how support works', () => {
    expect(canReach(['Admin'], '/advertiser')).toBe(true);
    expect(canReach(['SuperAdmin'], '/taxi-company')).toBe(true);
  });

  it('does not let a fleet manager into another portal', () => {
    expect(canReach(['FleetManager'], '/taxi-company')).toBe(true);
    expect(canReach(['FleetManager'], '/advertiser')).toBe(false);
  });

  it('leaves public routes open', () => {
    expect(canReach([], '/')).toBe(true);
    expect(canReach([], '/login')).toBe(true);
  });
});

describe('signing in', () => {
  beforeEach(() => {
    installStorage();
    vi.unstubAllGlobals();
    installStorage();
  });

  it('stores the tokens and the user the server returned', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      token: 'access-1',
      refreshToken: 'refresh-1',
      expiresAtUtc: '2026-08-11T13:00:00Z',
      userId: 'u1',
      displayName: 'Rana K.',
      roles: ['Advertiser'],
    })));

    const session = await signInToPortal('rana@example.com', 'secret');

    expect(session.displayName).toBe('Rana K.');
    expect(session.roles).toEqual(['Advertiser']);
    expect(localStorage.getItem('adz.accessToken')).toBe('access-1');
    expect(localStorage.getItem('adz.refreshToken')).toBe('refresh-1');
  });

  it('keeps the driver id, which is not the same as the user id elsewhere', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      token: 'access-2',
      driverId: 'd7',
      driverName: 'Elie H.',
      firstName: 'Elie',
      region: 'Beirut',
      refreshToken: 'refresh-2',
      expiresAtUtc: '2026-08-11T13:00:00Z',
    })));

    const session = await signInAsDriver('0096170123456', 'secret');

    expect(session.driverId).toBe('d7');
    expect(session.roles).toEqual(['Driver']);
  });

  it("surfaces the server's own wording on a rejected credential", async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse({ message: 'Invalid email or password.' }, 401)));

    await expect(signInToPortal('x@example.com', 'wrong'))
      .rejects.toThrow('Invalid email or password.');
  });

  it('distinguishes an account still under review from a wrong password', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse({ status: 'PendingVerification', message: 'Your account is still being reviewed.' }, 403)));

    // Telling someone their password is wrong when the account is simply pending sends them
    // round a reset loop that cannot possibly help.
    const error = (await signInToPortal('new@example.com', 'right').catch((e) => e)) as SignInError;

    expect(error.isAwaitingReview).toBe(true);
    expect(error.accountStatus).toBe('PendingVerification');
    expect(error.message).toContain('still being reviewed');
  });

  it('says the server was unreachable rather than blaming the password', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));

    const error = (await signInToPortal('x@example.com', 'secret').catch((e) => e)) as SignInError;

    expect(error.status).toBe(0);
    expect(error.message).toContain('Could not reach the server');
  });

  it('stores nothing when sign-in fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'no' }, 401)));

    await signInToPortal('x@example.com', 'wrong').catch(() => undefined);

    expect(localStorage.getItem('adz.accessToken')).toBeNull();
  });
});

describe('restoring a session', () => {
  beforeEach(() => {
    installStorage();
  });

  it('returns nothing when there is no stored session', () => {
    expect(restoreSession()).toBeNull();
  });

  it('restores a stored session so a page reload is not a sign-out', () => {
    localStorage.setItem('adz.refreshToken', 'refresh-1');
    localStorage.setItem('adz.session', JSON.stringify({
      userId: 'u1', displayName: 'Rana K.', roles: ['Advertiser'], expiresAtUtc: '2026-08-11T13:00:00Z',
    }));

    expect(restoreSession()?.displayName).toBe('Rana K.');
  });

  it('treats a session with no refresh token as gone', () => {
    // The access token will lapse within the hour and there would be no way back; better to find
    // that out at startup than halfway through a task.
    localStorage.setItem('adz.session', JSON.stringify({
      userId: 'u1', displayName: 'Rana K.', roles: ['Advertiser'], expiresAtUtc: '2026-08-11T13:00:00Z',
    }));

    expect(restoreSession()).toBeNull();
  });

  it('survives corrupted storage rather than crashing the app at startup', () => {
    localStorage.setItem('adz.refreshToken', 'refresh-1');
    localStorage.setItem('adz.session', '{not json');

    expect(restoreSession()).toBeNull();
  });

  it('rejects a stored session that is missing its roles', () => {
    localStorage.setItem('adz.refreshToken', 'refresh-1');
    localStorage.setItem('adz.session', JSON.stringify({ userId: 'u1' }));

    expect(restoreSession()).toBeNull();
  });
});
