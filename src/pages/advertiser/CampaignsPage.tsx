import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import CampaignTable from '../../components/advertiser/CampaignTable';
import CampaignProgressCard from '../../components/advertiser/CampaignProgressCard';
import MyCampaignsCard from '../../components/advertiser/MyCampaignsCard';
import { useCreateCampaign } from '../../components/advertiser/CreateCampaignContext';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { useToast } from '../../contexts/ToastProvider';
import { CAMPAIGNS } from '../../data/advertiserMockData';
import type { Campaign } from '../../types/advertiser';

function CampaignsContent() {
  const { showToast } = useToast();
  const { openCreateCampaign } = useCreateCampaign();
  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === 'Active');

  const handleViewDetails = (campaign: Campaign) => showToast(`Opening ${campaign.name}…`);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Campaigns</Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
            Every campaign you've run — search, filter, and manage them here.
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

      <MyCampaignsCard />

      <Box sx={{ ...cardSx, padding: '20px', mb: '24px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
          In progress
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '6px' }}>Active now</Typography>
        <Box>
          {activeCampaigns.map((c) => (
            <CampaignProgressCard key={c.id} campaign={c} onViewDetails={handleViewDetails} />
          ))}
        </Box>
      </Box>

      <CampaignTable />
    </>
  );
}

export default function CampaignsPage() {
  return (
    <AdvertiserLayout title="Campaigns">
      <CampaignsContent />
    </AdvertiserLayout>
  );
}
