import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { advTokens, cardSx } from './theme';
import { REGIONS } from '../../data/advertiserMockData';

export default function RegionPerformanceCard() {
  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        By region
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Region Performance</Typography>

      <Box sx={{ display: 'grid', gap: '16px' }}>
        {REGIONS.map((r) => (
          <Box key={r.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: '6px' }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>{r.name}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.orange }}>{r.percentOfTotalExposure}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={r.percentOfTotalExposure}
              sx={{ height: 6, borderRadius: 3, backgroundColor: '#EEF0F3', mb: '8px', '& .MuiLinearProgress-bar': { backgroundColor: advTokens.orange, borderRadius: 3 } }}
            />
            <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: 11.5, color: advTokens.textMuted }}>
              <span>{r.estimatedImpressions.toLocaleString()} impressions</span>
              <span>{r.verifiedPlays.toLocaleString()} verified plays</span>
              <span>{r.activeTaxis} taxis</span>
              <span>{r.kilometresCovered.toLocaleString()} km</span>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
