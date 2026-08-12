import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approve, hasAllDocuments, reject, waitingFor, type DriverRegistration } from './admin';

function installStorage() {
  const store = new Map([['adz.accessToken', 'valid']]);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
}

const response = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, statusText: '', json: async () => body } as Response);

const NOW = Date.parse('2026-08-12T12:00:00Z');

function registration(documentTypes: string[]): DriverRegistration {
  return {
    driverId: 'd1', fullName: 'Elie Haddad', mobileNumber: '0096170123456', region: 'Beirut',
    status: 'PendingVerification', createdAtUtc: '2026-08-12T11:00:00Z',
    documentTypes, plateNumber: '123456', carType: 'Sedan', carModel: 'Corolla', carYear: 2019,
  };
}

describe('how long something has been waiting', () => {
  it('reads in hours on the first day and days after', () => {
    expect(waitingFor('2026-08-12T11:40:00Z', NOW)).toBe('just now');
    expect(waitingFor('2026-08-12T06:00:00Z', NOW)).toBe('6h');
    expect(waitingFor('2026-08-11T12:00:00Z', NOW)).toBe('1 day');
    expect(waitingFor('2026-08-05T12:00:00Z', NOW)).toBe('7 days');
  });

  it('never reports a negative wait for a clock slightly ahead', () => {
    // A server a few seconds ahead of the browser should not produce "waiting -1h".
    expect(waitingFor('2026-08-12T12:00:30Z', NOW)).toBe('just now');
  });
});

describe('whether a driver application can be judged', () => {
  it('accepts an application with all three documents', () => {
    expect(hasAllDocuments(registration(['NationalId', 'DriverLicense', 'CarPapers']))).toBe(true);
  });

  it('flags one that is short, in any combination', () => {
    // The registration endpoint stores whatever it is given, including nothing. An application
    // missing a document cannot actually be reviewed, so it must not look ready.
    expect(hasAllDocuments(registration([]))).toBe(false);
    expect(hasAllDocuments(registration(['NationalId']))).toBe(false);
    expect(hasAllDocuments(registration(['NationalId', 'CarPapers']))).toBe(false);
  });

  it('is not fooled by extra or unexpected document types', () => {
    expect(hasAllDocuments(registration(['NationalId', 'DriverLicense', 'Something']))).toBe(false);
  });
});

describe('decisions', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installStorage();
  });

  it('posts each kind to its own endpoint', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => { urls.push(url); return response({}); }));

    await approve('driver', 'd1');
    await approve('advertiser', 'a1');
    await approve('fleet', 'f1');
    await approve('campaign', 'c1');

    expect(urls[0]).toContain('/admin/driver-registrations/d1/approve');
    expect(urls[1]).toContain('/admin/advertiser-registrations/a1/approve');
    expect(urls[2]).toContain('/admin/taxi-company-registrations/f1/approve');
    expect(urls[3]).toContain('/admin/campaigns/c1/approve');
  });

  it('sends the reason with a rejection', async () => {
    let body: string | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      body = init.body as string;
      return response({});
    }));

    await reject('campaign', 'c1', 'Creative needs the logo larger.');

    expect(JSON.parse(body!)).toEqual({ notes: 'Creative needs the logo larger.' });
  });

  it('sends null rather than an empty string when approving without notes', async () => {
    let body: string | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      body = init.body as string;
      return response({});
    }));

    await approve('driver', 'd1');

    expect(JSON.parse(body!)).toEqual({ notes: null });
  });
});
