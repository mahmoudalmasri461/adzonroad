import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { advTokens } from './theme';
import { useToast } from '../../contexts/ToastProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { MOCK_ADVERTISER, NOTIFICATIONS } from '../../data/advertiserMockData';

type TopAppBarProps = {
  title: string;
  onMenuClick?: () => void;
};

export default function TopAppBar({ title, onMenuClick }: TopAppBarProps) {
  const { showToast } = useToast();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  // The signed-in name where there is one. The fixture is still the fallback because the rest of
  // this bar reads from fixtures, and a half-real header is more confusing than a consistent one.
  const displayName = session?.displayName || MOCK_ADVERTISER.companyName;

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
      <TextField
        size="small"
        placeholder="Search campaigns, creatives, invoices…"
        onChange={() => undefined}
        sx={{ ml: { sm: '12px' }, flex: 1, maxWidth: 380, display: { xs: 'none', md: 'block' } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: advTokens.textMuted }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box sx={{ flex: { xs: 1, md: 'unset' } }} />
      <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
        <Badge badgeContent={NOTIFICATIONS.length} sx={{ '& .MuiBadge-badge': { backgroundColor: advTokens.orange, color: '#fff' } }}>
          <NotificationsNoneIcon sx={{ color: advTokens.text }} />
        </Badge>
      </IconButton>
      <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)} slotProps={{ paper: { sx: { width: 320 } } }}>
        {NOTIFICATIONS.slice(0, 5).map((n) => (
          <MenuItem key={n.id} onClick={() => setNotifAnchor(null)} sx={{ whiteSpace: 'normal', fontSize: 13 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{n.message}</Typography>
              <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>{n.timestamp}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
      <IconButton onClick={() => showToast('Help center isn\'t built in this preview yet')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
        <HelpOutlineIcon sx={{ color: advTokens.text }} />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, my: '6px' }} />
      <Box
        onClick={(e) => setAccountAnchor(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', pr: '4px' }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: advTokens.text }}>{displayName}</Typography>
          {MOCK_ADVERTISER.accountVerified && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', color: advTokens.green, fontSize: 11, fontWeight: 700 }}>
              <CheckCircleIcon sx={{ fontSize: 12 }} />
              Account Verified
            </Box>
          )}
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
        <MenuItem onClick={() => { setAccountAnchor(null); showToast('Profile isn\'t built in this preview yet'); }}>Profile</MenuItem>
        <MenuItem onClick={() => { setAccountAnchor(null); showToast('Account settings isn\'t built in this preview yet'); }}>Account settings</MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </Box>
  );
}
