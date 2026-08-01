import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import Logo from './Logo';
import { useToast } from './ToastProvider';
import { tokens } from '../theme';

export type SidebarNavItem = {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
};

type DashboardShellProps = {
  navItems: SidebarNavItem[];
  avatarInitials: string;
  userName: string;
  userSubtitle: string;
  children: ReactNode;
};

export default function DashboardShell({ navItems, avatarInitials, userName, userSubtitle, children }: DashboardShellProps) {
  const { showToast } = useToast();

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="aside"
        sx={{
          backgroundColor: tokens.navy,
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ px: '4px' }}>
          <Logo size="md" onDark />
        </Box>
        <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 14 }}>
          {navItems.map((item) => (
            <Box
              key={item.label}
              component={item.href ? RouterLink : 'a'}
              to={item.href}
              onClick={
                item.onClick ??
                (item.href || item.active ? undefined : () => showToast(`${item.label} isn't built in this preview yet`))
              }
              sx={{
                padding: '9px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: item.active ? 600 : 400,
                color: item.active ? '#fff' : 'rgba(255,255,255,0.6)',
                backgroundColor: item.active ? 'rgba(245,166,35,0.16)' : 'transparent',
                cursor: 'pointer',
                '&:hover': { color: '#fff' },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: tokens.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: tokens.navy,
              flexShrink: 0,
            }}
          >
            {avatarInitials}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{userName}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }} noWrap>
              {userSubtitle}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ padding: '28px 36px 48px', maxWidth: 1440, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
