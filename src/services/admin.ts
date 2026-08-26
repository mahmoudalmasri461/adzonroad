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

/**
 * How long a screen may go quiet before we stop calling it online.
 *
 * Looser than the two minutes used for driver devices: a rooftop unit reports less often than a
 * phone on an active shift, and treating it to the same threshold would flap.
 */
export const SCREEN_SILENCE_SECONDS = 300;

/**
 * What a screen is actually doing, decided from evidence rather than from its status column.
 *
 * `Screen.Status` is a stored field — something wrote `Online` into it — and the whole point of
 * this platform is that stored claims do not count as evidence. Showing it raw produced a screen
 * that had never sent a single heartbeat displaying as Online, and an Overview reading
 * "9 screens online" directly above an alert saying "8 screens disconnected". Both came from the
 * same rows; only one of them was derived.
 *
 * Order matters: never-heard-from outranks everything, because it is the difference between a
 * screen that is failing and a screen that was never really there.
 */
export function presentScreen(
  screen: AdminScreen, now = Date.now(),
): { label: string; tone: Tone } {
  if (!screen.lastHeartbeatAtUtc) return { label: 'Never checked in', tone: 'neutral' };

  const silentFor = Math.max(0, (now - Date.parse(screen.lastHeartbeatAtUtc)) / 1000);
  if (silentFor > SCREEN_SILENCE_SECONDS) return { label: 'Not reporting', tone: 'error' };

  if (screen.networkStatus !== 'Connected') return { label: 'Disconnected', tone: 'error' };
  if (screen.status === 'Maintenance') return { label: 'Maintenance', tone: 'warn' };

  return { label: 'Online', tone: 'live' };
}

