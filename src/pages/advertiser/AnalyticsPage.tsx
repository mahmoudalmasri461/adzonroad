import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import DeliveryAnalytics from '../../components/advertiser/DeliveryAnalytics';
import { advTokens } from '../../components/advertiser/theme';

export default function AnalyticsPage() {
  return (
    <AdvertiserLayout title="Analytics">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>
          Analytics
        </Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Verified delivery across your campaigns, and what remains in doubt.
        </Typography>
      </Box>

      <DeliveryAnalytics days={30} />
    </AdvertiserLayout>
  );
}
