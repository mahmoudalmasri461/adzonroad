import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TvIcon from '@mui/icons-material/Tv';
import SyncIcon from '@mui/icons-material/Sync';
import { advTokens, cardSx } from './theme';
import { SCREENS, CAMPAIGN_ANALYTICS } from '../../data/advertiserMockData';

export default function VerificationStatusCard() {
  const online = SCREENS.filter((s) => s.status === 'Online').length;
  const pendingSync = SCREENS.filter((s) => s.status === 'Pending Sync').length;
  const reconciled = SCREENS.length - online - pendingSync;

  const signals = [
    { icon: GpsFixedIcon, label: 'GPS verified', value: `${online + pendingSync}/${SCREENS.length}`, color: advTokens.green },
    { icon: PlayCircleIcon, label: 'Playback verified', value: `${online}/${SCREENS.length}`, color: advTokens.green },
    { icon: TvIcon, label: 'Screen status confirmed', value: `${SCREENS.length}/${SCREENS.length}`, color: advTokens.green },
    { icon: SyncIcon, label: 'Sync uptime', value: `${CAMPAIGN_ANALYTICS.screenUptimePercent}%`, color: advTokens.orange },
  ];

  const buckets = [
    { label: 'Live Verified', count: online, color: advTokens.green },
    { label: 'Pending Sync', count: pendingSync, color: advTokens.amber },
    { label: 'Reconciled Verified', count: reconciled, color: advTokens.blue },
  ];

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Trust &amp; verification
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Verified Delivery</Typography>

      <Box sx={{ display: 'grid', gap: '12px', mb: '18px' }}>
        {signals.map((s) => {
          const Icon = s.icon;
          return (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon sx={{ fontSize: 17, color: s.color }} />
                <Typography sx={{ fontSize: 13, color: advTokens.text }}>{s.label}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: advTokens.text }}>{s.value}</Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: '8px', pt: '14px', borderTop: `1px solid ${advTokens.border}` }}>
        {buckets.map((b) => (
          <Box key={b.label} sx={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: '10px', backgroundColor: advTokens.bg }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: b.color }}>{b.count}</Typography>
            <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted, fontWeight: 600 }}>{b.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