/** Screens the platform can currently vouch for. The only honest "online" count. */
export function reportingScreens(screens: AdminScreen[], now = Date.now()): number {
  return screens.filter((s) => presentScreen(s, now).tone === 'live').length;
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

// ---------------------------------------------------------------------------- the whole book

/**
 * Everything beyond the review desk.
 *
 * The console's other twelve sections read from endpoints that mostly already existed — the
 * platform had the answers, nothing asked for them. Where a call is new it was added to the API
 * rather than assembled here. Nothing below computes a figure the server also computes: the same
 * number arrived at two ways is two numbers.
 */

export type AccountStatusFilter = 'pending' | 'approved' | 'rejected' | 'suspended' | 'all';

export interface AdminCampaign extends PendingCampaign {
  /** Screens the network could give this campaign right now. */
  freeScreens: number;
  /** Null once a campaign is live, where the assignment count is the real answer. */
  couldFillNow: number | null;
}

export function fetchCampaigns(status = 'all', signal?: AbortSignal): Promise<AdminCampaign[]> {
  return apiGet(`${BASE}/campaigns`, { status }, signal);
}

export interface Assignment {
  assignmentId: string;
  campaignId: string;
  campaignName: string | null;
  campaignStatus: string | null;
  advertiser: string | null;
  screenId: string;
  screenSerial: string | null;
  vehiclePlate: string | null;
  assignedBy: string;
  /** Whether the screen was chosen on observed presence or only on its declared region. */
  matchBasis: string;
  assignedAtUtc: string;
  releasedAtUtc: string | null;
  releaseReason: string | null;
}

export interface CampaignFill {
  campaignId: string;
  campaignName: string;
  advertiserName: string;
  requestedTaxis: number;
  filledTaxis: number;
  shortfall: number;
  observedPresenceMatches: number;
  declaredRegionMatches: number;
}

export interface AssignmentCapacity {
  usableScreens: number;
  assignedScreens: number;
  freeScreens: number;
  taxiSlotsRequested: number;
  taxiSlotsFilled: number;
  totalShortfall: number;
  campaigns: CampaignFill[];
}

export interface AssignmentRunResult {
  assigned: number;
  released: number;
  campaignsConsidered: number;
  screensAvailable: number;
  shortfalls: CampaignFill[];
  ranAtUtc: string;
}

export function fetchAssignments(current = true, signal?: AbortSignal): Promise<Assignment[]> {
  return apiGet(`${BASE}/assignments`, { current: String(current) }, signal);
}

export function fetchCapacity(signal?: AbortSignal): Promise<AssignmentCapacity> {
  return apiGet(`${BASE}/assignments/capacity`, undefined, signal);
}

export function releaseAssignment(assignmentId: string): Promise<unknown> {
  return apiJson(`${BASE}/assignments/${assignmentId}/release`, 'POST');
}

export function runAssignmentSweep(): Promise<AssignmentRunResult> {
  return apiJson(`${BASE}/assignments/run`, 'POST');
}

// ---------------------------------------------------------------------------- accounts

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchDrivers(
  status: AccountStatusFilter = 'all',
  page = 1,
  pageSize = 100,
  signal?: AbortSignal,
): Promise<Paged<DriverRegistration>> {
  return apiGet(`${BASE}/driver-registrations`, { status, page, pageSize }, signal);
}

export function fetchAdvertisers(
  status: AccountStatusFilter = 'all', signal?: AbortSignal,
): Promise<AccountRegistration[]> {
  return apiGet(`${BASE}/advertiser-registrations`, { status }, signal);
}

export function fetchTaxiCompanies(
  status: AccountStatusFilter = 'all', signal?: AbortSignal,
): Promise<AccountRegistration[]> {
  return apiGet(`${BASE}/taxi-company-registrations`, { status }, signal);
}

/**
 * Suspension is separately permissioned on the server and separately worded here, because it is
 * not a rejection: it stops a working driver earning, and whoever does it should be in no doubt
 * which of the two they are doing.
 */
export function suspendDriver(driverId: string, notes: string): Promise<unknown> {
  return apiJson(`${BASE}/driver-registrations/${driverId}/suspend`, 'POST', { notes });
}

// ---------------------------------------------------------------------------- vehicles

export interface AdminVehicle {
  vehicleId: string;
  plateNumber: string;
  plateCharacter: string;
  plateCategory: string;
  carType: string;
  model: string;
  year: number;
  taxiCompanyId: string | null;
  taxiCompanyName: string | null;
  driverId: string | null;
  driverName: string | null;
  driverStatus: string | null;
  region: string | null;
  /** Null for every vehicle today: no screen hardware has been built. */
  screenSerial: string | null;
  screenStatus: string | null;
  lastFixAtUtc: string | null;
  createdAtUtc: string;
}

export function fetchVehicles(
  fitted?: 'yes' | 'no', page = 1, pageSize = 200, signal?: AbortSignal,
): Promise<Paged<AdminVehicle>> {
  return apiGet(`${BASE}/vehicles`, { fitted, page, pageSize }, signal);
}

/** A car with no company belongs to an independent driver, which is a category rather than a gap. */
export function ownerOf(vehicle: AdminVehicle): string {
  return vehicle.taxiCompanyName ?? 'Independent';
}

/** The plate as it is painted, rather than three columns the reader has to reassemble. */
export function plateOf(vehicle: AdminVehicle): string {
  return [vehicle.plateCharacter, vehicle.plateNumber].filter(Boolean).join(' ').trim()
    || vehicle.plateNumber;
}

// ---------------------------------------------------------------------------- money

export interface AdminInvoice {
  invoiceId: string;
  number: string;
  description: string;
  advertiserId: string;
  advertiserName: string;
  campaignId: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  daysUntilDue: number;
  issuedAtUtc: string;
  paidAtUtc: string | null;
  paymentReference: string | null;
}

export interface EarningsSummary {
  totalAccrued: number;
  accruedLast30Days: number;
  driversWithEarnings: number;
  shiftsSettled: number;
  /** Zero platform-wide, and stays zero until something creates payout records. */
  totalPaidOut: number;
  payoutsRecorded: number;
  outstandingToDrivers: number;
}

export function fetchInvoices(status?: string, signal?: AbortSignal): Promise<AdminInvoice[]> {
  return apiGet(`${BASE}/invoices`, { status }, signal);
}

export function markInvoicePaid(invoiceId: string, reference: string): Promise<AdminInvoice> {
  return apiJson(`${BASE}/invoices/${invoiceId}/mark-paid`, 'POST', { reference });
}

export function backfillInvoices(): Promise<{ issued: number }> {
  return apiJson(`${BASE}/invoices/backfill`, 'POST');
}

export function fetchEarningsSummary(signal?: AbortSignal): Promise<EarningsSummary> {
  return apiGet(`${BASE}/earnings/summary`, undefined, signal);
}

/**
 * What has been billed, collected and left owing.
 *
 * Overdue is the server's verdict, carried on the row — recomputing it here from the due date
 * would produce a second opinion, and the two would disagree at midnight.
 */
export function invoiceTotals(invoices: AdminInvoice[]): {
  billed: number; collected: number; outstanding: number; overdue: number; overdueCount: number;
} {
  let billed = 0, collected = 0, outstanding = 0, overdue = 0, overdueCount = 0;

  for (const invoice of invoices) {
    billed += invoice.amount;

    if (invoice.status === 'Paid') {
      collected += invoice.amount;
      continue;
    }

    outstanding += invoice.amount;

    if (invoice.status === 'Overdue') {
      overdue += invoice.amount;
      overdueCount += 1;
    }
  }

  return { billed, collected, outstanding, overdue, overdueCount };
}

// ---------------------------------------------------------------------------- pricing

export interface Pricing {
  ratePerTaxiPerSecondUsd: number;
  additionalRegionSurchargeUsd: number;
  validDurationsSeconds: number[];
  currency: string;
  /** False. Pricing is a constant in the API, and the page says so rather than offering a field. */
  editable: boolean;
  source: string;
}

export function fetchPricing(signal?: AbortSignal): Promise<Pricing> {
  return apiGet(`${BASE}/pricing`, undefined, signal);
}

// ---------------------------------------------------------------------------- reporting

export interface DeliverySummaryRow {
  campaignId: string;
  verifiedPlays: number;
  verifiedSeconds: number;
  pendingPlays: number;
  conflictPlays: number;
  screens: number;
  hours: number;
}

export interface TelemetryVolume {
  totalPings: number;
  pingsLast24h: number;
  pingsLast7d: number;
  shiftsRaw: number;
  shiftsCompacted: number;
  compactedTrackPoints: number;
  estimatedRawMegabytes: number;
  projectedYearlyGigabytes: number;
  oldestCaptureDate: string | null;
  newestCaptureDate: string | null;
}

export interface RollupResult {
  bucketsWritten: number;
  playbackEventsConsidered: number;
  verifiedPlays: number;
  verifiedSeconds: number;
  pendingPlays: number;
  conflictPlays: number;
}

export function fetchDeliverySummary(hours = 168, signal?: AbortSignal): Promise<DeliverySummaryRow[]> {
  return apiGet(`${BASE}/delivery/summary`, { hours }, signal);
}

export function fetchTelemetryVolume(signal?: AbortSignal): Promise<TelemetryVolume> {
  return apiGet(`${BASE}/telemetry/volume`, undefined, signal);
}

export function rebuildDeliveryRollup(hours = 48): Promise<RollupResult> {
  return apiJson(`${BASE}/delivery/rollup?hours=${hours}`, 'POST');
}

// ---------------------------------------------------------------------------- support

export interface SupportTicket {
  ticketId: string;
  type: string;
  status: string;
  message: string;
  driverId: string | null;
  driverName: string | null;
  taxiCompanyName: string | null;
  vehicleId: string | null;
  vehiclePlate: string | null;
  resolutionNotes: string | null;
  createdAtUtc: string;
  resolvedAtUtc: string | null;
}

export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export function fetchSupportTickets(
  status?: string, type?: string, signal?: AbortSignal,
): Promise<SupportTicket[]> {
  return apiGet(`${BASE}/support-tickets`, { status, type }, signal);
}

export function updateTicketStatus(
  ticketId: string, status: TicketStatus, notes?: string,
): Promise<SupportTicket> {
  return apiJson(`${BASE}/support-tickets/${ticketId}/status`, 'POST', { status, notes: notes ?? null });
}

/** Open and in-progress both still need somebody; resolved and closed do not. */
export function isOpen(ticket: SupportTicket): boolean {
  return ticket.status === 'Open' || ticket.status === 'InProgress';
}

// ---------------------------------------------------------------------------- staff accounts

export interface StaffUser {
  userId: string;
  userName: string;
  email: string | null;
  fullName: string;
  roles: string[];
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}

export interface RoleSummary {
  role: string;
  permissions: string[];
}

export function fetchUsers(page = 1, pageSize = 100, signal?: AbortSignal): Promise<Paged<StaffUser>> {
  return apiGet(`${BASE}/users`, { page, pageSize }, signal);
}

export interface NewStaffUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}

