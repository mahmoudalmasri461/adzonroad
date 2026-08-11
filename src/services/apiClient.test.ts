import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, ApiError } from './apiClient';

function installStorage(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries(entries));

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });

  return store;
}

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  } as Response;
}

describe('token refresh', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renews an expired token and retries the request once', async () => {
    installStorage({ 'adz.accessToken': 'stale', 'adz.refreshToken': 'refresh-1' });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ message: 'expired' }, 401))
      .mockResolvedValueOnce(response({ token: 'fresh', refreshToken: 'refresh-2' }))
      .mockResolvedValueOnce(response({ ok: true }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/api/v1/reports/campaigns')).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem('adz.accessToken')).toBe('fresh');
    // The refresh token rotated, and the new one was kept.
    expect(localStorage.getItem('adz.refreshToken')).toBe('refresh-2');
  });

  it('refreshes once for several requests that expire together', async () => {
    installStorage({ 'adz.accessToken': 'stale', 'adz.refreshToken': 'refresh-1' });

    const calls: string[] = [];
    const fetchMock = vi.fn(async (target: string) => {
      calls.push(target);

      if (target.includes('/auth/refresh')) {
        return response({ token: 'fresh', refreshToken: 'refresh-2' });
      }

      // Anything sent with the stale token fails; the renewed one succeeds.
      return localStorage.getItem('adz.accessToken') === 'stale'
        ? response({ message: 'expired' }, 401)
        : response({ ok: true });
    });

    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      apiGet('/api/v1/reports/campaigns'),
      apiGet('/api/v1/reports/campaigns/1/delivery'),
      apiGet('/api/v1/reports/campaigns/1/claims'),
    ]);

    // The load-bearing assertion. Refresh tokens rotate and the server treats a replayed revoked
    // one as theft by revoking the whole chain — so a second concurrent refresh would not merely
    // be wasteful, it would sign the user out of everything.
    expect(calls.filter((c) => c.includes('/auth/refresh'))).toHaveLength(1);
  });

  it('gives up and clears the session when the refresh token is spent', async () => {
    installStorage({ 'adz.accessToken': 'stale', 'adz.refreshToken': 'revoked' });

    vi.stubGlobal('fetch', vi.fn(async (target: string) =>
      target.includes('/auth/refresh')
        ? response({ message: 'Invalid or expired refresh token.' }, 401)
        : response({ message: 'expired' }, 401)));

    await expect(apiGet('/api/v1/reports/campaigns')).rejects.toBeInstanceOf(ApiError);

    expect(localStorage.getItem('adz.refreshToken')).toBeNull();
    expect(localStorage.getItem('adz.accessToken')).toBeNull();
  });

  it('does not try to refresh a session that never had a refresh token', async () => {
    installStorage({ 'adz.accessToken': 'stale' });

    const fetchMock = vi.fn(async () => response({ message: 'expired' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/api/v1/reports/campaigns')).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on a 403, which refreshing could never fix', async () => {
    installStorage({ 'adz.accessToken': 'valid', 'adz.refreshToken': 'refresh-1' });

    const fetchMock = vi.fn(async () => response({ message: 'Forbidden' }, 403));
    vi.stubGlobal('fetch', fetchMock);

    // The credential was understood and refused. A new token says exactly the same thing.
    await expect(apiGet('/api/v1/admin/users')).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the tokens when the refresh call fails on the network', async () => {
    installStorage({ 'adz.accessToken': 'stale', 'adz.refreshToken': 'refresh-1' });

    vi.stubGlobal('fetch', vi.fn(async (target: string) => {
      if (target.includes('/auth/refresh')) throw new TypeError('Failed to fetch');
      return response({ message: 'expired' }, 401);
    }));

    await expect(apiGet('/api/v1/reports/campaigns')).rejects.toBeInstanceOf(ApiError);

    // Being offline is not the same as being logged out.
    expect(localStorage.getItem('adz.refreshToken')).toBe('refresh-1');
  });
});

describe('errors', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installStorage({ 'adz.accessToken': 'valid' });
  });

  it('keeps the status so a 404 can be told from a refusal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ message: 'nope' }, 404)));

    const error = (await apiGet('/api/v1/reports/campaigns/x/delivery').catch((e) => e)) as ApiError;

    expect(error.isNotFound).toBe(true);
    expect(error.isUnauthorized).toBe(false);
  });

  it("uses the server's message when it sends one", async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      response({ error: "Window may not exceed 366 days." }, 400)));

    await expect(apiGet('/api/v1/reports/campaigns/x/delivery'))
      .rejects.toThrow('Window may not exceed 366 days.');
  });
});
