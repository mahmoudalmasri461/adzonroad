import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import SearchBox from '../../components/SearchBox';
import DataCard from '../../components/admin/DataCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../services/apiClient';
import {
  fetchAssignments,
  fetchCampaigns,
  fetchCapacity,
  fetchDeliverySummary,
  readableStatus,
  releaseAssignment,
  runAssignmentSweep,
  toneForStatus,
  type AdminCampaign,
  type Assignment,
  type AssignmentCapacity,
  type DeliverySummaryRow,
} from '../../services/admin';
import {
  buildCampaignRows,
  concernsFor,
  countByFilter,
  filterCampaignRows,
  type CampaignFilter,
  type CampaignRow,
} from '../../services/campaignOperations';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * Every campaign on the platform, what it has recorded, and which rooftop each one is on.
 *
 * No progress bar. A campaign has no ad-play target — the entity carries a taxi count, a creative
 * duration, a budget and a date range, because the product is sold as vehicles for a period — so
 * "delivered of target" has no denominator and drawing one would mean inventing it. What is shown
 * is what was recorded, plus how far through its own window the campaign is, which is arithmetic
 * on two dates and the figure that actually tells an operator where to look.
 *
 * Capacity sits above because it makes a shortfall a standing condition rather than a surprise
 * discovered one campaign at a time.
 */

const SURFACE = { backgroundColor: '#fff', border: '1px solid #E7E4DE', borderRadius: '10px' } as const;

const FILTERS: CampaignFilter[] = ['all', 'pending', 'active', 'completed', 'rejected'];

