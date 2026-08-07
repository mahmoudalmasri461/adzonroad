import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import LiveCampaignMap from '../../components/advertiser/LiveCampaignMap';
import StatusChip from '../../components/advertiser/StatusChip';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { VEHICLES, SCREENS } from '../../data/advertiserMockData';

function FleetListCard() {
  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Fleet
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '10px' }}>Vehicles on your campaigns</Typography>
      <Box sx={{ display: 'grid', gap: '4px' }}>
        {VEHICLES.map((v) => {
          const screen = SCREENS.find((s) => s.vehicleId === v.id);
          return (
            <Box
              key={v.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 4px',
                borderBottom: `1px solid ${advTokens.border}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ flex: '1 1 120px', minWidth: 100 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>{v.taxiId}</Typography>
                <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>{v.plate} · {v.driverName}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: advTokens.textMuted, flex: '1 1 120px', minWidth: 100 }} noWrap>
                {v.region}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: advTokens.text, minWidth: 60, textAlign: 'right' }}>
                {v.speedKmh} km/h
              </Typography>
              {screen && <StatusChip status={screen.status} size="small" />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function LiveMapPage() {
  return (
    <AdvertiserLayout title="Live Map">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Live Map</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Where your campaigns are on the road right now.
        </Typography>
      </Box>
      <Box sx={{ mb: '24px' }}>
        <LiveCampaignMap />
      </Box>
      <FleetListCard />
    </AdvertiserLayout>
  );
}
