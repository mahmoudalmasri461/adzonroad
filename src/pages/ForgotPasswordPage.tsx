import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import AuthShell from '../layouts/AuthShell';
import { ADVERTISER_SUPPORT_CONTACT } from '../data/supportContact';
import { tokens } from '../theme';

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
  const contact = ADVERTISER_SUPPORT_CONTACT;

  return (
    <AuthShell
      eyebrow="Account access"
      headline={
        <>
          We&rsquo;ll help you
          <Box component="span" sx={{ display: 'block' }}>
            get back in.
          </Box>
        </>
      }
      copy="Account recovery is handled securely by the AdzOnRoad team."
      footerTitle="Built for Lebanon"
      footerCopy="Moving digital advertising, designed around the city."
      align="center"
      contentMaxWidth={480}
      backLabel="Back to sign in"
      backTo="/login"
    >
      <Typography
        component="h1"
        sx={{ fontWeight: 800, fontSize: { xs: 27, md: 33 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
      >
        Forgot your password?
      </Typography>
      <Typography sx={{ mt: '10px', fontSize: 15, color: 'text.secondary', lineHeight: 1.65 }}>
        Contact our team and we&rsquo;ll help you securely regain access to your AdzOnRoad account.
      </Typography>

      <Box sx={{ my: { xs: '26px', md: '30px' }, borderTop: '1px solid #E9E3D9' }} />

      <SectionLabel>Secure account recovery</SectionLabel>
      <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
        For your security, password recovery is currently handled directly by the AdzOnRoad team.
      </Typography>
      <Typography sx={{ mt: '10px', fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
        Once your identity is confirmed, you&rsquo;ll receive temporary access and create a new
        password when you sign in.
      </Typography>

      <Box sx={{ mt: { xs: '26px', md: '30px' } }}>
        <SectionLabel>Contact support</SectionLabel>
        <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7, mb: '18px' }}>
          Get in touch with our team to recover your account.
        </Typography>

        <Button
          href={`mailto:${contact.email}?subject=${encodeURIComponent('AdzOnRoad account recovery')}`}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ minHeight: 52, borderRadius: '11px', fontSize: 15.5 }}
        >
          Contact AdzOnRoad Support
          <Box component="span" aria-hidden sx={{ ml: '9px', fontSize: 16, lineHeight: 1 }}>
            &rarr;
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
          <ContactDetail label="Email" value={contact.email} href={`mailto:${contact.email}`} />
          <ContactDetail
            label="Phone"
            value={contact.phone}
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
          />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: '28px', md: '34px' }, pt: '20px', borderTop: '1px solid #E9E3D9' }}>
        {/* True of the process as it stands: a person issues a temporary password, and nobody is
            ever asked for the one they already have. */}
        <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
          AdzOnRoad will never ask you to send your existing password by email.
        </Typography>

        {/* Kept because it is the one case support cannot resolve: an administrator's account is
            held by their own organisation, so this line saves them a call that goes nowhere. */}
        <Typography sx={{ mt: '8px', fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.6 }}>
          Administrators: your password is reset by another administrator in your organisation,
          from Settings &rarr; Users.
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
          Return to AdzOnRoad homepage &rarr;
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
