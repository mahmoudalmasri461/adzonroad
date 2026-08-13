import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import CreativeThumbnail from './CreativeThumbnail';
import { describeStatus, type CampaignStatus } from '../../services/campaigns';
import {
  completionPercent,
  describeCompletion,
  fetchCreatives,
  type CreativeListItem,
} from '../../services/creatives';

/**
 * How each creative has actually performed.
 *
 * Plays are verified plays — the same predicate the delivery report counts by, so this card and
 * the proof of delivery cannot disagree about what ran. The chip shows the owning campaign's
 * status, because a creative has no status of its own: there is no separate creative review
 * anywhere in the platform.
 */
export default function CreativePerformanceCard({ limit }: { limit?: number }) {
  const { creatives, state } = useCreatives();

  return <CreativeLibraryCard creatives={creatives} state={state} limit={limit} />;
}

/**
 * The same card, rendering a list somebody else loaded.
 *
 * Split out because a page that also shows a count must read both from one fetch. Two components
 * each calling the hook would put a total from one request beside a list from another, and a newly
 * uploaded creative would appear in the count while the list still denied it existed.
 */
export function CreativeLibraryCard({
  creatives, state, limit,
}: {
  creatives: CreativeListItem[];
  state: 'loading' | 'ready' | 'error';
  limit?: number;
}) {
  const shown = limit ? creatives.slice(0, limit) : creatives;

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Creative library
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>
        Creative Performance
      </Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your creatives.</Alert>
      )}

      {state === 'ready' && (
        creatives.length === 0 ? (
          <EmptyState
            title="No creatives uploaded yet"
            description="Add one to a draft campaign and it will appear here."
          />
        ) : (
          <Box sx={{ display: 'grid', gap: '4px' }}>
            {shown.map((creative) => (
              <CreativeRow key={creative.creativeId} creative={creative} />
            ))}
          </Box>
        )
      )}
    </Box>
  );
}

export function CreativeRow({ creative }: { creative: CreativeListItem }) {
  const percent = completionPercent(creative);

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
      <CreativeThumbnail creative={creative} />

      <Box sx={{ flex: '1 1 160px', minWidth: 120 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: advTokens.text }} noWrap>
          {creative.name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }} noWrap>
          {creative.type} · {creative.durationSeconds}s · {creative.campaignName}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: advTokens.text }}>
          {creative.verifiedPlays.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted }}>verified plays</Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 84 }} title={describeCompletion(creative)}>
        <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: percent === null ? advTokens.textMuted : advTokens.text }}>
          {percent === null ? '—' : `${percent}%`}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted }}>
          {percent === null ? 'no data' : 'completion'}
        </Typography>
      </Box>

      <CampaignChip status={creative.campaignStatus} />
    </Box>
  );
}

/**
 * The owning campaign's status. Draft is the one worth colouring: it means this creative is not
 * running yet and can still be changed.
 */
function CampaignChip({ status }: { status: CampaignStatus | '' }) {
  if (!status) return null;

  const style = status === 'Active' || status === 'Scheduled'
    ? { color: advTokens.green, bg: '#E9F9EF' }
    : status === 'Rejected' || status === 'Cancelled'
      ? { color: advTokens.red, bg: '#FDECEC' }
      : status === 'Draft'
        ? { color: advTokens.amber, bg: '#FEF3E2' }
        : { color: advTokens.textMuted, bg: '#F1F1F0' };

  return (
    <Box
      sx={{
        flexShrink: 0,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: style.color,
        backgroundColor: style.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {describeStatus(status)}
    </Box>
  );
}

export function useCreatives() {
  const [creatives, setCreatives] = useState<CreativeListItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchCreatives(undefined, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setCreatives(loaded);
        setState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });

    return () => controller.abort();
  }, [reloadToken]);

  return { creatives, state, reload: () => setReloadToken((n) => n + 1) };
}
