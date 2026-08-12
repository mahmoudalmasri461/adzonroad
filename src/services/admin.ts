import { apiGet, apiJson } from './apiClient';

/**
 * The review desk.
 *
 * Everything on the platform is created in a pending state — drivers, advertisers, fleets and
 * campaigns alike — and none of it self-approves. Until now there was no interface for any of it,
 * so an administrator could only approve things by calling the API by hand. These are the calls
 * behind that interface.
 */

const BASE = '/api/v1/admin';

export interface DriverRegistration {
  driverId: string;
  fullName: string;
  mobileNumber: string;
  region: string | null;
  status: string;
  createdAtUtc: string;
  /** Which of the three documents were actually stored. Fewer than three cannot be reviewed. */
  documentTypes: string[];
  plateNumber: string | null;
  carType: string | null;
  carModel: string | null;
  carYear: number | null;
}

export interface AccountRegistration {
  accountId: string;
  companyName: string;
  contactName: string;
  email: string;
  mobileNumber: string | null;
  region: string | null;
  status: string;
  createdAtUtc: string;
}

export interface PendingCampaign {
  campaignId: string;
  name: string;
  status: string;
  advertiser: string | null;
  startDate: string;
  endDate: string;
  taxiCount: number;
  creativeDurationSeconds: number;
  regions: string[];
  creativeCount: number;
  price: number;
  createdAtUtc: string;
}

export interface AdminScreen {
  screenId: string;
  serialNumber: string;
  status: string;
  networkStatus: string;
  plate: string | null;
  driverName: string | null;
  region: string | null;
  lastHeartbeatAtUtc: string | null;
  batteryLevel: number | null;
}

export interface LiveVehicle {
  vehicleId: string;
  plate: string;
  driverName: string | null;
  lat: number;
  lng: number;
  speedKmh: number;
  atUtc: string;
  region: string | null;
}

// ---------------------------------------------------------------------------- queues

export function fetchDriverQueue(signal?: AbortSignal): Promise<{ items: DriverRegistration[] }> {
  return apiGet(`${BASE}/driver-registrations?status=pending`, undefined, signal);
}

export function fetchAdvertiserQueue(signal?: AbortSignal): Promise<AccountRegistration[]> {
  return apiGet(`${BASE}/advertiser-registrations?status=pending`, undefined, signal);
}

export function fetchFleetQueue(signal?: AbortSignal): Promise<AccountRegistration[]> {
  return apiGet(`${BASE}/taxi-company-registrations?status=pending`, undefined, signal);
}

export function fetchCampaignQueue(signal?: AbortSignal): Promise<PendingCampaign[]> {
  return apiGet(`${BASE}/campaigns?status=pending`, undefined, signal);
}

export function fetchScreens(signal?: AbortSignal): Promise<AdminScreen[]> {
  return apiGet(`${BASE}/screens`, undefined, signal);
}

export function fetchLiveVehicles(signal?: AbortSignal): Promise<LiveVehicle[]> {
  return apiGet(`${BASE}/vehicles/live`, undefined, signal);
}

export interface DeviceStatus {
  driverId: string;
  shiftId: string | null;
  connectivity: 'Healthy' | 'Delayed' | 'Offline' | 'Unknown';
  gpsFreshness: string;
  syncHealth: string;
  canPresentAsLive: boolean;
  lastHeartbeatAtUtc: string | null;
  lastFixCapturedAtUtc: string | null;
  /** Rows still waiting on the device. A climbing backlog means uploads are failing. */
  pendingTelemetryCount: number;
  batteryLevel: number | null;
  networkType: string | null;
  clockSkewMs: number | null;
}

export interface PlaybackConflict {
  id: number;
  screenId: string | null;
  vehicleId: string | null;
  campaignId: string;
  startedAtUtc: string;
  endedAtUtc: string;
  actualDurationSeconds: number;
  receivedAtUtc: string;
  source: string;
  status: string;
  /** Flags as a comma-joined string, so every reason is present rather than the first. */
  qualifications: string;
}

export function fetchDeviceStatuses(signal?: AbortSignal): Promise<DeviceStatus[]> {
  return apiGet(`${BASE}/devices/status`, undefined, signal);
}

export function fetchPlaybackConflicts(limit = 50, signal?: AbortSignal): Promise<PlaybackConflict[]> {
  return apiGet(`${BASE}/playback-conflicts`, { limit }, signal);
}

// ---------------------------------------------------------------------------- alerting

export type AlertTone = 'error' | 'warn' | 'info';

export interface OperationsAlert {
  key: string;
  label: string;
  detail: string;
  tone: AlertTone;
}

/**
 * What actually needs attention, derived rather than listed.
 *
 * A hand-maintained alert list goes stale the moment reality moves. These come from the same
 * signals the platform already computes: a device the server has stopped hearing from, a queue
 * that is not draining, and playback the evidence refused to support.
 *
 * Ordered worst first, because the top of a list is the only part reliably read.
 */
