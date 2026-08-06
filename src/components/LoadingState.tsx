import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export default function LoadingState({ label = 'Loading…', minHeight = 220 }: { label?: string; minHeight?: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight, gap: '12px', color: 'text.secondary' }}>
      <CircularProgress size={28} color="primary" />
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}
