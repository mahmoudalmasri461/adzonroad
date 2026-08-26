import type { Invoice } from './billing';
import type { CampaignDelivery, PortfolioDelivery } from './advertiserAnalytics';

/**
 * What actually needs the advertiser's attention.
 *
 * Every alert here is derived from data the portal already holds — a campaign's status, a claim
 * the evidence could not support, an invoice past its due date. Nothing is generated on a
 * schedule and nothing is stored: there is no notifications table in the platform, and inventing
 * one in the browser is how the fixture list came to announce "Summer Launch is 8% ahead of
 * schedule" to accounts that had never run a campaign.
 *
 * The derivation is pure and tested. An alert that fires when nothing is wrong trains people to
 * ignore the whole list, so each rule below has to be defensible on its own.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AdvertiserAlert {
  id: string;
  message: string;
  /** The line under the message: what it means, or what to do about it. */
  detail: string;
  severity: AlertSeverity;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/** Campaigns ending within this many days are worth mentioning before they quietly finish. */
const ENDING_SOON_DAYS = 3;

/** Invoices falling due within this many days are worth mentioning before they are late. */
const DUE_SOON_DAYS = 7;

export function deriveAlerts(
  portfolio: PortfolioDelivery | null,
  invoices: Invoice[],
  today = new Date(),
): AdvertiserAlert[] {
  const alerts: AdvertiserAlert[] = [];

  if (portfolio) {
    alerts.push(...campaignAlerts(portfolio.byCampaign, today));
    alerts.push(...evidenceAlerts(portfolio));
  }

  alerts.push(...invoiceAlerts(invoices));

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function campaignAlerts(rows: CampaignDelivery[], today: Date): AdvertiserAlert[] {
  const alerts: AdvertiserAlert[] = [];

  for (const row of rows) {
    const { campaign } = row;

    if (campaign.status === 'Rejected') {
      alerts.push({
        id: `rejected-${campaign.campaignId}`,
        message: `"${campaign.name}" was not approved`,
        detail: 'Open the campaign to see the reviewer\'s notes, then resubmit.',
        severity: 'critical',
      });
      continue;
    }

    if (campaign.status === 'Draft' && campaign.creativeCount === 0) {
      alerts.push({
        id: `no-creative-${campaign.campaignId}`,
        message: `"${campaign.name}" has no creative`,
        detail: 'A campaign cannot be submitted for review until something has been uploaded to run.',
        severity: 'warning',
      });
      continue;
    }

    // A campaign the platform says is running, that has claimed nothing at all. Either no screen
    // is carrying it or nothing is reporting — both are worth knowing about before the window
    // closes and the delivery cannot be recovered.
    if (campaign.status === 'Active' && row.totalClaims === 0) {
      alerts.push({
        id: `silent-${campaign.campaignId}`,
        message: `"${campaign.name}" is running but has reported no delivery`,
        detail: 'No playback has been claimed for this campaign in the reporting window.',
        severity: 'warning',
      });
      continue;
    }

    const daysLeft = daysUntil(campaign.endDate, today);
    if (campaign.status === 'Active' && daysLeft !== null && daysLeft >= 0 && daysLeft <= ENDING_SOON_DAYS) {
      alerts.push({
        id: `ending-${campaign.campaignId}`,
        message: `"${campaign.name}" ${daysLeft === 0 ? 'ends today' : `ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}`,
        detail: 'Download the proof of delivery once it finishes, or book a follow-on campaign.',
        severity: 'info',
      });
    }
  }

  return alerts;
}

function evidenceAlerts(portfolio: PortfolioDelivery): AdvertiserAlert[] {
  const alerts: AdvertiserAlert[] = [];

  if (portfolio.notVerifiedPlays > 0) {
    alerts.push({
      id: 'not-verified',
      message: `${portfolio.notVerifiedPlays.toLocaleString()} claimed plays could not be verified`,
      detail: 'These are not counted toward your delivery and are not billed.',
      severity: 'warning',
    });
  }

  // Deliberately info, not warning. Claims waiting on evidence after an outage are the offline
  // design working; colouring them as a fault would teach advertisers to read normal operation
  // as something going wrong.
  if (portfolio.pendingEvidencePlays > 0) {
    alerts.push({
      id: 'pending-evidence',
      message: `${portfolio.pendingEvidencePlays.toLocaleString()} plays are awaiting evidence`,
      detail: 'Normal after a screen has been offline. They are re-checked automatically once it syncs.',
      severity: 'info',
    });
  }

  if (portfolio.anyRollupStale) {
    alerts.push({
      id: 'rollup-stale',
      message: 'Some totals are still catching up',
      detail: 'The figures on this page are computed from the underlying claims and are the ones to rely on.',
      severity: 'info',
    });
  }

  return alerts;
}

function invoiceAlerts(invoices: Invoice[]): AdvertiserAlert[] {
  const alerts: AdvertiserAlert[] = [];

  for (const invoice of invoices) {
    if (invoice.status === 'Overdue') {
      const late = Math.abs(invoice.daysUntilDue);
      alerts.push({
        id: `overdue-${invoice.invoiceId}`,
        message: `Invoice ${invoice.number} is ${late} day${late === 1 ? '' : 's'} late`,
        detail: 'Invoices are settled by bank transfer — contact support for the details.',
        severity: 'critical',
      });
      continue;
    }

    if (invoice.status === 'Open' && invoice.daysUntilDue >= 0 && invoice.daysUntilDue <= DUE_SOON_DAYS) {
      alerts.push({
        id: `due-${invoice.invoiceId}`,
        message: `Invoice ${invoice.number} is due ${invoice.daysUntilDue === 0 ? 'today' : `in ${invoice.daysUntilDue} days`}`,
        detail: 'Settled by bank transfer. There is no online payment on the platform.',
        severity: 'info',
      });
    }
  }

  return alerts;
}

/** Whole days from today to a `YYYY-MM-DD`, in UTC, or null if it will not parse. */
function daysUntil(isoDate: string, today: Date): number | null {
  const target = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target.getTime() - startOfToday) / 86_400_000);
}
