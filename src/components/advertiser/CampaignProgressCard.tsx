import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import MuiTooltip from '@mui/material/Tooltip';
import { advTokens } from './theme';
import { describeStatus } from '../../services/campaigns';
import { describeSchedule, formatScreenTime, type CampaignDelivery } from '../../services/advertiserAnalytics';

type CampaignProgressCardProps = {
  row: CampaignDelivery;
  onViewDetails: (row: CampaignDelivery) => void;
};

/**
 * One campaign's real delivery.
 *
 * The bar is the share of this campaign's claims that the evidence supports — not a share of a
 * contract. A "% of campaign delivered" figure would need a contracted total in seconds, and the
 * platform sells taxis and duration rather than a guaranteed play count, so that denominator does
 * not exist. The fixture had one anyway, which is why "82% delivered" sat under a real KPI row.
 */
export default function CampaignProgressCard({ row, onViewDetails }: CampaignProgressCardProps) {
  const { campaign } = row;
  const share = Math.round(row.verifiedShare * 100);
  const reported = row.totalClaims > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 4px',
        borderBottom: `1px solid ${advTokens.border}`,
        flexWrap: 'wrap',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ minWidth: 160, flex: '1 1 220px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text }} noWrap>
          {campaign.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: advTokens.textMuted }} noWrap>
          {campaign.regions.length > 0 ? campaign.regions.join(', ') : 'No regions set'}
        </Typography>
      </Box>

      <Box sx={{ flex: '2 1 200px', minWidth: 150 }}>
        {reported ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: advTokens.textMuted, mb: '4px' }}>
              <span>{share}% of claims verified</span>
              <span>{row.verifiedPlays.toLocaleString()} plays</span>
            </Box>
            <MuiTooltip title={`${row.verifiedPlays.toLocaleString()} of ${row.totalClaims.toLocaleString()} claimed plays are backed by GPS evidence.`}>
              <LinearProgress
                variant="determinate"
                value={share}
                sx={{ height: 6, borderRadius: 3, backgroundColor: '#EEF0F3', cursor: 'help', '& .MuiLinearProgress-bar': { backgroundColor: advTokens.orange, borderRadius: 3 } }}
              />
            </MuiTooltip>
          </>
        ) : (
          <Typography sx={{ fontSize: 12, color: advTokens.textMuted }}>
            {row.summary === null ? 'Delivery could not be read' : 'No delivery reported yet'}
          </Typography>
        )}
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 82 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>
          {reported ? formatScreenTime(row.verifiedSeconds) : '—'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>on screen</Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 76 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>{campaign.taxiCount}</Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>taxis booked</Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 110 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: advTokens.text }}>
          {describeSchedule(campaign)}
        </Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>{describeStatus(campaign.status)}</Typography>
      </Box>

      <Button
        size="small"
        onClick={() => onViewDetails(row)}
        sx={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: advTokens.orange, '&:hover': { backgroundColor: advTokens.orangeSoft } }}
      >
        View Details
      </Button>
    </Box>
  );
}
