import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { useToast } from '../contexts/ToastProvider';
import { tokens } from '../theme';

const TABS = [
  { label: 'Home', icon: HomeRoundedIcon },
  { label: 'Earnings', icon: PaidRoundedIcon },
  { label: 'Activity', icon: TimelineRoundedIcon },
  { label: 'Vehicle', icon: DirectionsCarRoundedIcon },
  { label: 'Support', icon: SupportAgentRoundedIcon },
];

type BottomTabBarProps = {
  active?: string;
};

export default function BottomTabBar({ active = 'Home' }: BottomTabBarProps) {
  const { showToast } = useToast();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        backgroundColor: '#fff',
        borderTop: `1px solid ${tokens.border}`,
        padding: '8px 4px 12px',
      }}
    >
      {TABS.map(({ label, icon: Icon }) => {
        const isActive = label === active;
        return (
          <Box
            key={label}
            component="button"
            onClick={() => (isActive ? undefined : showToast(`${label} isn't built in this preview yet`))}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: isActive ? tokens.navy : tokens.textMuted,
              cursor: 'pointer',
              background: 'none',
              border: 0,
              font: 'inherit',
              padding: 0,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 10.5, fontWeight: isActive ? 600 : 400 }}>{label}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
