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
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  countAccountsByFilter,
  filterAccounts,
  type AccountFilter,
} from '../../services/accountFilters';
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

/**
 * Every driver on the platform, whatever state their account is in.
 *
 * Suspension and reinstatement live here rather than on the review queue because they are not
 * review decisions. The queue is for applications nobody has judged yet; this is for a driver who
 * has been working and whose access is being taken away or given back. Both require a reason —
 * suspension stops somebody earning, and "why is my account off" deserves an answer.
 */

type PendingAction = { driver: DriverRegistration; kind: 'suspend' | 'reinstate' };

function getColumns(
  t: (key: string, opts?: Record<string, unknown>) => string,onAction: (action: PendingAction) => void): GridColDef<DriverRegistration>[] {
  return [
    { field: 'fullName', headerName: t('admin.drivers.name'), flex: 1, minWidth: 160 },
    { field: 'mobileNumber', headerName: t('admin.drivers.mobile'), flex: 0.9, minWidth: 150 },
    {
      field: 'region',
      headerName: t('admin.drivers.region'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'vehicle',
      headerName: t('admin.drivers.vehicle'),
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) =>
        [row.carModel, row.plateNumber].filter(Boolean).join(' · ') || 'No car registered',
    },
    {
      field: 'documentTypes',
      headerName: t('admin.drivers.documents'),
      flex: 0.7,
      minWidth: 130,
      renderCell: (params) =>
        hasAllDocuments(params.row)
          ? <StatusTag label="Complete" variant="live" />
          : <StatusTag label={`${params.row.documentTypes.length} of 3`} variant="warn" />,
    },
    {
      field: 'status',
      headerName: t('admin.drivers.status'),
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'createdAtUtc',
      headerName: t('admin.drivers.submitted'),
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
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<PendingAction | null>(null);
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);

  const loaded = useAsyncData<DriverRegistration[]>(
    (signal) => fetchDrivers('all', 1, 100, signal).then((page) => page.items),
    [],
    'Drivers could not be loaded.',
  );

  const drivers = useMemo(() => loaded.data ?? [], [loaded.data]);

  const counts = useMemo(() => countAccountsByFilter(drivers, (d) => d.status), [drivers]);

  const filtered = useMemo(
    () =>
      filterAccounts(
        drivers,
        filter,
        search,
        (d) => d.status,
        (d) => [d.fullName, d.mobileNumber, d.region, d.status, d.plateNumber],
      ),
    [drivers, filter, search],
  );

  const columns = useMemo(
    () => getColumns(t, (next) => { setAction(next); setNotes(''); }),
    [t],
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

  const incomplete = drivers.filter((d) => !hasAllDocuments(d)).length;

  const suspending = action?.kind === 'suspend';
  const reasonMissing = suspending && notes.trim().length === 0;

  return (
    <>
      <AdminFilterBar
        ariaLabel={t('admin.drivers.status')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('admin.filters.all'), count: counts.all },
          { value: 'pending', label: t('admin.filters.pending'), count: counts.pending },
          { value: 'approved', label: t('admin.filters.approved'), count: counts.approved },
          { value: 'suspended', label: t('admin.filters.suspended'), count: counts.suspended },
          { value: 'rejected', label: t('admin.filters.rejected'), count: counts.rejected },
        ]}
        search={{ value: search, onChange: setSearch, placeholder: t('admin.drivers.search') }}
        trailing={
          // No status tab covers this, and an application missing a document cannot be judged.
          incomplete > 0 ? (
            <StatusTag label={`${t('admin.drivers.documents')}: ${incomplete}`} variant="warn" />
          ) : undefined
        }
      />

      <DataCard
        title={t('admin.nav.drivers')}
        count={filtered.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.driverId}
        emptyTitle={drivers.length === 0 ? t('admin.drivers.empty') : t('admin.drivers.noMatch')}
        emptyDescription={drivers.length === 0 ? t('admin.drivers.emptyDetail') : t('admin.drivers.noMatchDetail')}
        note={t('admin.drivers.note')}
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
