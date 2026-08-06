import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { advTokens } from './theme';
import StatusChip from './StatusChip';
import type { Campaign } from '../../types/advertiser';

type CampaignProgressCardProps = {
  campaign: Campaign;
  onViewDetails: (campaign: Campaign) => void;
};

export default function CampaignProgressCard({ campaign, onViewDetails }: CampaignProgressCardProps) {
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
      <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: campaign.thumbnailColor, flexShrink: 0 }} />

      <Box sx={{ minWidth: 160, flex: '1 1 200px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text }} noWrap>
          {campaign.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: advTokens.textMuted }} noWrap>
          {campaign.region}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <StatusChip status={campaign.status} size="small" />
      </Box>

      <Box sx={{ flex: '2 1 180px', minWidth: 140 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: advTokens.textMuted, mb: '4px' }}>
          <span>{campaign.deliveryPercent}% delivered</span>
          <span>{campaign.verifiedHours}/{campaign.totalHours} hrs</span>
        </Box>
        <LinearProgress
          variant="determinate"
          value={campaign.deliveryPercent}
          sx={{ height: 6, borderRadius: 3, backgroundColor: '#EEF0F3', '& .MuiLinearProgress-bar': { backgroundColor: advTokens.orange, borderRadius: 3 } }}
        />
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 76 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }}>{campaign.activeTaxis}</Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>taxis</Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 96 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: advTokens.text }}>{campaign.remainingLabel}</Typography>
      </Box>

      <Button
        size="small"
        onClick={() => onViewDetails(campaign)}
        sx={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: advTokens.orange, '&:hover': { backgroundColor: advTokens.orangeSoft } }}
      >
        View Details
      </Button>
    </Box>
  );
}
