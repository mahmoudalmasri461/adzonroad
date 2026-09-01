import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import Logo from '../components/Logo';
import { useToast } from '../contexts/ToastProvider';
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

const SIDEBAR_WIDTH = 240;

/**
 * The sidebar body, rendered twice — docked beside the content from `lg` up, and inside a
 * temporary Drawer below it. It is one component rather than two so a nav item added to the
 * console can never appear on desktop and go missing on a phone.
 */
function Sidebar({
  navItems,
  avatarInitials,
  userName,
  userSubtitle,
  onNavigate,
}: Omit<DashboardShellProps, 'children'> & { onNavigate?: () => void }) {
  const { showToast } = useToast();

  return (
    <Box
      sx={{
        backgroundColor: tokens.navy,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        width: SIDEBAR_WIDTH,
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
            onClick={() => {
              if (item.onClick) item.onClick();
              else if (!item.href && !item.active) showToast(`${item.label} isn't built in this preview yet`);
              onNavigate?.();
            }}
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
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#fff' }} noWrap>
            {userName}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }} noWrap>
            {userSubtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function DashboardShell({ navItems, avatarInitials, userName, userSubtitle, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Named in the mobile bar, since the sidebar that would otherwise show it is behind the menu. */
  const activeLabel = navItems.find((item) => item.active)?.label ?? '';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        <Sidebar
          navItems={navItems}
          avatarInitials={avatarInitials}
          userName={userName}
          userSubtitle={userSubtitle}
        />
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { border: 'none' } }}
      >
        <Sidebar
          navItems={navItems}
          avatarInitials={avatarInitials}
          userName={userName}
          userSubtitle={userSubtitle}
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            backgroundColor: tokens.navy,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          <IconButton onClick={() => setMobileOpen(true)} aria-label="Open navigation" sx={{ color: '#fff' }}>
            <MenuIcon />
          </IconButton>
          <Logo size="sm" onDark />
          {activeLabel && (
            <Typography sx={{ ml: 'auto', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }} noWrap>
              {activeLabel}
            </Typography>
          )}
        </Box>

        <Box
          component="main"
          sx={{
            padding: { xs: '18px 16px 40px', sm: '22px 24px 44px', md: '28px 36px 48px' },
            maxWidth: 1440,
            width: '100%',
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
