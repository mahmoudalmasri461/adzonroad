import { useEffect, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { REDUCED_MOTION_QUERY, shouldRevealImmediately } from './revealVisibility';

type RevealProps = {
  children: ReactNode;
  delay?: number;
};

export default function Reveal({ children, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() =>
    shouldRevealImmediately(
      typeof window === 'undefined' ? undefined : window,
      typeof document === 'undefined' ? undefined : document,
    ),
  );

  useEffect(() => {
    if (visible) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Triggered by where the element is rather than by how much of it fits on screen. The
      // previous `threshold: 0.15` asked for 15% of the *target* to be visible, which an element
      // taller than about six viewports can never satisfy — the callback then never arrives at
      // all, and the section stays invisible no matter how far you scroll. Several of these
      // sections are that tall on a phone. A bottom rootMargin asks the same question in a way
      // that does not depend on the element's height.
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        // Also covers switching the preference on after load, when the initial check has already
        // been made and the element is still waiting its turn.
        [`@media ${REDUCED_MOTION_QUERY}`]: { transition: 'none' },
      }}
    >
      {children}
    </Box>
  );
}
