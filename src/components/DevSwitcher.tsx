import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { tokens } from '../theme';

const SCREENS = [
  { to: '/', label: 'Homepage', activeOn: ['/'] },
  { to: '/login?role=advertiser', label: 'Advertiser', activeOn: ['/advertiser'] },
  { to: '/login?role=admin', label: 'Admin', activeOn: ['/admin'] },
  { to: '/login?role=driver', label: 'Driver', activeOn: ['/driver'] },
  { to: '/login?role=taxiCompany', label: 'Taxi Company', activeOn: ['/taxi-company'] },
];

export default function DevSwitcher() {
  const location = useLocation();
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 10, sm: 16 },
        right: { xs: 10, sm: 16 },
        // Five labels are wider than a phone, so the pill spans the screen and scrolls instead of
        // running off the left edge.
        left: { xs: 10, sm: 'auto' },
        zIndex: 1300,
        display: 'flex',
        gap: '4px',
        backgroundColor: tokens.navy,
        borderRadius: '999px',
        padding: '6px',
        boxShadow: tokens.shadowLg,
        maxWidth: 'calc(100vw - 20px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {SCREENS.map((screen) => {
        const active = screen.activeOn.some((path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)));
        return (
          <Box
            key={screen.to}
            component={Link}
            to={screen.to}
            sx={{
              textDecoration: 'none',
              fontSize: { xs: 11.5, sm: 12.5 },
              fontWeight: 600,
              padding: { xs: '6px 10px', sm: '7px 14px' },
              flexShrink: 0,
              borderRadius: '999px',
              color: active ? tokens.navy : 'rgba(255,255,255,0.7)',
              backgroundColor: active ? tokens.amber : 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {screen.label}
          </Box>
        );
      })}
    </Box>
  );
}
