import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has been scrolled into view, and true from then on.
 *
 * Latching rather than tracking: this drives things that animate into position, and a value that
 * flipped back to false on scroll-out would replay them every time the section passed the fold.
 * The observer disconnects on the first hit for the same reason.
 *
 * `Reveal` runs its own observer for the section fade, but keeps the result to itself — this is
 * for children that need to know, without changing how Reveal behaves everywhere else.
 */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without the API there is no way to know, and staying at the pre-animation state would leave
    // the content looking empty rather than un-animated.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}
