import { apiBlob, apiGet } from './apiClient';
import type { CampaignStatus } from './campaigns';

/**
 * The advertiser's creative library, across every campaign.
 *
 * A creative has no life of its own — it belongs to a campaign, is uploaded through that campaign,
 * and inherits its status. There is no separate "creative approval" anywhere in the platform, so
 * this module reports the owning campaign's status rather than inventing one.
 */

export interface CreativeListItem {
  creativeId: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: CampaignStatus | '';
  name: string;
  type: 'Image' | 'Video';
  durationSeconds: number;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
  /** Only playback the GPS evidence supports — the same rule the delivery report counts by. */
  verifiedPlays: number;
  totalClaims: number;
  /** Null when no claim carried an expected duration, which is normal until screens report one. */
  averageCompletion: number | null;
  completionSampleSize: number;
}

export function fetchCreatives(campaignId?: string, signal?: AbortSignal): Promise<CreativeListItem[]> {
  return apiGet<CreativeListItem[]>('/api/v1/creatives', campaignId ? { campaignId } : undefined, signal);
}

/**
 * The creative's bytes, as an object URL for previewing.
 *
 * The caller must revoke the returned URL when the preview goes away; see `useCreativePreview`.
 */
export async function fetchCreativePreview(creativeId: string, signal?: AbortSignal): Promise<string> {
  const blob = await apiBlob(`/api/v1/creatives/${creativeId}/content`, signal);

  return URL.createObjectURL(blob);
}

// ---------------------------------------------------------------------------- presentation

/**
 * Completion as a percentage, or null when there is nothing to compute it from.
 *
 * Returning null rather than 0 or 100 matters: a creative nobody has measured has an unknown
 * completion rate, and both of the tidy defaults are claims the platform cannot support.
 */
export function completionPercent(creative: CreativeListItem): number | null {
  return creative.averageCompletion === null
    ? null
    : Math.round(creative.averageCompletion * 100);
}

/**
 * Why a completion figure should or should not be trusted.
 *
 * A rate computed from three plays is not a rate, and a reader shown "94%" with no sample size
 * will treat it as one.
 */
export function describeCompletion(creative: CreativeListItem): string {
  const percent = completionPercent(creative);

  if (percent === null) {
    return creative.totalClaims === 0
      ? 'Not played yet'
      : 'No screen reported an expected duration';
  }

  return `${percent}% average over ${creative.completionSampleSize} `
    + `${creative.completionSampleSize === 1 ? 'play' : 'plays'}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;

  const mb = kb / 1024;
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** Campaigns that can still take a creative. Anything past Draft is locked to what a reviewer saw. */
export function canAcceptCreatives(status: CampaignStatus): boolean {
  return status === 'Draft';
}
