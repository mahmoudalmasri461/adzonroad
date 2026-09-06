import { useLanguage } from '../contexts/LanguageProvider';

/**
 * An arrow that means "forward", not "right".
 *
 * Unicode does not mirror → and ← for you: a right-pointing arrow stays right-pointing inside an
 * RTL paragraph, so "Sign in →" in Arabic ends up pointing back the way the reader came. The
 * layout around it has already flipped by then, which makes the arrow the only thing on the page
 * disagreeing with everything else.
 *
 * Returns a fragment rather than a span so it adds no element of its own — most call sites already
 * have a styled wrapper that animates the arrow on hover, and nesting a second span inside it
 * would break the transform those rules apply.
 */
export default function DirArrow({ back = false }: { back?: boolean }) {
  const { direction } = useLanguage();
  const rtl = direction === 'rtl';
  const glyph = back ? (rtl ? '→' : '←') : rtl ? '←' : '→';

  return <>{glyph}</>;
}
