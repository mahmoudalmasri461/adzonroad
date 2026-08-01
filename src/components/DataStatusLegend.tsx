import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tokens } from '../theme';

const ITEMS: { label: string; color: string; pulse?: boolean }[] = [
  { label: 'Live verified', color: tokens.green, pulse: true },
  { label: 'Offline recorded', color: tokens.textMuted },
  { label: 'Pending sync', color: tokens.warn },
  { label: 'Synced', color: tokens.blue },
  { label: 'Conflict — needs review', color: tokens.red },
];

export default function DataStatusLegend() {
  return (
    <Card sx={{ p: '20px' }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: '12px' }}>
        Data integrity — every hour above traces back to a source record
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {ITEMS.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: 12.5,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: item.color,
                animation: item.pulse ? 'dotPulse 1.8s infinite' : 'none',
              }}
            />
            {item.label}
          </Box>
        ))}
      </Box>
    </Card>
  );
}
