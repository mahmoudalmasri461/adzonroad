import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '../../utils/format';
import { FLEET_EARNINGS } from '../../data/taxiCompanyMockData';
import { tokens } from '../../theme';

const TILES = [
  { label: 'Today', value: FLEET_EARNINGS.today },
  { label: 'This week', value: FLEET_EARNINGS.thisWeek },
  { label: 'This month', value: FLEET_EARNINGS.thisMonth },
  { label: 'Total earned', value: FLEET_EARNINGS.total },
];

export default function EarningsSummary({ columns = 2 }: { columns?: number }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${columns},1fr)` }, gap: '10px' }}>
      {TILES.map((tile) => (
        <Box key={tile.label} sx={{ padding: '12px', borderRadius: '10px', backgroundColor: tokens.bg }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{tile.label}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(tile.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
}
