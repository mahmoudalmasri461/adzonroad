import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../services/apiClient';
import {
  fetchCampaigns,
  fetchDeliverySummary,
  fetchInvoices,
  fetchPlaybackConflicts,
  fetchTelemetryVolume,
  fetchVehicles,
  rebuildDeliveryRollup,
  type AdminCampaign,
  type AdminInvoice,
  type AdminVehicle,
  type DeliverySummaryRow,
  type PlaybackConflict,
  type TelemetryVolume,
} from '../../services/admin';
import { describeQualification, downloadProofOfDelivery } from '../../services/deliveryReport';
import { downloadCsv } from '../../services/fleetReports';
import {
  invoiceLedgerCsv,
  invoiceLedgerFilename,
  platformDeliveryCsv,
  platformDeliveryFilename,
  vehicleInventoryCsv,
  vehicleInventoryFilename,
} from '../../services/adminReports';
import { formatNumber } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * What the platform delivered, and what it costs to keep proving it.
 *
 * Delivery is read from the hourly rollups rather than recounted from raw events — the same
 * buckets invoicing reads, so a report and a bill cannot disagree. Rebuilding those buckets is
 * offered here because verdicts move as late evidence arrives, and a report run before a
 * reconciliation would otherwise quietly undercount.
 */

const WINDOWS = [
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
];

type DeliveryRow = DeliverySummaryRow & { name: string; advertiser: string };

function getColumns(): GridColDef<DeliveryRow>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.1, minWidth: 180 },
    { field: 'advertiser', headerName: 'Advertiser', flex: 1, minWidth: 160 },
    { field: 'verifiedPlays', headerName: 'Verified plays', flex: 0.7, minWidth: 130, type: 'number' },
    {
      field: 'verifiedSeconds',
      headerName: 'Verified time',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => `${(row.verifiedSeconds / 60).toFixed(1)} min`,
    },
    { field: 'pendingPlays', headerName: 'Pending', flex: 0.6, minWidth: 100, type: 'number' },
    { field: 'conflictPlays', headerName: 'In doubt', flex: 0.6, minWidth: 100, type: 'number' },
    { field: 'screens', headerName: 'Screens', flex: 0.5, minWidth: 95, type: 'number' },
    { field: 'hours', headerName: 'Hours active', flex: 0.6, minWidth: 115, type: 'number' },
  ];
}

