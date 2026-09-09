import { describe, expect, it } from 'vitest';
import { describeLastSignal, presentScreen, SCREEN_SILENCE_SECONDS, type AdminScreen } from './admin';
import {
  countScreensByFilter,
  filterScreens,
  fitmentPercent,
  lastSignalParts,
  matchesScreenFilter,
  screenState,
  SCREEN_STATE_TONES,
  type ScreenState,
} from './screenOperations';

const NOW = Date.parse('2026-09-09T12:00:00Z');
const secondsAgo = (s: number) => new Date(NOW - s * 1000).toISOString();

function screen(over: Partial<AdminScreen> = {}): AdminScreen {
  return {
    screenId: over.screenId ?? crypto.randomUUID(),
    serialNumber: 'SCR-001',
    status: 'Online',
    networkStatus: 'Connected',
    plate: 'B 123456',
    driverName: 'Rana Khoury',
    region: 'Hamra',
    lastHeartbeatAtUtc: secondsAgo(30),
    batteryLevel: 80,
    ...over,
  };
}

/**
 * Every state a screen can be in, one example each. The pin below walks this list, so a sixth
 * state added to `presentScreen` without a matching key here is caught by the exhaustive record
 * rather than silently filtered as "attention".
 */
const EXAMPLES: Record<ScreenState, AdminScreen> = {
  online: screen(),
  notReporting: screen({ lastHeartbeatAtUtc: secondsAgo(SCREEN_SILENCE_SECONDS + 1) }),
  disconnected: screen({ networkStatus: 'Offline' }),
  maintenance: screen({ status: 'Maintenance' }),
  never: screen({ lastHeartbeatAtUtc: null }),
};

describe('screenState', () => {
  it('names each of the states the status column already derives', () => {
    for (const [expected, row] of Object.entries(EXAMPLES)) {
      expect(screenState(row, NOW)).toBe(expected);
    }
  });

  it('stays pinned to presentScreen, so a chip and the badge it hides cannot disagree', () => {
    // If the silence threshold moves or the rules are reordered in one place only, this fails.
    const LABELS: Record<ScreenState, string> = {
      online: 'Online',
      notReporting: 'Not reporting',
      disconnected: 'Disconnected',
      maintenance: 'Maintenance',
      never: 'Never checked in',
    };

    for (const [state, row] of Object.entries(EXAMPLES) as [ScreenState, AdminScreen][]) {
      const presented = presentScreen(row, NOW);
      expect(presented.label).toBe(LABELS[state]);
      expect(presented.tone).toBe(SCREEN_STATE_TONES[state]);
    }
  });

  it('ranks never-heard-from above every other fault', () => {
    // A screen with no heartbeat and a bad network is "never", not "disconnected": it was never
    // really there, which is a different problem from one that stopped working.
    expect(screenState(screen({ lastHeartbeatAtUtc: null, networkStatus: 'Offline' }), NOW)).toBe('never');
    expect(screenState(screen({ lastHeartbeatAtUtc: null, status: 'Maintenance' }), NOW)).toBe('never');
  });

  it('ranks silence above the stored network and status columns', () => {
    const silent = screen({
      lastHeartbeatAtUtc: secondsAgo(SCREEN_SILENCE_SECONDS + 60),
      networkStatus: 'Connected',
      status: 'Online',
    });
    expect(screenState(silent, NOW)).toBe('notReporting');
  });

  it('does not call a screen online because its status column says so', () => {
    // Status is written by something; the whole point is that a stored claim is not evidence.
    expect(screenState(screen({ status: 'Online', lastHeartbeatAtUtc: null }), NOW)).toBe('never');
  });

  it('holds a screen online right up to the threshold and not past it', () => {
    expect(screenState(screen({ lastHeartbeatAtUtc: secondsAgo(SCREEN_SILENCE_SECONDS) }), NOW)).toBe('online');
    expect(screenState(screen({ lastHeartbeatAtUtc: secondsAgo(SCREEN_SILENCE_SECONDS + 1) }), NOW)).toBe('notReporting');
  });

  it('treats a heartbeat from the future as fresh rather than as ancient', () => {
    // Clock skew on a rooftop unit should not make a reporting screen look dead.
    expect(screenState(screen({ lastHeartbeatAtUtc: new Date(NOW + 90_000).toISOString() }), NOW)).toBe('online');
  });
});

