import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import LiveCampaignMap from '../../components/advertiser/LiveCampaignMap';
import EmptyState from '../../components/advertiser/EmptyState';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { useLiveVehicles } from '../../hooks/useLiveVehicles';
import { describeAge } from '../../services/vehicleInterpolation';

/**
 * The vehicles the live feed is actually reporting.
 *
 * Plates, drivers, regions and speeds used to be listed here from a fixture. None of them are on
 * the feed — the hub broadcasts a vehicle id, a position and how old the fix is — and an
 * advertiser is not entitled to a driver's name in any case. What is left is the reporting state
 * of each vehicle carrying their campaigns, with the age of every fix stated rather than implied.
 */
function ReportingListCard() {
  const { vehicles, connectionState } = useLiveVehicles();

  const live = vehicles.filter((v) => v.presentation === 'live').length;

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Fleet
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '4px' }}>
        Vehicles reporting
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '10px' }}>
        {vehicles.length === 0
          ? 'Nothing is reporting a position at the moment.'
          : `${live} of ${vehicles.length} reporting live`}
      </Typography>

      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles reporting"
          description={
            connectionState === 'connected'
              ? 'The live feed is connected and no vehicle is sending a position.'
              : 'Not connected to the live feed. Reconnecting automatically.'
          }
        />
      ) : (
        <Box sx={{ display: 'grid', gap: '4px' }}>
          {vehicles.map((vehicle) => (
            <Box
              key={vehicle.vehicleId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 4px',
                borderBottom: `1px solid ${advTokens.border}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ flex: '1 1 140px', minWidth: 110 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>
                  {vehicle.vehicleId.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>
                  Last fix {describeAge(vehicle.fixAgeSeconds)}
                </Typography>
              </Box>

              <Typography sx={{ fontSize: 12, color: advTokens.textMuted, minWidth: 90, textAlign: 'right' }}>
                {vehicle.isDerived ? 'Estimated' : 'Confirmed GPS'}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 110,
                  textAlign: 'right',
                  color: vehicle.presentation === 'live'
                    ? advTokens.green
                    : vehicle.presentation === 'stale'
                      ? advTokens.orange
                      : advTokens.textMuted,
                }}
              >
                {PRESENTATION_LABELS[vehicle.presentation]}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

const PRESENTATION_LABELS = {
  live: 'Reporting live',
  stale: 'Last known position',
  offline: 'Not reporting',
} as const;

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
      <ReportingListCard />
    </AdvertiserLayout>
  );
}
