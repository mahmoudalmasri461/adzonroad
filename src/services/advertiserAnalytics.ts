import { fetchCampaigns, type CampaignSummary } from './campaigns';
import { fetchDeliverySummary, type DeliverySummary } from './deliveryReport';

/**
 * Delivery across everything an advertiser is running.
 *
 * The report endpoint answers per campaign, so a portfolio view is the sum of several answers.
 * The summing is a pure function below, separate from the fetching, because the arithmetic is
 * where an error would be silent and expensive — a total that quietly disagrees with the
 * per-campaign reports is worse than no total.
 *
 * Only verified delivery is added up. Pending and contradicted claims are carried alongside
 * rather than folded in, so the headline can never overstate what was delivered.
 */

export interface DeliveryPoint {
  day: string;
  verifiedPlays: number;
  verifiedSeconds: number;
}

export interface RegionTotal {
  regionName: string;
  verifiedPlays: number;
  verifiedSeconds: number;
}

/**
 * One campaign's delivery, kept beside the totals rather than dissolved into them.
 *
 * The portfolio view needs both: a headline that adds everything up, and rows that say which
 * campaign contributed what. `summary` is null when the report could not be read, which is not
 * the same as a campaign that delivered nothing — the two are shown differently.
 */
export interface CampaignDelivery {
  campaign: CampaignSummary;
  summary: DeliverySummary | null;
  verifiedPlays: number;
  verifiedSeconds: number;
  pendingEvidencePlays: number;
  totalClaims: number;
  /** Share of this campaign's claims backed by evidence, 0-1. Zero of zero is 0, never 1. */
  verifiedShare: number;
}

export interface PortfolioDelivery {
  campaigns: CampaignSummary[];
  /** Per-campaign rows, in the order the API listed the campaigns. */
  byCampaign: CampaignDelivery[];
  /** Campaigns the platform could report on. May be fewer than `campaigns` if some had no data. */
  reported: number;

  verifiedPlays: number;
  verifiedSeconds: number;
  pendingEvidencePlays: number;
  notVerifiedPlays: number;
  totalClaims: number;

  screenConfirmedPlays: number;
  deviceDeclaredPlays: number;

  byDay: DeliveryPoint[];
  byRegion: RegionTotal[];
  qualifications: { qualification: string; plays: number }[];

  /** True when any campaign's rollup disagreed with its claims, so the reader can discount totals. */
  anyRollupStale: boolean;
}

/**
 * Sums a set of per-campaign reports into one portfolio view.
 *
 * Days are unioned and sorted, so a chart shows a continuous run rather than one campaign's
 * calendar. Regions are keyed by name, since two campaigns naming the same region must add
 * together rather than appear twice.
 *
 * Reports are matched to campaigns by id rather than by position, so a campaign whose report
 * failed cannot silently take the delivery figures of the next one along.
 */
export function aggregateDelivery(
  campaigns: CampaignSummary[],
  summaries: DeliverySummary[],
): PortfolioDelivery {
  const byDay = new Map<string, DeliveryPoint>();
  const byRegion = new Map<string, RegionTotal>();
  const qualifications = new Map<string, number>();

  let verifiedPlays = 0;
  let verifiedSeconds = 0;
  let pendingEvidencePlays = 0;
  let notVerifiedPlays = 0;
  let totalClaims = 0;
  let screenConfirmedPlays = 0;
  let deviceDeclaredPlays = 0;
  let anyRollupStale = false;

  for (const summary of summaries) {
    verifiedPlays += summary.counts.verifiedPlays;
    verifiedSeconds += summary.counts.verifiedSeconds;
    pendingEvidencePlays += summary.counts.pendingEvidencePlays;
    notVerifiedPlays += summary.counts.unverifiedPlays + summary.counts.rejectedPlays;
    totalClaims += summary.counts.total;
    screenConfirmedPlays += summary.screenConfirmedPlays;
    deviceDeclaredPlays += summary.deviceDeclaredPlays;

    if (!summary.rollupAgrees) anyRollupStale = true;

    for (const day of summary.byDay) {
      const existing = byDay.get(day.day) ?? { day: day.day, verifiedPlays: 0, verifiedSeconds: 0 };
      existing.verifiedPlays += day.verifiedPlays;
      existing.verifiedSeconds += day.verifiedSeconds;
      byDay.set(day.day, existing);
    }

    for (const region of summary.byRegion) {
      const existing = byRegion.get(region.regionName)
        ?? { regionName: region.regionName, verifiedPlays: 0, verifiedSeconds: 0 };
      existing.verifiedPlays += region.verifiedPlays;
      existing.verifiedSeconds += region.verifiedSeconds;
      byRegion.set(region.regionName, existing);
    }

    for (const q of summary.qualifications) {
      qualifications.set(q.qualification, (qualifications.get(q.qualification) ?? 0) + q.plays);
    }
  }

  const byId = new Map(summaries.map((s) => [s.campaignId, s]));

  return {
    campaigns,
    byCampaign: campaigns.map((campaign) => describeCampaign(campaign, byId.get(campaign.campaignId) ?? null)),
    reported: summaries.length,
    verifiedPlays,
    verifiedSeconds,
    pendingEvidencePlays,
    notVerifiedPlays,
    totalClaims,
    screenConfirmedPlays,
    deviceDeclaredPlays,
    byDay: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
    byRegion: [...byRegion.values()].sort((a, b) => b.verifiedSeconds - a.verifiedSeconds),
    qualifications: [...qualifications.entries()]
      .map(([qualification, plays]) => ({ qualification, plays }))
      .sort((a, b) => b.plays - a.plays),
    anyRollupStale,
  };
}