/**
 * Creates a staff account directly, with no review step — an administrator made it.
 *
 * The server refuses a caller who is not already a SuperAdmin from granting SuperAdmin, so the
 * form offers the role and lets the refusal come back rather than second-guessing the token: the
 * permission set in a browser is a copy made at sign-in, and the server's answer is the real one.
 */
export function createStaffUser(input: NewStaffUser): Promise<StaffUser> {
  return apiJson(`${BASE}/users`, 'POST', {
    email: input.email.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    password: input.password,
    roles: input.roles,
  });
}

export function fetchRoles(signal?: AbortSignal): Promise<RoleSummary[]> {
  return apiGet(`${BASE}/roles`, undefined, signal);
}

export function fetchPermissionCatalogue(signal?: AbortSignal): Promise<string[]> {
  return apiGet(`${BASE}/permissions`, undefined, signal);
}

export interface PasswordReset {
  userId: string;
  userName: string;
  temporaryPassword: string;
  /** Sessions killed by the reset. A reset that left the old token working would be no reset. */
  sessionsRevoked: number;
  resetAtUtc: string;
}

/**
 * Issues a temporary password and returns it exactly once.
 *
 * The server never stores it in readable form and never logs it, so the only copy is the one in
 * this response. The screen that shows it has to treat that as the last chance to read it.
 */
