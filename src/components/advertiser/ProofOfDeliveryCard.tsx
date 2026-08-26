import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import { advTokens, cardSx } from './theme';
import { useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../services/apiClient';
import {
  describeQualification,
  describeStatus,
  downloadProofOfDelivery,
  fetchCampaigns,
  fetchClaims,
  fetchDeliverySummary,
  formatSeconds,
  summarise,
  toneFor,
  verifiedShare,
  type ClaimTone,
  type DeliverySummary,
  type PlaybackClaim,
  type ReportableCampaign,
} from '../../services/deliveryReport';

/**
 * Proof of delivery for one campaign over one window.
 *
 * The layout follows the argument the report is making: what was verified, what is still
 * outstanding, and then the individual claims so any figure can be traced back to the evidence
 * that produced it. The outstanding part is not tucked away — a report that showed only the
 * verified count would be the more flattering and less useful document.
 */

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const;

const TONE_COLORS: Record<ClaimTone, string> = {
  good: advTokens.green,
  qualified: advTokens.amber,
  pending: advTokens.blue,
  bad: advTokens.red,
};

export default function ProofOfDeliveryCard() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Campaign lists elsewhere in the portal link here for a single campaign's evidence, which is
  // the only per-campaign detail view the portal has.
  const requestedCampaignId = searchParams.get('campaign') ?? '';

  const [campaigns, setCampaigns] = useState<ReportableCampaign[] | null>(null);
  const [campaignId, setCampaignId] = useState('');
  const [days, setDays] = useState<number>(30);

  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [claims, setClaims] = useState<PlaybackClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Recomputed only when the window changes, so a re-render does not silently move the range the
  // figures were fetched for.
  const window = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to };
  }, [days]);

  useEffect(() => {
    const controller = new AbortController();

    fetchCampaigns(controller.signal)
      .then((list) => {
        setCampaigns(list);
        const requested = list.some((c) => c.campaignId === requestedCampaignId)
          ? requestedCampaignId
          : '';
        setCampaignId((current) => requested || current || list[0]?.campaignId || '');
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setCampaigns([]);
        setError(messageFor(e));
      });

    return () => controller.abort();
  }, [requestedCampaignId]);

  useEffect(() => {
    if (!campaignId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDeliverySummary(campaignId, window.from, window.to, controller.signal),
      fetchClaims(campaignId, window.from, window.to, { pageSize: 100 }, controller.signal),
    ])
      .then(([nextSummary, page]) => {
        setSummary(nextSummary);
        setClaims(page.items);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setSummary(null);
        setClaims([]);
        setError(messageFor(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [campaignId, window]);

  const download = useCallback(async () => {
    if (!campaignId) return;

    setDownloading(true);
    try {
      await downloadProofOfDelivery(campaignId, window.from, window.to);
    } catch (e: unknown) {
      showToast(messageFor(e));
    } finally {
      setDownloading(false);
    }
  }, [campaignId, window, showToast]);

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Evidence
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text }}>
            Proof of delivery
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Campaign"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={!campaigns || campaigns.length === 0}
            sx={{ minWidth: 200 }}
          >
            {(campaigns ?? []).map((c) => (
              <MenuItem key={c.campaignId} value={c.campaignId}>{c.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Period"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            sx={{ minWidth: 140 }}
          >
            {RANGES.map((r) => (
              <MenuItem key={r.days} value={r.days}>{r.label}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            size="small"
            startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
            disabled={!summary || downloading}
            onClick={download}
            sx={{ fontWeight: 700, backgroundColor: advTokens.orange, '&:hover': { backgroundColor: advTokens.orangeHover } }}
          >
            CSV
          </Button>
        </Box>
      </Box>

      {error && <Notice tone="bad">{error}</Notice>}

      {loading && !summary && (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <CircularProgress size={22} />
        </Box>
      )}

      {campaigns?.length === 0 && !error && (
        <Notice tone="neutral">No campaigns are available to report on yet.</Notice>
      )}

      {summary && (
        <>
          <Typography sx={{ mt: '14px', fontSize: 13.5, color: advTokens.text, lineHeight: 1.6 }}>
            {summarise(summary)}
          </Typography>

          <Typography sx={{ mt: '4px', fontSize: 11.5, color: advTokens.textMuted }}>
            {new Date(summary.fromUtc).toLocaleDateString()} – {new Date(summary.toUtc).toLocaleDateString()}
            {' · generated '}{new Date(summary.generatedAtUtc).toLocaleString()}
          </Typography>

          {/* The rollup is a cache; the figures above never come from it. Saying so is cheaper
              than an advertiser noticing the dashboard and the report disagree. */}
          {!summary.rollupAgrees && (
            <Notice tone="pending">
              Dashboard totals are still catching up with this evidence. The figures here are
              computed from the underlying claims and are the ones to rely on.
            </Notice>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: '10px', mt: '16px' }}>
            <Metric label="Verified plays" value={summary.counts.verifiedPlays} tone="good" />
            <Metric label="Confirmed screen time" value={formatSeconds(summary.counts.verifiedSeconds)} tone="good" />
            <Metric label="Awaiting evidence" value={summary.counts.pendingEvidencePlays} tone="pending" />
            <Metric
              label="Not verified"
              value={summary.counts.unverifiedPlays + summary.counts.rejectedPlays}
              tone={summary.counts.unverifiedPlays + summary.counts.rejectedPlays > 0 ? 'bad' : 'neutral'}
            />
          </Box>

          <VerifiedBar summary={summary} />

          <Box sx={{ display: 'flex', gap: '18px', flexWrap: 'wrap', mt: '14px' }}>
            <Tooltip title="Reported by screen hardware, which can observe the panel itself.">
              <Typography sx={{ fontSize: 12, color: advTokens.textMuted, cursor: 'help' }}>
                Screen-confirmed: <b style={{ color: advTokens.text }}>{summary.screenConfirmedPlays}</b>
              </Typography>
            </Tooltip>
            <Tooltip title="Reported by the driver's phone standing in for hardware. These can never rise above 'verified, with notes' however good the GPS.">
              <Typography sx={{ fontSize: 12, color: advTokens.textMuted, cursor: 'help' }}>
                Device-declared: <b style={{ color: advTokens.text }}>{summary.deviceDeclaredPlays}</b>
              </Typography>
            </Tooltip>
          </Box>

          {summary.qualifications.length > 0 && (
            <Box sx={{ mt: '16px' }}>
              <SectionLabel>Why some plays carried notes</SectionLabel>
              <Box sx={{ display: 'grid', gap: '4px', mt: '6px' }}>
                {summary.qualifications.map((q) => (
                  <Box key={q.qualification} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: advTokens.text }}>{describeQualification(q.qualification)}</span>
                    <span style={{ color: advTokens.textMuted, fontWeight: 700 }}>{q.plays}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {summary.byRegion.length > 0 && (
            <Box sx={{ mt: '16px' }}>
              <SectionLabel>Where it played</SectionLabel>
              <Box sx={{ display: 'grid', gap: '4px', mt: '6px' }}>
                {summary.byRegion.map((r) => (
                  <Box key={r.regionId ?? 'unknown'} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: advTokens.text }}>{r.regionName}</span>
                    <span style={{ color: advTokens.textMuted, fontWeight: 700 }}>
                      {r.verifiedPlays} plays · {formatSeconds(r.verifiedSeconds)}
                    </span>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <ClaimTable claims={claims} total={summary.counts.total} />
        </>
      )}
    </Box>
  );
}

/**
 * Every claim, in the order it played. Coordinates carry a marker when the position was
 * interpolated rather than measured — the same distinction the live map draws, kept intact all the
 * way into the evidence table.
 */
function ClaimTable({ claims, total }: { claims: PlaybackClaim[]; total: number }) {
  if (claims.length === 0) return null;

  return (
    <Box sx={{ mt: '20px' }}>
      <SectionLabel>
        Individual claims{claims.length < total ? ` (showing ${claims.length} of ${total})` : ''}
      </SectionLabel>

      <Box sx={{ overflowX: 'auto', mt: '8px' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
          <Box component="thead">
            <Box component="tr" sx={{ '& th': { textAlign: 'left', padding: '8px 10px', color: advTokens.textMuted, fontWeight: 700, fontSize: 11.5, borderBottom: `1px solid ${advTokens.border}`, whiteSpace: 'nowrap' } }}>
              <th>Played</th>
              <th>Duration</th>
              <th>Verdict</th>
              <th>Reported by</th>
              <th>Screen</th>
              <th>Position</th>
            </Box>
          </Box>
          <Box component="tbody">
            {claims.map((c) => (
              <Box
                key={c.playbackEventId}
                component="tr"
                sx={{ '& td': { padding: '8px 10px', borderBottom: `1px solid ${advTokens.border}`, color: advTokens.text, verticalAlign: 'top' } }}
              >
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.startedAtUtc).toLocaleString()}</td>
                <td>{c.actualDurationSeconds}s</td>
                <td>
                  <span style={{ color: TONE_COLORS[toneFor(c.verificationStatus)], fontWeight: 700 }}>
                    {describeStatus(c.verificationStatus)}
                  </span>
                  {c.qualifications.length > 0 && (
                    <Box sx={{ mt: '2px', fontSize: 11, color: advTokens.textMuted }}>
                      {c.qualifications.map(describeQualification).join('; ')}
                    </Box>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {c.source === 'ScreenConfirmed' ? 'Screen' : "Driver's phone"}
                </td>
                <td>{c.screenSerial ?? '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {c.startLat !== null && c.startLng !== null ? (
                    <>
                      {c.startLat.toFixed(5)}, {c.startLng.toFixed(5)}
                      {c.startIsDerived && (
                        <Tooltip title="Interpolated between two measured fixes rather than measured directly.">
                          <span style={{ color: advTokens.textMuted, cursor: 'help' }}> (estimated)</span>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <span style={{ color: advTokens.textMuted }}>No position</span>
                  )}
                </td>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The verified share as a bar, with the rest of the claims visible beside it rather than left as
 * empty space. Empty space reads as "nothing there"; a coloured segment reads as "something we
 * have not confirmed", which is what it is.
 */
function VerifiedBar({ summary }: { summary: DeliverySummary }) {
  const { counts } = summary;
  if (counts.total === 0) return null;

  const segment = (value: number, tone: ClaimTone) =>
    value > 0 ? { flexGrow: value, backgroundColor: TONE_COLORS[tone] } : null;

  const segments = [
    segment(counts.fullyVerifiedPlays, 'good'),
    segment(counts.qualifiedPlays, 'qualified'),
    segment(counts.pendingEvidencePlays, 'pending'),
    segment(counts.unverifiedPlays + counts.rejectedPlays, 'bad'),
  ].filter(Boolean) as { flexGrow: number; backgroundColor: string }[];

  return (
    <Box sx={{ mt: '14px' }}>
      <Box sx={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: '2px' }}>
        {segments.map((s, i) => (
          <Box key={i} sx={{ flexGrow: s.flexGrow, backgroundColor: s.backgroundColor }} />
        ))}
      </Box>
      <Typography sx={{ mt: '6px', fontSize: 11.5, color: advTokens.textMuted }}>
        {Math.round(verifiedShare(counts) * 100)}% of claimed plays verified
      </Typography>
    </Box>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone: ClaimTone | 'neutral' }) {
  return (
    <Box sx={{ border: `1px solid ${advTokens.border}`, borderRadius: '10px', padding: '10px 12px' }}>
      <Typography sx={{ fontSize: 11, color: advTokens.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 800, color: tone === 'neutral' ? advTokens.text : TONE_COLORS[tone] }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
      {children}
    </Typography>
  );
}

function Notice({ tone, children }: { tone: ClaimTone | 'neutral'; children: React.ReactNode }) {
  const color = tone === 'neutral' ? advTokens.textMuted : TONE_COLORS[tone];

  return (
    <Box sx={{ mt: '14px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${color}55`, backgroundColor: `${color}14` }}>
      <Typography sx={{ fontSize: 12.5, color: advTokens.text, lineHeight: 1.5 }}>{children}</Typography>
    </Box>
  );
}

/** Keeps the 404-not-403 distinction legible instead of collapsing every failure into one string. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) return 'Sign in again to view delivery evidence.';
    if (error.isNotFound) return 'That campaign is not available to this account.';
    return error.message;
  }

  return 'Could not reach the reporting service.';
}
