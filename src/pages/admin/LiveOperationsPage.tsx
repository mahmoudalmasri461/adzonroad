import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import SearchBox from '../../components/SearchBox';
import DataCard from '../../components/admin/DataCard';
import OperationsMap from '../../components/admin/OperationsMap';
import LiveVehiclePanel from '../../components/admin/LiveVehiclePanel';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLiveVehicles } from '../../hooks/useLiveVehicles';
import {
  describeLastSignal,
  fetchAssignments,
  fetchDeviceStatuses,
  fetchLiveVehicles,
  fetchScreens,
  type AdminScreen,
  type Assignment,
  type DeviceStatus,
  type LiveVehicle,
} from '../../services/admin';
import { buildVehicleRows, filterVehicleRows, type LiveFilter } from '../../services/liveOperations';
import { tokens } from '../../theme';

/**
 * The dispatch view: where the vehicles are, what each is carrying, and which devices are still
 * talking to us.
 *
 * Three sources, deliberately kept apart. The map is the hub feed — positions as they arrive,
 * interpolated between fixes and frozen when they stop. Screens and assignments are REST, joined
 * to a vehicle by plate because that is the only key the three share. Device health is derived by
 * the server from the age of what it received, and stays in its own table: it is keyed on driver
 * id, and a live vehicle carries no driver id, so there is no honest way to attach one to the
 * other. None of it is a claim a phone made about itself, which is the distinction the whole
 * evidence pipeline rests on.
 */

const CONNECTIVITY_TONE: Record<DeviceStatus['connectivity'], 'live' | 'warn' | 'error' | 'neutral'> = {
  Healthy: 'live',
  Delayed: 'warn',
  Offline: 'error',
  Unknown: 'neutral',
};

const SURFACE = { backgroundColor: '#fff', border: '1px solid #E7E4DE', borderRadius: '10px' } as const;

