import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { formatCurrency } from '../../utils/format';
import { useFleet } from './FleetContext';
import { tokens } from '../../theme';

/**
 * What this company's drivers generated, from the server.
 *
 * "Generated" rather than "earned" is deliberate. Earnings accrue per driver; how the takings
 * divide between a company and the driver it employs is a commercial arrangement the platform
 * does not model, and printing a company payout figure would be inventing one.
 */
export default function EarningsSummary({ columns = 2 }: { columns?: number }) {
  const { summary, loading } = useFleet();

  const tiles = [
    { label: 'Today', value: summary?.earningsToday ?? 0 },
    { label: 'This week', value: summary?.earningsThisWeek ?? 0 },
    { label: 'This month', value: summary?.earningsThisMonth ?? 0 },
    { label: 'All time', value: summary?.earningsAllTime ?? 0 },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${columns},1fr)` }, gap: '10px' }}>
      {tiles.map((tile) => (
        <Box key={tile.label} sx={{ padding: '12px', borderRadius: '10px', backgroundColor: tokens.bg }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{tile.label}</Typography>
          {loading && !summary ? (
            <Skeleton width={72} height={26} />
          ) : (
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(tile.value)}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
