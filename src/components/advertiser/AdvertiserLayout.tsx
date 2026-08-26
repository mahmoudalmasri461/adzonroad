import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { advTokens } from './theme';
import SidebarNavigation from './SidebarNavigation';
import TopAppBar from './TopAppBar';
import { CreateCampaignProvider } from './CreateCampaignContext';
import { PortfolioProvider } from './PortfolioContext';
import { AlertsProvider } from './AlertsContext';

/**
 * The portal shell.
 *
 * The portfolio is loaded once here rather than once per card. Loading it is a fan-out — the
 * campaign list plus one delivery report per campaign — and the top bar needs the same data the
 * dashboard cards do. One load per page view keeps the request count down and, more importantly,
 * guarantees the bell and the cards beneath it are describing the same moment.
 */

type AdvertiserLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function AdvertiserLayout({ title, children }: AdvertiserLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CreateCampaignProvider>
      <PortfolioProvider>
        <AlertsProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: advTokens.bg }}>
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
              <SidebarNavigation />
            </Box>

            <Drawer
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { border: 'none' } }}
            >
              <SidebarNavigation onNavigate={() => setMobileOpen(false)} />
            </Drawer>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <TopAppBar title={title} onMenuClick={() => setMobileOpen(true)} />
              <Box component="main" sx={{ padding: { xs: '16px', sm: '22px', md: '28px 32px 48px' }, maxWidth: 1560, width: '100%' }}>
                {children}
              </Box>
            </Box>
          </Box>
        </AlertsProvider>
      </PortfolioProvider>
    </CreateCampaignProvider>
  );
}
