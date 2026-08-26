import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import EmptyState from './EmptyState';
import { advTokens, cardSx } from './theme';
import { usePortfolio } from './PortfolioContext';
import { formatScreenTime } from '../../services/advertiserAnalytics';

/**
 * Where the advertisement actually played.
 *
 * The share bar is a share of confirmed screen time — the region's verified seconds against the
 * portfolio's — not a share of "exposure". Exposure would need an audience model the platform
 * does not have, and the fixture this replaced quoted impressions, taxi counts and kilometres
 * that no endpoint has ever returned. What is left is smaller and true.
 *
 * Only regions that reported are listed. A region a campaign targeted but that never produced a
 * verified play is absent rather than shown at zero, because the two look identical on a bar and
 * the platform cannot yet tell them apart.
 */
export default function RegionPerformanceCard() {
  const { portfolio, state } = usePortfolio();

  const regions = portfolio?.byRegion ?? [];
  const totalSeconds = regions.reduce((sum, r) => sum + r.verifiedSeconds, 0);

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        By region
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '4px' }}>
        Region Performance
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '16px' }}>
        Confirmed screen time, by where the GPS evidence puts it
      </Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your delivery by region.</Alert>
      )}

      {state === 'ready' && regions.length === 0 && (
        <EmptyState
          title="No located delivery yet"
          description="Once your campaigns run, the regions their verified plays came from appear here."
        />
      )}

      {state === 'ready' && regions.length > 0 && (
        <Box sx={{ display: 'grid', gap: '16px' }}>
          {regions.map((region) => {
            const share = totalSeconds === 0 ? 0 : (region.verifiedSeconds / totalSeconds) * 100;

            return (
              <Box key={region.regionName}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '10px', mb: '6px' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>
                    {region.regionName}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.orange }}>
                    {Math.round(share)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={share}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: '#EEF0F3', mb: '8px', '& .MuiLinearProgress-bar': { backgroundColor: advTokens.orange, borderRadius: 3 } }}
                />
                <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: 11.5, color: advTokens.textMuted }}>
                  <span>{region.verifiedPlays.toLocaleString()} verified plays</span>
                  <span>{formatScreenTime(region.verifiedSeconds)} on screen</span>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
