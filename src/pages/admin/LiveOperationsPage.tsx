import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import OperationsMap from '../../components/admin/OperationsMap';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLiveVehicles } from '../../hooks/useLiveVehicles';
import {
  describeLastSignal,
  fetchDeviceStatuses,
  fetchLiveVehicles,
  type DeviceStatus,
  type LiveVehicle,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * The dispatch view: where the vehicles are and which devices are still talking to us.
 *
 * Two sources, deliberately kept apart. The map is the hub feed — positions as they arrive,
 * interpolated between fixes and frozen when they stop. The table is device health as the server
 * derives it from the age of what it received. Neither is a claim the phone made about itself,
 * which is the distinction the whole evidence pipeline rests on.
 */

const CONNECTIVITY_TONE: Record<DeviceStatus['connectivity'], 'live' | 'warn' | 'error' | 'neutral'> = {
  Healthy: 'live',
  Delayed: 'warn',
  Offline: 'error',
  Unknown: 'neutral',
};

export default function LiveOperationsPage() {
  const { vehicles, connectionState, lastReconciliation } = useLiveVehicles();
  const [search, setSearch] = useState('');

  const loaded = useAsyncData<{ devices: DeviceStatus[]; metadata: LiveVehicle[] }>(
    async (signal) => {
      const [devices, metadata] = await Promise.all([
        fetchDeviceStatuses(signal),
        fetchLiveVehicles(signal),
      ]);
      return { devices, metadata };
    },
    [],
    'Device health could not be loaded.',
  );

  const devices = useMemo(() => loaded.data?.devices ?? [], [loaded.data]);
  const metadata = useMemo(() => loaded.data?.metadata ?? [], [loaded.data]);

  const driverNames = useMemo(
    () => new Map(metadata.map((v) => [v.vehicleId, v])),
    [metadata],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return devices;

    return devices.filter((d) => d.driverId.toLowerCase().includes(needle));
  }, [devices, search]);

  const healthy = devices.filter((d) => d.connectivity === 'Healthy').length;
  const offline = devices.filter((d) => d.connectivity === 'Offline').length;
  const backlog = devices.reduce((sum, d) => sum + d.pendingTelemetryCount, 0);

  const columns = useMemo<GridColDef<DeviceStatus>[]>(
    () => [
      {
        field: 'driverId',
        headerName: 'Device',
        flex: 0.8,
        minWidth: 130,
        // A driver id is what the device table is keyed on. The plate is more useful when the
        // vehicle is also reporting a position; when it is not, the id is all there is.
        valueGetter: (_v, row) => driverNames.get(row.driverId)?.plate ?? row.driverId.slice(0, 8).toUpperCase(),
      },
      {
        field: 'connectivity',
        headerName: 'Connectivity',
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => (
          <StatusTag label={params.row.connectivity} variant={CONNECTIVITY_TONE[params.row.connectivity]} />
        ),
      },
      { field: 'gpsFreshness', headerName: 'GPS', flex: 0.7, minWidth: 110 },
      { field: 'syncHealth', headerName: 'Sync', flex: 0.7, minWidth: 110 },
      {
        field: 'pendingTelemetryCount',
        headerName: 'Unsent fixes',
        flex: 0.6,
        minWidth: 110,
        type: 'number',
      },
      {
        field: 'canPresentAsLive',
        headerName: 'Presentable as live',
        flex: 0.7,
        minWidth: 150,
        valueGetter: (_v, row) => (row.canPresentAsLive ? 'Yes' : 'No'),
      },
      {
        field: 'batteryLevel',
        headerName: 'Battery',
        flex: 0.5,
        minWidth: 95,
        valueGetter: (_v, row) => (row.batteryLevel === null ? '—' : `${row.batteryLevel}%`),
      },
      {
        field: 'lastHeartbeatAtUtc',
        headerName: 'Last heartbeat',
        flex: 0.8,
        minWidth: 140,
        valueGetter: (_v, row) => describeLastSignal(row.lastHeartbeatAtUtc),
      },
      {
        field: 'clockSkewMs',
        headerName: 'Clock skew',
        flex: 0.6,
        minWidth: 110,
        valueGetter: (_v, row) =>
          row.clockSkewMs === null ? '—' : `${Math.round(row.clockSkewMs / 1000)}s`,
      },
    ],
    [driverNames],
  );

  return (
    <>
      <PageHeader
        title="Live operations"
        subtitle="Positions as they arrive, and the health of the devices producing them."
      />

      {lastReconciliation && (
        <Alert severity="info" sx={{ mb: '20px', fontSize: 13 }}>
          Offline evidence synchronised — {lastReconciliation.claimsReconciled} playback claim
          {lastReconciliation.claimsReconciled === 1 ? '' : 's'} re-checked,{' '}
          {lastReconciliation.nowVerified} now verified.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(vehicles.length)} label="Vehicles reporting" />
        <StatCard value={String(healthy)} label="Devices healthy" color={healthy > 0 ? tokens.green : undefined} />
        <StatCard value={String(offline)} label="Devices offline" color={offline > 0 ? tokens.red : undefined} />
        <StatCard
          value={String(backlog)}
          label="Fixes waiting on devices"
          color={backlog > 0 ? tokens.warn : undefined}
        />
      </Box>

      <Box sx={{ mb: '20px' }}>
        <OperationsMap vehicles={vehicles} metadata={metadata} connectionState={connectionState} />
      </Box>

      <DataCard
        title="Device health"
        count={devices.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by driver id' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.driverId}
        emptyTitle="No device has ever checked in"
        emptyDescription="A row appears here the first time a driver app sends a heartbeat."
        note="Every column is derived from the age of what the server received. Nothing here is a state the device asserted about itself."
      />
    </>
  );
}
