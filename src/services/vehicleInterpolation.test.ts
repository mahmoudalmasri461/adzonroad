import { describe, expect, it } from 'vitest';
import {
  INTERPOLATION_CONFIG,
  describeAge,
  distanceMeters,
  interpolate,
  presentationFor,
  type VehicleFix,
} from './vehicleInterpolation';

const BASE_LAT = 33.8977;
const BASE_LNG = 35.4813;
const NOW = Date.parse('2026-08-10T12:00:00.000Z');

function fix(overrides: Partial<VehicleFix> = {}): VehicleFix {
  return {
    vehicleId: 'v1',
    lat: BASE_LAT,
    lng: BASE_LNG,
    speedKmh: 34,
    bearingDegrees: 90,
    accuracyMeters: 8,
    capturedAtUtc: new Date(NOW).toISOString(),
    receivedAtUtc: new Date(NOW).toISOString(),
    connectivity: 'Healthy',
    canPresentAsLive: true,
    ...overrides,
  };
}

/** ~0.00045 degrees of latitude is roughly 50 m. */
const latAt = (metres: number) => BASE_LAT + metres / 111_320;

describe('interpolation', () => {
  it('draws the reported position when there is nothing to interpolate from', () => {
    const rendered = interpolate(null, fix(), NOW);

    expect(rendered.isDerived).toBe(false);
    expect(rendered.lat).toBe(BASE_LAT);
  });

  it('slides between two real fixes and marks the result derived', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW - 5000).toISOString() });
    const latest = fix({ lat: latAt(50), capturedAtUtc: new Date(NOW).toISOString() });

    // The render delay puts the drawn instant halfway between the two fixes.
    const rendered = interpolate(previous, latest, NOW + 2500);

    expect(rendered.isDerived).toBe(true);
    expect(rendered.lat).toBeGreaterThan(BASE_LAT);
    expect(rendered.lat).toBeLessThan(latAt(50));
  });

  it('never extrapolates past the newest fix', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW - 5000).toISOString() });
    const latest = fix({ lat: latAt(50), capturedAtUtc: new Date(NOW).toISOString() });

    // Past the newest fix even after the render delay: the vehicle's position is unknown from
    // here on, so the marker holds rather than continuing along the last known heading.
    const rendered = interpolate(previous, latest, NOW + 10_000);

    expect(rendered.lat).toBe(latAt(50));
    expect(rendered.isDerived).toBe(false);
  });

  it('holds the older fix until the drawn instant has caught up to it', () => {
    const previous = fix({ lat: latAt(-50), capturedAtUtc: new Date(NOW - 1000).toISOString() });
    const latest = fix({ capturedAtUtc: new Date(NOW).toISOString() });

    // Drawn instant is NOW - 5000, before either fix; nothing to interpolate across yet.
    const rendered = interpolate(previous, latest, NOW);

    expect(rendered.lat).toBe(latAt(-50));
    expect(rendered.isDerived).toBe(false);
  });

  it('snaps rather than sliding across a correction', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW - 5000).toISOString() });
    // 2 km in five seconds — 1,440 km/h, so not travel.
    const latest = fix({ lat: latAt(2000), capturedAtUtc: new Date(NOW).toISOString() });

    const rendered = interpolate(previous, latest, NOW + 2500);

    expect(rendered.isDerived).toBe(false);
    expect(rendered.lat).toBe(latAt(2000));
  });

  it('slides across ordinary city driving', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW - 5000).toISOString() });
    // 60 m in five seconds — 43 km/h, an unremarkable taxi.
    const latest = fix({ lat: latAt(60), capturedAtUtc: new Date(NOW).toISOString() });

    expect(interpolate(previous, latest, NOW + 2500).isDerived).toBe(true);
  });

  it('slides after a long parked gap, where distance alone would look like a jump', () => {
    // Sampling drops to once a minute while stationary; pulling away covers 800 m before the
    // next fix. That is 48 km/h — ordinary — even though the distance is large.
    const previous = fix({ capturedAtUtc: new Date(NOW - 60_000).toISOString() });
    const latest = fix({ lat: latAt(800), capturedAtUtc: new Date(NOW).toISOString() });

    expect(interpolate(previous, latest, NOW + 2000).isDerived).toBe(true);
  });

  it('handles out-of-order timestamps without dividing by zero', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW).toISOString() });
    const latest = fix({ capturedAtUtc: new Date(NOW - 5000).toISOString() });

    const rendered = interpolate(previous, latest, NOW);

    expect(Number.isFinite(rendered.lat)).toBe(true);
    expect(rendered.isDerived).toBe(false);
  });

  it('stops moving once the vehicle is no longer live', () => {
    const previous = fix({ capturedAtUtc: new Date(NOW - 60_000).toISOString() });
    const latest = fix({
      lat: latAt(50),
      capturedAtUtc: new Date(NOW - 50_000).toISOString(),
    });

    const rendered = interpolate(previous, latest, NOW);

    expect(rendered.presentation).not.toBe('live');
    expect(rendered.isDerived).toBe(false);
  });
});

describe('presentation', () => {
  it('is live for a fresh fix on a healthy device', () => {
    expect(presentationFor(fix(), NOW)).toBe('live');
  });

  it('goes stale on fix age, judged on capture rather than receipt', () => {
    const stale = fix({
      capturedAtUtc: new Date(NOW - 60_000).toISOString(),
      // Received just now — a batch flushed after a tunnel.
      receivedAtUtc: new Date(NOW).toISOString(),
    });

    expect(presentationFor(stale, NOW)).toBe('stale');
  });

  it('respects the server verdict even when the fix looks recent', () => {
    expect(presentationFor(fix({ canPresentAsLive: false }), NOW)).toBe('stale');
  });

  it('treats a delayed device as stale rather than live', () => {
    expect(presentationFor(fix({ connectivity: 'Delayed' }), NOW)).toBe('stale');
  });

  it('treats offline and unknown devices as offline', () => {
    expect(presentationFor(fix({ connectivity: 'Offline' }), NOW)).toBe('offline');
    expect(presentationFor(fix({ connectivity: 'Unknown' }), NOW)).toBe('offline');
  });

  it('goes offline once the fix is older than the offline threshold', () => {
    const ancient = fix({
      capturedAtUtc: new Date(NOW - INTERPOLATION_CONFIG.offlineAfterMs - 1).toISOString(),
    });

    expect(presentationFor(ancient, NOW)).toBe('offline');
  });

  it('reports the true age of the newest real fix', () => {
    const rendered = interpolate(null, fix({
      capturedAtUtc: new Date(NOW - 18_000).toISOString(),
    }), NOW);

    expect(rendered.fixAgeSeconds).toBeCloseTo(18, 0);
  });
});

describe('supporting maths', () => {
  it('measures distance accurately enough for the plausibility check', () => {
    expect(distanceMeters(BASE_LAT, BASE_LNG, latAt(100), BASE_LNG)).toBeGreaterThan(95);
    expect(distanceMeters(BASE_LAT, BASE_LNG, latAt(100), BASE_LNG)).toBeLessThan(105);
  });

  it('describes ages readably', () => {
    expect(describeAge(18)).toBe('18s ago');
    expect(describeAge(120)).toBe('2m ago');
    expect(describeAge(7200)).toBe('2h ago');
  });

  it('keeps the render delay well under the stale threshold', () => {
    // Otherwise the map's own lag could push a healthy vehicle into looking stale.
    expect(INTERPOLATION_CONFIG.renderDelayMs)
      .toBeLessThan(INTERPOLATION_CONFIG.staleAfterMs / 2);
  });
});
