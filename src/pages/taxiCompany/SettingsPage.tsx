import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { useToast } from '../../contexts/ToastProvider';
import { MOCK_TAXI_COMPANY } from '../../data/taxiCompanyMockData';
import { LEBANON_REGIONS } from '../../data/lebanonRegions';
import { tokens } from '../../theme';

const NOTIFICATION_PREFS = [
  { key: 'screens', label: 'Screen alerts', description: 'When a screen in your fleet goes offline or loses GPS' },
  { key: 'payouts', label: 'Payout notifications', description: 'When a monthly payout is processed' },
  { key: 'maintenance', label: 'Maintenance updates', description: 'Status changes on damage reports and maintenance requests' },
  { key: 'drivers', label: 'Driver document reminders', description: 'When a driver is missing an ID or license image' },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState(MOCK_TAXI_COMPANY.companyName);
  const [email, setEmail] = useState(MOCK_TAXI_COMPANY.email);
  const [mobile, setMobile] = useState(MOCK_TAXI_COMPANY.mobileNumber);
  const [region, setRegion] = useState(MOCK_TAXI_COMPANY.region);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ screens: true, payouts: true, maintenance: true, drivers: false });

  return (
    <>
      <PageHeader title="Settings" subtitle="Company details and notification preferences." />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', alignItems: 'start', mb: '24px' }}>
        <Card sx={{ p: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                Account
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Company information</Typography>
            </Box>
            <StatusTag
              label={MOCK_TAXI_COMPANY.verificationStatus}
              variant={MOCK_TAXI_COMPANY.verificationStatus === 'Verified' ? 'live' : 'warn'}
            />
          </Box>
          <Box sx={{ display: 'grid', gap: '16px' }}>
            <TextField label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} fullWidth />
            <TextField label="Region" select value={region} onChange={(e) => setRegion(e.target.value)} fullWidth>
              {LEBANON_REGIONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Card>

        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Notifications
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '10px' }}>Email preferences</Typography>
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
                <Switch checked={prefs[pref.key]} onChange={(e) => setPrefs((p) => ({ ...p, [pref.key]: e.target.checked }))} />
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      <Button variant="contained" color="primary" onClick={() => showToast("Settings saved (preview only — changes aren't stored)")}>
        Save changes
      </Button>
    </>
  );
}
