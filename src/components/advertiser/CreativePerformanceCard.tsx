import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import { CREATIVES } from '../../data/advertiserMockData';
import type { CreativeStatus } from '../../types/advertiser';

const STATUS_COLOR: Record<CreativeStatus, { color: string; bg: string }> = {
  Active: { color: advTokens.green, bg: '#E9F9EF' },
  'Expiring Soon': { color: advTokens.amber, bg: '#FEF3E2' },
  Expired: { color: advTokens.red, bg: '#FDECEC' },
  'In Review': { color: advTokens.blue, bg: '#EAF0FE' },
};

export default function CreativePerformanceCard() {
  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Creative library
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>Creative Performance</Typography>

      {CREATIVES.length === 0 ? (
        <EmptyState title="No creatives uploaded yet" description="Upload a video or image to start tracking performance." />
      ) : (
        <Box sx={{ display: 'grid', gap: '4px' }}>
          {CREATIVES.map((c) => {
            const statusStyle = STATUS_COLOR[c.status];
            return (
              <Box
                key={c.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 4px',
                  borderBottom: `1px solid ${advTokens.border}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 32,
                    borderRadius: '8px',
                    backgroundColor: c.thumbnailColor,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {c.type === 'Video' ? <VideocamIcon sx={{ fontSize: 16 }} /> : <ImageIcon sx={{ fontSize: 16 }} />}
                </Box>
                <Box sx={{ flex: '1 1 160px', minWidth: 120 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }} noWrap>
                    {c.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>
                    {c.type} · {c.durationSeconds}s
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: advTokens.text }}>{c.plays.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted }}>plays</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: advTokens.text }}>{c.completionRate}%</Typography>
                  <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted }}>completion</Typography>
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.status}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
