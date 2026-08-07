import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import AnalyticsChart from '../../components/advertiser/AnalyticsChart';
import RegionPerformanceCard from '../../components/advertiser/RegionPerformanceCard';
import VerificationStatusCard from '../../components/advertiser/VerificationStatusCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { CAMPAIGN_ANALYTICS, SCREENS } from '../../data/advertiserMockData';

const SCREEN_STATUS_COLORS: Record<string, string> = {
  Online: advTokens.green,
  Offline: advTokens.red,
  Inactive: advTokens.textMuted,
  'Pending Sync': advTokens.amber,
  Maintenance: advTokens.blue,
};

export default function AnalyticsPage() {
  const screenStatusDonut = Object.entries(
    SCREENS.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value, color: SCREEN_STATUS_COLORS[label] ?? advTokens.textMuted }));

  return (
    <AdvertiserLayout title="Analytics">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Analytics</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Verified delivery, impressions, and exposure across all your campaigns.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '16px', mb: '24px' }}>
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: '16px' }}>
        <RegionPerformanceCard />
        <VerificationStatusCard />
      </Box>
    </AdvertiserLayout>
  );
}
