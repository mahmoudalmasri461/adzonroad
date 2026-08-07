import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import { advTokens, cardSx } from './theme';
import { useToast } from '../../contexts/ToastProvider';
import { REPORTS } from '../../data/advertiserMockData';

type ReportsListCardProps = {
  /** How many reports to show; omit to show all. */
  limit?: number;
};

export default function ReportsListCard({ limit }: ReportsListCardProps) {
  const { showToast } = useToast();
  const reports = limit ? REPORTS.slice(0, limit) : REPORTS;

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Downloadable
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>Reports</Typography>
      <Box sx={{ display: 'grid', gap: '4px' }}>
        {reports.map((r) => (
          <Box key={r.name} sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', borderBottom: `1px solid ${advTokens.border}`, '&:last-of-type': { borderBottom: 'none' } }}>
            <DescriptionIcon sx={{ fontSize: 20, color: advTokens.textMuted }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>{r.name}</Typography>
              <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>Generated {r.date}</Typography>
            </Box>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => showToast(`Downloading ${r.name}…`)}
              sx={{ fontSize: 12, fontWeight: 700, color: advTokens.orange }}
            >
              Download
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
