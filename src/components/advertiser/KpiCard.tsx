import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { advTokens, cardSx } from './theme';

type KpiCardProps = {
  label: string;
  value: string;
  change: number;
  comparison: string;
  trend: number[];
  icon: React.ReactNode;
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 96;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const color = positive ? advTokens.green : advTokens.red;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function KpiCard({ label, value, change, comparison, trend, icon }: KpiCardProps) {
  const positive = change >= 0;
  return (
    <Box sx={{ ...cardSx, padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: advTokens.orangeSoft,
            color: advTokens.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Sparkline data={trend} positive={positive} />
      </Box>
      <Typography sx={{ fontSize: 24, fontWeight: 800, color: advTokens.text, letterSpacing: '-0.01em' }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color: positive ? advTokens.green : advTokens.red,
            fontWeight: 700,
          }}
        >
          {positive ? <ArrowUpwardIcon sx={{ fontSize: 13 }} /> : <ArrowDownwardIcon sx={{ fontSize: 13 }} />}
          {Math.abs(change)}%
        </Box>
        <Typography sx={{ fontSize: 12.5, color: advTokens.textMuted }}>{comparison}</Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: advTokens.textMuted, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}
