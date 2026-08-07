import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import UploadIcon from '@mui/icons-material/Upload';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import CreativePerformanceCard from '../../components/advertiser/CreativePerformanceCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { useToast } from '../../contexts/ToastProvider';

function CreativesContent() {
  const { showToast } = useToast();

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', mb: '24px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Creatives</Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
            Your uploaded ads and how each one is performing on screen.
          </Typography>
        </Box>
        <Button
          startIcon={<UploadIcon />}
          onClick={() => showToast('Creative upload isn\'t built in this preview yet')}
          sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          Upload creative
        </Button>
      </Box>

      <Box
        sx={{
          ...cardSx,
          mb: '24px',
          border: `1.5px dashed ${advTokens.border}`,
          boxShadow: 'none',
          padding: '32px',
          textAlign: 'center',
          color: advTokens.textMuted,
          cursor: 'pointer',
          '&:hover': { borderColor: advTokens.orange },
        }}
        onClick={() => showToast('Creative upload isn\'t built in this preview yet')}
      >
        <Typography sx={{ fontWeight: 700, color: advTokens.text, mb: '4px' }}>Drop creative assets here</Typography>
        <Typography sx={{ fontSize: 13 }}>MP4, PNG or JPG — recommended 1920×1080 · 10, 15 or 30 seconds</Typography>
      </Box>

      <CreativePerformanceCard />
    </>
  );
}

export default function CreativesPage() {
  return (
    <AdvertiserLayout title="Creatives">
      <CreativesContent />
    </AdvertiserLayout>
  );
}