export default function LiveOperationsPage() {
  const { t } = useTranslation();
  const { vehicles, connectionState, lastReconciliation } = useLiveVehicles();

  const [filter, setFilter] = useState<LiveFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');

  const loaded = useAsyncData<{
    devices: DeviceStatus[];
    metadata: LiveVehicle[];
    screens: AdminScreen[];
    assignments: Assignment[];
  }>(
    async (signal) => {
      const [devices, metadata, screens, assignments] = await Promise.all([
        fetchDeviceStatuses(signal),
        fetchLiveVehicles(signal),
        fetchScreens(signal),
        fetchAssignments(true, signal),
      ]);
      return { devices, metadata, screens, assignments };
    },
    [],
    'Device health could not be loaded.',
  );

  const devices = useMemo(() => loaded.data?.devices ?? [], [loaded.data]);
  const metadata = useMemo(() => loaded.data?.metadata ?? [], [loaded.data]);

  const metaById = useMemo(() => new Map(metadata.map((v) => [v.vehicleId, v])), [metadata]);

  // Built and filtered by services/liveOperations, which is unit-tested — there is no live
  // position data in development, so this join would otherwise ship unverified.
  const allRows = useMemo(
    () =>
      buildVehicleRows(
        vehicles,
        metadata,
        loaded.data?.screens ?? [],
        loaded.data?.assignments ?? [],
      ),
    [vehicles, metadata, loaded.data],
  );

  const rows = useMemo(() => filterVehicleRows(allRows, filter, search), [allRows, filter, search]);

  const visibleIds = useMemo(() => new Set(rows.map((r) => r.vehicle.vehicleId)), [rows]);
  const mapVehicles = useMemo(
    () => vehicles.filter((v) => visibleIds.has(v.vehicleId)),
    [vehicles, visibleIds],
  );

  const filteredDevices = useMemo(() => {
    const needle = deviceSearch.trim().toLowerCase();
    if (!needle) return devices;
    return devices.filter((d) => d.driverId.toLowerCase().includes(needle));
  }, [devices, deviceSearch]);

  const healthy = devices.filter((d) => d.connectivity === 'Healthy').length;
  const offline = devices.filter((d) => d.connectivity === 'Offline').length;
  const backlog = devices.reduce((sum, d) => sum + d.pendingTelemetryCount, 0);
  const liveCount = vehicles.filter((v) => v.presentation === 'live').length;

  const columns = useMemo<GridColDef<DeviceStatus>[]>(
    () => [
      {
        field: 'driverId',
        headerName: t('admin.liveOps.devices.device'),
        flex: 0.8,
        minWidth: 130,
        // Shown as the driver id it is. The previous version looked this up in a map keyed by
        // vehicle id, which could never match — a live vehicle carries no driver id — so it
        // silently fell back to a truncated identifier on every row.
        valueGetter: (_v, row) => row.driverId.slice(0, 8).toUpperCase(),
      },
      {
        field: 'connectivity',
        headerName: t('admin.liveOps.devices.connectivity'),
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => (
          <StatusTag label={params.row.connectivity} variant={CONNECTIVITY_TONE[params.row.connectivity]} />
        ),
      },
      { field: 'gpsFreshness', headerName: t('admin.liveOps.devices.gps'), flex: 0.7, minWidth: 110 },
      { field: 'syncHealth', headerName: t('admin.liveOps.devices.sync'), flex: 0.7, minWidth: 110 },
      {
        field: 'pendingTelemetryCount',
        headerName: t('admin.liveOps.devices.pending'),
        flex: 0.6,
        minWidth: 110,
        type: 'number',
      },
      {
        field: 'canPresentAsLive',
        headerName: t('admin.liveOps.devices.presentable'),
        flex: 0.7,
        minWidth: 150,
        valueGetter: (_v, row) =>
          row.canPresentAsLive ? t('admin.liveOps.devices.yes') : t('admin.liveOps.devices.no'),
      },
      {
        field: 'batteryLevel',
        headerName: t('admin.liveOps.devices.battery'),
        flex: 0.5,
        minWidth: 95,
        valueGetter: (_v, row) => (row.batteryLevel === null ? '—' : `${row.batteryLevel}%`),
      },
      {
        field: 'lastHeartbeatAtUtc',
        headerName: t('admin.liveOps.devices.heartbeat'),
        flex: 0.8,
        minWidth: 140,
        valueGetter: (_v, row) => describeLastSignal(row.lastHeartbeatAtUtc),
      },
      {
        field: 'clockSkewMs',
        headerName: t('admin.liveOps.devices.skew'),
        flex: 0.6,
        minWidth: 110,
        valueGetter: (_v, row) => (row.clockSkewMs === null ? '—' : `${Math.round(row.clockSkewMs / 1000)}s`),
      },
    ],
    [t],
  );

  return (
    <>
      {lastReconciliation && (
        <Box sx={{ ...SURFACE, px: '16px', py: '11px', mb: '16px', borderColor: 'rgba(245,166,35,0.4)', backgroundColor: 'rgba(245,166,35,0.07)' }}>
          <Typography sx={{ fontSize: 12.5, color: tokens.navy }}>
            {t('admin.liveOps.reconciled', {
              claims: lastReconciliation.claimsReconciled,
              verified: lastReconciliation.nowVerified,
            })}
          </Typography>
        </Box>
      )}

      {/* Controls, the feed's own state, and the four counts — one row rather than a card each. */}
      <Box
        sx={{
          ...SURFACE,
          p: '12px 14px',
          mb: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Box role="radiogroup" aria-label={t('admin.liveOps.filters.all')} sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['all', 'reporting', 'attention', 'onCampaign'] as LiveFilter[]).map((f) => (
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
                '&:hover': { borderColor: '#CFCBC2' },
                '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
                '&[data-active="true"]': {
                  borderColor: tokens.amber,
                  backgroundColor: 'rgba(245,166,35,0.12)',
                  color: tokens.navy,
                },
              }}
            >
              {t(`admin.liveOps.filters.${f}`)}
            </Box>
          ))}
        </Box>

        <SearchBox value={search} onChange={setSearch} placeholder={t('admin.liveOps.search')} width={280} />

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <Count label={t('admin.liveOps.metrics.reporting')} value={liveCount} />
          <Count label={t('admin.liveOps.metrics.healthy')} value={healthy} />
          <Count label={t('admin.liveOps.metrics.offline')} value={offline} tone={offline > 0 ? 'bad' : undefined} />
          <Count label={t('admin.liveOps.metrics.backlog')} value={backlog} tone={backlog > 0 ? 'warn' : undefined} />
          <StatusTag
            label={t(`admin.liveOps.feed.${connectionState}`)}
            variant={connectionState === 'connected' ? 'live' : 'warn'}
          />
        </Box>
      </Box>

      {/* Map and panel, roughly two thirds to one third. */}
      <Box
        sx={{
          ...SURFACE,
          overflow: 'hidden',
          mb: '20px',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' },
          height: { xs: 'auto', lg: 560 },
        }}
      >
        <Box sx={{ height: { xs: 380, lg: '100%' }, minWidth: 0, borderInlineEnd: { lg: '1px solid #EFEDE8' } }}>
          <OperationsMap
            vehicles={mapVehicles}
            metadata={metaById}
            connectionState={connectionState}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Box>

        <Box sx={{ minHeight: { xs: 320, lg: 0 }, borderTop: { xs: '1px solid #EFEDE8', lg: 'none' } }}>
          <LiveVehiclePanel rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </Box>
      </Box>

      <DataCard
        title={t('admin.liveOps.devices.title')}
        count={devices.length}
        search={{ value: deviceSearch, onChange: setDeviceSearch, placeholder: t('admin.liveOps.devices.search') }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filteredDevices}
        columns={columns}
        getRowId={(row) => row.driverId}
        emptyTitle={t('admin.liveOps.devices.empty')}
        emptyDescription={t('admin.liveOps.devices.emptyDetail')}
        note={t('admin.liveOps.devices.note')}
      />
    </>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'bad' }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.textMuted }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.15,
          direction: 'ltr',
          textAlign: 'start',
          color: tone === 'bad' ? '#B42318' : tone === 'warn' ? '#8A5A12' : tokens.navy,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
