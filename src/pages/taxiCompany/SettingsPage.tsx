import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { SUPPORT_CONTACT } from '../../data/supportContact';
import { tokens } from '../../theme';

const NOTIFICATION_PREFS = [
  { key: 'screens', label: 'Screen alerts', description: 'When a screen in your fleet goes offline or loses GPS' },
  { key: 'payouts', label: 'Payout notifications', description: 'When a monthly payout is processed' },
  { key: 'maintenance', label: 'Maintenance updates', description: 'Status changes on damage reports and maintenance requests' },
  { key: 'drivers', label: 'Driver document reminders', description: 'When a driver is missing an ID or license image' },
];

export default function SettingsPage() {
  const { profile, loading, error } = useFleet();

  // Local only, and labelled as such below. There is no preferences endpoint yet, and a switch
  // that silently forgets is worse than one that says it does.
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    screens: true,
    payouts: true,
    maintenance: true,
    drivers: false,
  });

  const verified = profile?.verificationStatus === 'Approved';

  return (
    <>
      <PageHeader title="Settings" subtitle="Company details and notification preferences." />

      {error && <Alert severity="error" sx={{ mb: '20px' }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', alignItems: 'start', mb: '24px' }}>
        <Card sx={{ p: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                Account
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Company information</Typography>
            </Box>
            {profile && (
              <StatusTag
                label={verified ? 'Verified' : profile.verificationStatus}
                variant={verified ? 'live' : 'warn'}
              />
            )}
          </Box>

          {loading && !profile ? (
            <Box sx={{ display: 'grid', gap: '16px' }}>
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={52} />)}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: '16px' }}>
              {/* Read-only: these are the details AdzOnRoad verified your company against, and
                  there is no endpoint to change them without re-verification. */}
              <TextField label="Company name" value={profile?.companyName ?? ''} fullWidth disabled />
              <TextField label="Email" value={profile?.email ?? ''} fullWidth disabled />
              <TextField label="Mobile number" value={profile?.mobileNumber ?? ''} fullWidth disabled />
              <TextField label="Region" value={profile?.region ?? 'Not set'} fullWidth disabled />

              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                These are the details your company was verified against. To change them, contact{' '}
                <a href={`mailto:${SUPPORT_CONTACT.email}`} style={{ color: tokens.blue }}>
                  {SUPPORT_CONTACT.email}
                </a>
                .
              </Typography>
            </Box>
          )}
        </Card>

        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Notifications
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '10px' }}>Email preferences</Typography>

          <Alert severity="info" sx={{ mb: '12px', fontSize: 12.5 }}>
            Email notifications are not sending yet — there is no mail provider connected. These
            switches are a preview and are not saved.
          </Alert>

          <Box sx={{ display: 'grid', gap: '4px' }}>
            {NOTIFICATION_PREFS.map((pref) => (
              <Box
                key={pref.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: `1px solid ${tokens.border}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{pref.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{pref.description}</Typography>
                </Box>
                <Switch
                  checked={prefs[pref.key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [pref.key]: e.target.checked }))}
                />
              </Box>
            ))}
          </Box>
        </Card>
      </Box>
    </>
  );
}
