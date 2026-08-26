import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../services/apiClient';
import {
  fetchAssignments,
  fetchCampaigns,
  fetchCapacity,
  readableStatus,
  releaseAssignment,
  runAssignmentSweep,
  toneForStatus,
  type AdminCampaign,
  type Assignment,
  type AssignmentCapacity,
} from '../../services/admin';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * Every campaign on the platform, and which rooftop each one is actually on.
 *
 * The two tables answer different questions and are both needed. The first is the book: what has
 * been sold. The second is the engine's work: what got placed, and on what basis it was chosen —
 * a screen picked because the taxi has been observed working the region is a stronger match than
 * one picked because its paperwork says it is based there, and the column says which.
 *
 * Capacity sits above both because it is the figure that makes a shortfall a standing condition
 * rather than a surprise discovered one campaign at a time.
 */

function getCampaignColumns(): GridColDef<AdminCampaign>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.1, minWidth: 180 },
    {
      field: 'advertiser',
      headerName: 'Advertiser',
      flex: 1,
      minWidth: 160,
      valueGetter: (_v, row) => row.advertiser ?? '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    { field: 'taxiCount', headerName: 'Taxis', flex: 0.4, minWidth: 80, type: 'number' },
    {
      field: 'creativeDurationSeconds',
      headerName: 'Duration',
      flex: 0.5,
      minWidth: 95,
      valueGetter: (_v, row) => `${row.creativeDurationSeconds}s`,
    },
    {
      field: 'regions',
      headerName: 'Regions',
      flex: 1,
      minWidth: 150,
      valueGetter: (_v, row) => row.regions.join(', ') || '—',
    },
    {
      field: 'creativeCount',
      headerName: 'Creatives',
      flex: 0.5,
      minWidth: 100,
      // A campaign with no creative cannot run whatever its status says, so it is called out
      // rather than shown as a zero somebody has to notice.
      renderCell: (params) =>
        params.row.creativeCount === 0
          ? <StatusTag label="None" variant="warn" />
          : <span>{params.row.creativeCount}</span>,
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_v, row) => formatCurrency(row.price),
    },
    {
      field: 'startDate',
      headerName: 'Runs',
      flex: 0.9,
      minWidth: 165,
      valueGetter: (_v, row) => `${row.startDate.slice(0, 10)} → ${row.endDate.slice(0, 10)}`,
    },
  ];
}

function getAssignmentColumns(
  onRelease: (assignment: Assignment) => void,
  releasing: string | null,
): GridColDef<Assignment>[] {
  return [
    {
      field: 'campaignName',
      headerName: 'Campaign',
      flex: 1.1,
      minWidth: 180,
      valueGetter: (_v, row) => row.campaignName ?? '—',
    },
    {
      field: 'advertiser',
      headerName: 'Advertiser',
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.advertiser ?? '—',
    },
    {
      field: 'screenSerial',
      headerName: 'Screen',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.screenSerial ?? '—',
    },
    {
      field: 'vehiclePlate',
      headerName: 'Vehicle',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_v, row) => row.vehiclePlate ?? '—',
    },
    {
      field: 'matchBasis',
      headerName: 'Chosen because',
      flex: 0.9,
      minWidth: 165,
      renderCell: (params) => (
        <StatusTag
          label={params.row.matchBasis === 'ObservedPresence' ? 'Observed in region' : 'Declared region'}
          variant={params.row.matchBasis === 'ObservedPresence' ? 'live' : 'neutral'}
        />
      ),
    },
    {
      field: 'assignedBy',
      headerName: 'Assigned by',
      flex: 0.6,
      minWidth: 115,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 110,
      renderCell: (params) => (
        <Button
          size="small"
          color="error"
          disabled={releasing === params.row.assignmentId}
          onClick={() => onRelease(params.row)}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Release
        </Button>
      ),
    },
  ];
}

