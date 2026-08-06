import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SyncIcon from '@mui/icons-material/Sync';
import BuildIcon from '@mui/icons-material/Build';
import { advTokens } from './theme';
import type { CampaignStatus, ScreenStatus } from '../../types/advertiser';

type Status = CampaignStatus | ScreenStatus;

const CONFIG: Record<Status, { color: string; bg: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }> = {
  Draft: { color: advTokens.textMuted, bg: '#F0F1F3', icon: EditIcon },
  'Pending Approval': { color: advTokens.amber, bg: '#FEF3E2', icon: HourglassTopIcon },
  Scheduled: { color: advTokens.blue, bg: '#EAF0FE', icon: ScheduleIcon },
  Active: { color: advTokens.green, bg: '#E9F9EF', icon: CheckCircleIcon },
  Paused: { color: advTokens.amber, bg: '#FEF3E2', icon: PauseCircleIcon },
  Completed: { color: advTokens.textMuted, bg: '#F0F1F3', icon: DoneAllIcon },
  Rejected: { color: advTokens.red, bg: '#FDECEC', icon: CancelIcon },
  Online: { color: advTokens.green, bg: '#E9F9EF', icon: WifiIcon },
  Offline: { color: advTokens.red, bg: '#FDECEC', icon: WifiOffIcon },
  Inactive: { color: advTokens.textMuted, bg: '#F0F1F3', icon: RadioButtonUncheckedIcon },
  'Pending Sync': { color: advTokens.amber, bg: '#FEF3E2', icon: SyncIcon },
  Maintenance: { color: advTokens.blue, bg: '#EAF0FE', icon: BuildIcon },
};

export default function StatusChip({ status, size = 'medium' }: { status: Status; size?: 'small' | 'medium' }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  const compact = size === 'small';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '4px' : '6px',
        padding: compact ? '3px 8px' : '4px 10px',
        borderRadius: 999,
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: compact ? 11.5 : 12.5,
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon style={{ fontSize: compact ? 13 : 15 }} />
      {status}
    </Box>
  );
}
