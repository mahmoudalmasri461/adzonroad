import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import {
  describeAccountStatus,
  fetchAdvertiserProfile,
  type AdvertiserProfile,
} from '../../services/advertiser';
import { ADVERTISER_SUPPORT_CONTACT } from '../../data/supportContact';

/**
 * The account, as the platform holds it.
 *
 * This page used to render three editable fields against a fixture company — "Cedar Retail
 * Group" — and a Save button that showed a toast and stored nothing. Both halves were wrong: the
 * details belonged to nobody, and the button implied a write path that does not exist.
 *
 * What replaced them is the real record, read-only, with the reason it is read-only stated on the
 * page. Notification preferences are gone entirely rather than rendered as switches: the platform
 * sends no email to anybody, so there is no preference to express.
 */
function SettingsContent() {
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchAdvertiserProfile(controller.signal)
      .then((loaded) => { if (!controller.signal.aborted) setProfile(loaded); })
      .catch(() => { if (!controller.signal.aborted) setError('Could not load your account details.'); });

    return () => controller.abort();
  }, []);

  return (
    <>
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Settings</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Your account, as it was registered and approved.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', alignItems: 'start' }}>
        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Account
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>
            Company information
          </Typography>

          {error && <Alert severity="info" sx={{ fontSize: 13 }}>{error}</Alert>}

          {!profile && !error && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
              <CircularProgress size={20} />
            </Box>
          )}

          {profile && (
            <>
              <Box sx={{ display: 'grid', gap: '2px' }}>
                <Field label="Company name" value={profile.companyName} />
                <Field label="Contact name" value={profile.contactName} />
                <Field label="Email" value={profile.email} />
                <Field label="Mobile number" value={profile.mobileNumber ?? 'Not provided'} />
                <Field label="Account status" value={describeAccountStatus(profile.verificationStatus)} />
                <Field label="Registered" value={formatDate(profile.createdAtUtc)} />
              </Box>

              <Typography sx={{ mt: '16px', fontSize: 12.5, color: advTokens.textMuted }}>
                These are the details your account was approved against. Changing them needs a
                review, which is not something the portal can do on its own — email support and
                they will make the change.
              </Typography>

              <Button
                href={`mailto:${ADVERTISER_SUPPORT_CONTACT.email}?subject=${encodeURIComponent(`Account details change — ${profile.companyName}`)}`}
                sx={{ mt: '14px', backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', px: '20px', '&:hover': { backgroundColor: advTokens.orangeHover } }}
              >
                Request a change
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Notifications
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '10px' }}>
            Email preferences
          </Typography>
          <Typography sx={{ fontSize: 13, color: advTokens.textMuted }}>
            The platform does not send email. There is no mail or SMS provider connected to it, so
            campaign approvals, screen alerts and invoices all appear here rather than arriving in
            an inbox — and there is nothing to switch on or off yet.
          </Typography>
          <Typography sx={{ mt: '12px', fontSize: 13, color: advTokens.textMuted }}>
            The bell in the top bar carries the same alerts an email would, derived from your own
            campaigns, delivery and invoices.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 0',
        borderBottom: `1px solid ${advTokens.border}`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography sx={{ fontSize: 12.5, color: advTokens.textMuted, flexShrink: 0 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: advTokens.text, textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? iso
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SettingsPage() {
  return (
    <AdvertiserLayout title="Settings">
      <SettingsContent />
    </AdvertiserLayout>
  );
}
