import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import CampaignTable from '../../components/advertiser/CampaignTable';
import CampaignDeliveryCard from '../../components/advertiser/CampaignDeliveryCard';
import { useCreateCampaign } from '../../components/advertiser/CreateCampaignContext';
import { advTokens } from '../../components/advertiser/theme';

function CampaignsContent() {
  const { openCreateCampaign } = useCreateCampaign();

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

      <CampaignDeliveryCard title="Active now" />

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
