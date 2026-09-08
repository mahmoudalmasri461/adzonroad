import type { AdminCampaign, Assignment, DeliverySummaryRow } from './admin';

/**
 * What the console can honestly say about a campaign's delivery.
 *
 * There is no ad-play target on a campaign. The entity stores a taxi count, a creative duration,
 * a budget and a date range — the product is sold as vehicles for a period, not as a quantity of
 * plays — so "72,000 of 100,000 ad plays" has no denominator behind it and no progress bar is
 * drawn. What exists is what was recorded, which is reported as a count.
 *
 * The one honest ratio is time: a campaign is a fixed window, and how far through it we are is
 * arithmetic on two dates. That is the figure an operator can act on, because a campaign most of
 * the way through its period with nothing recorded is the one worth opening.
 */

export type CampaignRow = {
  campaign: AdminCampaign;
  /** Plays the platform recorded and accepted. Absent when delivery data has not loaded. */
  recordedPlays: number;
  /** Recorded but not yet accepted, and recorded with a conflict — both are review work. */
  pendingPlays: number;
  conflictPlays: number;
  /** Screens currently carrying this campaign, counted from live assignments. */
  screensAssigned: number;
  /** 0–1 through the campaign's own date range, or null when the dates cannot be read. */
  scheduleProgress: number | null;
};

export function scheduleProgress(
  startDate: string,
  endDate: string,
  now: number = Date.now(),
): number | null {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

export function buildCampaignRows(
  campaigns: readonly AdminCampaign[],
  delivery: readonly DeliverySummaryRow[],
  assignments: readonly Assignment[],
  now: number = Date.now(),
): CampaignRow[] {
  const deliveryById = new Map(delivery.map((d) => [d.campaignId, d]));

  const screensById = new Map<string, number>();
  for (const a of assignments) {
    screensById.set(a.campaignId, (screensById.get(a.campaignId) ?? 0) + 1);
  }

  return campaigns.map((campaign) => {
    const d = deliveryById.get(campaign.campaignId);
    return {
      campaign,
      recordedPlays: d?.verifiedPlays ?? 0,
      pendingPlays: d?.pendingPlays ?? 0,
      conflictPlays: d?.conflictPlays ?? 0,
      screensAssigned: screensById.get(campaign.campaignId) ?? 0,
      scheduleProgress: scheduleProgress(campaign.startDate, campaign.endDate, now),
    };
  });
}

/**
 * The status filters, mapped to the values the API actually stores.
 *
 * `CampaignStatus` on the server is Draft, PendingApproval, Scheduled, Active, Paused, Completed,
 * Cancelled and Rejected. The tabs cover the ones an operator sorts by; everything else stays
 * reachable under "all" rather than being hidden behind a tab nobody thinks to press.
 */
export type CampaignFilter = 'all' | 'pending' | 'active' | 'completed' | 'rejected';

const FILTER_STATUSES: Record<Exclude<CampaignFilter, 'all'>, readonly string[]> = {
  pending: ['PendingApproval'],
  active: ['Active', 'Scheduled'],
  completed: ['Completed'],
  rejected: ['Rejected', 'Cancelled'],
};

export function filterCampaignRows(
  rows: readonly CampaignRow[],
  filter: CampaignFilter,
  search: string,
): CampaignRow[] {
  const needle = search.trim().toLowerCase();

  return rows.filter((row) => {
    if (filter !== 'all' && !FILTER_STATUSES[filter].includes(row.campaign.status)) return false;
    if (!needle) return true;

    return [row.campaign.name, row.campaign.advertiser, row.campaign.status, ...row.campaign.regions].some(
      (field) => field?.toLowerCase().includes(needle),
    );
  });
}

/** Counts for the filter tabs, so a tab can show how much is behind it. */
export function countByFilter(rows: readonly CampaignRow[]): Record<CampaignFilter, number> {
  return {
    all: rows.length,
    pending: rows.filter((r) => FILTER_STATUSES.pending.includes(r.campaign.status)).length,
    active: rows.filter((r) => FILTER_STATUSES.active.includes(r.campaign.status)).length,
    completed: rows.filter((r) => FILTER_STATUSES.completed.includes(r.campaign.status)).length,
    rejected: rows.filter((r) => FILTER_STATUSES.rejected.includes(r.campaign.status)).length,
  };
}

/**
 * Whether a campaign is worth an operator's attention right now.
 *
 * Every reason is something the data supports: a campaign that cannot run because it has no
 * creative, one that is live with no screen carrying it, one well into its period with nothing
 * recorded, and playback that arrived in doubt. None of it is a health score.
 */
export type CampaignConcern = 'noCreative' | 'noScreens' | 'nothingRecorded' | 'playbackInDoubt';

export function concernsFor(row: CampaignRow): CampaignConcern[] {
  const concerns: CampaignConcern[] = [];
  const live = row.campaign.status === 'Active';

  if (row.campaign.creativeCount === 0) concerns.push('noCreative');
  if (live && row.screensAssigned === 0) concerns.push('noScreens');
  if (live && row.scheduleProgress !== null && row.scheduleProgress > 0.25 && row.recordedPlays === 0) {
    concerns.push('nothingRecorded');
  }
  if (row.conflictPlays > 0) concerns.push('playbackInDoubt');

  return concerns;
}
