/**
 * Smooth marker movement between real GPS updates.
 *
 * Vehicles report roughly every five seconds. Drawing a marker only at those instants makes it
 * jump; drawing it continuously between them looks alive. The catch is that the intermediate
 * positions are drawn, not observed — so this module exists to make that distinction impossible to
 * lose track of.
 *
 * Three rules, all encoded below and all tested:
 *
 * 1. Interpolated coordinates are always flagged. Nothing here is ever sent back to the server;
 *    there is no endpoint that would accept it, and inventing evidence is the one thing this
 *    system must not do.
 * 2. Extrapolation is refused. Between two known fixes the vehicle was somewhere on that line, but
 *    past the newest fix its position is unknown — continuing to slide the marker would be a
 *    guess presented as knowledge. To make that refusal workable the map draws one sampling
 *    interval in the past (see `renderDelayMs`), so there is always a real fix ahead to move
 *    toward.
 * 3. Movement stops when updates stop. After a short grace the marker freezes and the vehicle is
 *    reported stale, because a smoothly gliding icon is the most convincing possible lie about a
 *    device that has gone silent.
 */

/** A real position as reported by the server. Never produced by this module. */
export interface VehicleFix {
  vehicleId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  bearingDegrees: number | null;
  accuracyMeters: number;
  /** When the vehicle was actually here. The only timestamp that means anything for position. */
  capturedAtUtc: string;
  /** When the server learned it. Differs sharply after an outage. */
  receivedAtUtc: string;
  connectivity: 'Healthy' | 'Delayed' | 'Offline' | 'Unknown';
  canPresentAsLive: boolean;
}

export type VehiclePresentation = 'live' | 'stale' | 'offline';

/** What to draw right now. `isDerived` says whether the position was measured or computed. */
export interface RenderedVehicle {
  vehicleId: string;
  lat: number;
  lng: number;
  bearingDegrees: number | null;
  /** True when the coordinates were computed between two real fixes rather than reported. */
  isDerived: boolean;
  presentation: VehiclePresentation;
  /** Age of the newest real fix, in seconds. Shown to the user when not live. */
  fixAgeSeconds: number;
}

export const INTERPOLATION_CONFIG = {
  /**
   * How far behind real time the map draws.
   *
   * This is what makes smoothing possible without lying. The newest fix always describes a moment
   * that has already passed, so animating *toward* it means animating toward the present — which
   * arrives before the next fix does, leaving the marker parked on the newest position and the
   * motion just as jumpy as before. Drawing one sampling interval in the past means there is
   * always a later fix to move toward, and every drawn position falls between two the vehicle
   * actually reported.
   *
   * The cost is that a taxi is shown where it was five seconds ago. That is the honest trade:
   * a small, bounded, stated delay instead of a guess about the present.
   */
  renderDelayMs: 5000,

  /** Beyond this the position is presented as stale rather than current. */
  staleAfterMs: 45_000,

  /** Beyond this the vehicle is treated as gone, matching the server's Offline threshold. */
  offlineAfterMs: 120_000,

  /**
   * Above this implied speed the gap between two fixes is a correction, not travel, so the marker
   * snaps rather than sliding across a route the vehicle never drove.
   *
   * Judged as a speed rather than a flat distance because the gap between fixes is not fixed:
   * sampling drops to once a minute while a taxi is parked, and a car that then pulls away
   * covers half a kilometre before the next fix — perfectly ordinary travel that a distance
   * threshold would misread as a jump. Matches the backend's own plausibility limit.
   */
  implausibleSpeedKmh: 200,
} as const;

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Position to draw at `nowMs`, given the previous and newest real fixes.
 *
 * `previous` may be null on the first sighting, in which case the newest fix is drawn as-is.
 */
