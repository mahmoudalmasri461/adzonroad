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

export interface PortfolioDelivery {
  campaigns: CampaignSummary[];
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

  return {
    campaigns,
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

/** Campaigns an advertiser would consider live right now. */
export function liveCampaigns(campaigns: CampaignSummary[]): CampaignSummary[] {
  return campaigns.filter((c) => c.status === 'Active' || c.status === 'Scheduled');
}
