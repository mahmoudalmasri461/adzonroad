import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastProvider';
import { FLEET_REPORTS } from '../../data/taxiCompanyMockData';
import { tokens } from '../../theme';

export default function ReportsPage() {
  const { showToast } = useToast();

  return (
    <>
      <PageHeader title="Reports" subtitle="Download earnings statements, utilisation, and screen uptime reports for your fleet." />

      <Card sx={{ p: '20px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Downloadable
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '14px' }}>Available reports</Typography>
        {FLEET_REPORTS.length === 0 ? (
          <EmptyState title="No reports yet" description="Reports are generated at the start of each month." />
        ) : (
          <Box sx={{ display: 'grid', gap: '4px' }}>
            {FLEET_REPORTS.map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 4px',
                  borderBottom: `1px solid ${tokens.border}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <DescriptionIcon sx={{ fontSize: 20, color: tokens.textMuted }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Generated {r.generatedOn}</Typography>
                </Box>
                <Button size="small" startIcon={<DownloadIcon />} onClick={() => showToast(`Downloading ${r.name}…`)} sx={{ fontSize: 12, fontWeight: 700 }}>
                  Download
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </>
  );
}
