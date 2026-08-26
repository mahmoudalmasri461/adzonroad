import { describe, expect, it } from 'vitest';
import { deriveAlerts } from './advertiserAlerts';
import { aggregateDelivery, type PortfolioDelivery } from './advertiserAnalytics';
import type { CampaignSummary } from './campaigns';
import type { DeliveryCounts, DeliverySummary } from './deliveryReport';
import type { Invoice } from './billing';

const TODAY = new Date('2026-08-20T09:00:00Z');

function counts(overrides: Partial<DeliveryCounts> = {}): DeliveryCounts {
  return {
    total: 0,
    verifiedPlays: 0,
    verifiedSeconds: 0,
    fullyVerifiedPlays: 0,
    qualifiedPlays: 0,
    pendingEvidencePlays: 0,
    unverifiedPlays: 0,
    rejectedPlays: 0,
    ...overrides,
  };
}

function summary(campaignId: string, overrides: Partial<DeliverySummary> = {}): DeliverySummary {
  return {
    campaignId,
    campaignName: 'Campaign',
    fromUtc: '2026-07-21T00:00:00Z',
    toUtc: '2026-08-20T00:00:00Z',
    generatedAtUtc: '2026-08-20T09:00:00Z',
    hasEvidence: true,
    counts: counts(),
    screenConfirmedPlays: 0,
    deviceDeclaredPlays: 0,
    qualifications: [],
    byDay: [],
    byRegion: [],
    rollupAgrees: true,
    rollupVerifiedSeconds: 0,
    ...overrides,
  };
}

function campaign(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    campaignId: 'c1',
    name: 'Beirut Summer Push',
    status: 'Active',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    taxiCount: 10,
    creativeDurationSeconds: 15,
    regions: ['Beirut'],
    creativeCount: 1,
    price: 3000,
    createdAtUtc: '2026-07-30T09:00:00Z',
    ...overrides,
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    invoiceId: 'i1',
    number: 'INV-2026-0148',
    description: 'Beirut Summer Push',
    campaignId: 'c1',
    amount: 3000,
    currency: 'USD',
    status: 'Open',
    dueDate: '2026-08-25',
    daysUntilDue: 5,
    issuedAtUtc: '2026-08-01T09:00:00Z',
    paidAtUtc: null,
    paymentReference: null,
    ...overrides,
  };
}

function portfolioOf(
  campaigns: CampaignSummary[],
  summaries: DeliverySummary[],
): PortfolioDelivery {
  return aggregateDelivery(campaigns, summaries);
}

describe('deriving advertiser alerts', () => {
  it('says nothing when nothing is wrong', () => {
    const portfolio = portfolioOf(
      [campaign()],
      [summary('c1', { counts: counts({ total: 100, verifiedPlays: 100, verifiedSeconds: 1500 }) })],
    );

    expect(deriveAlerts(portfolio, [], TODAY)).toEqual([]);
  });

  it('raises a rejected campaign as critical', () => {
    const portfolio = portfolioOf([campaign({ status: 'Rejected' })], []);

    const alerts = deriveAlerts(portfolio, [], TODAY);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('Beirut Summer Push');
  });

  it('flags a draft campaign with nothing to run', () => {
    const portfolio = portfolioOf([campaign({ status: 'Draft', creativeCount: 0 })], []);

    const alerts = deriveAlerts(portfolio, [], TODAY);

    expect(alerts.map((a) => a.id)).toEqual(['no-creative-c1']);
    expect(alerts[0].severity).toBe('warning');
  });

  it('flags a running campaign that has claimed nothing', () => {
    const portfolio = portfolioOf([campaign()], [summary('c1')]);

    const alerts = deriveAlerts(portfolio, [], TODAY);

    expect(alerts.map((a) => a.id)).toEqual(['silent-c1']);
  });

  // A campaign that is running and reporting is not "silent" just because a rounding of days
  // puts it near its end date; the two rules must not both fire for the same campaign.
  it('mentions a campaign about to end without also calling it silent', () => {
    const portfolio = portfolioOf(
      [campaign({ endDate: '2026-08-22' })],
      [summary('c1', { counts: counts({ total: 10, verifiedPlays: 10 }) })],
    );

    const alerts = deriveAlerts(portfolio, [], TODAY);

    expect(alerts.map((a) => a.id)).toEqual(['ending-c1']);
    expect(alerts[0].message).toContain('ends in 2 days');
  });

  it('does not mention a campaign ending well in the future', () => {
    const portfolio = portfolioOf(
      [campaign({ endDate: '2026-09-30' })],
      [summary('c1', { counts: counts({ total: 10, verifiedPlays: 10 }) })],
    );

    expect(deriveAlerts(portfolio, [], TODAY)).toEqual([]);
  });

  it('treats claims awaiting evidence as information, not as a fault', () => {
    const portfolio = portfolioOf(
      [campaign()],
      [summary('c1', { counts: counts({ total: 100, verifiedPlays: 80, pendingEvidencePlays: 20 }) })],
    );

    const pending = deriveAlerts(portfolio, [], TODAY).find((a) => a.id === 'pending-evidence');

    expect(pending?.severity).toBe('info');
  });

  it('treats claims the evidence contradicts as a warning', () => {
    const portfolio = portfolioOf(
      [campaign()],
      [summary('c1', { counts: counts({ total: 100, verifiedPlays: 80, rejectedPlays: 20 }) })],
    );

    const notVerified = deriveAlerts(portfolio, [], TODAY).find((a) => a.id === 'not-verified');

    expect(notVerified?.severity).toBe('warning');
    expect(notVerified?.message).toContain('20');
  });

  it('raises an overdue invoice as critical and counts the lateness in positive days', () => {
    const alerts = deriveAlerts(null, [invoice({ status: 'Overdue', daysUntilDue: -9 })], TODAY);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('9 days late');
  });

  it('mentions an invoice falling due soon but not one months away', () => {
    const soon = deriveAlerts(null, [invoice({ daysUntilDue: 3 })], TODAY);
    const distant = deriveAlerts(null, [invoice({ daysUntilDue: 40 })], TODAY);

    expect(soon.map((a) => a.id)).toEqual(['due-i1']);
    expect(distant).toEqual([]);
  });

  it('never mentions a paid invoice', () => {
    const alerts = deriveAlerts(null, [invoice({ status: 'Paid', daysUntilDue: -30 })], TODAY);

    expect(alerts).toEqual([]);
  });

  it('puts the most serious alert first', () => {
    const portfolio = portfolioOf(
      [campaign({ status: 'Rejected' })],
      [],
    );

    const alerts = deriveAlerts(portfolio, [invoice({ daysUntilDue: 2 })], TODAY);

    expect(alerts.map((a) => a.severity)).toEqual(['critical', 'info']);
  });

  it('still reports invoices when the delivery half could not be loaded', () => {
    const alerts = deriveAlerts(null, [invoice({ status: 'Overdue', daysUntilDue: -1 })], TODAY);

    expect(alerts.map((a) => a.id)).toEqual(['overdue-i1']);
  });
});
