import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { useToast } from '../../contexts/ToastProvider';
import { MOCK_ADVERTISER } from '../../data/advertiserMockData';

const NOTIFICATION_PREFS = [
  { key: 'campaign', label: 'Campaign status changes', description: 'Approvals, launches, pauses, and completions' },
  { key: 'screens', label: 'Screen alerts', description: 'When screens running your ads go offline' },
  { key: 'billing', label: 'Billing reminders', description: 'New invoices and payment due dates' },
  { key: 'reports', label: 'Weekly summary report', description: 'A delivery digest every Monday morning' },
];

function SettingsContent() {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState(MOCK_ADVERTISER.companyName);
  const [contactName, setContactName] = useState(MOCK_ADVERTISER.contactName);
  const [email, setEmail] = useState(MOCK_ADVERTISER.email);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ campaign: true, screens: true, billing: true, reports: false });

  return (
    <>
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Settings</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Company details and notification preferences.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', alignItems: 'start', mb: '24px' }}>
        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Account
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Company information</Typography>
          <Box sx={{ display: 'grid', gap: '16px' }}>
            <TextField label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
            <TextField label="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          </Box>
        </Box>

        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Notifications
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '10px' }}>Email preferences</Typography>
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
                  borderBottom: `1px solid ${advTokens.border}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: advTokens.text }}>{pref.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: advTokens.textMuted }}>{pref.description}</Typography>
                </Box>
                <Switch
                  checked={prefs[pref.key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [pref.key]: e.target.checked }))}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Button
        onClick={() => showToast('Settings saved (preview only — changes aren\'t stored)')}
        sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', px: '24px', '&:hover': { backgroundColor: advTokens.orangeHover } }}
      >
        Save changes
      </Button>
    </>
  );
}

export default function SettingsPage() {
  return (
    <AdvertiserLayout title="Settings">
      <SettingsContent />
    </AdvertiserLayout>
  );
}