/**
 * One campaign's row.
 *
 * A campaign with no readable report reads as zero delivery *and* zero claims, which the UI
 * renders as "nothing reported" rather than as nought per cent delivered — the difference between
 * "we have no evidence" and "the evidence says nothing ran" is the whole point of the report.
 */
function describeCampaign(
  campaign: CampaignSummary,
  summary: DeliverySummary | null,
): CampaignDelivery {
  const totalClaims = summary?.counts.total ?? 0;
  const verifiedPlays = summary?.counts.verifiedPlays ?? 0;

  return {
    campaign,
    summary,
    verifiedPlays,
    verifiedSeconds: summary?.counts.verifiedSeconds ?? 0,
    pendingEvidencePlays: summary?.counts.pendingEvidencePlays ?? 0,
    totalClaims,
    verifiedShare: totalClaims === 0 ? 0 : verifiedPlays / totalClaims,
  };
}

/**
 * Loads every campaign and its delivery over a window.
 *
 * A campaign whose report fails is skipped rather than failing the page: one unreadable campaign
 * should not blank the other nine. `reported` says how many actually contributed, so a total can
 * be read with the right amount of confidence.
 */
export async function loadPortfolio(days = 30, signal?: AbortSignal): Promise<PortfolioDelivery> {
  const campaigns = await fetchCampaigns(signal);

  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const settled = await Promise.all(
    campaigns.map((c): Promise<DeliverySummary | null> =>
      fetchDeliverySummary(c.campaignId, from, to, signal).catch(() => null)),
  );

  return aggregateDelivery(campaigns, settled.filter((s): s is DeliverySummary => s !== null));
}

// ---------------------------------------------------------------------------- presentation

/** Share of claims that count as delivered. Zero of zero is 0%, never a flattering 100%. */
export function verifiedShare(portfolio: PortfolioDelivery): number {
  return portfolio.totalClaims === 0 ? 0 : portfolio.verifiedPlays / portfolio.totalClaims;
}

export function formatScreenTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Short day label for a chart axis, from the API's `YYYY-MM-DD`. */
export function shortDay(day: string): string {
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? day
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Where a campaign is in its own schedule, in words.
 *
 * Computed from the dates the campaign actually carries rather than stored as a label, so it
 * cannot go stale the way "Ends in 6 days" did when it was a fixture. Days are counted in UTC to
 * match the delivery reports; a Beirut reader can be a few hours out at a boundary, which is the
 * same simplification the rest of the platform makes and better than two figures disagreeing.
 */
export function describeSchedule(campaign: CampaignSummary, today = new Date()): string {
  if (campaign.status === 'Draft') return 'Not submitted';
  if (campaign.status === 'PendingApproval') return 'Awaiting review';
  if (campaign.status === 'Rejected') return 'Needs changes';
  if (campaign.status === 'Cancelled') return 'Cancelled';
  if (campaign.status === 'Completed') return 'Completed';

  const start = daysBetween(today, campaign.startDate);
  const end = daysBetween(today, campaign.endDate);

  if (start !== null && start > 0) return start === 1 ? 'Starts tomorrow' : `Starts in ${start} days`;
  if (end === null) return campaign.status === 'Paused' ? 'Paused' : 'Running';
  if (end < 0) return 'Ended';
  if (end === 0) return 'Ends today';
  if (end === 1) return 'Ends tomorrow';

  return `Ends in ${end} days`;
}

/** Whole days from now to a `YYYY-MM-DD`, or null if the date will not parse. */
function daysBetween(from: Date, isoDate: string): number | null {
  const target = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.round((target.getTime() - startOfToday) / 86_400_000);
}

/** Campaigns an advertiser would consider live right now. */
export function liveCampaigns(campaigns: CampaignSummary[]): CampaignSummary[] {
  return campaigns.filter((c) => c.status === 'Active' || c.status === 'Scheduled');
}
