import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
  approve,
  fetchDrivers,
  hasAllDocuments,
  readableStatus,
  suspendDriver,
  toneForStatus,
  waitingFor,
  type DriverRegistration,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * Every driver on the platform, whatever state their account is in.
 *
 * Suspension and reinstatement live here rather than on the review queue because they are not
 * review decisions. The queue is for applications nobody has judged yet; this is for a driver who
 * has been working and whose access is being taken away or given back. Both require a reason —
 * suspension stops somebody earning, and "why is my account off" deserves an answer.
 */

type PendingAction = { driver: DriverRegistration; kind: 'suspend' | 'reinstate' };

function getColumns(onAction: (action: PendingAction) => void): GridColDef<DriverRegistration>[] {
  return [
    { field: 'fullName', headerName: 'Driver', flex: 1, minWidth: 160 },
    { field: 'mobileNumber', headerName: 'Mobile', flex: 0.9, minWidth: 150 },
    {
      field: 'region',
      headerName: 'Region',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'vehicle',
      headerName: 'Vehicle',
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) =>
        [row.carModel, row.plateNumber].filter(Boolean).join(' · ') || 'No car registered',
    },
    {
      field: 'documentTypes',
      headerName: 'Documents',
      flex: 0.7,
      minWidth: 130,
      renderCell: (params) =>
        hasAllDocuments(params.row)
          ? <StatusTag label="Complete" variant="live" />
          : <StatusTag label={`${params.row.documentTypes.length} of 3`} variant="warn" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'createdAtUtc',
      headerName: 'Registered',
      flex: 0.6,
      minWidth: 120,
      valueGetter: (_v, row) => `${waitingFor(row.createdAtUtc)} ago`,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params) => {
        if (params.row.status === 'Approved') {
          return (
            <Button
              size="small"
              color="error"
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => onAction({ driver: params.row, kind: 'suspend' })}
            >
              Suspend
            </Button>
          );
        }

        if (params.row.status === 'Suspended') {
          return (
            <Button
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => onAction({ driver: params.row, kind: 'reinstate' })}
            >
              Reinstate
            </Button>
          );
        }

        // Pending and rejected applications belong to the review queue, which records a decision
        // against a reviewer. Offering the same action twice in two places invites two answers.
        return <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>—</Typography>;
      },
    },
  ];
}

export default function DriversPage() {
  const { showToast } = useToast();
  const [action, setAction] = useState<PendingAction | null>(null);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);

  const loaded = useAsyncData<DriverRegistration[]>(
    (signal) => fetchDrivers('all', 1, 100, signal).then((page) => page.items),
    [],
    'Drivers could not be loaded.',
  );

  const drivers = useMemo(() => loaded.data ?? [], [loaded.data]);

  const { search, setSearch, filtered } = useSearchFilter(drivers, [
    'fullName', 'mobileNumber', 'region', 'status', 'plateNumber',
  ]);

  const columns = useMemo(
    () => getColumns((next) => { setAction(next); setNotes(''); }),
    [],
  );

  const confirm = async () => {
    if (!action) return;

    setWorking(true);
    try {
      if (action.kind === 'suspend') {
        await suspendDriver(action.driver.driverId, notes.trim());
        showToast(`${action.driver.fullName} suspended.`);
      } else {
        await approve('driver', action.driver.driverId, notes.trim() || undefined);
        showToast(`${action.driver.fullName} reinstated.`);
      }
      setAction(null);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That change could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const approved = drivers.filter((d) => d.status === 'Approved').length;
  const pending = drivers.filter((d) => d.status === 'PendingVerification').length;
  const suspended = drivers.filter((d) => d.status === 'Suspended').length;
  const incomplete = drivers.filter((d) => !hasAllDocuments(d)).length;

  const suspending = action?.kind === 'suspend';
  const reasonMissing = suspending && notes.trim().length === 0;

  return (
    <>
      <PageHeader title="Drivers" subtitle="Everyone registered to drive, and the state of their account." />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(drivers.length)} label="Drivers" />
        <StatCard value={String(approved)} label="Approved" color={approved > 0 ? tokens.green : undefined} />
        <StatCard value={String(pending)} label="Awaiting review" color={pending > 0 ? tokens.warn : undefined} />
        <StatCard value={String(suspended)} label="Suspended" color={suspended > 0 ? tokens.red : undefined} />
        <StatCard
          value={String(incomplete)}
          label="Missing documents"
          color={incomplete > 0 ? tokens.warn : undefined}
        />
      </Box>

      <DataCard
        title="Drivers"
        count={drivers.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search name, mobile, region or plate' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.driverId}
        emptyTitle="No drivers have registered"
        emptyDescription="Drivers appear here as soon as one signs up through the app or is added by a fleet."
        note="The first hundred, oldest first. Approving and rejecting new applications happens on the Overview review queue."
      />

      <Dialog open={action !== null} onClose={working ? undefined : () => setAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>
          {suspending ? 'Suspend' : 'Reinstate'} {action?.driver.fullName}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            {suspending
              ? 'They will be signed out and cannot start a shift or earn until this is lifted. Any shift already running is unaffected until it ends.'
              : 'They will be able to sign in and start shifts again immediately.'}
          </Typography>
          <TextField
            label={suspending ? 'Reason (required)' : 'Notes (optional)'}
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
          <Button color="inherit" disabled={working} onClick={() => setAction(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={suspending ? 'error' : 'primary'}
            disabled={working || reasonMissing}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={confirm}
          >
            {suspending ? 'Suspend' : 'Reinstate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
