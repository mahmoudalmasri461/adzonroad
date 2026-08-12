import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import AdvertiserLayout from '../components/advertiser/AdvertiserLayout';
import DeliveryKpis from '../components/advertiser/DeliveryKpis';
import DeliveryAnalytics from '../components/advertiser/DeliveryAnalytics';
import MyCampaignsCard from '../components/advertiser/MyCampaignsCard';
import LiveCampaignMap from '../components/advertiser/LiveCampaignMap';
import CampaignProgressCard from '../components/advertiser/CampaignProgressCard';
import CampaignTable from '../components/advertiser/CampaignTable';
import RegionPerformanceCard from '../components/advertiser/RegionPerformanceCard';
import CreativePerformanceCard from '../components/advertiser/CreativePerformanceCard';
import VerificationStatusCard from '../components/advertiser/VerificationStatusCard';
import AlertsCard from '../components/advertiser/AlertsCard';
import BillingCard from '../components/advertiser/BillingCard';
import SupportCard from '../components/advertiser/SupportCard';
import ReportsListCard from '../components/advertiser/ReportsListCard';
import { useCreateCampaign } from '../components/advertiser/CreateCampaignContext';
import { advTokens, cardSx } from '../components/advertiser/theme';
import { useToast } from '../contexts/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import { CAMPAIGNS } from '../data/advertiserMockData';
import type { Campaign } from '../types/advertiser';

function DashboardContent() {
  const { showToast } = useToast();
  const { openCreateCampaign } = useCreateCampaign();
  const { session } = useAuth();

  // The signed-in user's own name, not a fixture. The session carries no company name, so the
  // subtitle says nothing about one rather than inventing an employer for the reader.
  const firstName = session?.displayName.trim().split(/\s+/)[0] ?? 'there';

  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === 'Active').slice(0, 4);

  const handleViewDetails = (campaign: Campaign) => showToast(`Opening ${campaign.name}…`);

  return (
    <>
      {/* Welcome */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>
            Welcome back, {firstName}
          </Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
            Verified delivery across your campaigns over the last 30 days.
          </Typography>
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={openCreateCampaign}
          sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* KPIs — counted from delivery reports, not asserted */}
      <DeliveryKpis days={30} />

      {/* Live map */}
      <Box sx={{ mb: '24px' }}>
        <LiveCampaignMap />
      </Box>

      {/* The advertiser's real campaigns */}
      <MyCampaignsCard />

      {/* Campaign delivery — still fixtures, kept as a design reference */}
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
          onClick={openCreateCampaign}
          sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', px: '20px', '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Analytics — real delivery across every campaign */}
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: advTokens.text, mb: '14px' }}>Analytics</Typography>
        <DeliveryAnalytics days={30} />
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
      <Box sx={{ mb: '24px' }}>
        <ReportsListCard limit={3} />
      </Box>

      {/* Billing + support */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px' }}>
        <BillingCard />
        <SupportCard />
      </Box>
    </>
  );
}

export default function AdvertiserDashboard() {
  return (
    <AdvertiserLayout title="Advertiser Dashboard">
      <DashboardContent />
    </AdvertiserLayout>
  );
}
