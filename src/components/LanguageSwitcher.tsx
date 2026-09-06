import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageProvider';
import { LANGUAGES, type Language } from '../i18n';
import { tokens } from '../theme';

/**
 * EN | العربية.
 *
 * A radiogroup rather than a select: there are two options and both fit on screen, so a dropdown
 * would hide half the choice behind a click and look like a form field on a page that has none.
 *
 * `lang` on each option matters — without it a screen reader in English mode reads "العربية"
 * with an English voice, which produces nothing a person can act on.
 */
export default function LanguageSwitcher({
  variant = 'light',
}: {
  /** `dark` for the navy dashboard headers, `light` for the white public navbar. */
  variant?: 'light' | 'dark';
}) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const onDark = variant === 'dark';
  const idle = onDark ? 'rgba(255,255,255,0.62)' : tokens.textMuted;
  const activeColor = onDark ? '#fff' : tokens.navy;

  return (
    <Box
      role="radiogroup"
      aria-label={t('language.label')}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px',
        borderRadius: '999px',
        border: `1px solid ${onDark ? 'rgba(255,255,255,0.18)' : tokens.border}`,
      }}
    >
      {LANGUAGES.map((code: Language) => {
        const selected = code === language;
        return (
          <Box
            key={code}
            component="button"
            type="button"
            role="radio"
            lang={code}
            aria-checked={selected}
            data-selected={selected ? 'true' : undefined}
            onClick={() => setLanguage(code)}
            title={code === 'ar' ? t('language.arFull') : t('language.enFull')}
            sx={{
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: 0,
              background: 'none',
              padding: '4px 11px',
              borderRadius: '999px',
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.4,
              color: idle,
              transition: 'background-color .18s ease, color .18s ease',
              '&:hover': { color: activeColor },
              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
              '&[data-selected="true"]': {
                color: onDark ? tokens.navy : tokens.navy,
                backgroundColor: tokens.amber,
              },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            {t(`language.${code}`)}
          </Box>
        );
      })}
    </Box>
  );
}