describe('matchesScreenFilter', () => {
  it('lets every state through on all', () => {
    for (const state of Object.keys(EXAMPLES) as ScreenState[]) {
      expect(matchesScreenFilter(state, 'all')).toBe(true);
    }
  });

  it('groups exactly the three states the platform treats as problems under attention', () => {
    expect(matchesScreenFilter('notReporting', 'attention')).toBe(true);
    expect(matchesScreenFilter('disconnected', 'attention')).toBe(true);
    expect(matchesScreenFilter('maintenance', 'attention')).toBe(true);
    expect(matchesScreenFilter('online', 'attention')).toBe(false);
    // Never-checked-in is not an incident: nothing broke, nothing was ever installed.
    expect(matchesScreenFilter('never', 'attention')).toBe(false);
  });

  it('keeps online to screens the platform can actually vouch for', () => {
    expect(matchesScreenFilter('online', 'online')).toBe(true);
    expect(matchesScreenFilter('maintenance', 'online')).toBe(false);
  });
});

describe('countScreensByFilter', () => {
  const all = Object.values(EXAMPLES);

  it('counts each chip from the same rule that renders the badges', () => {
    expect(countScreensByFilter(all, NOW)).toEqual({ all: 5, online: 1, attention: 3, never: 1 });
  });

  it('accounts for every screen exactly once across the three named chips', () => {
    const c = countScreensByFilter(all, NOW);
    expect(c.online + c.attention + c.never).toBe(c.all);
  });

  it('reports zeroes rather than nothing for an empty estate', () => {
    expect(countScreensByFilter([], NOW)).toEqual({ all: 0, online: 0, attention: 0, never: 0 });
  });
});

describe('filterScreens', () => {
  const all = Object.values(EXAMPLES);

  it('returns only the rows behind the chip that was pressed', () => {
    expect(filterScreens(all, 'online', '', NOW)).toHaveLength(1);
    expect(filterScreens(all, 'attention', '', NOW)).toHaveLength(3);
    expect(filterScreens(all, 'all', '', NOW)).toHaveLength(5);
  });

  it('searches serial, plate, driver and region, case-insensitively', () => {
    const rows = [
      screen({ screenId: 'a', serialNumber: 'SCR-777', plate: null, driverName: null, region: null }),
      screen({ screenId: 'b', serialNumber: 'SCR-888', region: 'Jounieh' }),
    ];
    expect(filterScreens(rows, 'all', '777', NOW).map((r) => r.screenId)).toEqual(['a']);
    expect(filterScreens(rows, 'all', 'jounieh', NOW).map((r) => r.screenId)).toEqual(['b']);
    expect(filterScreens(rows, 'all', 'RANA', NOW).map((r) => r.screenId)).toEqual(['b']);
  });

  it('skips null fields rather than letting them match the word null', () => {
    const rows = [screen({ plate: null, driverName: null, region: null })];
    expect(filterScreens(rows, 'all', 'null', NOW)).toHaveLength(0);
  });

  it('applies the chip and the search together rather than letting either win', () => {
    const rows = [
      screen({ screenId: 'live', serialNumber: 'SCR-100' }),
      screen({ screenId: 'dead', serialNumber: 'SCR-100', networkStatus: 'Offline' }),
    ];
    expect(filterScreens(rows, 'online', 'SCR-100', NOW).map((r) => r.screenId)).toEqual(['live']);
  });

  it('ignores a search of only whitespace', () => {
    expect(filterScreens(all, 'all', '   ', NOW)).toHaveLength(5);
  });
});

describe('fitmentPercent', () => {
  it('reports the share of the fleet carrying a screen', () => {
    expect(fitmentPercent(3, 12)).toBe(25);
    expect(fitmentPercent(0, 12)).toBe(0);
  });

  it('refuses to state a percentage with no fleet underneath it', () => {
    // 0 of 0 is not 0% fitted; it is a ratio of nothing, and "0%" would read as a measured fleet.
    expect(fitmentPercent(0, 0)).toBeNull();
    expect(fitmentPercent(5, -1)).toBeNull();
  });
});

describe('lastSignalParts', () => {
  it('returns pieces a locale can order for itself rather than an English sentence', () => {
    expect(lastSignalParts(null, NOW)).toEqual({ unit: 'never', count: null });
    expect(lastSignalParts(secondsAgo(20), NOW)).toEqual({ unit: 'now', count: 0 });
    expect(lastSignalParts(secondsAgo(240), NOW)).toEqual({ unit: 'minutes', count: 4 });
    expect(lastSignalParts(secondsAgo(7200), NOW)).toEqual({ unit: 'hours', count: 2 });
    expect(lastSignalParts(secondsAgo(172_800), NOW)).toEqual({ unit: 'days', count: 2 });
  });

  it('agrees with the buckets describeLastSignal uses, so the two never read differently', () => {
    expect(describeLastSignal(secondsAgo(240), NOW)).toBe('4 min ago');
    expect(describeLastSignal(secondsAgo(20), NOW)).toBe('just now');
    expect(describeLastSignal(null, NOW)).toBe('never');
  });

  it('does not report a future heartbeat as a negative age', () => {
    expect(lastSignalParts(new Date(NOW + 60_000).toISOString(), NOW)).toEqual({ unit: 'now', count: 0 });
  });
});
