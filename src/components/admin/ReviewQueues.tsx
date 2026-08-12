import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { ApiError } from '../../services/apiClient';
import {
  approve,
  fetchAdvertiserQueue,
  fetchCampaignQueue,
  fetchDriverQueue,
  fetchFleetQueue,
  hasAllDocuments,
  reject,
  waitingFor,
  QUEUE_LABELS,
  type AccountRegistration,
  type DriverRegistration,
  type PendingCampaign,
  type ReviewKind,
} from '../../services/admin';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * The review desk: everything waiting on a decision, and the means to make it.
 *
 * Nothing on this platform self-approves, which until now meant an administrator could only
 * approve things by calling the API directly. This is that workflow given a surface.
 *
 * Rejections require a reason, matching what the server enforces. That is not a formality: a
 * rejection the applicant cannot act on comes straight back unchanged.
 */

type QueueRow = {
  id: string;
  title: string;
  subtitle: string;
  createdAtUtc: string;
  /** Shown as a warning chip when the application cannot actually be judged as it stands. */
  caveat?: string;
};

const KINDS: ReviewKind[] = ['driver', 'advertiser', 'fleet', 'campaign'];

export default function ReviewQueues({ onCountsChanged }: { onCountsChanged?: (total: number) => void }) {
  const [kind, setKind] = useState<ReviewKind>('driver');
  const [rows, setRows] = useState<Record<ReviewKind, QueueRow[] | null>>({
    driver: null, advertiser: null, fleet: null, campaign: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ row: QueueRow; action: 'approve' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    // All four at once: the tab strip shows every count, so waiting until a tab is opened would
    // leave an administrator unaware of a queue they never clicked.
    Promise.all([
      fetchDriverQueue(controller.signal).then(toDriverRows).catch(() => null),
      fetchAdvertiserQueue(controller.signal).then((r) => toAccountRows(r)).catch(() => null),
      fetchFleetQueue(controller.signal).then((r) => toAccountRows(r)).catch(() => null),
      fetchCampaignQueue(controller.signal).then(toCampaignRows).catch(() => null),
    ])
      .then(([driver, advertiser, fleet, campaign]) => {
        if (controller.signal.aborted) return;

        setRows({ driver, advertiser, fleet, campaign });

        const total = [driver, advertiser, fleet, campaign]
          .reduce((sum, list) => sum + (list?.length ?? 0), 0);
        onCountsChanged?.(total);

        if ([driver, advertiser, fleet, campaign].every((list) => list === null)) {
          setError('Could not load the review queues.');
        } else {
          setError(null);
        }
      });

    return () => controller.abort();
  }, [reload, onCountsChanged]);

  const decide = useCallback(async () => {
    if (!decision) return;

    setWorking(true);
    try {
      if (decision.action === 'approve') {
        await approve(kind, decision.row.id, notes.trim() || undefined);
      } else {
        await reject(kind, decision.row.id, notes.trim());
      }
      setDecision(null);
      setNotes('');
      setReload((n) => n + 1);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'That decision could not be saved.');
    } finally {
      setWorking(false);
    }
  }, [decision, kind, notes]);

  const current = rows[kind];
  const rejectionNeedsReason = decision?.action === 'reject' && notes.trim().length === 0;

  return (
    <Card sx={{ p: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
        Waiting on you
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '10px' }}>Review queue</Typography>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

      <Tabs
        value={kind}
        onChange={(_, v) => setKind(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: '12px', minHeight: 38, '& .MuiTab-root': { minHeight: 38, textTransform: 'none', fontWeight: 600, fontSize: 13.5 } }}
      >
        {KINDS.map((k) => (
          <Tab
            key={k}
            value={k}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {QUEUE_LABELS[k].title}
                {(rows[k]?.length ?? 0) > 0 && (
                  <Chip
                    size="small"
                    label={rows[k]!.length}
                    sx={{ height: 18, fontSize: 11, fontWeight: 700, backgroundColor: tokens.blue, color: '#fff' }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {current === null && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {current?.length === 0 && (
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', py: '14px' }}>
          {QUEUE_LABELS[kind].empty}
        </Typography>
      )}

      {current && current.length > 0 && (
        <Box sx={{ display: 'grid', gap: '2px' }}>
          {current.map((row) => (
            <Box
              key={row.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                padding: '12px 4px', borderBottom: '1px solid', borderColor: 'divider',
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{row.title}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.subtitle}</Typography>
                {row.caveat && (
                  <Chip
                    size="small"
                    label={row.caveat}
                    sx={{ mt: '4px', height: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#FEF3E2', color: tokens.warn }}
                  />
                )}
              </Box>

              <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                waiting {waitingFor(row.createdAtUtc)}
              </Typography>

              <Box sx={{ display: 'flex', gap: '8px' }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                  onClick={() => { setDecision({ row, action: 'reject' }); setNotes(''); }}
                >
                  Reject
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                  onClick={() => { setDecision({ row, action: 'approve' }); setNotes(''); }}
                >
                  Approve
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={decision !== null} onClose={working ? undefined : () => setDecision(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>
          {decision?.action === 'approve' ? 'Approve' : 'Reject'} {decision?.row.title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            {decision?.action === 'approve'
              ? 'They will be able to sign in immediately.'
              : 'They will see this reason, so make it something they can act on.'}
          </Typography>
          <TextField
            label={decision?.action === 'reject' ? 'Reason (required)' : 'Notes (optional)'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus
            disabled={working}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setDecision(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={decision?.action === 'approve' ? 'primary' : 'error'}
            disabled={working || rejectionNeedsReason}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={decide}
          >
            {decision?.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------- shaping

function toDriverRows(response: { items: DriverRegistration[] } | DriverRegistration[]): QueueRow[] {
  const items = Array.isArray(response) ? response : response.items;

  return (items ?? []).map((d) => ({
    id: d.driverId,
    title: d.fullName,
    subtitle: [d.mobileNumber, d.region, [d.carModel, d.plateNumber].filter(Boolean).join(' · ')]
      .filter(Boolean).join(' — '),
    createdAtUtc: d.createdAtUtc,
    // The endpoint stores whatever documents it is given, including none. An application short of
    // the three cannot actually be judged, so say so rather than presenting it as ready.
    caveat: hasAllDocuments(d)
      ? undefined
      : `${d.documentTypes.length} of 3 documents`,
  }));
}

function toAccountRows(items: AccountRegistration[]): QueueRow[] {
  return (items ?? []).map((a) => ({
    id: a.accountId,
    title: a.companyName,
    subtitle: [a.contactName, a.email, a.mobileNumber, a.region].filter(Boolean).join(' — '),
    createdAtUtc: a.createdAtUtc,
  }));
}

function toCampaignRows(items: PendingCampaign[]): QueueRow[] {
  return (items ?? []).map((c) => ({
    id: c.campaignId,
    title: c.name,
    subtitle: [
      c.advertiser,
      `${c.taxiCount} taxis`,
      `${c.creativeDurationSeconds}s`,
      c.regions.join(', '),
      formatCurrency(c.price),
    ].filter(Boolean).join(' — '),
    createdAtUtc: c.createdAtUtc,
    caveat: c.creativeCount === 0 ? 'no creative' : undefined,
  }));
}