function StorageCard({ volume }: { volume: TelemetryVolume | null }) {
  if (!volume) return null;

  return (
    <Card sx={{ p: '22px', mb: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
        What the evidence costs
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '4px' }}>Telemetry volume</Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '14px' }}>
        {volume.oldestCaptureDate
          ? `Capturing since ${volume.oldestCaptureDate}, most recently ${volume.newestCaptureDate}.`
          : 'Nothing has been captured yet.'}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
        <StatCard value={formatNumber(volume.totalPings)} label="GPS fixes stored" padding={16} />
        <StatCard value={formatNumber(volume.pingsLast24h)} label="Last 24 hours" padding={16} />
        <StatCard value={formatNumber(volume.pingsLast7d)} label="Last 7 days" padding={16} />
        <StatCard value={`${volume.estimatedRawMegabytes.toFixed(1)} MB`} label="Raw telemetry" padding={16} />
        <StatCard
          value={`${volume.projectedYearlyGigabytes.toFixed(1)} GB`}
          label="Projected over a year"
          padding={16}
          color={volume.projectedYearlyGigabytes > 50 ? tokens.warn : undefined}
        />
        <StatCard
          value={`${volume.shiftsCompacted} of ${volume.shiftsRaw + volume.shiftsCompacted}`}
          label="Shifts compacted"
          padding={16}
        />
      </Box>
    </Card>
  );
}

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [hours, setHours] = useState(168);
  const [rebuilding, setRebuilding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loaded = useAsyncData<{
    delivery: DeliverySummaryRow[];
    campaigns: AdminCampaign[];
    volume: TelemetryVolume | null;
    conflicts: PlaybackConflict[];
  }>(
    async (signal) => {
      const [delivery, campaigns, volume, conflicts] = await Promise.all([
        fetchDeliverySummary(hours, signal),
        fetchCampaigns('all', signal).catch(() => [] as AdminCampaign[]),
        fetchTelemetryVolume(signal).catch(() => null),
        fetchPlaybackConflicts(100, signal).catch(() => [] as PlaybackConflict[]),
      ]);
      return { delivery, campaigns, volume, conflicts };
    },
    [hours],
    'Reporting could not be loaded.',
  );

  const names = useMemo(() => {
    const map = new Map<string, { name: string; advertiser: string | null }>();
    for (const campaign of loaded.data?.campaigns ?? []) {
      map.set(campaign.campaignId, { name: campaign.name, advertiser: campaign.advertiser });
    }
    return map;
  }, [loaded.data]);

  const rows = useMemo<DeliveryRow[]>(
    () => (loaded.data?.delivery ?? []).map((row) => ({
      ...row,
      name: names.get(row.campaignId)?.name ?? 'Unknown campaign',
      advertiser: names.get(row.campaignId)?.advertiser ?? '—',
    })),
    [loaded.data, names],
  );

  const verifiedPlays = rows.reduce((sum, r) => sum + r.verifiedPlays, 0);
  const verifiedSeconds = rows.reduce((sum, r) => sum + r.verifiedSeconds, 0);
  const pending = rows.reduce((sum, r) => sum + r.pendingPlays, 0);
  const conflicts = rows.reduce((sum, r) => sum + r.conflictPlays, 0);

  const rebuild = async () => {
    setRebuilding(true);
    try {
      const result = await rebuildDeliveryRollup(Math.min(hours, 720));
      showToast(
        `Rebuilt ${result.bucketsWritten} bucket${result.bucketsWritten === 1 ? '' : 's'} from ` +
        `${result.playbackEventsConsidered} playback event${result.playbackEventsConsidered === 1 ? '' : 's'}.`,
      );
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'The rollup could not be rebuilt.');
    } finally {
      setRebuilding(false);
    }
  };

  /**
   * Files are built from what is on the page, except the proof-of-delivery pack, which is the
   * server's own signed-off CSV per campaign. Rebuilding that in the browser would produce a
   * second version of the artefact an advertiser hands to their auditor.
   */
  const exportDelivery = () => {
    if (rows.length === 0) {
      showToast('Nothing delivered in this window, so there is nothing to export.');
      return;
    }
    downloadCsv(platformDeliveryFilename(), platformDeliveryCsv(loaded.data?.delivery ?? [], names));
  };

  const exportLedger = async () => {
    setDownloading(true);
    try {
      const invoices: AdminInvoice[] = await fetchInvoices();
      if (invoices.length === 0) {
        showToast('No invoices have been issued yet.');
        return;
      }
      downloadCsv(invoiceLedgerFilename(), invoiceLedgerCsv(invoices));
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'The ledger could not be exported.');
    } finally {
      setDownloading(false);
    }
  };

  const exportVehicles = async () => {
    setDownloading(true);
    try {
      const vehicles: AdminVehicle[] = await fetchVehicles(undefined, 1, 200).then((p) => p.items);
      if (vehicles.length === 0) {
        showToast('No vehicles are registered yet.');
        return;
      }
      downloadCsv(vehicleInventoryFilename(), vehicleInventoryCsv(vehicles));
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'The inventory could not be exported.');
    } finally {
      setDownloading(false);
    }
  };

  const proofFor = async (row: DeliveryRow) => {
    setDownloading(true);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - hours * 3_600_000);
      await downloadProofOfDelivery(row.campaignId, from, to);
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That proof pack could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  };

  type ConflictRow = PlaybackConflict & { campaign: string };

  const conflictRows = useMemo<ConflictRow[]>(
    () => (loaded.data?.conflicts ?? []).map((conflict) => ({
      ...conflict,
      campaign: names.get(conflict.campaignId)?.name ?? 'Unknown campaign',
    })),
    [loaded.data, names],
  );

  const conflictColumns = useMemo<GridColDef<ConflictRow>[]>(
    () => [
      { field: 'campaign', headerName: 'Campaign', flex: 1, minWidth: 170 },
      {
        field: 'status',
        headerName: 'Verdict',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params) => (
          <StatusTag
            label={params.row.status === 'Rejected' ? 'Contradicted' : 'Not verified'}
            variant={params.row.status === 'Rejected' ? 'error' : 'warn'}
          />
        ),
      },
      {
        field: 'qualifications',
        headerName: 'Why',
        flex: 1.8,
        minWidth: 280,
        // Flags arrive comma-joined so every reason survives, not just the first one checked.
        valueGetter: (_v, row) =>
          row.qualifications
            .split(',')
            .map((flag) => flag.trim())
            .filter((flag) => flag && flag !== 'None')
            .map(describeQualification)
            .join('; ') || 'No reason recorded',
      },
      {
        field: 'actualDurationSeconds',
        headerName: 'Claimed',
        flex: 0.5,
        minWidth: 100,
        valueGetter: (_v, row) => `${row.actualDurationSeconds}s`,
      },
      { field: 'source', headerName: 'Reported by', flex: 0.7, minWidth: 130 },
      {
        field: 'startedAtUtc',
        headerName: 'Started',
        flex: 0.9,
        minWidth: 160,
        valueGetter: (_v, row) => row.startedAtUtc.replace('T', ' ').slice(0, 16),
      },
      {
        field: 'receivedAtUtc',
        headerName: 'Arrived',
        flex: 0.9,
        minWidth: 160,
        // Captured against received: the gap is the whole offline story, so both are shown.
        valueGetter: (_v, row) => row.receivedAtUtc.replace('T', ' ').slice(0, 16),
      },
    ],
    [],
  );

  const columns = useMemo<GridColDef<DeliveryRow>[]>(
    () => [
      ...getColumns(),
      {
        field: 'proof',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 130,
        renderCell: (params) => (
          <Button
            size="small"
            disabled={downloading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
            onClick={() => proofFor(params.row)}
          >
            Proof pack
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [downloading, hours],
  );

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Delivery across the platform, and what proving it costs to store."
        actions={
          <>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.text }}
              disabled={downloading}
              onClick={exportLedger}
            >
              Invoice ledger
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.text }}
              disabled={downloading}
              onClick={exportVehicles}
            >
              Vehicle inventory
            </Button>
            <Button variant="contained" color="primary" onClick={exportDelivery}>
              Export delivery
            </Button>
          </>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', mb: '20px' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={hours}
          onChange={(_e, value) => value && setHours(value)}
        >
          {WINDOWS.map((window) => (
            <ToggleButton key={window.hours} value={window.hours} sx={{ textTransform: 'none', fontWeight: 600 }}>
              {window.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        <Button
          size="small"
          disabled={rebuilding}
          startIcon={rebuilding ? <CircularProgress size={14} color="inherit" /> : undefined}
          onClick={rebuild}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Rebuild delivery buckets
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={formatNumber(verifiedPlays)} label="Verified plays" color={verifiedPlays > 0 ? tokens.green : undefined} />
        <StatCard value={`${(verifiedSeconds / 3600).toFixed(1)} hrs`} label="Verified screen time" />
        <StatCard value={formatNumber(pending)} label="Awaiting evidence" color={pending > 0 ? tokens.warn : undefined} />
        <StatCard value={formatNumber(conflicts)} label="Contradicted by GPS" color={conflicts > 0 ? tokens.red : undefined} />
        <StatCard value={String(rows.length)} label="Campaigns delivering" />
      </Box>

      <StorageCard volume={loaded.data?.volume ?? null} />

      <Box sx={{ mb: '20px' }}>
        <DataCard
          title="Playback in doubt"
          count={conflictRows.length}
          loading={loaded.loading}
          error={loaded.error}
          onRetry={loaded.reload}
          rows={conflictRows}
          columns={conflictColumns}
          getRowId={(row) => String(row.id)}
          height={420}
          emptyTitle="No claim is in doubt"
          emptyDescription="Every playback claim either has GPS evidence behind it or is still waiting for late evidence to arrive."
          note="Every reason a claim failed, not just the first one checked. A verdict can move on its own as late evidence arrives — rebuilding the buckets re-examines them. Recording a human decision against a claim is not built: the verification row has no reviewer or notes field, and adding one is a schema change."
        />
      </Box>

      <DataCard
        title="Delivery by campaign"
        count={rows.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.campaignId}
        emptyTitle="Nothing delivered in this window"
        emptyDescription="Delivery is counted only where a play correlates to a GPS fix. With no screens fitted, no play can be evidenced."
        note="Counted from the same hourly buckets invoicing reads. Days are UTC, so a Beirut reader sees boundary hours fall on the neighbouring day."
      />

      <Alert severity="info" sx={{ mt: '20px', fontSize: 12.5 }}>
        Nothing here is scheduled or emailed. A report is generated from live data at the moment
        you download it, and is not stored afterwards.
      </Alert>
    </>
  );
}
