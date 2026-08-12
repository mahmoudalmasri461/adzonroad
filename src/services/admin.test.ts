import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approve, deriveAlerts, describeLastSignal, hasAllDocuments, reject, waitingFor,
  type AdminScreen, type DeviceStatus, type DriverRegistration, type PlaybackConflict,
} from './admin';

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

describe('operational alerts', () => {
  const device = (over: Partial<DeviceStatus> = {}): DeviceStatus => ({
    driverId: 'd1', shiftId: null, connectivity: 'Healthy', gpsFreshness: 'Fresh',
    syncHealth: 'Healthy', canPresentAsLive: true, lastHeartbeatAtUtc: null,
    lastFixCapturedAtUtc: null, pendingTelemetryCount: 0, batteryLevel: 80,
    networkType: 'cellular', clockSkewMs: 0, ...over,
  });

  const screen = (over: Partial<AdminScreen> = {}): AdminScreen => ({
    screenId: 's1', serialNumber: 'AZR-1', status: 'Online', networkStatus: 'Connected',
    plate: 'B 12 771', driverName: 'Elie', region: 'Beirut',
    lastHeartbeatAtUtc: null, batteryLevel: 80, ...over,
  });

  const conflict = (): PlaybackConflict => ({
    id: 1, screenId: 's1', vehicleId: 'v1', campaignId: 'c1',
    startedAtUtc: '2026-08-12T10:00:00Z', endedAtUtc: '2026-08-12T10:00:15Z',
    actualDurationSeconds: 15, receivedAtUtc: '2026-08-12T10:00:17Z',
    source: 'ScreenConfirmed', status: 'Rejected', qualifications: 'OverlappingClaim',
  });

  it('stays silent when everything is healthy', () => {
    // An alert panel that cannot go quiet is worse than none — nobody learns to trust it.
    expect(deriveAlerts([device()], [screen()], [])).toEqual([]);
  });

  it('raises devices that have stopped reporting', () => {
    const alerts = deriveAlerts([device({ connectivity: 'Offline' })], [screen()], []);

    expect(alerts[0].label).toContain('1 device not reporting');
    expect(alerts[0].tone).toBe('error');
  });

  it('raises a sync backlog, which is the failure that looks like nothing is wrong', () => {
    // Evidence is being recorded but not delivered; the shift looks fine until a report is short.
    const alerts = deriveAlerts([device({ pendingTelemetryCount: 140 })], [screen()], []);
    const backlog = alerts.find((a) => a.key === 'sync-backlog');

    expect(backlog?.tone).toBe('error');
    expect(backlog?.detail).toContain('140');
  });

  it('ignores a small queue, which is just a batch in flight', () => {
    expect(deriveAlerts([device({ pendingTelemetryCount: 4 })], [screen()], [])).toEqual([]);
  });

  it('puts the worst first, because the top of a list is what gets read', () => {
    const alerts = deriveAlerts(
      [device({ connectivity: 'Offline' }), device({ connectivity: 'Delayed' })],
      [screen({ networkStatus: 'Disconnected' })],
      [conflict()],
    );

    expect(alerts[0].tone).toBe('error');
    expect(alerts.at(-1)?.tone).toBe('info');
  });

  it('pluralises so the text is not embarrassing', () => {
    const one = deriveAlerts([device({ connectivity: 'Offline' })], [], []);
    const two = deriveAlerts(
      [device({ connectivity: 'Offline' }), device({ driverId: 'd2', connectivity: 'Offline' })], [], []);

    expect(one[0].label).toContain('1 device not reporting');
    expect(two[0].label).toContain('2 devices not reporting');
  });
});

describe('last signal', () => {
  const NOW_MS = Date.parse('2026-08-12T12:00:00Z');

  it('reads at the right granularity as it ages', () => {
    expect(describeLastSignal('2026-08-12T11:59:30Z', NOW_MS)).toBe('just now');
    expect(describeLastSignal('2026-08-12T11:30:00Z', NOW_MS)).toBe('30 min ago');
    expect(describeLastSignal('2026-08-12T09:00:00Z', NOW_MS)).toBe('3 hrs ago');
    expect(describeLastSignal('2026-08-10T12:00:00Z', NOW_MS)).toBe('2 days ago');
  });

  it('says never rather than inventing a time for a screen that has never checked in', () => {
    expect(describeLastSignal(null, NOW_MS)).toBe('never');
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
