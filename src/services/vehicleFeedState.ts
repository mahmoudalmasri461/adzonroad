import type { VehicleConnectivityEvent, VehicleMovedEvent } from './liveConnection';
import { interpolate, type RenderedVehicle, type VehicleFix } from './vehicleInterpolation';

/**
 * What the map knows about each vehicle, and how incoming events change it.
 *
 * Kept separate from the React hook because the decisions here are the ones worth testing — which
 * fix wins when a replayed batch arrives out of order, what a connectivity event does to a vehicle
 * that has sent no new position, when a vehicle stops being drawn at all. None of that needs a DOM.
 *
 * The store is mutated in place. It is read on a fixed render tick rather than per event, so
 * copying it on every fix would allocate for no one's benefit.
 */

/** The two most recent real fixes: enough to interpolate between, and nothing more retained. */
export interface TrackedVehicle {
  previous: VehicleFix | null;
  latest: VehicleFix;
}

export type VehicleFeedStore = Map<string, TrackedVehicle>;

/** After this long without a fix a vehicle leaves the map entirely rather than sitting there grey. */
export const FORGET_AFTER_MS = 15 * 60 * 1000;

export function toFix(e: VehicleMovedEvent): VehicleFix {
  return {
    vehicleId: e.vehicleId,
    lat: e.lat,
    lng: e.lng,
    speedKmh: e.speedKmh,
    bearingDegrees: e.bearingDegrees,
    accuracyMeters: e.accuracyMeters,
    capturedAtUtc: e.capturedAtUtc,
    receivedAtUtc: e.receivedAtUtc,
    connectivity: e.connectivity,
    canPresentAsLive: e.canPresentAsLive,
  };
}

/**
 * Records a newly reported position.
 *
 * Ordering is by capture time, never arrival. A device flushing a buffered batch after a tunnel
 * delivers old positions at high speed; letting a late arrival become "latest" would drag the
 * marker backwards through a route the vehicle finished driving twenty minutes ago.
 *
 * Returns whether the store changed, which makes the discard visible to tests.
 */
export function applyFix(store: VehicleFeedStore, event: VehicleMovedEvent): boolean {
  const fix = toFix(event);
  const existing = store.get(event.vehicleId);

  if (existing && Date.parse(fix.capturedAtUtc) <= Date.parse(existing.latest.capturedAtUtc)) {
    return false;
  }

  store.set(event.vehicleId, { previous: existing?.latest ?? null, latest: fix });
  return true;
}

/**
 * Applies a connectivity change to a vehicle already on the map.
 *
 * A device going quiet produces no further positions, so this event is the only way the map ever
 * learns. The position itself is untouched — the vehicle really was there — but it stops being
 * presentable as current. Recovery to Healthy does not restore that on its own: the fix is still
 * as old as it was, and only a new one can make it current again.
 */
export function applyConnectivity(
  store: VehicleFeedStore,
  event: VehicleConnectivityEvent,
): boolean {
  if (!event.vehicleId) return false;

  const existing = store.get(event.vehicleId);
  if (!existing) return false;

  store.set(event.vehicleId, {
    ...existing,
    latest: {
      ...existing.latest,
      connectivity: event.connectivity,
      canPresentAsLive:
        event.connectivity === 'Healthy' && existing.latest.canPresentAsLive,
    },
  });

  return true;
}

/**
 * Positions to draw at `nowMs`, dropping vehicles that have gone quiet for long enough to forget.
 * Called on the render tick, not on events.
 */
export function renderAll(store: VehicleFeedStore, nowMs: number): RenderedVehicle[] {
  const rendered: RenderedVehicle[] = [];

  for (const [vehicleId, entry] of store) {
    if (nowMs - Date.parse(entry.latest.capturedAtUtc) > FORGET_AFTER_MS) {
      store.delete(vehicleId);
      continue;
    }

    rendered.push(interpolate(entry.previous, entry.latest, nowMs));
  }

  return rendered;
}
