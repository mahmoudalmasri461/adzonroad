import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { tokens } from '../theme';
import DirArrow from '../components/DirArrow';

/**
 * The frame both authentication pages sit in.
 *
 * Extracted so signing in and signing up cannot drift apart. They were separate designs before,
 * and the shared parts — the navy panel, the field styling, the label-above-input pattern — are
 * exactly the parts that would have diverged first.
 *
 * It replaced `AuthLayout`, which the three authentication pages all used to share and which
 * no longer had a caller once recovery moved across. That file carried the last role tabs in the
 * product, including the one still labelled "Taxi Company".
 */

/** The chain the brand panel draws. Keys, not words — four figures-free labels. */
const NETWORK_FLOW = ['flowCampaign', 'flowVehicle', 'flowLocation', 'flowDelivery'] as const;

export const AUTH_PANEL_BG = '#FAF8F4';

/**
 * Inputs are 50px with an 11px radius, rather than the theme's taller default and 14px corners.
 * Registration is the longest stack of fields in the product, and the default height put the
 * driver form well past two screens.
 */
export const authFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 50,
    borderRadius: '11px',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: '#DFE3EA' },
    '&:hover fieldset': { borderColor: '#C3CAD6' },
    '&.Mui-focused fieldset': { borderColor: tokens.amber, borderWidth: '1.5px' },
  },
  '& .MuiOutlinedInput-input': { fontSize: 14.5 },
} as const;

/**
 * A visible label above its field.
 *
 * Placeholders alone vanish the moment someone types, which on a long form means a filled field no
 * longer says what it holds. `htmlFor` is why every caller passes an explicit id.
 */
export function AuthField({
  id,
  label,
  required,
  optional,
  hint,
  action,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  /** Rendered on the label row, right-aligned — the "Forgot password?" slot. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', mb: '7px' }}>
        <Typography
          component="label"
          htmlFor={id}
          sx={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.navy }}
        >
          {label}
          {required && (
            <Box component="span" aria-hidden sx={{ ml: '3px', color: tokens.amber600 }}>
              *
            </Box>
          )}
          {optional && (
            <Box component="span" sx={{ ml: '5px', fontWeight: 500, color: tokens.textMuted }}>
              (optional)
            </Box>
          )}
        </Typography>
        {action}
      </Box>
      {children}
      {hint && (
        <Typography sx={{ mt: '7px', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

type AuthShellProps = {
  eyebrow: string;
  /** Two lines usually — passed as nodes so each page controls its own break. */
  headline: ReactNode;
  copy: string;
  footerTitle: string;
  footerCopy: string;
  /** Login centres its short form; signup starts at the top because it scrolls. */
  align?: 'start' | 'center';
  contentMaxWidth?: number;
  /** Hidden on the confirmation screens, which offer the same destination as a button. */
  showBackLink?: boolean;
  /** Recovery goes back to sign-in rather than to the homepage. */
  /** A translation key, resolved here so callers do not each have to call useTranslation. */
  backLabelKey?: string;
  backTo?: string;
  children: ReactNode;
};

export default function AuthShell({
  eyebrow,
  headline,
  copy,
  footerTitle,
  footerCopy,
  align = 'start',
  contentMaxWidth = 600,
  showBackLink = true,
  backLabelKey = 'common.backToHomepage',
  backTo = '/',
  children,
}: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '44fr 56fr' },
        backgroundColor: AUTH_PANEL_BG,
      }}
    >
      <BrandPanel eyebrow={eyebrow} headline={headline} copy={copy} footerTitle={footerTitle} footerCopy={footerCopy} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          alignItems: 'center',
          px: { xs: '20px', sm: '32px', md: '56px' },
          py: { xs: '28px', md: '48px' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: contentMaxWidth }}>
          {/* At the top, where someone decides to leave — not floating under the whole form. */}
          <Link
            component={RouterLink}
            to={backTo}
            underline="none"
            sx={{
              display: showBackLink ? 'inline-flex' : 'none',
              alignItems: 'center',
              gap: '7px',
              fontSize: 13.5,
              fontWeight: 500,
              color: tokens.textMuted,
              mb: { xs: '22px', md: '34px' },
              '&:hover': { color: tokens.navy },
              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '3px', borderRadius: '4px' },
            }}
          >
            <Box component="span" aria-hidden>
              <DirArrow back />
            </Box>
            {t(backLabelKey)}
          </Link>

          {children}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The navy half.
 *
 * Collapses to a compact header on a phone rather than a half-screen of decoration: the form is
 * what someone came for, and it should be the first thing under the logo.
 */
function BrandPanel({
  eyebrow,
  headline,
  copy,
  footerTitle,
  footerCopy,
}: {
  eyebrow: string;
  headline: ReactNode;
  copy: string;
  footerTitle: string;
  footerCopy: string;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        backgroundColor: tokens.navy,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: '20px', sm: '32px', md: '52px' },
        py: { xs: '26px', md: '48px' },
      }}
    >
      {/* The full logo is black type with an orange car, so it disappears on navy. Rendered as a
          mono-white version of the real mark rather than swapped for the icon on its own. */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <Box sx={{ filter: 'brightness(0) invert(1)', width: 'fit-content' }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Logo size="md" />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Logo size="lg" />
          </Box>
        </Box>
        {/* Reachable before signing in, which is the one place somebody cannot open a settings
            menu to find it. */}
        <LanguageSwitcher variant="dark" />
      </Box>

      <Box sx={{ mt: { xs: '20px', md: '64px' }, flex: { md: 1 } }}>
        <Typography
          sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.amber, mb: { xs: '10px', md: '16px' } }}
        >
          {eyebrow}
        </Typography>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 24, md: 'clamp(30px,3vw,40px)' },
            lineHeight: 1.08,
            letterSpacing: '-0.032em',
            color: '#fff',
          }}
        >
          {headline}
        </Typography>

        <Typography
          sx={{
            mt: { xs: '12px', md: '18px' },
            fontSize: { xs: 14, md: 15 },
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '42ch',
          }}
        >
          {copy}
        </Typography>

        {/* Campaign to delivery, drawn rather than described. Hidden on a phone, where it would
            sit between someone and the form. */}
        <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' }, mt: '52px' }}>
          {NETWORK_FLOW.map((step, i) => (
            <Box key={step} sx={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10 }}>
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    mt: '6px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: i === 0 || i === NETWORK_FLOW.length - 1 ? tokens.amber : 'transparent',
                    border: i === 0 || i === NETWORK_FLOW.length - 1 ? 'none' : '1.25px solid rgba(255,255,255,0.42)',
                  }}
                />
                {i < NETWORK_FLOW.length - 1 && (
                  <Box sx={{ width: '1px', flex: 1, minHeight: 30, mt: '5px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </Box>
              <Typography
                sx={{
                  pb: i < NETWORK_FLOW.length - 1 ? '16px' : 0,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {t(`auth.brand.${step}`)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' }, mt: '40px', pt: '26px', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
        <Typography
          sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber, mb: '8px' }}
        >
          {footerTitle}
        </Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', maxWidth: '38ch' }}>
          {footerCopy}
        </Typography>
      </Box>
    </Box>
  );
}
