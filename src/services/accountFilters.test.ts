import { describe, expect, it } from 'vitest';
import { countAccountsByFilter, filterAccounts, matchesAccountFilter } from './accountFilters';

type Row = { name: string; status: string | null; region: string | null };

const rows: Row[] = [
  { name: 'Rana Khoury', status: 'PendingVerification', region: 'Hamra' },
  { name: 'Sami Haddad', status: 'Approved', region: null },
  { name: 'Beirut Cabs', status: 'Rejected', region: 'Verdun' },
  { name: 'Cedar Fleet', status: 'Suspended', region: 'Jounieh' },
  { name: 'Odd One', status: 'SomethingNew', region: null },
];

const statusOf = (r: Row) => r.status;
const searchable = (r: Row) => [r.name, r.region, r.status];

describe('matchesAccountFilter', () => {
  it('maps each tab onto the statuses the server stores', () => {
    expect(matchesAccountFilter('PendingVerification', 'pending')).toBe(true);
    expect(matchesAccountFilter('Approved', 'approved')).toBe(true);
    expect(matchesAccountFilter('Rejected', 'rejected')).toBe(true);
    expect(matchesAccountFilter('Suspended', 'suspended')).toBe(true);
  });

  it('accepts the campaign spelling of pending so one helper serves both', () => {
    expect(matchesAccountFilter('PendingApproval', 'pending')).toBe(true);
  });

  it('lets everything through on all, including a status it has never seen', () => {
    expect(matchesAccountFilter('SomethingNew', 'all')).toBe(true);
    expect(matchesAccountFilter(null, 'all')).toBe(true);
  });

  it('does not quietly file an unknown status under a named tab', () => {
    expect(matchesAccountFilter('SomethingNew', 'approved')).toBe(false);
    expect(matchesAccountFilter('SomethingNew', 'pending')).toBe(false);
  });

  it('treats a missing status as unmatched rather than as pending', () => {
    expect(matchesAccountFilter(null, 'pending')).toBe(false);
    expect(matchesAccountFilter(undefined, 'approved')).toBe(false);
  });
});

describe('countAccountsByFilter', () => {
  it('counts each tab from real statuses', () => {
    expect(countAccountsByFilter(rows, statusOf)).toEqual({
      all: 5, pending: 1, approved: 1, rejected: 1, suspended: 1,
    });
  });

  it('counts all as the full list so an unknown status is never lost', () => {
    const counts = countAccountsByFilter(rows, statusOf);
    expect(counts.all).toBeGreaterThan(counts.pending + counts.approved + counts.rejected + counts.suspended);
  });
});

describe('filterAccounts', () => {
  it('applies the status filter', () => {
    expect(filterAccounts(rows, 'pending', '', statusOf, searchable).map((r) => r.name)).toEqual(['Rana Khoury']);
  });

  it('searches the fields the page nominates, case-insensitively', () => {
    expect(filterAccounts(rows, 'all', 'verdun', statusOf, searchable).map((r) => r.name)).toEqual(['Beirut Cabs']);
    expect(filterAccounts(rows, 'all', 'RANA', statusOf, searchable).map((r) => r.name)).toEqual(['Rana Khoury']);
  });

  it('skips null fields rather than letting them match', () => {
    // A naive String(null) would make every record with a missing region match "null".
    expect(filterAccounts(rows, 'all', 'null', statusOf, searchable)).toHaveLength(0);
  });

  it('applies status and search together rather than letting either win', () => {
    expect(filterAccounts(rows, 'approved', 'rana', statusOf, searchable)).toHaveLength(0);
    expect(filterAccounts(rows, 'approved', 'sami', statusOf, searchable)).toHaveLength(1);
  });

  it('returns everything when nothing is asked of it', () => {
    expect(filterAccounts(rows, 'all', '   ', statusOf, searchable)).toHaveLength(5);
  });
});
