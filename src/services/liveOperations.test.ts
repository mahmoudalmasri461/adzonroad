import { describe, expect, it } from 'vitest';
import { buildVehicleRows, filterVehicleRows, plateKey, type VehicleRow } from './liveOperations';
import type { RenderedVehicle } from './vehicleInterpolation';
import type { AdminScreen, Assignment, LiveVehicle } from './admin';

function vehicle(id: string, presentation: RenderedVehicle['presentation'] = 'live'): RenderedVehicle {
  return { vehicleId: id, lat: 33.88, lng: 35.5, bearingDegrees: null, isDerived: false, presentation, fixAgeSeconds: 4 };
}

function meta(id: string, plate: string, driverName: string | null = 'Rana K'): LiveVehicle {
  return { vehicleId: id, plate, driverName, lat: 33.88, lng: 35.5, speedKmh: 30, atUtc: '', region: 'Hamra' };
}

function screen(serial: string, plate: string | null): AdminScreen {
  return {
    screenId: 's-' + serial, serialNumber: serial, status: 'Active', networkStatus: 'Online',
    plate, driverName: null, region: null, lastHeartbeatAtUtc: null, batteryLevel: null,
  };
}

function assignment(plate: string | null, campaignName: string): Assignment {
  return {
    assignmentId: 'a1', campaignId: 'c1', campaignName, campaignStatus: 'Active', advertiser: 'Acme',
    screenId: 's1', screenSerial: 'SCR-1', vehiclePlate: plate, assignedBy: 'admin',
    matchBasis: 'observed', assignedAtUtc: '', releasedAtUtc: null, releaseReason: null,
  };
}

describe('plateKey', () => {
  it('normalises case and surrounding space so the same plate joins', () => {
    expect(plateKey(' b 1234 ')).toBe('B 1234');
    expect(plateKey('b 1234')).toBe(plateKey('B 1234'));
  });

  it('treats a missing plate as no key rather than an empty match', () => {
    expect(plateKey(null)).toBe('');
    expect(plateKey(undefined)).toBe('');
  });
});

describe('buildVehicleRows', () => {
  it('joins a screen and an assignment to a vehicle by plate', () => {
    const rows = buildVehicleRows(
      [vehicle('v1')],
      [meta('v1', 'B 1234')],
      [screen('SCR-001', 'B 1234')],
      [assignment('B 1234', 'Summer Beirut')],
    );

    expect(rows[0].screen?.serialNumber).toBe('SCR-001');
    expect(rows[0].assignment?.campaignName).toBe('Summer Beirut');
    expect(rows[0].label).toBe('B 1234');
  });

  it('still joins when the plate differs only by case or spacing', () => {
    const rows = buildVehicleRows(
      [vehicle('v1')],
      [meta('v1', 'b 1234 ')],
      [screen('SCR-001', 'B 1234')],
      [assignment('B 1234', 'Summer Beirut')],
    );

    expect(rows[0].screen?.serialNumber).toBe('SCR-001');
    expect(rows[0].assignment?.campaignName).toBe('Summer Beirut');
  });

  it('leaves screen and assignment undefined rather than guessing when nothing matches', () => {
    const rows = buildVehicleRows(
      [vehicle('v1')],
      [meta('v1', 'B 1234')],
      [screen('SCR-001', 'B 9999')],
      [assignment('B 9999', 'Other campaign')],
    );

    expect(rows[0].screen).toBeUndefined();
    expect(rows[0].assignment).toBeUndefined();
  });

  it('does not join two plateless records to each other', () => {
    // Both sides normalise to '', which a naive lookup would treat as a match.
    const rows = buildVehicleRows(
      [vehicle('v1')],
      [{ ...meta('v1', ''), plate: '' }],
      [screen('SCR-001', null)],
      [assignment(null, 'Unassigned')],
    );

    expect(rows[0].screen).toBeUndefined();
    expect(rows[0].assignment).toBeUndefined();
  });

  it('falls back to a shortened id when the vehicle has no metadata at all', () => {
    const rows = buildVehicleRows([vehicle('abcdef1234')], [], [], []);

    expect(rows[0].label).toBe('ABCDEF12');
    expect(rows[0].meta).toBeUndefined();
  });
});

describe('filterVehicleRows', () => {
  const rows: VehicleRow[] = buildVehicleRows(
    [vehicle('v1', 'live'), vehicle('v2', 'stale'), vehicle('v3', 'offline')],
    [meta('v1', 'B 1111', 'Rana'), meta('v2', 'B 2222', 'Sami'), meta('v3', 'B 3333', null)],
    [screen('SCR-A', 'B 1111')],
    [assignment('B 2222', 'Autumn push')],
  );

  it('reporting keeps only live positions', () => {
    expect(filterVehicleRows(rows, 'reporting', '').map((r) => r.label)).toEqual(['B 1111']);
  });

  it('attention keeps everything that is not live', () => {
    expect(filterVehicleRows(rows, 'attention', '').map((r) => r.label)).toEqual(['B 2222', 'B 3333']);
  });

  it('on campaign keeps only vehicles with a real assignment', () => {
    expect(filterVehicleRows(rows, 'onCampaign', '').map((r) => r.label)).toEqual(['B 2222']);
  });

  it('searches plate, driver, region and screen serial', () => {
    expect(filterVehicleRows(rows, 'all', 'sami').map((r) => r.label)).toEqual(['B 2222']);
    expect(filterVehicleRows(rows, 'all', 'scr-a').map((r) => r.label)).toEqual(['B 1111']);
    expect(filterVehicleRows(rows, 'all', 'hamra')).toHaveLength(3);
  });

  it('combines a filter with a search rather than letting either win', () => {
    expect(filterVehicleRows(rows, 'reporting', 'sami')).toHaveLength(0);
  });
});
