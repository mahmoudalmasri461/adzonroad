import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import { usePortfolio } from './PortfolioContext';
import { useToast } from '../../contexts/ToastProvider';
import { downloadProofOfDelivery } from '../../services/deliveryReport';
import { formatScreenTime, type CampaignDelivery } from '../../services/advertiserAnalytics';

/**
 * Proof of delivery, per campaign.
 *
 * There is no report archive in the platform — no generated documents sitting in storage waiting
 * to be fetched, which is what the fixture list implied with its five dated PDFs. What exists is
 * an export endpoint that builds a CSV from the evidence at the moment somebody asks for it, so
 * the list is of campaigns, and the button produces the file.
 */
export default function ReportsListCard({ limit }: { limit?: number }) {
  const { portfolio, state, days } = usePortfolio();

  const reportable = (portfolio?.byCampaign ?? []).filter((row) => row.totalClaims > 0);
  const shown = limit ? reportable.slice(0, limit) : reportable;

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Downloadable
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '4px' }}>
        Proof of Delivery
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '14px' }}>
        One CSV per campaign, generated from the evidence when you download it — last {days} days
      </Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your campaigns.</Alert>
      )}

      {state === 'ready' && shown.length === 0 && (
        <EmptyState
          title="Nothing to report yet"
          description="A campaign appears here once it has claimed playback that can be exported."
        />
      )}

      {state === 'ready' && shown.length > 0 && (
        <Box sx={{ display: 'grid', gap: '4px' }}>
          {shown.map((row) => (
            <ReportRow key={row.campaign.campaignId} row={row} days={days} />
          ))}
        </Box>
      )}
    </Box>
  );
}

function ReportRow({ row, days }: { row: CampaignDelivery; days: number }) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      await downloadProofOfDelivery(row.campaign.campaignId, from, to);
    } catch {
      showToast('That export could not be generated. Try again in a moment.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 4px',
        borderBottom: `1px solid ${advTokens.border}`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <DescriptionIcon sx={{ fontSize: 20, color: advTokens.textMuted, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }} noWrap>
          {row.campaign.name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>
          {row.verifiedPlays.toLocaleString()} verified plays · {formatScreenTime(row.verifiedSeconds)} on screen
        </Typography>
      </Box>
      <Button
        size="small"
        disabled={downloading}
        startIcon={downloading ? <CircularProgress size={13} /> : <DownloadIcon />}
        onClick={download}
        sx={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: advTokens.orange }}
      >
        {downloading ? 'Preparing…' : 'Download'}
      </Button>
    </Box>
  );
}
