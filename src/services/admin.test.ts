import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approve, createStaffUser, deriveAlerts, describeLastSignal, hasAllDocuments, invoiceTotals,
  isOpen, ownerOf, plateOf, presentScreen, readableStatus, reject, reportingScreens,
  suspendDriver, toneForStatus, updateRolePermissions, updateTicketStatus, waitingFor,
  type AdminInvoice, type AdminScreen, type AdminVehicle, type DeviceStatus,
  type DriverRegistration, type PlaybackConflict, type SupportTicket,
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

  /**
   * Suspension is not a rejection. It has its own endpoint and its own permission on the server,
   * and sending it to the reject route would record the wrong thing against a working driver.
   */
  it('sends a suspension to the suspend endpoint, not the reject one', async () => {
    let url = '';
    vi.stubGlobal('fetch', vi.fn(async (u: string) => { url = u; return response({}); }));

    await suspendDriver('d1', 'Papers expired.');

    expect(url).toContain('/admin/driver-registrations/d1/suspend');
    expect(url).not.toContain('reject');
  });

  it('escapes a role name on its way into the path', async () => {
    let url = '';
    vi.stubGlobal('fetch', vi.fn(async (u: string) => { url = u; return response({}); }));

    await updateRolePermissions('Fleet Manager', ['fleets.read']);

    expect(url).toContain('/admin/roles/Fleet%20Manager/permissions');
  });

  it('trims the name and address but never the password', async () => {
    let body: string | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      body = init.body as string;
      return response({});
    }));

    await createStaffUser({
      email: '  ops@adzonroad.com ', firstName: ' Mahmoud ', lastName: ' Al-Masri ',
      // Leading and trailing spaces are legitimate characters in a password. Trimming it here
      // would create an account nobody can sign in to, and the failure would look like a typo.
      password: ' spaced out 9A ', roles: ['Admin'],
    });

    expect(JSON.parse(body!)).toEqual({
      email: 'ops@adzonroad.com',
      firstName: 'Mahmoud',
      lastName: 'Al-Masri',
      password: ' spaced out 9A ',
      roles: ['Admin'],
    });
  });

  it('sends null rather than an empty note when moving a ticket', async () => {
    let body: string | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      body = init.body as string;
      return response({});
    }));

    await updateTicketStatus('t1', 'InProgress');

    expect(JSON.parse(body!)).toEqual({ status: 'InProgress', notes: null });
  });
});

describe('the ledger', () => {
  const invoice = (over: Partial<AdminInvoice>): AdminInvoice => ({
    invoiceId: 'i1', number: 'INV-1', description: 'Campaign', advertiserId: 'a1',
    advertiserName: 'Cedar Retail', campaignId: 'c1', amount: 100, currency: 'USD',
    status: 'Open', dueDate: '2026-09-01', daysUntilDue: 7,
    issuedAtUtc: '2026-08-01T00:00:00Z', paidAtUtc: null, paymentReference: null,
    ...over,
  });

  it('counts a paid invoice as collected and not as outstanding', () => {
    const totals = invoiceTotals([
      invoice({ amount: 300, status: 'Paid' }),
      invoice({ invoiceId: 'i2', amount: 200, status: 'Open' }),
    ]);

    expect(totals).toEqual({
      billed: 500, collected: 300, outstanding: 200, overdue: 0, overdueCount: 0,
    });
  });

  /**
   * Overdue is the server's verdict, carried on the row. Deciding it here from the due date
   * would be a second opinion, and the two would disagree the moment a day rolls over.
   */
  it('takes overdue from the status rather than recomputing it from the due date', () => {
    const totals = invoiceTotals([
      invoice({ amount: 400, status: 'Overdue', daysUntilDue: -12 }),
      // Past its due date on the numbers, but the server still calls it open. It is open.
      invoice({ invoiceId: 'i2', amount: 50, status: 'Open', daysUntilDue: -3 }),
    ]);

    expect(totals.overdue).toBe(400);
    expect(totals.overdueCount).toBe(1);
    expect(totals.outstanding).toBe(450);
  });

  it('reports zeroes rather than NaN for an empty ledger', () => {
    expect(invoiceTotals([])).toEqual({
      billed: 0, collected: 0, outstanding: 0, overdue: 0, overdueCount: 0,
    });
  });
});

