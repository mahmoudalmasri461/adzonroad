import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
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
  backfillInvoices,
  fetchEarningsSummary,
  fetchInvoices,
  invoiceTotals,
  markInvoicePaid,
  toneForStatus,
  type AdminInvoice,
  type EarningsSummary,
} from '../../services/admin';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * Both directions of the money: what advertisers owe the platform, and what the platform owes
 * drivers.
 *
 * They are shown together and settled nowhere near each other. Invoices are reconciled by hand
 * from a bank statement — there is no card, no gateway, and no statement import. Driver earnings
 * accrue per settled shift and nothing turns them into a payment, which is stated as a figure on
 * this page rather than left as something you would have to know.
 */

function getColumns(onMarkPaid: (invoice: AdminInvoice) => void): GridColDef<AdminInvoice>[] {
  return [
    { field: 'number', headerName: 'Invoice', flex: 0.7, minWidth: 130 },
    { field: 'advertiserName', headerName: 'Advertiser', flex: 1, minWidth: 170 },
    { field: 'description', headerName: 'For', flex: 1.2, minWidth: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_v, row) => formatCurrency(row.amount),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 115,
      renderCell: (params) => <StatusTag label={params.row.status} variant={toneForStatus(params.row.status)} />,
    },
    {
      field: 'dueDate',
      headerName: 'Due',
      flex: 0.8,
      minWidth: 150,
      valueGetter: (_v, row) => {
        if (row.status === 'Paid') return row.dueDate;
        if (row.daysUntilDue < 0) return `${row.dueDate} (${Math.abs(row.daysUntilDue)}d late)`;
        return `${row.dueDate} (in ${row.daysUntilDue}d)`;
      },
    },
    {
      field: 'paymentReference',
      headerName: 'Reference',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => row.paymentReference ?? '—',
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params) =>
        params.row.status === 'Paid' ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Settled</Typography>
        ) : (
          <Button
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
            onClick={() => onMarkPaid(params.row)}
          >
            Mark paid
          </Button>
        ),
    },
  ];
}

function EarningsCard({ earnings }: { earnings: EarningsSummary | null }) {
  if (!earnings) return null;

  return (
    <Card sx={{ p: '22px', mb: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
        The other direction
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '14px' }}>Owed to drivers</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
        <StatCard value={formatCurrency(earnings.totalAccrued)} label="Accrued in total" padding={16} />
        <StatCard value={formatCurrency(earnings.accruedLast30Days)} label="Accrued last 30 days" padding={16} />
        <StatCard value={String(earnings.shiftsSettled)} label="Shifts settled" padding={16} />
        <StatCard value={String(earnings.driversWithEarnings)} label="Drivers with earnings" padding={16} />
        <StatCard
          value={formatCurrency(earnings.totalPaidOut)}
          label="Actually paid out"
          padding={16}
          color={earnings.totalPaidOut === 0 ? tokens.red : tokens.green}
        />
        <StatCard
          value={formatCurrency(earnings.outstandingToDrivers)}
          label="Outstanding"
          padding={16}
          color={earnings.outstandingToDrivers > 0 ? tokens.warn : undefined}
        />
      </Box>

      {earnings.payoutsRecorded === 0 && (
        <Alert severity="warning" sx={{ mt: '14px', fontSize: 12.5 }}>
          No payout record exists anywhere on the platform. Earnings are settled per shift and
          accrue against each driver, but nothing turns them into a payment — the outstanding
          figure above is therefore the entire accrued balance, not an arrears position.
        </Alert>
      )}
    </Card>
  );
}

export default function FinancePage() {
  const { showToast } = useToast();
  const [paying, setPaying] = useState<AdminInvoice | null>(null);
  const [reference, setReference] = useState('');
  const [working, setWorking] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const loaded = useAsyncData<{ invoices: AdminInvoice[]; earnings: EarningsSummary | null }>(
    async (signal) => {
      const [invoices, earnings] = await Promise.all([
        fetchInvoices(undefined, signal),
        fetchEarningsSummary(signal).catch(() => null),
      ]);
      return { invoices, earnings };
    },
    [],
    'The ledger could not be loaded.',
  );

  const invoices = useMemo(() => loaded.data?.invoices ?? [], [loaded.data]);
  const totals = useMemo(() => invoiceTotals(invoices), [invoices]);

  const { search, setSearch, filtered } = useSearchFilter(invoices, [
    'number', 'advertiserName', 'description', 'status', 'paymentReference',
  ]);

  const columns = useMemo(
    () => getColumns((invoice) => { setPaying(invoice); setReference(''); }),
    [],
  );

  const confirmPaid = async () => {
    if (!paying) return;

    setWorking(true);
    try {
      await markInvoicePaid(paying.invoiceId, reference.trim());
      showToast(`${paying.number} marked paid.`);
      setPaying(null);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That invoice could not be updated.');
    } finally {
      setWorking(false);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const { issued } = await backfillInvoices();
      showToast(
        issued === 0
          ? 'Nothing to backfill — every scheduled campaign already has an invoice.'
          : `${issued} invoice${issued === 1 ? '' : 's'} issued.`,
      );
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'The backfill could not be run.');
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="What advertisers owe, and what the platform owes its drivers."
        actions={
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text }}
            disabled={backfilling}
            startIcon={backfilling ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={runBackfill}
          >
            Backfill invoices
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={formatCurrency(totals.billed)} label="Billed" />
        <StatCard value={formatCurrency(totals.collected)} label="Collected" color={tokens.green} />
        <StatCard value={formatCurrency(totals.outstanding)} label="Outstanding" />
        <StatCard
          value={formatCurrency(totals.overdue)}
          label={`Overdue (${totals.overdueCount})`}
          color={totals.overdue > 0 ? tokens.red : undefined}
        />
        <StatCard value={String(invoices.length)} label="Invoices" />
      </Box>

      <EarningsCard earnings={loaded.data?.earnings ?? null} />

      <DataCard
        title="Invoices"
        count={invoices.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search number, advertiser or reference' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.invoiceId}
        emptyTitle="No invoices have been issued"
        emptyDescription="One invoice is raised per campaign, at the moment a reviewer schedules it."
        note="Overdue is the server's verdict, worked out from the due date when the row is read. Settlement is offline: marking paid records a bank transfer that already happened."
      />

      <Dialog open={paying !== null} onClose={working ? undefined : () => setPaying(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>Mark {paying?.number} paid</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            {paying && `${formatCurrency(paying.amount)} from ${paying.advertiserName}.`} This records
            a transfer that has already arrived — it does not take a payment. The date is set once
            and is not moved by marking it again.
          </Typography>
          <TextField
            label="Bank reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            fullWidth
            autoFocus
            disabled={working}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setPaying(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={working}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={confirmPaid}
          >
            Mark paid
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
