import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { advTokens, cardSx } from './theme';
import { useCreateCampaign } from './CreateCampaignContext';
import { ApiError } from '../../services/apiClient';
import { describeStatus, fetchCampaigns, type CampaignStatus, type CampaignSummary } from '../../services/campaigns';
import { formatCurrency } from '../../utils/format';

/**
 * The advertiser's real campaigns, as the server holds them.
 *
 * Separate from the fixture-backed table below it rather than replacing it, because the two are
 * not the same thing: this is what exists, that is a design of what a busy account looks like.
 * Mixing them would make it impossible to tell which is which.
 */

const STATUS_TONE: Record<CampaignStatus, string> = {
  Draft: advTokens.textMuted,
  PendingApproval: advTokens.blue,
  Scheduled: advTokens.green,
  Active: advTokens.green,
  Paused: advTokens.amber,
  Completed: advTokens.textMuted,
  Cancelled: advTokens.textMuted,
  Rejected: advTokens.red,
};

export default function MyCampaignsCard() {
  const { createdCount } = useCreateCampaign();
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refetches when a campaign is submitted, so a new one appears without a page reload.
  useEffect(() => {
    const controller = new AbortController();

    fetchCampaigns(controller.signal)
      .then((list) => {
        setCampaigns(list);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setCampaigns([]);
        setError(
          e instanceof ApiError && e.isUnauthorized
            ? 'Sign in again to see your campaigns.'
            : 'Could not load your campaigns.',
        );
      });

    return () => controller.abort();
  }, [createdCount]);

  return (
    <Box sx={{ ...cardSx, padding: '20px', mb: '24px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Your account
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '12px' }}>
        Campaigns you've created
      </Typography>

      {error && <Alert severity="info" sx={{ fontSize: 13 }}>{error}</Alert>}

      {campaigns === null && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '20px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {campaigns?.length === 0 && !error && (
        <Typography sx={{ fontSize: 13.5, color: advTokens.textMuted, py: '8px' }}>
          No campaigns yet. Use "Create Campaign" to submit your first one for review.
        </Typography>
      )}

      {campaigns && campaigns.length > 0 && (
        <Box sx={{ display: 'grid', gap: '2px' }}>
          {campaigns.map((c) => (
            <Box
              key={c.campaignId}
              sx={{
                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                padding: '10px 4px', borderBottom: `1px solid ${advTokens.border}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: advTokens.text }}>{c.name}</Typography>
                <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted }}>
                  {c.taxiCount} taxis · {c.creativeDurationSeconds}s ·{' '}
                  {c.regions.length > 0 ? c.regions.join(', ') : 'no regions'}
                  {c.creativeCount === 0 && ' · no creative yet'}
                </Typography>
              </Box>

              <Typography sx={{ fontSize: 13, fontWeight: 700, color: advTokens.text }}>
                {c.price > 0 ? formatCurrency(c.price) : '—'}
              </Typography>

              <Chip
                size="small"
                label={describeStatus(c.status)}
                sx={{
                  fontWeight: 700, fontSize: 11,
                  color: STATUS_TONE[c.status],
                  backgroundColor: `${STATUS_TONE[c.status]}18`,
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
