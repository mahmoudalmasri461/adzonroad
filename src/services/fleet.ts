import { apiGet, apiJson } from './apiClient';

/**
 * What a signed-in taxi company can see about its own fleet.
 *
 * Every endpoint derives the company from the token rather than taking an id, and the server
 * scopes each query by that company, so there is no request a fleet manager could make to read
 * another operator's vehicles, drivers or earnings.
 */

export type FleetVehicleStatus = 'Active' | 'Idle' | 'Offline' | 'Maintenance' | 'Not Fitted';
export type FleetGpsStatus = 'Connected' | 'Weak Signal' | 'Lost';

export interface FleetProfile {
  id: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  region: string | null;
  verificationStatus: string;
}

export interface FleetSummary {
  companyName: string;
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  maintenanceVehicles: number;
  vehiclesWithoutScreen: number;
  screensOnline: number;
  gpsLost: number;
  totalDrivers: number;
  assignedDrivers: number;
  driversPendingApproval: number;
  earningsToday: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  earningsAllTime: number;
}

export interface FleetVehicle {
  id: string;
  plateNumber: string;
  plateCharacter: string;
  plateCategory: string;
  carType: string;
  model: string;
  year: number;
  status: FleetVehicleStatus;
  gpsStatus: FleetGpsStatus;
  screenId: string | null;
  screenSerialNumber: string | null;
  screenStatus: string | null;
  driverId: string | null;
  driverName: string | null;
  currentCampaign: string | null;
  drivingHoursToday: number;
  distanceKmToday: number;
  /**
   * Hours of *verified* delivery on this vehicle's screen today — playback that correlated to a
   * GPS fix. This is what the fleet is paid on, so unverified playback is excluded.
   */
  screenTimeHoursToday: number;
  lat: number | null;
  lng: number | null;
  /** When the fix was captured, not when it arrived. Null means we have never had a position. */
  positionCapturedAtUtc: string | null;
}

export interface FleetDriver {
  id: string;
  name: string;
  mobileNumber: string;
  status: string;
  assignmentStatus: 'Assigned' | 'Unassigned' | 'Pending Documents' | 'Pending Approval';
  assignedVehicleId: string | null;
  assignedVehiclePlate: string | null;
  hasNationalId: boolean;
  hasDriverLicense: boolean;
}

export interface FleetScreen {
  id: string;
  serialNumber: string;
  vehicleId: string;
  vehiclePlate: string;
  status: string;
  networkStatus: string;
  lastHeartbeatAtUtc: string | null;
  lastBatteryLevel: number | null;
  firmwareVersion: string | null;
}

export interface FleetDriverEarnings {
  driverId: string;
  driverName: string;
  shiftCount: number;
  activeHours: number;
  total: number;
}

export interface FleetEarnings {
  from: string;
  to: string;
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  periodTotal: number;
  byDriver: FleetDriverEarnings[];
}

export interface FleetPayout {
  id: string;
  period: string;
  amount: number;
  status: 'Scheduled' | 'Processing' | 'Paid';
  paidAtUtc: string | null;
}

export interface FleetSupportTicket {
  id: string;
  type: string;
  status: string;
  message: string;
  vehiclePlate: string | null;
  createdAtUtc: string;
}

// --------------------------------------------------------------------------------- reads

export const getFleetProfile = (signal?: AbortSignal) =>
  apiGet<FleetProfile>('/api/v1/fleet/profile', undefined, signal);

export const getFleetSummary = (signal?: AbortSignal) =>
  apiGet<FleetSummary>('/api/v1/fleet/summary', undefined, signal);

export const getFleetVehicles = (signal?: AbortSignal) =>
  apiGet<FleetVehicle[]>('/api/v1/fleet/vehicles', undefined, signal);

export const getFleetDrivers = (signal?: AbortSignal) =>
  apiGet<FleetDriver[]>('/api/v1/fleet/drivers', undefined, signal);

export const getFleetScreens = (signal?: AbortSignal) =>
  apiGet<FleetScreen[]>('/api/v1/fleet/screens', undefined, signal);

export const getFleetPayouts = (signal?: AbortSignal) =>
  apiGet<FleetPayout[]>('/api/v1/fleet/payouts', undefined, signal);

export const getFleetSupportTickets = (signal?: AbortSignal) =>
  apiGet<FleetSupportTicket[]>('/api/v1/fleet/support-tickets', undefined, signal);

export function getFleetEarnings(range?: { from?: string; to?: string }, signal?: AbortSignal) {
  // apiGet drops undefined keys, so an absent range asks for the server's default window.
  return apiGet<FleetEarnings>(
    '/api/v1/fleet/earnings',
    { from: range?.from, to: range?.to },
    signal,
  );
}

// --------------------------------------------------------------------------------- writes

export interface RegisterVehicleInput {
  plateNumber: string;
  plateCharacter?: string;
  plateCategory?: string;
  carType?: string;
  model?: string;
  year?: number;
  region?: string;
}

export const registerFleetVehicle = (input: RegisterVehicleInput) =>
  apiJson<FleetVehicle>('/api/v1/fleet/vehicles', 'POST', input);

export interface AddFleetDriverInput {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  password: string;
  region?: string;
  /**
   * Optional in the request, but a driver without both documents cannot be approved — and a
   * fleet-added driver has no other route to supply them.
   */
  nationalIdImageBase64?: string;
  driverLicenseImageBase64?: string;
}

export const addFleetDriver = (input: AddFleetDriverInput) =>
  apiJson<FleetDriver>('/api/v1/fleet/drivers', 'POST', input);

export const raiseFleetSupportTicket = (input: {
  type: 'Damage' | 'Maintenance' | 'General';
  message: string;
  vehicleId?: string;
}) => apiJson<FleetSupportTicket>('/api/v1/fleet/support-tickets', 'POST', input);

// --------------------------------------------------------------------------------- helpers

/**
 * How old a position is, in words. The fleet map must never imply a taxi is still where it was
 * last seen an hour ago, so the age travels with the marker rather than being dropped.
 */
export function positionAge(capturedAtUtc: string | null, now: Date = new Date()): string {
  if (!capturedAtUtc) return 'never reported';

  const seconds = Math.max(0, Math.round((now.getTime() - new Date(capturedAtUtc).getTime()) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

/**
 * GPS as it should be read, not as it is derived.
 *
 * The server computes GPS from the age of the last fix, so a car with no screen installed comes
 * back as "Lost" — which reads as a fault on a vehicle that has no device to lose a signal with.
 * A car awaiting hardware is not a problem to chase.
 */
export function gpsLabel(vehicle: Pick<FleetVehicle, 'screenId' | 'gpsStatus'>): string {
  return vehicle.screenId === null ? 'No device' : vehicle.gpsStatus;
}

/**
 * Whether a vehicle's row should read as a problem needing attention. Idle and Not Fitted are
 * deliberately excluded: a parked car and a car awaiting hardware are both fine.
 */
export const needsAttention = (vehicle: FleetVehicle): boolean =>
  vehicle.status === 'Offline' || vehicle.status === 'Maintenance';
