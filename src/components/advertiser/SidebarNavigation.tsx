import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/GridView';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MapIcon from '@mui/icons-material/Map';
import InsightsIcon from '@mui/icons-material/Insights';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SettingsIcon from '@mui/icons-material/Settings';
import { advTokens } from './theme';
import { useCreateCampaign } from './CreateCampaignContext';
import Logo from '../Logo';

type NavItem = {
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  to?: string;
  onClick?: () => void;
};

type SidebarNavigationProps = {
  onNavigate?: () => void;
};

export default function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const location = useLocation();
  const { openCreateCampaign } = useCreateCampaign();

  const items: NavItem[] = [
    { label: 'Dashboard', icon: DashboardIcon, to: '/advertiser' },
    { label: 'Campaigns', icon: CampaignIcon, to: '/advertiser/campaigns' },
    { label: 'Create Campaign', icon: AddCircleIcon, onClick: () => { openCreateCampaign(); onNavigate?.(); } },
    { label: 'Live Map', icon: MapIcon, to: '/advertiser/map' },
    { label: 'Analytics', icon: InsightsIcon, to: '/advertiser/analytics' },
    { label: 'Creatives', icon: PermMediaIcon, to: '/advertiser/creatives' },
    { label: 'Reports', icon: DescriptionIcon, to: '/advertiser/reports' },
    { label: 'Billing', icon: ReceiptLongIcon, to: '/advertiser/billing' },
    { label: 'Support', icon: SupportAgentIcon, to: '/advertiser/support' },
    { label: 'Settings', icon: SettingsIcon, to: '/advertiser/settings' },
  ];

  return (
    <Box
      sx={{
        backgroundColor: advTokens.charcoal,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px 14px',
        width: 260,
      }}
    >
      <Box sx={{ px: '6px' }}>
        <Logo size="md" onDark />
      </Box>
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.to ? location.pathname === item.to : false;
          return (
            <Box
              key={item.label}
              component={item.to ? RouterLink : 'div'}
              to={item.to}
              onClick={item.to ? onNavigate : item.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                textDecoration: 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                backgroundColor: active ? advTokens.orangeSoft : 'transparent',
                position: 'relative',
                '&:hover': { color: '#fff', backgroundColor: active ? advTokens.orangeSoft : 'rgba(255,255,255,0.06)' },
              }}
            >
              {active && (
                <Box sx={{ position: 'absolute', left: -14, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: advTokens.orange }} />
              )}
              <Icon style={{ fontSize: 19, color: active ? advTokens.orange : 'inherit' }} />
              {item.label}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ marginTop: 'auto', pt: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', px: '10px' }}>
          AdzOnRoad · Advertiser Portal
        </Typography>
      </Box>
    </Box>
  );
}
