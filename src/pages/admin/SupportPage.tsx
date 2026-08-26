import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
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
  fetchSupportTickets,
  isOpen,
  readableStatus,
  toneForStatus,
  updateTicketStatus,
  waitingFor,
  type SupportTicket,
  type TicketStatus,
} from '../../services/admin';
import { ADVERTISER_SUPPORT_CONTACT } from '../../data/supportContact';
import { tokens } from '../../theme';

/**
 * The support desk.
 *
 * Drivers raise tickets from the Android app, fleet managers from their own portal, and until now
 * nobody could read either. A ticket nobody can see is a ticket nobody answers, which is worse
 * than not offering the button in the first place.
 *
 * Advertisers are absent, and the page says so rather than showing an empty tab that reads as
 * broken: the ticket table is scoped to drivers and their vehicles and carries no advertiser
 * link, so advertiser support is a real email address until that schema change is made.
 */

const NEXT_STATES: { value: TicketStatus; label: string }[] = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
];

const TYPE_TONE: Record<string, 'error' | 'warn' | 'neutral'> = {
  Damage: 'error',
  Maintenance: 'warn',
  General: 'neutral',
};

function getColumns(onOpen: (ticket: SupportTicket) => void): GridColDef<SupportTicket>[] {
  return [
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.6,
      minWidth: 120,
      renderCell: (params) => (
        <StatusTag label={params.row.type} variant={TYPE_TONE[params.row.type] ?? 'neutral'} />
      ),
    },
    { field: 'message', headerName: 'What was reported', flex: 1.6, minWidth: 240 },
    {
      field: 'driverName',
      headerName: 'Raised by',
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.driverName?.trim() || 'Not a driver',
    },
    {
      field: 'taxiCompanyName',
      headerName: 'Fleet',
      flex: 0.8,
      minWidth: 140,
      // "Independent" means a driver who owns their car. A ticket with no driver at all — a fleet
      // manager reporting damage — has no fleet we can name from this row, and saying Independent
      // there asserts something the data does not support.
      valueGetter: (_v, row) =>
        row.taxiCompanyName ?? (row.driverId ? 'Independent' : '—'),
    },
    {
      field: 'vehiclePlate',
      headerName: 'Vehicle',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_v, row) => row.vehiclePlate ?? '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 130,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'createdAtUtc',
      headerName: 'Waiting',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_v, row) => (isOpen(row) ? waitingFor(row.createdAtUtc) : '—'),
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
          sx={{ textTransform: 'none', fontWeight: 600 }}
          onClick={() => onOpen(params.row)}
        >
          Update
        </Button>
      ),
    },
  ];
}

export default function AdminSupportPage() {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<SupportTicket | null>(null);
  const [status, setStatus] = useState<TicketStatus>('InProgress');
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);

  const loaded = useAsyncData<SupportTicket[]>(
    (signal) => fetchSupportTickets(undefined, undefined, signal),
    [],
    'Support tickets could not be loaded.',
  );

  const tickets = useMemo(() => loaded.data ?? [], [loaded.data]);

  const { search, setSearch, filtered } = useSearchFilter(tickets, [
    'message', 'driverName', 'taxiCompanyName', 'vehiclePlate', 'status', 'type',
  ]);

  const columns = useMemo(
    () => getColumns((ticket) => {
      setEditing(ticket);
      setStatus(ticket.status === 'Open' ? 'InProgress' : (ticket.status as TicketStatus));
      setNotes(ticket.resolutionNotes ?? '');
    }),
    [],
  );

  const save = async () => {
    if (!editing) return;

    setWorking(true);
    try {
      await updateTicketStatus(editing.ticketId, status, notes.trim() || undefined);
      showToast('Ticket updated.');
      setEditing(null);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That ticket could not be updated.');
    } finally {
      setWorking(false);
    }
  };

  const open = tickets.filter((t) => t.status === 'Open').length;
  const inProgress = tickets.filter((t) => t.status === 'InProgress').length;
  const damage = tickets.filter((t) => t.type === 'Damage' && isOpen(t)).length;
  const resolved = tickets.filter((t) => !isOpen(t)).length;

  // The server refuses a terminal status with no note, so the button says why before it is pressed.
  const terminal = status === 'Resolved' || status === 'Closed';
  const noteMissing = terminal && notes.trim().length === 0;

  return (
    <>
      <PageHeader title="Support" subtitle="Everything drivers and fleets have reported." />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(open)} label="Open" color={open > 0 ? tokens.warn : undefined} />
        <StatCard value={String(inProgress)} label="In progress" />
        <StatCard value={String(damage)} label="Damage, unresolved" color={damage > 0 ? tokens.red : undefined} />
        <StatCard value={String(resolved)} label="Resolved or closed" />
        <StatCard value={String(tickets.length)} label="Tickets in total" />
      </Box>

      <Alert severity="info" sx={{ mb: '20px', fontSize: 12.5 }}>
        Advertisers cannot raise a ticket. The ticket table is scoped to drivers and their
        vehicles and carries no advertiser link, so advertiser support stays an inbox until that
        schema change is made — nothing an advertiser sends appears on this page.
        {' '}Their line is <strong>{ADVERTISER_SUPPORT_CONTACT.email}</strong> and{' '}
        <strong>{ADVERTISER_SUPPORT_CONTACT.phone}</strong>.
      </Alert>

      <DataCard
        title="Tickets"
        count={tickets.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search message, driver, fleet or plate' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.ticketId}
        emptyTitle="No tickets have been raised"
        emptyDescription="Damage reports, maintenance requests and general questions from drivers and fleets land here."
        note="Open tickets first, oldest at the top — a three-week-old report should not sit under this morning's resolved ones."
      />

      <Dialog open={editing !== null} onClose={working ? undefined : () => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>Update ticket</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, mb: '4px', fontWeight: 600 }}>
            {editing?.type} · {editing?.driverName?.trim() || 'Not a driver'}
            {editing?.vehiclePlate ? ` · ${editing.vehiclePlate}` : ''}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            “{editing?.message}”
          </Typography>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            fullWidth
            disabled={working}
            sx={{ mb: 2 }}
          >
            {NEXT_STATES.map((state) => (
              <MenuItem key={state.value} value={state.value}>{state.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label={terminal ? 'What was done (required)' : 'Notes (optional)'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={working}
            helperText={
              terminal
                ? 'A ticket closed with no explanation is indistinguishable from one that was dropped.'
                : undefined
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setEditing(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={working || noteMissing}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={save}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
