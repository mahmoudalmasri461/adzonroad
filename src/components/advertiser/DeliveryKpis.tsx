import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CampaignIcon from '@mui/icons-material/Campaign';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TimerIcon from '@mui/icons-material/Timer';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { advTokens, cardSx } from './theme';
import {
  formatScreenTime,
  liveCampaigns,
  loadPortfolio,
  verifiedShare,
  type PortfolioDelivery,
} from '../../services/advertiserAnalytics';

/**
 * The four numbers an advertiser opens the page for.
 *
 * Deliberately not the KpiCard used before: that component requires a change percentage, a
 * comparison phrase and a sparkline trend, none of which the platform can supply yet. There is no
 * period-over-period comparison stored anywhere, so every one of those would have had to be
 * invented — and a fabricated "+12% vs last week" beside a real delivery figure makes the real
 * figure harder to trust, not easier.
 */
export default function DeliveryKpis({ days = 30 }: { days?: number }) {
  const [portfolio, setPortfolio] = useState<PortfolioDelivery | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    loadPortfolio(days, controller.signal)
      .then((p) => { if (!controller.signal.aborted) setPortfolio(p); })
      .catch(() => undefined);

    return () => controller.abort();
  }, [days]);

  const live = portfolio ? liveCampaigns(portfolio.campaigns).length : 0;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '14px', mb: '24px' }}>
      <Kpi
        label="Campaigns running"
        value={portfolio ? String(live) : '—'}
        hint={portfolio ? `${portfolio.campaigns.length} in total` : ' '}
        icon={<CampaignIcon sx={{ fontSize: 18 }} />}
      />
      <Kpi
        label="Verified plays"
        value={portfolio ? portfolio.verifiedPlays.toLocaleString() : '—'}
        hint={portfolio ? `${Math.round(verifiedShare(portfolio) * 100)}% of claims` : ' '}
        icon={<PlayCircleIcon sx={{ fontSize: 18 }} />}
        color={advTokens.green}
      />
      <Kpi
        label="Confirmed screen time"
        value={portfolio ? formatScreenTime(portfolio.verifiedSeconds) : '—'}
        hint={`last ${days} days`}
        icon={<TimerIcon sx={{ fontSize: 18 }} />}
      />
      <Kpi
        label="Awaiting evidence"
        value={portfolio ? portfolio.pendingEvidencePlays.toLocaleString() : '—'}
        hint={portfolio && portfolio.pendingEvidencePlays > 0 ? 'normal after an outage' : 'nothing outstanding'}
        icon={<PendingActionsIcon sx={{ fontSize: 18 }} />}
        color={portfolio && portfolio.pendingEvidencePlays > 0 ? advTokens.blue : undefined}
      />
    </Box>
  );
}

function Kpi({
  label, value, hint, icon, color,
}: {
  label: string; value: string; hint: string; icon: React.ReactNode; color?: string;
}) {
  return (
    <Box sx={{ ...cardSx, padding: '16px 18px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
          {label}
        </Typography>
        <Box sx={{ color: advTokens.textMuted, display: 'flex' }}>{icon}</Box>
      </Box>
      <Typography sx={{ fontSize: 24, fontWeight: 800, color: color ?? advTokens.text, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography sx={{ mt: '4px', fontSize: 11.5, color: advTokens.textMuted }}>{hint}</Typography>
    </Box>
  );
}