export function resetUserPassword(userId: string): Promise<PasswordReset> {
  return apiJson(`${BASE}/users/${userId}/reset-password`, 'POST');
}

/**
 * Replaces what a role may do, outright.
 *
 * Takes effect at each holder's next sign-in, because permissions are copied into the token then
 * rather than read per request. SuperAdmin is refused by the server — a SuperAdmin able to strip
 * SuperAdmin's own permissions can lock everybody out with one request.
 */
export function updateRolePermissions(role: string, permissions: string[]): Promise<RoleSummary> {
  return apiJson(`${BASE}/roles/${encodeURIComponent(role)}/permissions`, 'PUT', { permissions });
}

export function deactivateUser(userId: string, reason?: string): Promise<unknown> {
  return apiJson(`${BASE}/users/${userId}/deactivate`, 'POST', { reason: reason ?? null });
}

export function reactivateUser(userId: string): Promise<unknown> {
  return apiJson(`${BASE}/users/${userId}/reactivate`, 'POST');
}

// ---------------------------------------------------------------------------- presentation

/** Status colouring shared by every table in the console, so one word means one thing. */
export type Tone = 'live' | 'warn' | 'error' | 'neutral' | 'outline';

const STATUS_TONES: Record<string, Tone> = {
  Approved: 'live',
  Active: 'live',
  Online: 'live',
  Paid: 'live',
  PendingVerification: 'warn',
  PendingApproval: 'warn',
  Open: 'warn',
  InProgress: 'warn',
  Scheduled: 'warn',
  Rejected: 'error',
  Suspended: 'error',
  Overdue: 'error',
  Cancelled: 'neutral',
  Completed: 'neutral',
  Resolved: 'neutral',
  Closed: 'neutral',
  Draft: 'outline',
};

export function toneForStatus(status: string | null | undefined): Tone {
  if (!status) return 'neutral';
  return STATUS_TONES[status] ?? 'neutral';
}

/** "PendingVerification" is a database word. This is the one to put in front of a person. */
export function readableStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';

  const spaced = status.replace(/([a-z])([A-Z])/g, '$1 $2');

  return spaced === 'Pending Verification' || spaced === 'Pending Approval'
    ? 'Pending review'
    : spaced;
}
