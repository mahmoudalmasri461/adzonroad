import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

/**
 * Translation, in one place.
 *
 * Resources are bundled rather than fetched: there are two of them, they are small, and a language
 * switch that has to wait on a network request shows a screen of raw keys while it does.
 *
 * `en` is both the default and the fallback, so a key that has not been translated yet renders the
 * English string rather than the key itself. That matters while coverage is still growing — a page
 * with an untranslated line is usable; a page reading `home.hero.headlineLine1` is not.
 */

export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

export const STORAGE_KEY = 'adz.language';
export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'ar';
}

export function directionOf(language: Language): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

/**
 * The language to start in.
 *
 * Storage only. There is deliberately no navigator/geolocation sniffing: English is the default
 * until somebody chooses otherwise, and a visitor in Beirut who wants English should not have to
 * change it back on every visit.
 */
export function storedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Private browsing, or storage disabled. Not a reason to fail to render.
  }
  return DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: storedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    // React escapes for us; doing it twice turns an apostrophe into `&#39;` on screen.
    escapeValue: false,
  },
});

export default i18n;
