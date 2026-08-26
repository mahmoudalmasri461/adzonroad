import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import { useAlerts } from './AlertsContext';
import type { AlertSeverity } from '../../services/advertiserAlerts';

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  color: string;
  bg: string;
}> = {
  info: { icon: InfoOutlinedIcon, color: advTokens.blue, bg: '#EAF0FE' },
  warning: { icon: WarningAmberIcon, color: advTokens.amber, bg: '#FEF3E2' },
  critical: { icon: ErrorOutlineIcon, color: advTokens.red, bg: '#FDECEC' },
};

/**
 * Alerts derived from the account's own campaigns, delivery and invoices.
 *
 * There is no "success" tone any more. The fixture had one — "Summer Launch is 8% ahead of
 * schedule" — and a green congratulation in a list headed "what needs attention" is the kind of
 * detail that makes the whole panel read as decoration rather than as something to act on.
 */
export default function AlertsCard() {
  const { alerts, ready } = useAlerts();

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        What needs attention
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>
        Campaign Alerts
      </Typography>

      {!ready && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {ready && alerts.length === 0 && (
        <EmptyState title="Nothing needs attention" description="No campaign, delivery or billing issue is outstanding." />
      )}

      {ready && alerts.length > 0 && (
        <Box sx={{ display: 'grid', gap: '10px' }}>
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            const Icon = config.icon;

            return (
              <Box
                key={alert.id}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '10px', backgroundColor: config.bg }}
              >
                <Icon style={{ fontSize: 18, color: config.color, marginTop: 1 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>{alert.message}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mt: '2px' }}>{alert.detail}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
