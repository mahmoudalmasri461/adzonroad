import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { advTokens } from './theme';
import { useAlerts } from './AlertsContext';
import { useAuth } from '../../contexts/AuthProvider';

type TopAppBarProps = {
  title: string;
  onMenuClick?: () => void;
};

export default function TopAppBar({ title, onMenuClick }: TopAppBarProps) {
  const { session, signOut } = useAuth();
  const { alerts, ready } = useAlerts();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  // The signed-in name, with no fallback. There is no fixture left to fall back to, and an
  // account whose token carries no name is a bug worth seeing rather than papering over.
  const displayName = session?.displayName ?? '';

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setAccountAnchor(null);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        backgroundColor: advTokens.white,
        borderBottom: `1px solid ${advTokens.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      {onMenuClick && (
        <IconButton onClick={onMenuClick} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>
      )}
      <Typography sx={{ fontWeight: 800, fontSize: 17, color: advTokens.text, display: { xs: 'none', sm: 'block' } }}>
        {title}
      </Typography>
      {/* The global search box that used to sit here discarded every keystroke: there is no
          cross-entity search endpoint. The campaign table has a working search of its own. */}
      <Box sx={{ flex: 1 }} />
      {/* The badge counts the same derived alerts the dashboard card lists, so the number here
          and the list there can never disagree. No badge at all until both halves have loaded. */}
      <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
        <Badge
          badgeContent={ready ? alerts.length : 0}
          sx={{ '& .MuiBadge-badge': { backgroundColor: advTokens.orange, color: '#fff' } }}
        >
          <NotificationsNoneIcon sx={{ color: advTokens.text }} />
        </Badge>
      </IconButton>
      <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)} slotProps={{ paper: { sx: { width: { xs: 'calc(100vw - 32px)', sm: 340 }, maxWidth: 'calc(100vw - 32px)' } } }}>
        {alerts.length === 0 ? (
          <MenuItem disabled sx={{ whiteSpace: 'normal', fontSize: 13 }}>
            {ready ? 'Nothing needs attention' : 'Loading…'}
          </MenuItem>
        ) : (
          alerts.slice(0, 6).map((alert) => (
            <MenuItem key={alert.id} onClick={() => setNotifAnchor(null)} sx={{ whiteSpace: 'normal', fontSize: 13 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{alert.message}</Typography>
                <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>{alert.detail}</Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
      <IconButton
        onClick={() => { setNotifAnchor(null); navigate('/advertiser/support'); }}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <HelpOutlineIcon sx={{ color: advTokens.text }} />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, my: '6px' }} />
      <Box
        onClick={(e) => setAccountAnchor(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', pr: '4px' }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: advTokens.text }}>{displayName}</Typography>
          {/* "Account Verified" used to show unconditionally, from a fixture flag that was
              always true. An account that can sign in has already been approved, so the claim was
              never news; the real status now lives on Settings, where it comes from the server. */}
        </Box>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: advTokens.orange,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </Box>
      </Box>
      <Menu anchorEl={accountAnchor} open={!!accountAnchor} onClose={() => setAccountAnchor(null)}>
        <MenuItem onClick={() => { setAccountAnchor(null); navigate('/advertiser/settings'); }}>
          Account settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </Box>
  );
}
