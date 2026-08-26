import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiJson, apiUpload, ApiError } from './apiClient';

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

describe('writes', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installStorage({ 'adz.accessToken': 'valid', 'adz.refreshToken': 'refresh-1' });
  });

  it('sends a JSON body with the right content type', async () => {
    let captured: RequestInit | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      captured = init;
      return response({ campaignId: 'c1' }, 201);
    }));

    await apiJson('/api/v1/campaigns', 'POST', { name: 'Summer' });

    expect(captured?.method).toBe('POST');
    expect(captured?.body).toBe(JSON.stringify({ name: 'Summer' }));
    expect((captured?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('treats a 204 as success rather than failing to parse it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204 } as Response)));

    await expect(apiJson('/api/v1/campaigns/c1/creatives/x', 'DELETE')).resolves.toBeUndefined();
  });

  it('leaves the content type to the browser on an upload', async () => {
    let captured: RequestInit | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      captured = init;
      return response({ creativeId: 'x' }, 201);
    }));

    const form = new FormData();
    form.append('durationSeconds', '15');

    await apiUpload('/api/v1/campaigns/c1/creatives', form);

    // Setting it by hand omits the multipart boundary, and the server cannot parse the body.
    expect((captured?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(captured?.body).toBe(form);
  });

  it('rebuilds the request when retrying after a refresh', async () => {
    const bodies: unknown[] = [];
    const fetchMock = vi.fn(async (target: string, init: RequestInit) => {
      if (target.includes('/auth/refresh')) {
        return response({ token: 'fresh', refreshToken: 'refresh-2' });
      }

      bodies.push(init.body);
      return localStorage.getItem('adz.accessToken') === 'valid'
        ? response({ message: 'expired' }, 401)
        : response({ ok: true }, 200);
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiJson('/api/v1/campaigns', 'POST', { name: 'Summer' });

    // Both attempts carried the body. A body read once — a stream, or a FormData already
    // consumed — would make the retry send an empty request that fails for a different reason.
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toBe(bodies[1]);
    expect(bodies[1]).toBe(JSON.stringify({ name: 'Summer' }));
  });

  it('carries the list of problems when the server sends one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({
      message: 'This campaign is not ready to submit.',
      problems: ['Upload at least one creative.', 'Choose at least one region.'],
    }, 400)));

    const error = (await apiJson('/api/v1/campaigns/c1/submit', 'POST').catch((e) => e)) as ApiError;

    // Shown as a list so it takes one pass to fix, rather than one round trip per problem.
    expect(error.problems).toHaveLength(2);
    expect(error.problems[0]).toContain('creative');
  });

  /**
   * Two names for one thing: campaign submission answers with `problems`, anything creating an
   * Identity account answers with `errors` carrying the password-policy reasons. Reading only the
   * first meant those reasons arrived and were silently dropped.
   */
  it('carries the list when the server calls it errors instead of problems', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({
      message: 'Could not create the account.',
      errors: ['Passwords must have at least one digit.', 'Passwords must have at least one uppercase.'],
    }, 400)));

    const error = (await apiJson('/api/v1/admin/users', 'POST').catch((e) => e)) as ApiError;

    expect(error.problems).toHaveLength(2);
    expect(error.problems[0]).toContain('digit');
  });

  it('prefers problems when a response somehow carries both', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({
      message: 'No.', problems: ['the real one'], errors: ['the other one'],
    }, 400)));

    const error = (await apiJson('/api/v1/campaigns/c1/submit', 'POST').catch((e) => e)) as ApiError;

    expect(error.problems).toEqual(['the real one']);
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
