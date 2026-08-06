import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import { NOTIFICATIONS } from '../../data/advertiserMockData';
import type { AlertSeverity } from '../../types/advertiser';

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ComponentType<{ style?: React.CSSProperties }>; color: string; bg: string }> = {
  info: { icon: InfoOutlinedIcon, color: advTokens.blue, bg: '#EAF0FE' },
  warning: { icon: WarningAmberIcon, color: advTokens.amber, bg: '#FEF3E2' },
  success: { icon: CheckCircleOutlineIcon, color: advTokens.green, bg: '#E9F9EF' },
  critical: { icon: ErrorOutlineIcon, color: advTokens.red, bg: '#FDECEC' },
};

export default function AlertsCard() {
  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        What needs attention
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>Campaign Alerts</Typography>

      {NOTIFICATIONS.length === 0 ? (
        <EmptyState title="No alerts" description="You're all caught up — nothing needs attention right now." />
      ) : (
        <Box sx={{ display: 'grid', gap: '10px' }}>
          {NOTIFICATIONS.map((n) => {
            const cfg = SEVERITY_CONFIG[n.severity];
            const Icon = cfg.icon;
            return (
              <Box key={n.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '10px', backgroundColor: cfg.bg }}>
                <Icon style={{ fontSize: 18, color: cfg.color, marginTop: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>{n.message}</Typography>
                  <Typography sx={{ fontSize: 11, color: advTokens.textMuted, mt: '2px' }}>{n.timestamp}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
