import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CampaignIcon from '@mui/icons-material/Campaign';
import TvIcon from '@mui/icons-material/Tv';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import AdvertiserLayout from '../components/advertiser/AdvertiserLayout';
import KpiCard from '../components/advertiser/KpiCard';
import LiveCampaignMap from '../components/advertiser/LiveCampaignMap';
import CampaignProgressCard from '../components/advertiser/CampaignProgressCard';
import CampaignTable from '../components/advertiser/CampaignTable';
import AnalyticsChart from '../components/advertiser/AnalyticsChart';
import RegionPerformanceCard from '../components/advertiser/RegionPerformanceCard';
import CreativePerformanceCard from '../components/advertiser/CreativePerformanceCard';
import VerificationStatusCard from '../components/advertiser/VerificationStatusCard';
import AlertsCard from '../components/advertiser/AlertsCard';
import BillingCard from '../components/advertiser/BillingCard';
import SupportCard from '../components/advertiser/SupportCard';
import { advTokens, cardSx } from '../components/advertiser/theme';
import { useToast } from '../contexts/ToastProvider';
import CreateCampaignDialog from '../components/CreateCampaignDialog';
import {
  MOCK_ADVERTISER,
  KPI_SUMMARY,
  CAMPAIGNS,
  CAMPAIGN_ANALYTICS,
  SCREENS,
} from '../data/advertiserMockData';
import type { Campaign } from '../types/advertiser';

const KPI_ICONS = [CampaignIcon, TvIcon, PlayCircleIcon, VisibilityIcon];

const SCREEN_STATUS_COLORS: Record<string, string> = {
  Online: advTokens.green,
  Offline: advTokens.red,
  Inactive: advTokens.textMuted,
  'Pending Sync': advTokens.amber,
  Maintenance: advTokens.blue,
};

const REPORTS = [
  { name: 'Monthly Delivery Summary — July 2026', date: 'Aug 1, 2026' },
  { name: 'Verified Impressions Report — Q2 2026', date: 'Jul 3, 2026' },
  { name: 'Regional Coverage Breakdown — June 2026', date: 'Jul 1, 2026' },
];

export default function AdvertiserDashboard() {
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === 'Active').slice(0, 4);

  const screenStatusDonut = Object.entries(
    SCREENS.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value, color: SCREEN_STATUS_COLORS[label] ?? advTokens.textMuted }));

  const handleViewDetails = (campaign: Campaign) => showToast(`Opening ${campaign.name}…`);

  return (
    <AdvertiserLayout title="Advertiser Dashboard" onCreateCampaign={() => setDialogOpen(true)}>
      {/* Welcome */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>
            Welcome back, {MOCK_ADVERTISER.contactName.split(' ')[0]}
          </Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
            Here's how {MOCK_ADVERTISER.companyName}'s campaigns are performing today.
          </Typography>
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '14px', mb: '24px' }}>
        {KPI_SUMMARY.map((kpi, i) => {
          const Icon = KPI_ICONS[i];
          return <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} comparison={kpi.comparison} trend={kpi.trend} icon={<Icon sx={{ fontSize: 18 }} />} />;
        })}
      </Box>

      {/* Live map */}
      <Box sx={{ mb: '24px' }}>
        <LiveCampaignMap />
      </Box>

      {/* Campaign delivery */}
      <Box sx={{ ...cardSx, padding: '20px', mb: '24px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
          In progress
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '6px' }}>Campaign Delivery</Typography>
        <Box>
          {activeCampaigns.map((c) => (
            <CampaignProgressCard key={c.id} campaign={c} onViewDetails={handleViewDetails} />
          ))}
        </Box>
      </Box>

      {/* Recent campaigns table */}
      <Box sx={{ mb: '24px' }}>
        <CampaignTable />
      </Box>

      {/* Create campaign quick panel */}
      <Box
        sx={{
          ...cardSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '20px 24px',
          mb: '24px',
          backgroundColor: advTokens.charcoal,
          border: 'none',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Ready to launch your next campaign?</Typography>
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', mt: '4px' }}>
            Pick your regions, taxi count, and schedule — we'll estimate pricing instantly.
          </Typography>
        </Box>
        <Button
          onClick={() => setDialogOpen(true)}
          sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', px: '20px', '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Analytics */}
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: advTokens.text, mb: '14px' }}>Analytics</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '16px' }}>
          <Box sx={{ ...cardSx, padding: '20px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '10px' }}>Verified plays by day</Typography>
            <AnalyticsChart
              variant="line"
              categories={CAMPAIGN_ANALYTICS.verifiedPlaysByDay.map((d) => d.day)}
              series={[{ label: 'Verified plays', data: CAMPAIGN_ANALYTICS.verifiedPlaysByDay.map((d) => d.plays), color: advTokens.orange }]}
            />
          </Box>
          <Box sx={{ ...cardSx, padding: '20px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '10px' }}>Impressions by region</Typography>
            <AnalyticsChart
              variant="bar"
              categories={CAMPAIGN_ANALYTICS.impressionsByRegion.map((d) => d.region)}
              series={[{ label: 'Impressions', data: CAMPAIGN_ANALYTICS.impressionsByRegion.map((d) => d.impressions), color: advTokens.blue }]}
            />
          </Box>
          <Box sx={{ ...cardSx, padding: '20px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '10px' }}>Exposure by time of day</Typography>
            <AnalyticsChart
              variant="area"
              categories={CAMPAIGN_ANALYTICS.exposureByTimeOfDay.map((d) => d.hour)}
              series={[{ label: 'Exposure index', data: CAMPAIGN_ANALYTICS.exposureByTimeOfDay.map((d) => d.exposure), color: advTokens.orange }]}
            />
          </Box>
          <Box sx={{ ...cardSx, padding: '20px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '10px' }}>Screen status distribution</Typography>
            <AnalyticsChart variant="donut" data={screenStatusDonut} />
          </Box>
        </Box>
      </Box>

      {/* Region + creative performance */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', mb: '24px' }}>
        <RegionPerformanceCard />
        <CreativePerformanceCard />
      </Box>

      {/* Verified delivery + alerts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px', mb: '24px' }}>
        <VerificationStatusCard />
        <AlertsCard />
      </Box>

      {/* Reports */}
      <Box sx={{ ...cardSx, padding: '20px', mb: '24px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
          Downloadable
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>Reports</Typography>
        <Box sx={{ display: 'grid', gap: '4px' }}>
          {REPORTS.map((r) => (
            <Box key={r.name} sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', borderBottom: `1px solid ${advTokens.border}`, '&:last-of-type': { borderBottom: 'none' } }}>
              <DescriptionIcon sx={{ fontSize: 20, color: advTokens.textMuted }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>{r.name}</Typography>
                <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>Generated {r.date}</Typography>
              </Box>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => showToast(`Downloading ${r.name}…`)}
                sx={{ fontSize: 12, fontWeight: 700, color: advTokens.orange }}
              >
                Download
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Billing + support */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px' }}>
        <BillingCard />
        <SupportCard />
      </Box>

      <CreateCampaignDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </AdvertiserLayout>
  );
}
