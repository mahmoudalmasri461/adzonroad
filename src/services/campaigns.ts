import { apiGet, apiJson, apiUpload } from './apiClient';

/**
 * Campaign creation and review.
 *
 * The wizard shows a price, but it never sends one. The server computes the figure from the same
 * constants at submission and stores that — a price in a request body is a number worth lying
 * about. Likewise there is no status field here: an advertiser submits and withdraws, and
 * everything else is a reviewer's decision.
 */

export type CampaignStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Scheduled'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export interface CampaignPrice {
  baseTotal: number;
  regionSurcharge: number;
  total: number;
  taxiCount: number;
  creativeDurationSeconds: number;
  regionCount: number;
  ratePerTaxiPerSecond: number;
}

export interface Creative {
  creativeId: string;
  name: string;
  type: 'Image' | 'Video';
  durationSeconds: number;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
}

export interface CampaignSummary {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  taxiCount: number;
  creativeDurationSeconds: number;
  regions: string[];
  creativeCount: number;
  price: number;
  createdAtUtc: string;
}

export interface CampaignDetail extends Omit<CampaignSummary, 'price' | 'creativeCount'> {
  dailyStartTime: string;
  dailyEndTime: string;
  creatives: Creative[];
  price: CampaignPrice;
  /** Empty when the campaign is ready to submit; otherwise every reason it is not. */
  problemsPreventingSubmission: string[];
  canEdit: boolean;
  reviewNotes: string | null;
  reviewedAtUtc: string | null;
}

export interface CampaignInput {
  name: string;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  taxiCount: number;
  creativeDurationSeconds: number;
  regions: string[];
}

const BASE = '/api/v1/campaigns';

export function fetchCampaigns(signal?: AbortSignal): Promise<CampaignSummary[]> {
  return apiGet<CampaignSummary[]>(BASE, undefined, signal);
}

export function fetchCampaign(campaignId: string, signal?: AbortSignal): Promise<CampaignDetail> {
  return apiGet<CampaignDetail>(`${BASE}/${campaignId}`, undefined, signal);
}

/**
 * Price for a set of choices, from the server.
 *
 * Deliberately not computed in the browser. A local copy of the rate card drifts from the one that
 * charges, and the advertiser sees a number nobody honours.
 */
export function fetchQuote(
  taxiCount: number,
  creativeDurationSeconds: number,
  regionCount: number,
  signal?: AbortSignal,
): Promise<CampaignPrice> {
  return apiJson<CampaignPrice>(`${BASE}/quote`, 'POST', {
    taxiCount,
    creativeDurationSeconds,
    regionCount,
  }, signal);
}

export function createCampaign(input: CampaignInput): Promise<CampaignDetail> {
  return apiJson<CampaignDetail>(BASE, 'POST', input);
}

export function updateCampaign(campaignId: string, input: CampaignInput): Promise<CampaignDetail> {
  return apiJson<CampaignDetail>(`${BASE}/${campaignId}`, 'PUT', input);
}

export function uploadCreative(
  campaignId: string,
  file: File,
  durationSeconds: number,
): Promise<Creative> {
  const form = new FormData();
  form.append('file', file);
  form.append('durationSeconds', String(durationSeconds));

  return apiUpload<Creative>(`${BASE}/${campaignId}/creatives`, form);
}

export function submitCampaign(campaignId: string): Promise<CampaignDetail> {
  return apiJson<CampaignDetail>(`${BASE}/${campaignId}/submit`, 'POST');
}

export function withdrawCampaign(campaignId: string): Promise<CampaignDetail> {
  return apiJson<CampaignDetail>(`${BASE}/${campaignId}/withdraw`, 'POST');
}

// ---------------------------------------------------------------------------- presentation

/** Durations the platform sells. Ten seconds is deliberately not among them. */
export const CREATIVE_DURATIONS = [15, 30, 45, 60, 75, 90] as const;

/** Smallest campaign sold, matching the server's own floor. */
export const MINIMUM_TAXIS = 5;

export function describeStatus(status: CampaignStatus): string {
  switch (status) {
    case 'PendingApproval':
      return 'Awaiting review';
    case 'Scheduled':
      return 'Approved, not yet running';
    case 'Rejected':
      return 'Needs changes';
    default:
      return status;
  }
}

/**
 * Whether a campaign is still the advertiser's to change.
 *
 * Mirrors the server, which refuses edits outside Draft. Shown so the UI does not offer an action
 * that will be refused — the refusal is the server's job, and this is only about not wasting
 * someone's time.
 */
export function isEditable(status: CampaignStatus): boolean {
  return status === 'Draft';
}

/** `HH:mm` from the server's `HH:mm:ss`, and back. TimeOnly serialises with seconds. */
export function toTimeInput(value: string): string {
  return value.slice(0, 5);
}

export function toTimeOnly(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}
