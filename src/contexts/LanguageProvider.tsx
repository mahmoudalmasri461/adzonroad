import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import baseTheme from '../theme';
import i18n, {
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
  directionOf,
  storedLanguage,
  type Language,
} from '../i18n';

/**
 * Language, direction, and everything downstream of them.
 *
 * Switching language is not just swapping strings. Three other things have to move with it, and
 * all three live here so no page has to remember them:
 *
 *   - `document.lang` and `document.dir`, which is what a screen reader and the browser's own
 *     text shaping read.
 *   - MUI's `theme.direction`, which decides which side its components put things on.
 *   - Emotion's style pipeline, which needs the RTL plugin to flip the physical properties
 *     (`margin-left`, `padding-right`, `left`) that the codebase is written in.
 *
 * The two emotion caches are built once and kept, rather than rebuilt per render: recreating a
 * cache re-inserts every rule in the document, which on this app is a visible repaint.
 */

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  direction: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

const ltrCache = createCache({ key: 'adz', stylisPlugins: [prefixer] });
const rtlCache = createCache({ key: 'adz-rtl', stylisPlugins: [prefixer, rtlPlugin] });

const themes = {
  ltr: createTheme(baseTheme, { direction: 'ltr' }),
  rtl: createTheme(baseTheme, { direction: 'rtl' }),
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => storedLanguage());
  const direction = directionOf(language);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable. The switch still works for this session.
    }
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(language);

    const root = document.documentElement;
    root.lang = language;
    root.dir = directionOf(language);
    // Arabic needs a face that actually has the glyphs; Inter has none. Set on the element rather
    // than in the theme so it reaches anything rendered outside MUI too.
    root.style.setProperty(
      '--adz-font-stack',
      language === 'ar'
        ? '"IBM Plex Sans Arabic", Inter, system-ui, sans-serif'
        : 'Inter, system-ui, sans-serif',
    );
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, direction }),
    [language, setLanguage, direction],
  );

  return (
    <LanguageContext.Provider value={value}>
      <CacheProvider value={direction === 'rtl' ? rtlCache : ltrCache}>
        <ThemeProvider theme={direction === 'rtl' ? themes.rtl : themes.ltr}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </LanguageContext.Provider>
  );
}

export { DEFAULT_LANGUAGE };
