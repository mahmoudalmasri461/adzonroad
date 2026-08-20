import type { StatusTagVariant } from '../StatusTag';
import type { FleetGpsStatus, FleetVehicleStatus, FleetDriver } from '../../services/fleet';

/**
 * "Not Fitted" is deliberately neutral rather than an error. A car awaiting hardware is not a
 * fault, and colouring it red would put it alongside the vehicles that are genuinely out working
 * and not reporting — the only ones worth chasing.
 */
export const CAR_STATUS_VARIANT: Record<FleetVehicleStatus, StatusTagVariant> = {
  Active: 'live',
  Offline: 'error',
  Maintenance: 'warn',
  Idle: 'neutral',
  'Not Fitted': 'outline',
};

export const GPS_STATUS_VARIANT: Record<FleetGpsStatus, StatusTagVariant> = {
  Connected: 'live',
  'Weak Signal': 'warn',
  Lost: 'error',
};

/** Neutral when there is no device — an unfitted car has no signal to have lost. */
export const gpsVariant = (label: string): StatusTagVariant =>
  label === 'No device' ? 'outline' : GPS_STATUS_VARIANT[label as FleetGpsStatus] ?? 'neutral';

/** Server-side ScreenStatus, plus the null case for a vehicle with no screen installed. */
export const SCREEN_STATUS_VARIANT: Record<string, StatusTagVariant> = {
  Online: 'live',
  Offline: 'error',
  PendingSync: 'warn',
  Maintenance: 'outline',
  Inactive: 'neutral',
};

export const screenStatusVariant = (status: string | null): StatusTagVariant =>
  status ? SCREEN_STATUS_VARIANT[status] ?? 'neutral' : 'outline';

/** Server statuses are PascalCase; the portal reads better with a space. */
export const screenStatusLabel = (status: string | null): string =>
  status ? status.replace(/([a-z])([A-Z])/g, '$1 $2') : 'Not fitted';

export const DRIVER_STATUS_VARIANT: Record<FleetDriver['assignmentStatus'], StatusTagVariant> = {
  Assigned: 'live',
  Unassigned: 'outline',
  'Pending Documents': 'warn',
  'Pending Approval': 'warn',
};
