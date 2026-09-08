import { describe, expect, it } from 'vitest';
import {
  buildCampaignRows,
  concernsFor,
  countByFilter,
  filterCampaignRows,
  scheduleProgress,
} from './campaignOperations';
import type { AdminCampaign, Assignment, DeliverySummaryRow } from './admin';

function campaign(over: Partial<AdminCampaign> = {}): AdminCampaign {
  return {
    campaignId: 'c1', name: 'Summer Beirut', status: 'Active', advertiser: 'Acme',
    startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-11T00:00:00Z',
    taxiCount: 10, creativeDurationSeconds: 15, regions: ['Beirut'], creativeCount: 1,
    price: 1000, createdAtUtc: '2025-12-20T00:00:00Z', freeScreens: 3, couldFillNow: null,
    ...over,
  };
}

function delivery(over: Partial<DeliverySummaryRow> = {}): DeliverySummaryRow {
  return { campaignId: 'c1', verifiedPlays: 0, verifiedSeconds: 0, pendingPlays: 0, conflictPlays: 0, screens: 0, hours: 0, ...over };
}

function assignment(campaignId: string, id: string): Assignment {
  return {
    assignmentId: id, campaignId, campaignName: 'Summer Beirut', campaignStatus: 'Active',
    advertiser: 'Acme', screenId: 's' + id, screenSerial: 'SCR-' + id, vehiclePlate: 'B ' + id,
    assignedBy: 'admin', matchBasis: 'ObservedPresence', assignedAtUtc: '', releasedAtUtc: null, releaseReason: null,
  };
}

const MID = Date.parse('2026-01-06T00:00:00Z');

describe('scheduleProgress', () => {
  it('is arithmetic on the campaign window, not a delivery figure', () => {
    expect(scheduleProgress('2026-01-01T00:00:00Z', '2026-01-11T00:00:00Z', MID)).toBeCloseTo(0.5, 5);
  });

  it('clamps before the start and after the end', () => {
    const before = Date.parse('2025-12-01T00:00:00Z');
    const after = Date.parse('2027-01-01T00:00:00Z');
    expect(scheduleProgress('2026-01-01T00:00:00Z', '2026-01-11T00:00:00Z', before)).toBe(0);
    expect(scheduleProgress('2026-01-01T00:00:00Z', '2026-01-11T00:00:00Z', after)).toBe(1);
  });

  it('returns null rather than a number when the window is unusable', () => {
    expect(scheduleProgress('nonsense', '2026-01-11T00:00:00Z', MID)).toBeNull();
    // A zero-length or reversed window would divide by zero or go negative.
    expect(scheduleProgress('2026-01-11T00:00:00Z', '2026-01-11T00:00:00Z', MID)).toBeNull();
    expect(scheduleProgress('2026-01-11T00:00:00Z', '2026-01-01T00:00:00Z', MID)).toBeNull();
  });
});

describe('buildCampaignRows', () => {
  it('attaches recorded, pending and conflicting plays by campaign id', () => {
    const rows = buildCampaignRows(
      [campaign()],
      [delivery({ verifiedPlays: 40, pendingPlays: 5, conflictPlays: 2 })],
      [],
      MID,
    );

    expect(rows[0].recordedPlays).toBe(40);
    expect(rows[0].pendingPlays).toBe(5);
    expect(rows[0].conflictPlays).toBe(2);
  });

  it('counts the screens actually carrying the campaign', () => {
    const rows = buildCampaignRows(
      [campaign(), campaign({ campaignId: 'c2', name: 'Other' })],
      [],
      [assignment('c1', '1'), assignment('c1', '2'), assignment('c2', '3')],
      MID,
    );

    expect(rows[0].screensAssigned).toBe(2);
    expect(rows[1].screensAssigned).toBe(1);
  });

  it('reports zero rather than guessing when a campaign has no delivery row', () => {
    const rows = buildCampaignRows([campaign()], [], [], MID);
    expect(rows[0].recordedPlays).toBe(0);
    expect(rows[0].screensAssigned).toBe(0);
  });
});

