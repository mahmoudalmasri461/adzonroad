import { describe, expect, it } from 'vitest';
import {
  FORGET_AFTER_MS,
  applyConnectivity,
  applyFix,
  renderAll,
  type VehicleFeedStore,
} from './vehicleFeedState';
import type { VehicleConnectivityEvent, VehicleMovedEvent } from './liveConnection';

const NOW = Date.parse('2026-08-10T12:00:00.000Z');
const BASE_LAT = 33.8977;
const BASE_LNG = 35.4813;

function moved(overrides: Partial<VehicleMovedEvent> = {}): VehicleMovedEvent {
  return {
    vehicleId: 'veh-1',
    lat: BASE_LAT,
    lng: BASE_LNG,
    speedKmh: 30,
    bearingDegrees: 90,
    accuracyMeters: 8,
    capturedAtUtc: new Date(NOW).toISOString(),
    receivedAtUtc: new Date(NOW).toISOString(),
    connectivity: 'Healthy',
    canPresentAsLive: true,
    ...overrides,
  };
}

function connectivity(overrides: Partial<VehicleConnectivityEvent> = {}): VehicleConnectivityEvent {
  return {
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    connectivity: 'Offline',
    gpsFreshness: 'Stale',
    lastHeartbeatAtUtc: new Date(NOW - 200_000).toISOString(),
    lastFixCapturedAtUtc: new Date(NOW - 200_000).toISOString(),
    pendingTelemetryCount: 12,
    ...overrides,
  };
}

const store = (): VehicleFeedStore => new Map();

describe('applyFix', () => {
  it('tracks a newly seen vehicle', () => {
    const s = store();

    expect(applyFix(s, moved())).toBe(true);
    expect(s.get('veh-1')?.previous).toBeNull();
  });

  it('keeps the displaced fix as the interpolation start point', () => {
    const s = store();
    applyFix(s, moved({ capturedAtUtc: new Date(NOW - 5000).toISOString() }));
    applyFix(s, moved({ lat: BASE_LAT + 0.001 }));

    expect(s.get('veh-1')?.previous?.lat).toBe(BASE_LAT);
    expect(s.get('veh-1')?.latest.lat).toBe(BASE_LAT + 0.001);
  });

  it('discards a fix captured before the one already held', () => {
    const s = store();
    applyFix(s, moved());

    // A buffered batch flushing after a tunnel: newly received, but older than what we have.
    const late = moved({
      lat: BASE_LAT + 0.05,
      capturedAtUtc: new Date(NOW - 600_000).toISOString(),
      receivedAtUtc: new Date(NOW + 1000).toISOString(),
    });

    expect(applyFix(s, late)).toBe(false);
    expect(s.get('veh-1')?.latest.lat).toBe(BASE_LAT);
  });

  it('discards a duplicate of the fix already held', () => {
    const s = store();
    applyFix(s, moved());

    expect(applyFix(s, moved())).toBe(false);
  });

  it('tracks vehicles independently', () => {
    const s = store();
    applyFix(s, moved({ vehicleId: 'veh-1' }));
    applyFix(s, moved({ vehicleId: 'veh-2' }));

    expect(s.size).toBe(2);
  });
});

describe('applyConnectivity', () => {
  it('downgrades a tracked vehicle without moving it', () => {
    const s = store();
    applyFix(s, moved());

    expect(applyConnectivity(s, connectivity())).toBe(true);

    const entry = s.get('veh-1')!;
    expect(entry.latest.connectivity).toBe('Offline');
    expect(entry.latest.lat).toBe(BASE_LAT);
    expect(entry.latest.canPresentAsLive).toBe(false);
  });

  it('ignores vehicles that have never reported a position', () => {
    const s = store();

    expect(applyConnectivity(s, connectivity())).toBe(false);
    expect(s.size).toBe(0);
  });

  it('ignores events with no vehicle attached', () => {
    const s = store();
    applyFix(s, moved());

    expect(applyConnectivity(s, connectivity({ vehicleId: null }))).toBe(false);
  });

  it('does not restore presentability on recovery — only a new fix can', () => {
    const s = store();
    applyFix(s, moved());
    applyConnectivity(s, connectivity({ connectivity: 'Offline' }));
    applyConnectivity(s, connectivity({ connectivity: 'Healthy' }));

    // The device is reachable again, but the position it last reported is no fresher than it was.
    expect(s.get('veh-1')?.latest.canPresentAsLive).toBe(false);
  });
});

describe('renderAll', () => {
  it('renders every tracked vehicle', () => {
    const s = store();
    applyFix(s, moved({ vehicleId: 'veh-1' }));
    applyFix(s, moved({ vehicleId: 'veh-2' }));

    expect(renderAll(s, NOW)).toHaveLength(2);
  });

  it('forgets a vehicle that has been silent too long', () => {
    const s = store();
    applyFix(s, moved({ capturedAtUtc: new Date(NOW - FORGET_AFTER_MS - 1000).toISOString() }));

    expect(renderAll(s, NOW)).toHaveLength(0);
    expect(s.size).toBe(0);
  });

  it('keeps drawing a silent vehicle until the forget threshold', () => {
    const s = store();
    applyFix(s, moved({ capturedAtUtc: new Date(NOW - 5 * 60_000).toISOString() }));

    const [rendered] = renderAll(s, NOW);
    expect(rendered.presentation).toBe('offline');
    expect(rendered.isDerived).toBe(false);
  });

  it('produces derived positions between two fresh fixes and real ones outside them', () => {
    const s = store();
    applyFix(s, moved({ capturedAtUtc: new Date(NOW - 5000).toISOString() }));
    applyFix(s, moved({ lat: BASE_LAT + 0.0004, capturedAtUtc: new Date(NOW).toISOString() }));

    expect(renderAll(s, NOW + 2500)[0].isDerived).toBe(true);
    // Past the newest fix the marker holds position rather than continuing on.
    expect(renderAll(s, NOW + 10_000)[0].isDerived).toBe(false);
  });
});
