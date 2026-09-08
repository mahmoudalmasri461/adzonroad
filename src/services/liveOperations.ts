import type { RenderedVehicle } from './vehicleInterpolation';
import type { AdminScreen, Assignment, LiveVehicle } from './admin';

/**
 * Joining a live position to the things it is carrying.
 *
 * A hub position carries a vehicle id and nothing else. The plate is the only key shared with the
 * screen inventory and the assignment list, so that is what the join runs on — normalised, because
 * a plate typed with a trailing space or in lower case is the same vehicle and a silent miss here
 * shows an operator "no screen" for a vehicle that has one.
 *
 * Extracted from the page so the join can be tested. It is the part with no live data behind it
 * during development, which makes it exactly the part that would otherwise ship unverified.
 */

export type VehicleRow = {
  vehicle: RenderedVehicle;
  meta: LiveVehicle | undefined;
  screen: AdminScreen | undefined;
  assignment: Assignment | undefined;
  /** The plate when known, otherwise a shortened id — never a plausible-looking placeholder. */
  label: string;
};

export function plateKey(plate: string | null | undefined): string {
  return plate?.trim().toUpperCase() ?? '';
}

export function buildVehicleRows(
  vehicles: readonly RenderedVehicle[],
  metadata: readonly LiveVehicle[],
  screens: readonly AdminScreen[],
  assignments: readonly Assignment[],
): VehicleRow[] {
  const metaById = new Map(metadata.map((v) => [v.vehicleId, v]));

  const screenByPlate = new Map<string, AdminScreen>();
  for (const s of screens) {
    const k = plateKey(s.plate);
    if (k) screenByPlate.set(k, s);
  }

  const assignmentByPlate = new Map<string, Assignment>();
  for (const a of assignments) {
    const k = plateKey(a.vehiclePlate);
    if (k) assignmentByPlate.set(k, a);
  }

  return vehicles.map((vehicle) => {
    const meta = metaById.get(vehicle.vehicleId);
    const k = plateKey(meta?.plate);

    return {
      vehicle,
      meta,
      screen: k ? screenByPlate.get(k) : undefined,
      assignment: k ? assignmentByPlate.get(k) : undefined,
      label: meta?.plate?.trim() || vehicle.vehicleId.slice(0, 8).toUpperCase(),
    };
  });
}

export type LiveFilter = 'all' | 'reporting' | 'attention' | 'onCampaign';

/**
 * Every filter is derived from data that exists: presented state comes from the age of the newest
 * fix, and "on campaign" from a real current assignment. Nothing here invents a status.
 */
export function filterVehicleRows(rows: readonly VehicleRow[], filter: LiveFilter, search: string): VehicleRow[] {
  const needle = search.trim().toLowerCase();

  return rows.filter((row) => {
    if (filter === 'reporting' && row.vehicle.presentation !== 'live') return false;
    if (filter === 'attention' && row.vehicle.presentation === 'live') return false;
    if (filter === 'onCampaign' && !row.assignment) return false;

    if (!needle) return true;

    return [row.label, row.meta?.driverName, row.meta?.region, row.screen?.serialNumber].some((field) =>
      field?.toLowerCase().includes(needle),
    );
  });
}