describe('filterCampaignRows', () => {
  const rows = buildCampaignRows(
    [
      campaign({ campaignId: 'a', status: 'PendingApproval', name: 'Pending one' }),
      campaign({ campaignId: 'b', status: 'Active', name: 'Live one' }),
      campaign({ campaignId: 'c', status: 'Scheduled', name: 'Booked one' }),
      campaign({ campaignId: 'd', status: 'Completed', name: 'Done one' }),
      campaign({ campaignId: 'e', status: 'Rejected', name: 'Refused one' }),
      campaign({ campaignId: 'f', status: 'Draft', name: 'Draft one' }),
    ],
    [], [], MID,
  );

  it('maps each tab to the statuses the API actually stores', () => {
    expect(filterCampaignRows(rows, 'pending', '').map((r) => r.campaign.campaignId)).toEqual(['a']);
    // Scheduled counts as active work: it is sold and waiting to run.
    expect(filterCampaignRows(rows, 'active', '').map((r) => r.campaign.campaignId)).toEqual(['b', 'c']);
    expect(filterCampaignRows(rows, 'completed', '').map((r) => r.campaign.campaignId)).toEqual(['d']);
    expect(filterCampaignRows(rows, 'rejected', '').map((r) => r.campaign.campaignId)).toEqual(['e']);
  });

  it('keeps a Draft reachable under all rather than hiding it', () => {
    expect(filterCampaignRows(rows, 'all', '')).toHaveLength(6);
  });

  it('searches name, advertiser, status and region together', () => {
    expect(filterCampaignRows(rows, 'all', 'refused').map((r) => r.campaign.campaignId)).toEqual(['e']);
    expect(filterCampaignRows(rows, 'all', 'beirut')).toHaveLength(6);
  });

  it('applies the filter and the search together', () => {
    expect(filterCampaignRows(rows, 'pending', 'live one')).toHaveLength(0);
  });

  it('counts each tab', () => {
    expect(countByFilter(rows)).toEqual({ all: 6, pending: 1, active: 2, completed: 1, rejected: 1 });
  });
});

describe('concernsFor', () => {
  const at = (over: Partial<AdminCampaign>, d: Partial<DeliverySummaryRow> = {}, assigns: Assignment[] = []) =>
    buildCampaignRows([campaign(over)], [delivery(d)], assigns, MID)[0];

  it('flags a campaign that cannot run because it has no creative', () => {
    expect(concernsFor(at({ creativeCount: 0 }))).toContain('noCreative');
  });

  it('flags a live campaign no screen is carrying', () => {
    expect(concernsFor(at({ status: 'Active' }))).toContain('noScreens');
  });

  it('does not flag missing screens on a campaign that is not live yet', () => {
    expect(concernsFor(at({ status: 'PendingApproval' }))).not.toContain('noScreens');
  });

  it('flags a live campaign well into its period with nothing recorded', () => {
    // Half way through, zero plays.
    expect(concernsFor(at({ status: 'Active' }, { verifiedPlays: 0 }))).toContain('nothingRecorded');
  });

  it('does not flag nothing-recorded at the very start of the window', () => {
    const row = buildCampaignRows(
      [campaign({ status: 'Active' })], [delivery()], [assignment('c1', '1')],
      Date.parse('2026-01-01T06:00:00Z'),
    )[0];
    expect(concernsFor(row)).not.toContain('nothingRecorded');
  });

  it('flags playback that arrived in doubt', () => {
    expect(concernsFor(at({}, { conflictPlays: 3 }))).toContain('playbackInDoubt');
  });

  it('is silent on a healthy campaign', () => {
    const row = buildCampaignRows(
      [campaign({ status: 'Active', creativeCount: 2 })],
      [delivery({ verifiedPlays: 500 })],
      [assignment('c1', '1')],
      MID,
    )[0];
    expect(concernsFor(row)).toEqual([]);
  });
});