export default function AdminCampaignsPage() {
  const { showToast } = useToast();
  const [releasing, setReleasing] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const loaded = useAsyncData<{
    campaigns: AdminCampaign[];
    assignments: Assignment[];
    capacity: AssignmentCapacity | null;
  }>(
    async (signal) => {
      // One loader rather than three hooks: the capacity figure and the assignment count are
      // read together, and two independent fetches would let them describe different moments.
      const [campaigns, assignments, capacity] = await Promise.all([
        fetchCampaigns('all', signal),
        fetchAssignments(true, signal),
        fetchCapacity(signal).catch(() => null),
      ]);
      return { campaigns, assignments, capacity };
    },
    [],
    'Campaigns could not be loaded.',
  );

  const campaigns = useMemo(() => loaded.data?.campaigns ?? [], [loaded.data]);
  const assignments = useMemo(() => loaded.data?.assignments ?? [], [loaded.data]);
  const capacity = loaded.data?.capacity ?? null;

  const { search, setSearch, filtered } = useSearchFilter(campaigns, ['name', 'advertiser', 'status']);

  const release = async (assignment: Assignment) => {
    setReleasing(assignment.assignmentId);
    try {
      await releaseAssignment(assignment.assignmentId);
      showToast(`${assignment.screenSerial ?? 'Screen'} released.`);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That screen could not be released.');
    } finally {
      setReleasing(null);
    }
  };

  const sweep = async () => {
    setSweeping(true);
    try {
      const result = await runAssignmentSweep();
      showToast(
        `Sweep done: ${result.assigned} assigned, ${result.released} released, ` +
        `${result.shortfalls.length} campaign${result.shortfalls.length === 1 ? '' : 's'} short.`,
      );
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'The sweep could not be run.');
    } finally {
      setSweeping(false);
    }
  };

  const pending = campaigns.filter((c) => c.status === 'PendingApproval').length;
  const active = campaigns.filter((c) => c.status === 'Active').length;

  const assignmentColumns = useMemo(
    () => getAssignmentColumns(release, releasing),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [releasing],
  );

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Everything sold, and which screen each campaign is on."
        actions={
          <Button
            variant="contained"
            color="primary"
            disabled={sweeping}
            startIcon={sweeping ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={sweep}
          >
            Run assignment sweep
          </Button>
        }
      />

      {capacity && capacity.totalShortfall > 0 && (
        <Alert severity="warning" sx={{ mb: '20px', fontSize: 13 }}>
          The network is oversold: {capacity.taxiSlotsRequested} taxi slots are sold against{' '}
          {capacity.usableScreens} usable screen{capacity.usableScreens === 1 ? '' : 's'}, leaving{' '}
          {capacity.totalShortfall} unfilled. Approving more campaigns will not create inventory.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(campaigns.length)} label="Campaigns" />
        <StatCard value={String(pending)} label="Awaiting review" color={pending > 0 ? tokens.warn : undefined} />
        <StatCard value={String(active)} label="Active" color={active > 0 ? tokens.green : undefined} />
        <StatCard value={String(assignments.length)} label="Screens carrying one" />
        <StatCard
          value={capacity ? String(capacity.freeScreens) : '—'}
          label="Screens free"
        />
        <StatCard
          value={capacity ? String(capacity.totalShortfall) : '—'}
          label="Taxi slots unfilled"
          color={capacity && capacity.totalShortfall > 0 ? tokens.red : undefined}
        />
      </Box>

      <Box sx={{ mb: '20px' }}>
        <DataCard
          title="All campaigns"
          count={campaigns.length}
          search={{ value: search, onChange: setSearch, placeholder: 'Search name, advertiser or status' }}
          loading={loaded.loading}
          error={loaded.error}
          onRetry={loaded.reload}
          rows={filtered}
          columns={getCampaignColumns()}
          getRowId={(row) => row.campaignId}
          emptyTitle="No campaigns yet"
          emptyDescription="Campaigns appear here as soon as an advertiser submits one."
          note="Approving and rejecting happens on the Overview review queue, where the decision is recorded against a reviewer."
        />
      </Box>

      <DataCard
        title="Current assignments"
        count={assignments.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={assignments}
        columns={assignmentColumns}
        getRowId={(row) => row.assignmentId}
        emptyTitle="Nothing is assigned"
        emptyDescription="No screen is carrying a campaign. With no screen hardware built, this is the expected state."
        note="Releasing frees the screen for the next sweep. It does not cancel the campaign or credit the invoice."
      />
    </>
  );
}
