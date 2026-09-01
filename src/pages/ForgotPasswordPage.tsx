import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import { Link as RouterLink } from 'react-router-dom';
import AuthLayout, { type AuthRole } from '../layouts/AuthLayout';
import { SUPPORT_CONTACT, ADVERTISER_SUPPORT_CONTACT } from '../data/supportContact';
import type { SupportContact } from '../types/taxiCompany';
import { tokens } from '../theme';

function isAuthRole(value: string | null): value is AuthRole {
  return value === 'advertiser' || value === 'admin' || value === 'driver' || value === 'taxiCompany';
}

/**
 * Who actually restores access, per role.
 *
 * `contact` is null for admins on purpose: an administrator's account is held by whoever runs
 * their organisation, and pointing them at AdzOnRoad's support line would send them to people
 * who cannot help. Everyone else reaches the support line that already exists for their
 * audience — a fleet asks about a driver, an advertiser about their own login.
 */
const RECOVERY: Record<AuthRole, { who: string; contact: SupportContact | null }> = {
  advertiser: {
    who: 'An AdzOnRoad administrator issues you a new temporary password.',
    contact: ADVERTISER_SUPPORT_CONTACT,
  },
  admin: {
    who: 'Another administrator in your organisation resets it from Settings → Users.',
    contact: null,
  },
  driver: {
    who: 'Your taxi company arranges it with AdzOnRoad, who issue a new temporary password.',
    contact: SUPPORT_CONTACT,
  },
  taxiCompany: {
    who: 'An AdzOnRoad administrator issues you a new temporary password.',
    contact: SUPPORT_CONTACT,
  },
};

/**
 * What to do about a forgotten password.
 *
 * There is no reset link here, and the page says so rather than collecting an email address and
 * implying one is coming. AdzOnRoad has no email provider wired up, so a self-service flow would
 * mint a reset token it has no way to deliver — the same reason the administrator-issued
 * temporary password exists at all (see AdminUsersController.ResetPassword). A form that appears
 * to send a message nobody sends is worse than an honest dead end: the person waits for an email,
 * blames their spam folder, and never calls the number that would have taken thirty seconds.
 *
 * If an email provider is added later, this page is the right place for the request form, and the
 * role tabs already carry the distinction the flow would need.
 */
export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<AuthRole>(isAuthRole(initialRole) ? initialRole : 'advertiser');

  const { who, contact } = RECOVERY[role];

  return (
    <AuthLayout
      title="Forgotten password"
      subtitle="How to get back into your account"
      role={role}
      onRoleChange={setRole}
      roles={['advertiser', 'admin', 'driver', 'taxiCompany']}
      // The button below already goes back to sign in, so the footer earns its place by covering
      // the case the page cannot answer — an admin whose own organisation has nobody left to ask.
      footerText="Not sure who to ask?"
      footerLinkText="Contact AdzOnRoad"
      footerLinkTo="/#contact"
    >
      <Box sx={{ display: 'grid', gap: '18px' }}>
        <Alert severity="info" sx={{ fontSize: 13 }}>
          AdzOnRoad does not send password reset emails. Passwords are reset by a person, so that
          nobody can take an account over from an inbox alone.
        </Alert>

        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, mb: '6px' }}>What happens</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.65 }}>
            {who} You sign in with it once, and the app asks you to replace it before you can go
            anywhere else — so a password read out loud stops working the moment you have used it.
          </Typography>
        </Box>

        {contact && (
          <Box
            sx={{
              border: `1px solid ${tokens.border}`,
              borderRadius: '14px',
              padding: '16px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{contact.name}</Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{contact.role}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <EmailRoundedIcon sx={{ fontSize: 17, color: tokens.blue, flexShrink: 0 }} />
              <Link href={`mailto:${contact.email}`} underline="hover" sx={{ fontSize: 13.5 }}>
                {contact.email}
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <PhoneRoundedIcon sx={{ fontSize: 17, color: tokens.blue, flexShrink: 0 }} />
              <Link href={`tel:${contact.phone.replace(/\s/g, '')}`} underline="hover" sx={{ fontSize: 13.5 }}>
                {contact.phone}
              </Link>
            </Box>
          </Box>
        )}

        <Button
          component={RouterLink}
          to={`/login?role=${role}`}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
        >
          Back to sign in
        </Button>
      </Box>
    </AuthLayout>
  );
}