export function deriveAlerts(
  devices: DeviceStatus[],
  screens: AdminScreen[],
  conflicts: PlaybackConflict[],
): OperationsAlert[] {
  const alerts: OperationsAlert[] = [];

  const offline = devices.filter((d) => d.connectivity === 'Offline');
  if (offline.length > 0) {
    alerts.push({
      key: 'devices-offline',
      label: `${offline.length} device${offline.length === 1 ? '' : 's'} not reporting`,
      detail: 'No heartbeat for over two minutes',
      tone: 'error',
    });
  }

  // A backlog is the signal that evidence is being recorded but not delivered — the failure that
  // looks like nothing is wrong until a report comes up short.
  const backlogged = devices.filter((d) => d.pendingTelemetryCount > 25);
  if (backlogged.length > 0) {
    const worst = Math.max(...backlogged.map((d) => d.pendingTelemetryCount));
    alerts.push({
      key: 'sync-backlog',
      label: `${backlogged.length} device${backlogged.length === 1 ? '' : 's'} with a sync backlog`,
      detail: `Largest queue holds ${worst} unsent fixes`,
      tone: 'error',
    });
  }

  if (conflicts.length > 0) {
    alerts.push({
      key: 'playback-conflicts',
      label: `${conflicts.length} playback claim${conflicts.length === 1 ? '' : 's'} in doubt`,
      detail: 'GPS did not support the claim, or contradicted it',
      tone: 'warn',
    });
  }

  const disconnected = screens.filter((s) => s.networkStatus !== 'Connected');
  if (disconnected.length > 0) {
    alerts.push({
      key: 'screens-disconnected',
      label: `${disconnected.length} screen${disconnected.length === 1 ? '' : 's'} disconnected`,
      detail: 'Last known network state was not connected',
      tone: 'warn',
    });
  }

  const delayed = devices.filter((d) => d.connectivity === 'Delayed');
  if (delayed.length > 0) {
    alerts.push({
      key: 'devices-delayed',
      label: `${delayed.length} device${delayed.length === 1 ? '' : 's'} reporting late`,
      detail: 'Heartbeat older than 45 seconds',
      tone: 'info',
    });
  }

  return alerts;
}

/** Freshness of a heartbeat, for the screen table. Null means it has never checked in. */
export function describeLastSignal(lastHeartbeatAtUtc: string | null, now = Date.now()): string {
  if (!lastHeartbeatAtUtc) return 'never';

  const seconds = Math.max(0, (now - Date.parse(lastHeartbeatAtUtc)) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} hrs ago`;

  return `${Math.round(seconds / 86_400)} days ago`;
}

// ---------------------------------------------------------------------------- decisions

/**
 * Notes travel with every decision.
 *
 * Required on a rejection by the server, because a rejection an advertiser or driver cannot act on
 * gets resubmitted unchanged. Optional on approval, where it is simply a record of who decided
 * what and why.
 */
export type ReviewKind = 'driver' | 'advertiser' | 'fleet' | 'campaign';

const DECISION_PATHS: Record<ReviewKind, (id: string, action: string) => string> = {
  driver: (id, action) => `${BASE}/driver-registrations/${id}/${action}`,
  advertiser: (id, action) => `${BASE}/advertiser-registrations/${id}/${action}`,
  fleet: (id, action) => `${BASE}/taxi-company-registrations/${id}/${action}`,
  campaign: (id, action) => `${BASE}/campaigns/${id}/${action}`,
};

export function approve(kind: ReviewKind, id: string, notes?: string): Promise<unknown> {
  return apiJson(DECISION_PATHS[kind](id, 'approve'), 'POST', { notes: notes ?? null });
}

export function reject(kind: ReviewKind, id: string, notes: string): Promise<unknown> {
  return apiJson(DECISION_PATHS[kind](id, 'reject'), 'POST', { notes });
}

// ---------------------------------------------------------------------------- presentation

/** Human label for each queue, used in headings and empty states. */
export const QUEUE_LABELS: Record<ReviewKind, { title: string; empty: string }> = {
  driver: { title: 'Drivers', empty: 'No drivers waiting for review.' },
  advertiser: { title: 'Advertisers', empty: 'No advertisers waiting for review.' },
  fleet: { title: 'Taxi companies', empty: 'No taxi companies waiting for review.' },
  campaign: { title: 'Campaigns', empty: 'No campaigns waiting for review.' },
};

/**
 * How long something has been waiting.
 *
 * Shown because the queue is ordered oldest first and someone who applied last week should be
 * visibly ahead of someone who applied this morning.
 */
export function waitingFor(createdAtUtc: string, now = Date.now()): string {
  const hours = Math.max(0, (now - Date.parse(createdAtUtc)) / 3_600_000);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Whether a driver's application can actually be reviewed.
 *
 * The registration endpoint accepts a driver without documents — it stores what it is given. An
 * application missing any of the three cannot be judged, so it is flagged rather than presented as
 * though it were ready.
 */
export function hasAllDocuments(registration: DriverRegistration): boolean {
  return ['NationalId', 'DriverLicense', 'CarPapers'].every((type) =>
    registration.documentTypes.includes(type));
}
