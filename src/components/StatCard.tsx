import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

type StatCardProps = {
  value: string;
  label: string;
  color?: string;
  padding?: number;
};

export default function StatCard({ value, label, color, padding = 20 }: StatCardProps) {
  return (
    <Card sx={{ p: `${padding}px` }}>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography
        sx={{
          mt: '4px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
    </Card>
  );
}
