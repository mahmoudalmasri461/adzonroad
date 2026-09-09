import { SCREEN_SILENCE_SECONDS, type AdminScreen, type Tone } from './admin';

/**
 * Narrowing the screen estate by the state it is actually in.
 *
 * The states are the ones `presentScreen` already derives for the status column, restated here as
 * keys so a filter chip and the badge on the row it hides can never disagree. A test pins the two
 * together: if the silence threshold or the ordering of those rules ever changes, this drifts and
 * the suite says so rather than the console quietly filtering on a rule the badges stopped using.
 *
 * Nothing here is a health score. "Attention" is the union of the three states the platform
 * already treats as problems, not a judgement invented for the filter bar.
 */

export type ScreenState = 'online' | 'notReporting' | 'disconnected' | 'maintenance' | 'never';

export function screenState(screen: AdminScreen, now: number = Date.now()): ScreenState {
  if (!screen.lastHeartbeatAtUtc) return 'never';

  const silentFor = Math.max(0, (now - Date.parse(screen.lastHeartbeatAtUtc)) / 1000);
  if (silentFor > SCREEN_SILENCE_SECONDS) return 'notReporting';

  if (screen.networkStatus !== 'Connected') return 'disconnected';
  if (screen.status === 'Maintenance') return 'maintenance';

  return 'online';
}

/**
 * The colour each state carries, pinned by test to the tone `presentScreen` already gives it.
 *
 * The page reads its badge tone from here rather than calling `presentScreen` separately, so the
 * chip that hides a row and the badge on the row cannot end up coloured by two different rules.
 */
export const SCREEN_STATE_TONES: Record<ScreenState, Tone> = {
  online: 'live',
  notReporting: 'error',
  disconnected: 'error',
  maintenance: 'warn',
  never: 'neutral',
};

export type ScreenFilter = 'all' | 'online' | 'attention' | 'never';

/** The three states the platform already treats as a problem. */
const ATTENTION: readonly ScreenState[] = ['notReporting', 'disconnected', 'maintenance'];

export function matchesScreenFilter(state: ScreenState, filter: ScreenFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'online') return state === 'online';
  if (filter === 'never') return state === 'never';
  return ATTENTION.includes(state);
}

export function countScreensByFilter(
  screens: readonly AdminScreen[],
  now: number = Date.now(),
): Record<ScreenFilter, number> {
  const states = screens.map((s) => screenState(s, now));
  return {
    all: screens.length,
    online: states.filter((s) => matchesScreenFilter(s, 'online')).length,
    attention: states.filter((s) => matchesScreenFilter(s, 'attention')).length,
    never: states.filter((s) => matchesScreenFilter(s, 'never')).length,
  };
}

export function filterScreens(
  screens: readonly AdminScreen[],
  filter: ScreenFilter,
  search: string,
  now: number = Date.now(),
): AdminScreen[] {
  const needle = search.trim().toLowerCase();

  return screens.filter((screen) => {
    if (!matchesScreenFilter(screenState(screen, now), filter)) return false;
    if (!needle) return true;

    return [screen.serialNumber, screen.plate, screen.driverName, screen.region].some((field) =>
      field?.toLowerCase().includes(needle),
    );
  });
}

/**
 * How much of the fleet carries a screen.
 *
 * Null when there are no vehicles, because zero screens across zero vehicles is not 0% fitted —
 * it is a ratio with nothing underneath it, and showing "0%" would read as a fleet that has been
 * measured rather than one that does not exist.
 */
export function fitmentPercent(screenCount: number, vehicleCount: number): number | null {
  if (vehicleCount <= 0) return null;
  return Math.round((screenCount / vehicleCount) * 100);
}

/**
 * How long ago a screen last spoke, as a key and a number rather than a sentence.
 *
 * `describeLastSignal` builds English ("4 min ago") by concatenation, which cannot be translated
 * without rebuilding the sentence in every language. This returns the pieces so the caller can
 * hand them to i18next and let the locale decide word order and plural form.
 */
export type LastSignal =
  | { unit: 'never'; count: null }
  | { unit: 'now' | 'minutes' | 'hours' | 'days'; count: number };

export function lastSignalParts(lastHeartbeatAtUtc: string | null, now: number = Date.now()): LastSignal {
  if (!lastHeartbeatAtUtc) return { unit: 'never', count: null };

  const seconds = Math.max(0, (now - Date.parse(lastHeartbeatAtUtc)) / 1000);

  if (seconds < 60) return { unit: 'now', count: 0 };
  if (seconds < 3600) return { unit: 'minutes', count: Math.round(seconds / 60) };
  if (seconds < 86_400) return { unit: 'hours', count: Math.round(seconds / 3600) };

  return { unit: 'days', count: Math.round(seconds / 86_400) };
}
