import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '../layouts/AuthShell';
import { ADVERTISER_SUPPORT_CONTACT } from '../data/supportContact';
import { tokens } from '../theme';
import DirArrow from '../components/DirArrow';

/**
 * What to do about a forgotten password.
 *
 * There is no reset form here, and the page says so rather than collecting an email address and
 * implying one is coming. AdzOnRoad has no email provider wired up, so a self-service flow would
 * mint a reset token it has no way to deliver — the same reason the administrator-issued temporary
 * password exists at all (see AdminUsersController.ResetPassword). A form that appears to send a
 * message nobody sends is worse than an honest dead end: the person waits for an email, blames
 * their spam folder, and never calls the number that would have taken thirty seconds.
 *
 * The role tabs are gone. Recovery is the same conversation whoever is asking, and making someone
 * classify their own account before they can find a phone number was a question asked for the
 * page's benefit rather than theirs.
 *
 * Contact details come from the shared constant rather than being typed in here, so the address
 * and number stay in one place. Only the heading is local: the constant is named "AdzOnRoad
 * Advertiser Support" because it is the advertiser support line elsewhere in the product, and
 * recovery is not an advertiser-only errand.
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const contact = ADVERTISER_SUPPORT_CONTACT;

  return (
    <AuthShell
      eyebrow={t('auth.forgot.eyebrow')}
      headline={
        <>
          {t('auth.forgot.brandHeadlineLine1')}
          <Box component="span" sx={{ display: 'block' }}>
            {t('auth.forgot.brandHeadlineLine2')}
          </Box>
        </>
      }
      copy={t('auth.forgot.brandCopy')}
      footerTitle={t('auth.brand.builtForLebanon')}
      footerCopy={t('auth.forgot.footerCopy')}
      align="center"
      contentMaxWidth={480}
      backLabelKey="common.backToSignIn"
      backTo="/login"
    >
      <Typography
        component="h1"
        sx={{ fontWeight: 800, fontSize: { xs: 27, md: 33 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
      >
        {t('auth.forgot.title')}
      </Typography>
      <Typography sx={{ mt: '10px', fontSize: 15, color: 'text.secondary', lineHeight: 1.65 }}>
        {t('auth.forgot.subtitle')}
      </Typography>

      <Box sx={{ my: { xs: '26px', md: '30px' }, borderTop: '1px solid #E9E3D9' }} />

      <SectionLabel>{t('auth.forgot.secureRecovery')}</SectionLabel>
      <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
        {t('auth.forgot.secureRecoveryBody1')}
      </Typography>
      <Typography sx={{ mt: '10px', fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
        {t('auth.forgot.secureRecoveryBody2')}
      </Typography>

      <Box sx={{ mt: { xs: '26px', md: '30px' } }}>
        <SectionLabel>{t('auth.forgot.contactSupport')}</SectionLabel>
        <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7, mb: '18px' }}>
          {t('auth.forgot.contactSupportBody')}
        </Typography>

        <Button
          href={`mailto:${contact.email}?subject=${encodeURIComponent(t('auth.forgot.mailSubject'))}`}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ minHeight: 52, borderRadius: '11px', fontSize: 15.5 }}
        >
          {t('auth.forgot.contactButton')}
          <Box component="span" aria-hidden sx={{ ml: '9px', fontSize: 16, lineHeight: 1 }}>
            <DirArrow />
          </Box>
        </Button>

        {/* The same two details the button uses, spelled out — somebody phoning from another
            device needs to read them, not click them. Listed rather than boxed. */}
        <Box
          sx={{
            mt: '22px',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: '16px', sm: '24px' },
          }}
        >
          <ContactDetail label={t('common.email')} value={contact.email} href={`mailto:${contact.email}`} />
          <ContactDetail
            label={t('common.phone')}
            value={contact.phone}
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
          />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: '28px', md: '34px' }, pt: '20px', borderTop: '1px solid #E9E3D9' }}>
        {/* True of the process as it stands: a person issues a temporary password, and nobody is
            ever asked for the one they already have. */}
        <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
          {t('auth.forgot.neverAsk')}
        </Typography>

        {/* Kept because it is the one case support cannot resolve: an administrator's account is
            held by their own organisation, so this line saves them a call that goes nowhere. */}
        <Typography sx={{ mt: '8px', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
          {t('auth.forgot.adminNote')}
        </Typography>

        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{
            display: 'inline-block',
            mt: '16px',
            fontSize: 13.5,
            fontWeight: 600,
            color: tokens.navy,
            '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '3px', borderRadius: '4px' },
          }}
        >
          {t('auth.forgot.returnHome')} <DirArrow />
        </Link>
      </Box>
    </AuthShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: tokens.amber,
        mb: '10px',
      }}
    >
      {children}
    </Typography>
  );
}

function ContactDetail({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: tokens.textMuted, mb: '5px' }}
      >
        {label}
      </Typography>
      <Link
        href={href}
        underline="hover"
        sx={{
          fontSize: 14.5,
          fontWeight: 600,
          color: tokens.navy,
          wordBreak: 'break-word',
          '&:hover': { color: tokens.amber600 },
          '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '3px', borderRadius: '4px' },
        }}
      >
        {value}
      </Link>
    </Box>
  );
}
