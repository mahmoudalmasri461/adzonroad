import { apiDownload, apiGet } from './apiClient';

/**
 * Proof of delivery: what a campaign actually ran, and what the platform cannot yet stand behind.
 *
 * The types mirror the API deliberately closely. The server has already done the work of keeping
 * verified, pending and contradicted claims separate, and flattening them here into a single
 * "delivered" number would throw away the only thing that makes the report worth anything.
 */

export interface DeliveryCounts {
  total: number;
  verifiedPlays: number;
  verifiedSeconds: number;
  fullyVerifiedPlays: number;
  qualifiedPlays: number;
  pendingEvidencePlays: number;
  unverifiedPlays: number;
  rejectedPlays: number;
}

export interface QualificationCount {
  qualification: string;
  plays: number;
}

export interface DeliveryDayRow {
  day: string;
  verifiedPlays: number;
  verifiedSeconds: number;
  pendingEvidencePlays: number;
  notVerifiedPlays: number;
}

export interface DeliveryRegionRow {
  regionId: string | null;
  regionName: string;
  verifiedPlays: number;
  verifiedSeconds: number;
}

export interface DeliverySummary {
  campaignId: string;
  campaignName: string;
  fromUtc: string;
  toUtc: string;
  generatedAtUtc: string;
  hasEvidence: boolean;
  counts: DeliveryCounts;
  screenConfirmedPlays: number;
  deviceDeclaredPlays: number;
  qualifications: QualificationCount[];
  byDay: DeliveryDayRow[];
  byRegion: DeliveryRegionRow[];
  rollupAgrees: boolean;
  rollupVerifiedSeconds: number;
}

export interface PlaybackClaim {
  playbackEventId: number;
  startedAtUtc: string;
  endedAtUtc: string;
  actualDurationSeconds: number;
  expectedDurationSeconds: number | null;
  source: 'ScreenConfirmed' | 'DeviceDeclared';
  verificationStatus: VerificationStatus;
  qualifications: string[];
  screenSerial: string | null;
  vehiclePlate: string | null;
  hasStartBracket: boolean;
  hasEndBracket: boolean;
  startLat: number | null;
  startLng: number | null;
  startIsDerived: boolean;
  endLat: number | null;
  endLng: number | null;
  endIsDerived: boolean;
  averageAccuracyMeters: number | null;
  usableFixCount: number;
  receivedAtUtc: string;
  evaluatedAtUtc: string | null;
  evaluationCount: number;
}

export type VerificationStatus =
  | 'PendingVerification'
  | 'Verified'
  | 'VerifiedWithQualification'
  | 'Unverified'
  | 'Rejected';

export interface PagedClaims {
  items: PlaybackClaim[];
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface ReportableCampaign {
  campaignId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

const BASE = '/api/v1/reports';

export function fetchCampaigns(signal?: AbortSignal): Promise<ReportableCampaign[]> {
  return apiGet<ReportableCampaign[]>(`${BASE}/campaigns`, undefined, signal);
}

export function fetchDeliverySummary(
  campaignId: string,
  from: Date,
  to: Date,
  signal?: AbortSignal,
): Promise<DeliverySummary> {
  return apiGet<DeliverySummary>(
    `${BASE}/campaigns/${campaignId}/delivery`,
    { from: from.toISOString(), to: to.toISOString() },
    signal,
  );
}

export function fetchClaims(
  campaignId: string,
  from: Date,
  to: Date,
  options: { status?: string; page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<PagedClaims> {
  return apiGet<PagedClaims>(
    `${BASE}/campaigns/${campaignId}/claims`,
    {
      from: from.toISOString(),
      to: to.toISOString(),
      status: options.status,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 50,
    },
    signal,
  );
}

export function downloadProofOfDelivery(campaignId: string, from: Date, to: Date): Promise<void> {
  return apiDownload(`${BASE}/campaigns/${campaignId}/proof-of-delivery.csv`, {
    from: from.toISOString(),
    to: to.toISOString(),
  });
}

// ---------------------------------------------------------------------------- presentation

/**
 * How a claim should read on screen.
 *
 * `pending` is deliberately not `bad`. A claim awaiting evidence after an outage is the system
 * working as designed, and colouring it like a failure would train advertisers to read normal
 * offline operation as something going wrong.
 */
export type ClaimTone = 'good' | 'qualified' | 'pending' | 'bad';

export function toneFor(status: VerificationStatus): ClaimTone {
  switch (status) {
    case 'Verified':
      return 'good';
    case 'VerifiedWithQualification':
      return 'qualified';
    case 'PendingVerification':
      return 'pending';
    default:
      return 'bad';
  }
}

/** Plain-English status, since the enum names are the server's vocabulary rather than a reader's. */
export function describeStatus(status: VerificationStatus): string {
  switch (status) {
    case 'Verified':
      return 'Verified';
    case 'VerifiedWithQualification':
      return 'Verified, with notes';
    case 'PendingVerification':
      return 'Awaiting evidence';
    case 'Unverified':
      return 'Not verified';
    case 'Rejected':
      return 'Contradicted';
  }
}

/** Qualification flags spelled out. Unknown names pass through rather than disappearing. */
export function describeQualification(name: string): string {
  const known: Record<string, string> = {
    MissingStartBracket: 'No GPS fix before the advertisement started',
    MissingEndBracket: 'No GPS fix after it ended',
    PoorAccuracy: 'GPS accuracy below the usual standard',
    DeviceDeclaredSource: "Reported by the driver's phone, not screen hardware",
    ClockSkewSuspect: "The reporting device's clock was noticeably out",
    SparseCoverage: 'Few fixes inside the window',
    NoGpsEvidence: 'No GPS evidence available',
    DurationMismatch: 'Claimed duration differs from the creative',
    OverlappingClaim: 'Another claim overlaps this one on the same screen',
    InconsistentGps: 'The fixes contradict each other',
  };

  return known[name] ?? name;
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Share of claims that count as delivered.
 *
 * Zero of zero is 0%, not 100%. An empty window has delivered nothing, and the flattering reading
 * of an empty denominator is exactly the sort of thing this report exists not to do.
 */
export function verifiedShare(counts: DeliveryCounts): number {
  if (counts.total === 0) return 0;
  return counts.verifiedPlays / counts.total;
}

/**
 * The sentence at the top of the report.
 *
 * Says what is settled and, when anything is outstanding, says that too. The pending case is the
 * one that matters: a figure quoted while evidence is still arriving is provisional, and the
 * report should be the thing that says so rather than the thing that hides it.
 */
export function summarise(summary: DeliverySummary): string {
  const { counts } = summary;

  if (counts.total === 0) return 'No playback has been claimed for this campaign in this period.';

  const delivered = `${counts.verifiedPlays} of ${counts.total} claimed plays are verified `
    + `(${formatSeconds(counts.verifiedSeconds)} of confirmed screen time)`;

  const outstanding: string[] = [];
  if (counts.pendingEvidencePlays > 0)
    outstanding.push(`${counts.pendingEvidencePlays} still awaiting evidence`);
  if (counts.unverifiedPlays > 0)
    outstanding.push(`${counts.unverifiedPlays} could not be verified`);
  if (counts.rejectedPlays > 0)
    outstanding.push(`${counts.rejectedPlays} contradicted by the evidence`);

  return outstanding.length === 0
    ? `${delivered}. Nothing is outstanding.`
    : `${delivered}. Also in this period: ${outstanding.join(', ')}.`;
}
