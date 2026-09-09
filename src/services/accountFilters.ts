/**
 * Narrowing the account lists — drivers, advertisers and fleet partners — by status.
 *
 * All three carry the same status vocabulary from the server: PendingVerification, Approved,
 * Rejected and Suspended. The tabs map onto those values rather than onto anything derived, and
 * a status the map does not know stays visible under "all" instead of disappearing, because a
 * record nobody can see is worse than one in an unexpected column.
 */

export type AccountFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

const FILTER_STATUSES: Record<Exclude<AccountFilter, 'all'>, readonly string[]> = {
  // "PendingApproval" appears on campaigns; accounts use PendingVerification. Both are accepted
  // so one shared helper can serve either without a second near-identical map.
  pending: ['PendingVerification', 'PendingApproval', 'Pending'],
  approved: ['Approved', 'Active'],
  rejected: ['Rejected'],
  suspended: ['Suspended'],
};

export function matchesAccountFilter(status: string | null | undefined, filter: AccountFilter): boolean {
  if (filter === 'all') return true;
  if (!status) return false;
  return FILTER_STATUSES[filter].includes(status);
}

export function countAccountsByFilter<T>(
  items: readonly T[],
  statusOf: (item: T) => string | null | undefined,
): Record<AccountFilter, number> {
  return {
    all: items.length,
    pending: items.filter((i) => matchesAccountFilter(statusOf(i), 'pending')).length,
    approved: items.filter((i) => matchesAccountFilter(statusOf(i), 'approved')).length,
    rejected: items.filter((i) => matchesAccountFilter(statusOf(i), 'rejected')).length,
    suspended: items.filter((i) => matchesAccountFilter(statusOf(i), 'suspended')).length,
  };
}

/**
 * Status filter and free-text search applied together.
 *
 * `searchable` returns the fields a page considers worth searching; nulls are skipped rather than
 * stringified, so a missing region cannot make every record match the word "null".
 */
export function filterAccounts<T>(
  items: readonly T[],
  filter: AccountFilter,
  search: string,
  statusOf: (item: T) => string | null | undefined,
  searchable: (item: T) => readonly (string | null | undefined)[],
): T[] {
  const needle = search.trim().toLowerCase();

  return items.filter((item) => {
    if (!matchesAccountFilter(statusOf(item), filter)) return false;
    if (!needle) return true;
    return searchable(item).some((field) => field?.toLowerCase().includes(needle));
  });
}