export function interpolate(
  previous: VehicleFix | null,
  latest: VehicleFix,
  nowMs: number,
  config = INTERPOLATION_CONFIG,
): RenderedVehicle {
  const latestMs = Date.parse(latest.capturedAtUtc);
  const fixAgeSeconds = Math.max(0, (nowMs - latestMs) / 1000);

  const presentation = presentationFor(latest, nowMs, config);

  // Nothing to interpolate from, or the server says this must not be shown as current.
  if (!previous || presentation !== 'live') {
    return {
      vehicleId: latest.vehicleId,
      lat: latest.lat,
      lng: latest.lng,
      bearingDegrees: latest.bearingDegrees,
      isDerived: false,
      presentation,
      fixAgeSeconds,
    };
  }

  const previousMs = Date.parse(previous.capturedAtUtc);
  const span = latestMs - previousMs;

  // Out of order or duplicate timestamps: no interval to slide along.
  if (span <= 0) {
    return {
      vehicleId: latest.vehicleId,
      lat: latest.lat,
      lng: latest.lng,
      bearingDegrees: latest.bearingDegrees,
      isDerived: false,
      presentation,
      fixAgeSeconds,
    };
  }

  const jump = distanceMeters(previous.lat, previous.lng, latest.lat, latest.lng);
  const impliedSpeedKmh = (jump / span) * 3600;

  // A correction is snapped to. Sliding across it would draw the vehicle travelling a path it
  // never took — worse than a visible jump, because it looks plausible.
  if (impliedSpeedKmh > config.implausibleSpeedKmh) {
    return {
      vehicleId: latest.vehicleId,
      lat: latest.lat,
      lng: latest.lng,
      bearingDegrees: latest.bearingDegrees,
      isDerived: false,
      presentation,
      fixAgeSeconds,
    };
  }

  // Clamped to [0, 1]: the marker may travel toward the newest fix but never past it. Beyond that
  // point the vehicle's position is simply unknown, and extrapolating would invent it.
  const drawAtMs = nowMs - config.renderDelayMs;
  const progress = Math.min(1, Math.max(0, (drawAtMs - previousMs) / span));

  // At either end the drawn position coincides with a reported one, so it is not derived.
  if (progress <= 0) {
    return {
      vehicleId: latest.vehicleId,
      lat: previous.lat,
      lng: previous.lng,
      bearingDegrees: previous.bearingDegrees,
      isDerived: false,
      presentation,
      fixAgeSeconds,
    };
  }

  if (progress >= 1) {
    return {
      vehicleId: latest.vehicleId,
      lat: latest.lat,
      lng: latest.lng,
      bearingDegrees: latest.bearingDegrees,
      isDerived: false,
      presentation,
      fixAgeSeconds,
    };
  }

  return {
    vehicleId: latest.vehicleId,
    lat: previous.lat + (latest.lat - previous.lat) * progress,
    lng: previous.lng + (latest.lng - previous.lng) * progress,
    bearingDegrees: latest.bearingDegrees ?? previous.bearingDegrees,
    // The load-bearing flag: these coordinates were computed, not measured.
    isDerived: true,
    presentation,
    fixAgeSeconds,
  };
}

/**
 * How a vehicle should be presented.
 *
 * Judged on when the fix was *captured*, never when it was received. A batch arriving after a
 * tunnel contains old positions, and treating them as current would place a taxi where it no
 * longer is. The server's own verdict is respected as a floor.
 */
export function presentationFor(
  fix: VehicleFix,
  nowMs: number,
  config = INTERPOLATION_CONFIG,
): VehiclePresentation {
  const ageMs = nowMs - Date.parse(fix.capturedAtUtc);

  if (fix.connectivity === 'Offline' || ageMs >= config.offlineAfterMs) return 'offline';
  if (fix.connectivity === 'Unknown') return 'offline';

  // The server already decided this position cannot stand as current; the client must not
  // upgrade that judgement.
  if (!fix.canPresentAsLive || ageMs >= config.staleAfterMs) return 'stale';
  if (fix.connectivity === 'Delayed') return 'stale';

  return 'live';
}

/** Human-readable age, for the "last confirmed position N ago" line. */
export function describeAge(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}