describe('vehicles', () => {
  const vehicle = (over: Partial<AdminVehicle>): AdminVehicle => ({
    vehicleId: 'v1', plateNumber: '123456', plateCharacter: 'B', plateCategory: 'Public',
    carType: 'Sedan', model: 'Corolla', year: 2019,
    taxiCompanyId: null, taxiCompanyName: null, driverId: null, driverName: null,
    driverStatus: null, region: 'Beirut', screenSerial: null, screenStatus: null,
    lastFixAtUtc: null, createdAtUtc: '2026-08-01T00:00:00Z',
    ...over,
  });

  /** A car with no company is an independent driver's own, which is a category, not a gap. */
  it('names a company-less car Independent rather than leaving it blank', () => {
    expect(ownerOf(vehicle({}))).toBe('Independent');
    expect(ownerOf(vehicle({ taxiCompanyName: 'Cedar Taxi' }))).toBe('Cedar Taxi');
  });

  it('reassembles the plate as it is painted', () => {
    expect(plateOf(vehicle({}))).toBe('B 123456');
  });

  it('falls back to the number alone when no character was recorded', () => {
    expect(plateOf(vehicle({ plateCharacter: '' }))).toBe('123456');
  });
});

describe('support tickets', () => {
  const ticket = (status: string): SupportTicket => ({
    ticketId: 't1', type: 'Damage', status, message: 'Cracked screen',
    driverId: 'd1', driverName: 'Elie Haddad', taxiCompanyName: null,
    vehicleId: 'v1', vehiclePlate: 'B 123456', resolutionNotes: null,
    createdAtUtc: '2026-08-01T00:00:00Z', resolvedAtUtc: null,
  });

  it('treats in-progress as still needing somebody', () => {
    expect(isOpen(ticket('Open'))).toBe(true);
    expect(isOpen(ticket('InProgress'))).toBe(true);
    expect(isOpen(ticket('Resolved'))).toBe(false);
    expect(isOpen(ticket('Closed'))).toBe(false);
  });
});

describe('what a screen is actually doing', () => {
  const NOW_MS = Date.parse('2026-08-25T12:00:00Z');

  const screen = (over: Partial<AdminScreen>): AdminScreen => ({
    screenId: 's1', serialNumber: 'AZR-0001', status: 'Online', networkStatus: 'Connected',
    plate: 'B 123456', driverName: 'Elie Haddad', region: 'Beirut',
    lastHeartbeatAtUtc: '2026-08-25T11:59:00Z', batteryLevel: 80,
    ...over,
  });

  /**
   * The bug this exists for: a screen whose status column said Online had never sent a single
   * heartbeat, and the console believed the column.
   */
  it('does not call a screen online when it has never checked in', () => {
    const presented = presentScreen(screen({ status: 'Online', lastHeartbeatAtUtc: null }), NOW_MS);

    expect(presented.label).toBe('Never checked in');
    expect(presented.tone).not.toBe('live');
  });

  it('stops calling it online once it goes quiet, whatever the column says', () => {
    const presented = presentScreen(
      screen({ status: 'Online', lastHeartbeatAtUtc: '2026-08-25T11:00:00Z' }), NOW_MS);

    expect(presented.label).toBe('Not reporting');
    expect(presented.tone).toBe('error');
  });

  it('trusts a recent heartbeat on a connected screen', () => {
    expect(presentScreen(screen({}), NOW_MS)).toEqual({ label: 'Online', tone: 'live' });
  });

  it('reports a disconnected network even when the heartbeat is fresh', () => {
    expect(presentScreen(screen({ networkStatus: 'Disconnected' }), NOW_MS).label)
      .toBe('Disconnected');
  });

  /**
   * The counter and the alert beside it read the same rows. Counting the stored column gave
   * "9 screens online" directly above "8 screens disconnected".
   */
  it('counts only the screens it can vouch for', () => {
    const screens = [
      screen({ screenId: 'a' }),
      screen({ screenId: 'b', lastHeartbeatAtUtc: null }),
      screen({ screenId: 'c', lastHeartbeatAtUtc: '2026-08-25T11:00:00Z' }),
      screen({ screenId: 'd', networkStatus: 'Disconnected' }),
    ];

    expect(reportingScreens(screens, NOW_MS)).toBe(1);
  });
});

describe('status wording', () => {
  it('turns a database word into one worth showing a person', () => {
    expect(readableStatus('PendingVerification')).toBe('Pending review');
    expect(readableStatus('PendingApproval')).toBe('Pending review');
    expect(readableStatus('Approved')).toBe('Approved');
    expect(readableStatus('InProgress')).toBe('In Progress');
  });

  it('says Unknown rather than rendering nothing for a missing status', () => {
    expect(readableStatus(null)).toBe('Unknown');
    expect(readableStatus(undefined)).toBe('Unknown');
  });

  it('colours a refusal and a suspension the same way, and an approval differently', () => {
    expect(toneForStatus('Rejected')).toBe('error');
    expect(toneForStatus('Suspended')).toBe('error');
    expect(toneForStatus('Approved')).toBe('live');
    // An unrecognised status must not be coloured as though it were good news.
    expect(toneForStatus('SomethingNew')).toBe('neutral');
  });
});
