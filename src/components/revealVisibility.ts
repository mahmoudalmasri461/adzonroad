/**
 * Decides whether a `Reveal` should skip its entrance animation and show its children straight
 * away.
 *
 * This exists as its own module so it can be tested. Every section of the homepage below the hero
 * is wrapped in a `Reveal`, which means anything that stops the observer from reporting does not
 * degrade the animation — it takes the entire page with it and leaves a visitor scrolling through
 * blank space. So the rule is that the component fails open: if we cannot positively establish
 * that an element is off screen, we show it.
 */

/**
 * The parts of `window` this decision reads. Structural rather than `Window`, so a test can hand
 * it an environment missing the very things we are checking for — which a real `Window` type will
 * not let you express.
 */
export type RevealEnvironment = {
  IntersectionObserver?: unknown;
  innerWidth?: number;
  innerHeight?: number;
  matchMedia?: (query: string) => { matches: boolean };
};

/** The part of `document` this reads. Optional so a caller with no document can omit it. */
export type RevealDocument = {
  visibilityState?: string;
};

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function shouldRevealImmediately(
  env: RevealEnvironment | undefined,
  doc?: RevealDocument,
): boolean {
  // No window at all: server rendering, prerendering, a snapshot tool. Nothing will ever scroll,
  // so an element left at opacity 0 stays that way permanently.
  if (!env) return true;

  // No observer to ask. Nothing schedules a second attempt, so hiding here is forever.
  if (typeof env.IntersectionObserver !== 'function') return true;

  // A viewport with no area cannot intersect anything, so the observer stays silent rather than
  // reporting a miss — there is no callback to wait for. Hidden tabs, zero-height frames, print
  // and thumbnail contexts all land here.
  if (!env.innerHeight || !env.innerWidth) return true;

  // Chromium does not deliver intersection callbacks while a document is hidden. A background tab
  // catches up the moment it is brought forward, so that case would resolve itself — but the
  // contexts that stay hidden indefinitely while still being shown to somebody (prerenders,
  // in-app webviews, embedded preview panes, screenshot services) never do, and they get a page
  // that scrolls through nothing but blank space. The cost of failing open is skipping an
  // entrance animation for a tab opened in the background, which nobody was watching anyway.
  if (doc && doc.visibilityState === 'hidden') return true;

  // Asked for less motion: drop the animation, never the content.
  try {
    if (env.matchMedia?.(REDUCED_MOTION_QUERY).matches) return true;
  } catch {
    // matchMedia throws on queries it cannot parse in some engines. We keep the animation — the
    // observer above is working, so the content still arrives. The point of catching is that this
    // runs while computing initial state, where an escaping error would fail the render of every
    // section on the page.
  }

  return false;
}
