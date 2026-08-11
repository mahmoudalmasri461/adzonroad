import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import ProofOfDeliveryCard from '../../components/advertiser/ProofOfDeliveryCard';
import ReportsListCard from '../../components/advertiser/ReportsListCard';
import { advTokens } from '../../components/advertiser/theme';

export default function ReportsPage() {
  return (
    <AdvertiserLayout title="Reports">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Reports</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          What your campaigns delivered, and the GPS evidence behind each play.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: '20px' }}>
        <ProofOfDeliveryCard />
        <ReportsListCard />
      </Box>
    </AdvertiserLayout>
  );
}
