import { describe, expect, it } from 'vitest';
import { REDUCED_MOTION_QUERY, shouldRevealImmediately, type RevealEnvironment } from './revealVisibility';

/** A browser that can do everything the animation needs, so nothing is forced visible. */
function capableEnvironment(overrides: Partial<RevealEnvironment> = {}): RevealEnvironment {
  return {
    IntersectionObserver: function FakeObserver() {},
    innerWidth: 1280,
    innerHeight: 900,
    matchMedia: () => ({ matches: false }),
    ...overrides,
  };
}

describe('shouldRevealImmediately', () => {
  it('waits for the observer when the browser can support the animation', () => {
    expect(shouldRevealImmediately(capableEnvironment())).toBe(false);
  });

  it('reveals when there is no window at all', () => {
    expect(shouldRevealImmediately(undefined)).toBe(true);
  });

  it('reveals when IntersectionObserver is missing', () => {
    expect(shouldRevealImmediately(capableEnvironment({ IntersectionObserver: undefined }))).toBe(true);
  });

  it('reveals when IntersectionObserver is present but not constructible', () => {
    // A stub or polyfill that left a non-function behind would otherwise throw on `new`, which
    // happens inside an effect and takes the page down rather than degrading.
    expect(shouldRevealImmediately(capableEnvironment({ IntersectionObserver: {} }))).toBe(true);
  });

  it('reveals when the viewport has no height', () => {
    // The case this was written for: a zero-area viewport never intersects anything, so the
    // observer stays silent and there is no callback to wait for.
    expect(shouldRevealImmediately(capableEnvironment({ innerHeight: 0 }))).toBe(true);
  });

  it('reveals when the viewport has no width', () => {
    expect(shouldRevealImmediately(capableEnvironment({ innerWidth: 0 }))).toBe(true);
  });

  it('reveals when the viewport dimensions are not reported', () => {
    expect(
      shouldRevealImmediately(capableEnvironment({ innerWidth: undefined, innerHeight: undefined })),
    ).toBe(true);
  });

  it('reveals when the document is hidden, because no callback will arrive', () => {
    // Chromium withholds intersection callbacks from hidden documents. A background tab recovers
    // when it is fronted; a prerender or an embedded pane that stays hidden never does.
    expect(shouldRevealImmediately(capableEnvironment(), { visibilityState: 'hidden' })).toBe(true);
  });

  it('waits for the observer when the document is visible', () => {
    expect(shouldRevealImmediately(capableEnvironment(), { visibilityState: 'visible' })).toBe(false);
  });

  it('waits for the observer when no document is supplied', () => {
    expect(shouldRevealImmediately(capableEnvironment(), undefined)).toBe(false);
  });

  it('reveals when the visitor prefers reduced motion', () => {
    expect(
      shouldRevealImmediately(
        capableEnvironment({ matchMedia: (q) => ({ matches: q === REDUCED_MOTION_QUERY }) }),
      ),
    ).toBe(true);
  });

  it('survives matchMedia throwing, and still waits for the working observer', () => {
    // Failing to read the motion preference says nothing about whether the element is on screen,
    // and the observer here works — so the animation is kept. What matters is that the throw is
    // contained: it happens during the initial state calculation, where an escaping error would
    // fail the render of every section on the page.
    expect(
      shouldRevealImmediately(
        capableEnvironment({
          matchMedia: () => {
            throw new Error('unsupported query');
          },
        }),
      ),
    ).toBe(false);
  });

  it('waits for the observer when matchMedia is absent but everything else is fine', () => {
    // Missing matchMedia says nothing about whether the element is on screen, so it is not on its
    // own a reason to skip the animation.
    expect(shouldRevealImmediately(capableEnvironment({ matchMedia: undefined }))).toBe(false);
  });
});