export default function AdminCampaignsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [releasing, setReleasing] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [filter, setFilter] = useState<CampaignFilter>('all');
  const [search, setSearch] = useState('');

  const loaded = useAsyncData<{
    campaigns: AdminCampaign[];
    assignments: Assignment[];
    capacity: AssignmentCapacity | null;
    delivery: DeliverySummaryRow[];
  }>(
    async (signal) => {
      // One loader rather than four hooks: the capacity figure, the assignment count and the
      // delivery rows are read together, and independent fetches would let them describe
      // different moments.
      const [campaigns, assignments, capacity, delivery] = await Promise.all([
        fetchCampaigns('all', signal),
        fetchAssignments(true, signal),
        fetchCapacity(signal).catch(() => null),
        fetchDeliverySummary(24 * 30, signal).catch(() => [] as DeliverySummaryRow[]),
      ]);
      return { campaigns, assignments, capacity, delivery };
    },
    [],
    'Campaigns could not be loaded.',
  );

  const campaigns = useMemo(() => loaded.data?.campaigns ?? [], [loaded.data]);
  const assignments = useMemo(() => loaded.data?.assignments ?? [], [loaded.data]);
  const capacity = loaded.data?.capacity ?? null;

  const allRows = useMemo(
    () => buildCampaignRows(campaigns, loaded.data?.delivery ?? [], assignments),
    [campaigns, assignments, loaded.data],
  );

  const rows = useMemo(() => filterCampaignRows(allRows, filter, search), [allRows, filter, search]);
  const counts = useMemo(() => countByFilter(allRows), [allRows]);

  const release = async (assignment: Assignment) => {
    setReleasing(assignment.assignmentId);
    try {
      await releaseAssignment(assignment.assignmentId);
      showToast(t('admin.campaigns.assignments.released', { screen: assignment.screenSerial ?? 'Screen' }));
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : t('admin.campaigns.assignments.releaseFailed'));
    } finally {
      setReleasing(null);
    }
  };

  const sweep = async () => {
    setSweeping(true);
    try {
      const result = await runAssignmentSweep();
      showToast(
        t('admin.campaigns.sweepDone', {
          assigned: result.assigned,
          released: result.released,
          short: result.shortfalls.length,
        }),
      );
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : t('admin.campaigns.sweepFailed'));
    } finally {
      setSweeping(false);
    }
  };

  const campaignColumns = useMemo<GridColDef<CampaignRow>[]>(
    () => [
      {
        field: 'name',
        headerName: t('admin.campaigns.table.campaign'),
        flex: 1.2,
        minWidth: 210,
        valueGetter: (_v, row) => row.campaign.name,
        renderCell: (params) => {
          const concerns = concernsFor(params.row);
          return (
            <Box sx={{ py: '6px', minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.navy }} noWrap>
                {params.row.campaign.name}
              </Typography>
              {concerns.length > 0 && (
                <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap', mt: '2px' }}>
                  {concerns.map((c) => (
                    <StatusTag key={c} label={t(`admin.campaigns.concerns.${c}`)} variant="warn" />
                  ))}
                </Box>
              )}
            </Box>
          );
        },
      },
      {
        field: 'advertiser',
        headerName: t('admin.campaigns.table.advertiser'),
        flex: 0.9,
        minWidth: 150,
        valueGetter: (_v, row) => row.campaign.advertiser ?? '—',
      },
      {
        field: 'status',
        headerName: t('admin.campaigns.table.status'),
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_v, row) => row.campaign.status,
        renderCell: (params) => (
          <StatusTag
            label={readableStatus(params.row.campaign.status)}
            variant={toneForStatus(params.row.campaign.status)}
          />
        ),
      },
      {
        field: 'period',
        headerName: t('admin.campaigns.table.period'),
        flex: 1,
        minWidth: 175,
        sortable: false,
        renderCell: (params) => {
          const { startDate, endDate } = params.row.campaign;
          const progress = params.row.scheduleProgress;
          return (
            <Box sx={{ py: '8px', width: '100%', minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, color: tokens.navy, direction: 'ltr', textAlign: 'start' }} noWrap>
                {startDate.slice(0, 10)} → {endDate.slice(0, 10)}
              </Typography>
              {progress !== null && (
                <>
                  {/* Time through the campaign's own window. Explicitly not delivery. */}
                  <Box sx={{ mt: '4px', height: 3, borderRadius: '999px', backgroundColor: '#EFEDE8', overflow: 'hidden' }}>
                    <Box sx={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: tokens.navy600, opacity: 0.5 }} />
                  </Box>
                  <Typography sx={{ mt: '2px', fontSize: 10.5, color: tokens.textMuted }}>
                    {t('admin.campaigns.table.elapsed', { percent: Math.round(progress * 100) })}
                  </Typography>
                </>
              )}
            </Box>
          );
        },
      },
      {
        field: 'screensAssigned',
        headerName: t('admin.campaigns.table.screens'),
        flex: 0.5,
        minWidth: 105,
        type: 'number',
        valueGetter: (_v, row) => row.screensAssigned,
      },
      {
        field: 'taxiCount',
        headerName: t('admin.campaigns.table.taxis'),
        flex: 0.4,
        minWidth: 85,
        type: 'number',
        valueGetter: (_v, row) => row.campaign.taxiCount,
      },
      {
        field: 'recordedPlays',
        headerName: t('admin.campaigns.table.recorded'),
        flex: 0.7,
        minWidth: 145,
        type: 'number',
        valueGetter: (_v, row) => row.recordedPlays,
      },
      {
        field: 'conflictPlays',
        headerName: t('admin.campaigns.table.inDoubt'),
        flex: 0.5,
        minWidth: 105,
        type: 'number',
        valueGetter: (_v, row) => row.conflictPlays,
        renderCell: (params) =>
          params.row.conflictPlays > 0 ? (
            <StatusTag label={String(params.row.conflictPlays)} variant="error" />
          ) : (
            <span>0</span>
          ),
      },
      {
        field: 'price',
        headerName: t('admin.campaigns.table.price'),
        flex: 0.6,
        minWidth: 110,
        valueGetter: (_v, row) => formatCurrency(row.campaign.price),
      },
    ],
    [t],
  );

  const assignmentColumns = useMemo<GridColDef<Assignment>[]>(
    () => [
      {
        field: 'campaignName',
        headerName: t('admin.campaigns.assignments.campaign'),
        flex: 1.1,
        minWidth: 180,
        valueGetter: (_v, row) => row.campaignName ?? '—',
      },
      {
        field: 'advertiser',
        headerName: t('admin.campaigns.assignments.advertiser'),
        flex: 0.9,
        minWidth: 150,
        valueGetter: (_v, row) => row.advertiser ?? '—',
      },
      {
        field: 'screenSerial',
        headerName: t('admin.campaigns.assignments.screen'),
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_v, row) => row.screenSerial ?? '—',
      },
      {
        field: 'vehiclePlate',
        headerName: t('admin.campaigns.assignments.vehicle'),
        flex: 0.6,
        minWidth: 110,
        valueGetter: (_v, row) => row.vehiclePlate ?? '—',
      },
      {
        field: 'matchBasis',
        headerName: t('admin.campaigns.assignments.basis'),
        flex: 0.9,
        minWidth: 175,
        renderCell: (params) => (
          <StatusTag
            label={
              params.row.matchBasis === 'ObservedPresence'
                ? t('admin.campaigns.assignments.observed')
                : t('admin.campaigns.assignments.declared')
            }
            variant={params.row.matchBasis === 'ObservedPresence' ? 'live' : 'neutral'}
          />
        ),
      },
      {
        field: 'assignedBy',
        headerName: t('admin.campaigns.assignments.assignedBy'),
        flex: 0.6,
        minWidth: 120,
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 120,
        renderCell: (params) => (
          <Button
            size="small"
            color="error"
            disabled={releasing === params.row.assignmentId}
            onClick={() => release(params.row)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('admin.campaigns.assignments.release')}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [releasing, t],
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '16px' }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={sweeping}
          startIcon={sweeping ? <CircularProgress size={14} color="inherit" /> : undefined}
          onClick={sweep}
          sx={{ borderRadius: '9px' }}
        >
          {sweeping ? t('admin.campaigns.sweeping') : t('admin.campaigns.sweep')}
        </Button>
      </Box>

      {capacity && capacity.totalShortfall > 0 && (
        <Box sx={{ ...SURFACE, px: '16px', py: '12px', mb: '16px', borderColor: 'rgba(180,35,24,0.35)', backgroundColor: 'rgba(180,35,24,0.05)' }}>
          <Typography sx={{ fontSize: 12.5, color: tokens.navy }}>
            {t('admin.campaigns.oversold', {
              sold: capacity.taxiSlotsRequested,
              usable: capacity.usableScreens,
              short: capacity.totalShortfall,
            })}
          </Typography>
        </Box>
      )}

      {/* Only what the tabs do not already say. Campaign, pending and active counts sit on the
          filters below, and repeating them here was three of six cells saying nothing new. What
          is left is inventory, which no tab covers. */}
      <Box
        sx={{
          ...SURFACE,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          mb: '16px',
          overflow: 'hidden',
        }}
      >
        <Metric label={t('admin.campaigns.metrics.carrying')} value={assignments.length} />
        <Metric label={t('admin.campaigns.metrics.free')} value={capacity ? capacity.freeScreens : null} />
        <Metric
          label={t('admin.campaigns.metrics.unfilled')}
          value={capacity ? capacity.totalShortfall : null}
          tone={capacity && capacity.totalShortfall > 0 ? 'bad' : undefined}
        />
      </Box>

      {/* Status tabs, mapped to statuses the API actually stores, with real counts behind them. */}
      <Box
        sx={{
          ...SURFACE,
          p: '10px 12px',
          mb: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Box role="radiogroup" aria-label={t('admin.campaigns.table.status')} sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Box
              key={f}
              component="button"
              type="button"
              role="radio"
              aria-checked={filter === f}
              data-active={filter === f ? 'true' : undefined}
              onClick={() => setFilter(f)}
              sx={{
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: '1px solid #E4E1DA',
                borderRadius: '8px',
                background: 'none',
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                color: tokens.textMuted,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                '&:hover': { borderColor: '#CFCBC2' },
                '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                '&[data-active="true"]': {
                  borderColor: tokens.amber,
                  backgroundColor: 'rgba(245,166,35,0.12)',
                  color: tokens.navy,
                },
              }}
            >
              {t(`admin.campaigns.filters.${f}`)}
              <Box component="span" sx={{ direction: 'ltr', fontSize: 11.5, opacity: 0.7 }}>
                {counts[f]}
              </Box>
            </Box>
          ))}
        </Box>

        <SearchBox value={search} onChange={setSearch} placeholder={t('admin.campaigns.search')} width={300} />
      </Box>

      <Box sx={{ mb: '20px' }}>
        <DataCard
          title={t('admin.campaigns.table.title')}
          count={rows.length}
          loading={loaded.loading}
          error={loaded.error}
          onRetry={loaded.reload}
          rows={rows}
          columns={campaignColumns}
          getRowId={(row) => row.campaign.campaignId}
          emptyTitle={campaigns.length === 0 ? t('admin.campaigns.table.empty') : t('admin.campaigns.table.noMatch')}
          emptyDescription={
            campaigns.length === 0 ? t('admin.campaigns.table.emptyDetail') : t('admin.campaigns.table.noMatchDetail')
          }
          note={`${t('admin.campaigns.table.noTarget')} ${t('admin.campaigns.table.note')}`}
        />
      </Box>

      <DataCard
        title={t('admin.campaigns.assignments.title')}
        count={assignments.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={assignments}
        columns={assignmentColumns}
        getRowId={(row) => row.assignmentId}
        emptyTitle={t('admin.campaigns.assignments.empty')}
        emptyDescription={t('admin.campaigns.assignments.emptyDetail')}
        note={t('admin.campaigns.assignments.note')}
      />
    </>
  );
}

/** `null` means the figure could not be read, which is shown as a dash rather than a zero. */
function Metric({ label, value, tone }: { label: string; value: number | null; tone?: 'warn' | 'bad' }) {
  return (
    <Box sx={{ padding: '13px 16px', borderInlineEnd: '1px solid #EFEDE8', '&:last-of-type': { borderInlineEnd: 0 } }}>
      <Typography
        sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: tokens.textMuted, mb: '5px' }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 21,
          fontWeight: 700,
          lineHeight: 1.1,
          direction: 'ltr',
          textAlign: 'start',
          color: tone === 'bad' ? '#B42318' : tone === 'warn' ? '#8A5A12' : tokens.navy,
        }}
      >
        {value === null ? '—' : value}
      </Typography>
    </Box>
  );
}
