import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AnalyticsChart from './AnalyticsChart';
import EmptyState from '../EmptyState';
import { advTokens, cardSx } from './theme';
import { describeQualification } from '../../services/deliveryReport';
import {
  formatScreenTime,
  loadPortfolio,
  shortDay,
  verifiedShare,
  type PortfolioDelivery,
} from '../../services/advertiserAnalytics';

/**
 * Delivery across every campaign the advertiser is running.
 *
 * Charts only verified delivery. Pending and contradicted claims appear beside it as their own
 * figures rather than being folded into the line, because a chart that quietly counts unverified
 * playback is the most persuasive way to overstate what was delivered.
 */
export default function DeliveryAnalytics({ days = 30 }: { days?: number }) {
  const [portfolio, setPortfolio] = useState<PortfolioDelivery | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    loadPortfolio(days, controller.signal)
      .then((p) => { if (!controller.signal.aborted) setPortfolio(p); })
      .catch(() => { if (!controller.signal.aborted) setError('Could not load your delivery data.'); });

    return () => controller.abort();
  }, [days]);

  if (error) return <Alert severity="info" sx={{ fontSize: 13 }}>{error}</Alert>;

  if (!portfolio) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (portfolio.totalClaims === 0) {
    return (
      <Box sx={{ ...cardSx, padding: '20px' }}>
        <EmptyState
          title="No delivery recorded yet"
          description={
            portfolio.campaigns.length === 0
              ? 'Create a campaign and it will appear here once it starts running.'
              : 'Your campaigns have not reported any playback in this period.'
          }
        />
      </Box>
    );
  }

  const quality = [
    { label: 'Verified', value: portfolio.verifiedPlays, color: advTokens.green },
    { label: 'Awaiting evidence', value: portfolio.pendingEvidencePlays, color: advTokens.blue },
    { label: 'Not verified', value: portfolio.notVerifiedPlays, color: advTokens.red },
  ].filter((slice) => slice.value > 0);

  return (
    <>
      {portfolio.anyRollupStale && (
        <Alert severity="info" sx={{ mb: '16px', fontSize: 12.5 }}>
          Dashboard totals elsewhere may still be catching up. These figures are computed from the
          underlying claims and are the ones to rely on.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '16px', mb: '24px' }}>
        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '2px' }}>
            Verified plays by day
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '10px' }}>
            Only playback the GPS evidence supports
          </Typography>
          <AnalyticsChart
            variant="line"
            categories={portfolio.byDay.map((d) => shortDay(d.day))}
            series={[{
              label: 'Verified plays',
              data: portfolio.byDay.map((d) => d.verifiedPlays),
              color: advTokens.orange,
            }]}
          />
        </Box>

        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '2px' }}>
            Confirmed screen time by region
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '10px' }}>
            Where the advertisement actually played
          </Typography>
          {portfolio.byRegion.length === 0 ? (
            <EmptyState title="No located delivery yet" description="Verified plays will appear here by region." />
          ) : (
            <AnalyticsChart
              variant="bar"
              categories={portfolio.byRegion.map((r) => r.regionName)}
              series={[{
                label: 'Seconds',
                data: portfolio.byRegion.map((r) => r.verifiedSeconds),
                color: advTokens.blue,
              }]}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: '16px' }}>
        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '2px' }}>
            Evidence quality
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '10px' }}>
            Every claim in the period, in exactly one bucket
          </Typography>
          <AnalyticsChart variant="donut" data={quality} />
          <Typography sx={{ mt: '10px', fontSize: 12.5, color: advTokens.textMuted }}>
            {Math.round(verifiedShare(portfolio) * 100)}% of {portfolio.totalClaims} claimed plays
            verified · {formatScreenTime(portfolio.verifiedSeconds)} confirmed screen time
          </Typography>
        </Box>

        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: advTokens.text, mb: '2px' }}>
            Where delivery was reported from
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mb: '12px' }}>
            Screen hardware can confirm a play outright; a driver's phone cannot
          </Typography>

          <Box sx={{ display: 'grid', gap: '8px', fontSize: 13 }}>
            <Row label="Screen-confirmed" value={String(portfolio.screenConfirmedPlays)} />
            <Row label="Device-declared" value={String(portfolio.deviceDeclaredPlays)} />
          </Box>

          {portfolio.qualifications.length > 0 && (
            <>
              <Typography sx={{ mt: '16px', mb: '6px', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
                Why plays carried notes
              </Typography>
              <Box sx={{ display: 'grid', gap: '5px', fontSize: 12.5 }}>
                {portfolio.qualifications.slice(0, 5).map((q) => (
                  <Box key={q.qualification} sx={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ color: advTokens.text }}>{describeQualification(q.qualification)}</span>
                    <span style={{ color: advTokens.textMuted, fontWeight: 700 }}>{q.plays}</span>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: advTokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700, color: advTokens.text }}>{value}</span>
    </Box>
  );
}
