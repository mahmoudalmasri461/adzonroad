import { apiGet, apiJson } from './apiClient';

/**
 * What a signed-in driver can see about their own work.
 *
 * Every endpoint here derives the driver from the token rather than taking an id, so there is no
 * request a driver could make to read somebody else's shifts or earnings.
 */

export interface VehicleInfo {
  plate: string;
  screenSerial: string;
  batteryStatus: string;
  lastMaintenanceDate: string;
}

export interface CurrentCampaign {
  name: string;
  /** Epoch millis — the shape the Android app already expects. */
  displayedSince: number;
  campaignId: string;
  creativeId: string | null;
  creativeDurationSeconds: number;
}

export interface ShiftSummary {
  shiftId: string;
  startedAtUtc: string;
  endedAtUtc: string | null;
  totalDistanceKm: number;
  activeHours: number;
  premiumAreaCovered: boolean;
  status: string;
  earningsTotal: number | null;
}

export interface DriverEarnings {
  today: number;
  thisMonth: number;
  allTime: number;
  recentShifts: ShiftSummary[];
}

/** Server-derived device state. Every field is computed, none is asserted by the phone. */
export interface DeviceStatus {
  driverId: string;
  shiftId: string | null;
  connectivity: 'Healthy' | 'Delayed' | 'Offline' | 'Unknown';
  gpsFreshness: string;
  syncHealth: string;
  canPresentAsLive: boolean;
  lastHeartbeatAtUtc: string | null;
  lastFixCapturedAtUtc: string | null;
  pendingTelemetryCount: number;
  batteryLevel: number | null;
  networkType: string | null;
  clockSkewMs: number | null;
}

const ME = '/api/v1/drivers/me';

export function fetchVehicle(signal?: AbortSignal): Promise<VehicleInfo> {
  return apiGet(`${ME}/vehicle`, undefined, signal);
}

export function fetchEarnings(signal?: AbortSignal): Promise<DriverEarnings> {
  return apiGet(`${ME}/earnings`, undefined, signal);
}

export function fetchShifts(limit = 20, signal?: AbortSignal): Promise<ShiftSummary[]> {
  return apiGet(`${ME}/shifts`, { limit }, signal);
}

/**
 * The campaign on the screen right now. Answers 204 when nothing is assigned, which `apiGet`
 * surfaces as a parse failure — so callers should treat a rejection here as "nothing playing"
 * rather than an error worth showing.
 */
export function fetchCurrentCampaign(signal?: AbortSignal): Promise<CurrentCampaign> {
  return apiGet(`${ME}/current-campaign`, undefined, signal);
}

export function fetchMyDeviceStatus(signal?: AbortSignal): Promise<DeviceStatus> {
  return apiGet('/api/v1/telemetry/me/status', undefined, signal);
}

export function submitSupportTicket(message: string, type: string): Promise<{ ticketId: string; status: string }> {
  return apiJson('/api/v1/support-tickets', 'POST', { driverId: null, message, type });
}

// ---------------------------------------------------------------------------- presentation

/**
 * How the driver's recording is going, in words they would use.
 *
 * The distinction that matters: "not uploading" is not the same as "not recording". Evidence is
 * written to the phone first and uploaded second, so a driver who has lost signal has lost
 * nothing — and telling them otherwise would invite them to worry, or worse, to stop driving.
 */
export function describeRecording(status: DeviceStatus | null): {
  headline: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'idle';
} {
  if (!status || !status.shiftId) {
    return {
      headline: 'No shift running',
      detail: 'Start a shift in the driver app to begin recording.',
      tone: 'idle',
    };
  }

  if (status.connectivity === 'Offline') {
    return {
      headline: 'Recording, not uploading',
      detail: status.pendingTelemetryCount > 0
        ? `${status.pendingTelemetryCount} readings saved on your phone. They upload when you get signal.`
        : 'Your phone is saving everything. It uploads when you get signal.',
      tone: 'warn',
    };
  }

  if (status.pendingTelemetryCount > 25) {
    return {
      headline: 'Catching up',
      detail: `${status.pendingTelemetryCount} readings still to upload.`,
      tone: 'warn',
    };
  }

  if (status.connectivity === 'Delayed') {
    return { headline: 'Weak signal', detail: 'Still recording. Uploads are running behind.', tone: 'warn' };
  }

  return { headline: 'Recording and up to date', detail: 'Everything has reached the platform.', tone: 'good' };
}

/** Hours worked today, from the shifts that started today. */
export function hoursToday(shifts: ShiftSummary[], now = new Date()): number {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  return shifts
    .filter((s) => new Date(s.startedAtUtc) >= startOfDay)
    .reduce((sum, s) => sum + s.activeHours, 0);
}

/** Distance today, on the same basis. */
export function distanceToday(shifts: ShiftSummary[], now = new Date()): number {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  return shifts
    .filter((s) => new Date(s.startedAtUtc) >= startOfDay)
    .reduce((sum, s) => sum + s.totalDistanceKm, 0);
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;

  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes === 0 ? `${whole} hrs` : `${whole}h ${minutes}m`;
}

/** Greeting by local time of day. A small thing, but "Good afternoon" at 3am reads as broken. */
export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
