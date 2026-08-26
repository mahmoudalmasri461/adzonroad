import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EmptyState from './EmptyState';
import CampaignProgressCard from './CampaignProgressCard';
import { usePortfolio } from './PortfolioContext';
import { useCreateCampaign } from './CreateCampaignContext';
import { advTokens, cardSx } from './theme';
import type { CampaignDelivery } from '../../services/advertiserAnalytics';

/**
 * Delivery for the campaigns that are actually running.
 *
 * Replaces a fixture block that showed a "Summer Launch" campaign at 82% to every advertiser,
 * including ones with no account history at all. An empty account now says so.
 */
export default function CampaignDeliveryCard({
  title = 'Campaign Delivery',
  limit,
}: {
  title?: string;
  limit?: number;
}) {
  const { portfolio, state } = usePortfolio();
  const { openCreateCampaign } = useCreateCampaign();
  const navigate = useNavigate();

  const running = (portfolio?.byCampaign ?? []).filter(
    (row) => row.campaign.status === 'Active' || row.campaign.status === 'Paused',
  );
  const shown = limit ? running.slice(0, limit) : running;

  // The proof-of-delivery page is where a single campaign's evidence lives, so "View Details"
  // opens it there rather than raising a toast about a screen that does not exist.
  const openDetails = (row: CampaignDelivery) =>
    navigate(`/advertiser/reports?campaign=${encodeURIComponent(row.campaign.campaignId)}`);

  return (
    <Box sx={{ ...cardSx, padding: '20px', mb: '24px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        In progress
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '6px' }}>{title}</Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your campaign delivery.</Alert>
      )}

      {state === 'ready' && shown.length === 0 && (
        <EmptyState
          title="No campaigns running"
          description={
            (portfolio?.campaigns.length ?? 0) === 0
              ? 'Create a campaign and its delivery will appear here once it starts.'
              : 'None of your campaigns are live at the moment. Scheduled ones appear here when they start.'
          }
          actionLabel={(portfolio?.campaigns.length ?? 0) === 0 ? 'Create Campaign' : undefined}
          onAction={(portfolio?.campaigns.length ?? 0) === 0 ? openCreateCampaign : undefined}
        />
      )}

      {state === 'ready' && shown.length > 0 && (
        <Box>
          {shown.map((row) => (
            <CampaignProgressCard key={row.campaign.campaignId} row={row} onViewDetails={openDetails} />
          ))}
        </Box>
      )}
    </Box>
  );
}
