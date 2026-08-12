import { describe, expect, it } from 'vitest';
import {
  aggregateDelivery,
  formatScreenTime,
  liveCampaigns,
  shortDay,
  verifiedShare,
} from './advertiserAnalytics';
import type { CampaignSummary } from './campaigns';
import type { DeliveryCounts, DeliveryDayRow, DeliverySummary } from './deliveryReport';

/** A report's day row. Pending and not-verified are carried by the API but not charted. */
function day(d: string, verifiedPlays: number, verifiedSeconds: number): DeliveryDayRow {
  return { day: d, verifiedPlays, verifiedSeconds, pendingEvidencePlays: 0, notVerifiedPlays: 0 };
}

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

function summary(overrides: Partial<DeliverySummary> = {}): DeliverySummary {
  return {
    campaignId: 'c1',
    campaignName: 'Campaign',
    fromUtc: '2026-07-13T00:00:00Z',
    toUtc: '2026-08-12T00:00:00Z',
    generatedAtUtc: '2026-08-12T09:00:00Z',
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
    name: 'Campaign',
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

describe('aggregating delivery across campaigns', () => {
  it('sums the headline counts', () => {
    const portfolio = aggregateDelivery(
      [campaign(), campaign({ campaignId: 'c2' })],
      [
        summary({ counts: counts({ total: 10, verifiedPlays: 7, verifiedSeconds: 105 }) }),
        summary({ campaignId: 'c2', counts: counts({ total: 4, verifiedPlays: 3, verifiedSeconds: 45 }) }),
      ],
    );

    expect(portfolio.verifiedPlays).toBe(10);
    expect(portfolio.verifiedSeconds).toBe(150);
    expect(portfolio.totalClaims).toBe(14);
    expect(portfolio.reported).toBe(2);
  });

  it('unions days rather than concatenating each campaign calendar', () => {
    // Two campaigns overlapping on the 2nd. A chart must show three days, with the 2nd added
    // together — not five points, and not one campaign's day silently replacing the other's.
    const portfolio = aggregateDelivery(
      [],
      [
        summary({ byDay: [day('2026-08-01', 2, 30), day('2026-08-02', 3, 45)] }),
        summary({ byDay: [day('2026-08-02', 1, 15), day('2026-08-03', 4, 60)] }),
      ],
    );

    expect(portfolio.byDay).toEqual([
      { day: '2026-08-01', verifiedPlays: 2, verifiedSeconds: 30 },
      { day: '2026-08-02', verifiedPlays: 4, verifiedSeconds: 60 },
      { day: '2026-08-03', verifiedPlays: 4, verifiedSeconds: 60 },
    ]);
  });

  it('sorts days ascending even when the reports arrive out of order', () => {
    const portfolio = aggregateDelivery(
      [],
      [
        summary({ byDay: [day('2026-08-09', 1, 15)] }),
        summary({ byDay: [day('2026-08-02', 1, 15)] }),
      ],
    );

    expect(portfolio.byDay.map((d) => d.day)).toEqual(['2026-08-02', '2026-08-09']);
  });

  it('keys regions by name so the same region from two campaigns adds together', () => {
    // Region ids differ per campaign row in the report; the name is what the reader sees, and
    // "Beirut" appearing twice in a bar chart is the bug this guards.
    const portfolio = aggregateDelivery(
      [],
      [
        summary({
          byRegion: [{ regionId: 'r-a', regionName: 'Beirut', verifiedPlays: 2, verifiedSeconds: 30 }],
        }),
        summary({
          byRegion: [
            { regionId: 'r-b', regionName: 'Beirut', verifiedPlays: 3, verifiedSeconds: 45 },
            { regionId: 'r-c', regionName: 'Jounieh', verifiedPlays: 1, verifiedSeconds: 15 },
          ],
        }),
      ],
    );

    expect(portfolio.byRegion).toEqual([
      { regionName: 'Beirut', verifiedPlays: 5, verifiedSeconds: 75 },
      { regionName: 'Jounieh', verifiedPlays: 1, verifiedSeconds: 15 },
    ]);
  });

  it('carries doubt alongside delivery instead of folding it in', () => {
    const portfolio = aggregateDelivery(
      [],
      [
        summary({
          counts: counts({
            total: 10,
            verifiedPlays: 6,
            verifiedSeconds: 90,
            pendingEvidencePlays: 2,
            unverifiedPlays: 1,
            rejectedPlays: 1,
          }),
        }),
      ],
    );

    expect(portfolio.verifiedPlays).toBe(6);
    expect(portfolio.pendingEvidencePlays).toBe(2);
    // Unverified and rejected are both "not delivered", but neither is counted as verified.
    expect(portfolio.notVerifiedPlays).toBe(2);
  });

  it('flags the portfolio when any single rollup disagreed with its claims', () => {
    const agreeing = aggregateDelivery([], [summary(), summary()]);
    const oneStale = aggregateDelivery([], [summary(), summary({ rollupAgrees: false })]);

    expect(agreeing.anyRollupStale).toBe(false);
    expect(oneStale.anyRollupStale).toBe(true);
  });

  it('merges qualification tallies and orders them by weight', () => {
    const portfolio = aggregateDelivery(
      [],
      [
        summary({ qualifications: [{ qualification: 'CoarseGps', plays: 2 }] }),
        summary({
          qualifications: [
            { qualification: 'CoarseGps', plays: 3 },
            { qualification: 'DeviceDeclared', plays: 9 },
          ],
        }),
      ],
    );

    expect(portfolio.qualifications).toEqual([
      { qualification: 'DeviceDeclared', plays: 9 },
      { qualification: 'CoarseGps', plays: 5 },
    ]);
  });

  it('reports an empty portfolio as empty rather than failing', () => {
    const portfolio = aggregateDelivery([], []);

    expect(portfolio.reported).toBe(0);
    expect(portfolio.byDay).toEqual([]);
    expect(portfolio.byRegion).toEqual([]);
    expect(verifiedShare(portfolio)).toBe(0);
  });
});

describe('verified share of a portfolio', () => {
  it('is the verified fraction of every claim', () => {
    const portfolio = aggregateDelivery(
      [],
      [summary({ counts: counts({ total: 10, verifiedPlays: 7 }) })],
    );

    expect(verifiedShare(portfolio)).toBeCloseTo(0.7);
  });

  it('is zero of zero, not a flattering hundred percent', () => {
    expect(verifiedShare(aggregateDelivery([], []))).toBe(0);
  });
});

describe('presentation helpers', () => {
  it('formats screen time at the scale a reader can hold', () => {
    expect(formatScreenTime(45)).toBe('45s');
    expect(formatScreenTime(90)).toBe('2m');
    expect(formatScreenTime(3600)).toBe('1h');
    expect(formatScreenTime(5400)).toBe('1h 30m');
  });

  it('leaves an unparseable day label alone rather than printing Invalid Date', () => {
    expect(shortDay('not-a-day')).toBe('not-a-day');
  });

  it('counts scheduled campaigns as live, since the advertiser is already paying for them', () => {
    const list = [
      campaign({ campaignId: 'a', status: 'Active' }),
      campaign({ campaignId: 'b', status: 'Scheduled' }),
      campaign({ campaignId: 'c', status: 'Draft' }),
      campaign({ campaignId: 'd', status: 'Completed' }),
    ];

    expect(liveCampaigns(list).map((c) => c.campaignId)).toEqual(['a', 'b']);
  });
});
