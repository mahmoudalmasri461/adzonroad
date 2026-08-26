import { useMemo } from 'react';
import Box from '@mui/material/Box';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import {
  describeLastSignal,
  fetchScreens,
  fetchVehicles,
  presentScreen,
  reportingScreens,
  type AdminScreen,
  type AdminVehicle,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * The screen estate.
 *
 * There is nothing in it. No rooftop hardware has been built, so every screen-derived figure on
 * the platform is zero — which is a different thing from wrong, and the page says which. The
 * fitment ratio is shown against the vehicle count so the size of the gap is the first thing
 * read, rather than an empty table that could equally mean the query failed.
 */

function getColumns(): GridColDef<AdminScreen>[] {
  return [
    { field: 'serialNumber', headerName: 'Serial', flex: 0.8, minWidth: 140 },
    {
      field: 'plate',
      headerName: 'Vehicle',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_v, row) => row.plate ?? '—',
    },
    {
      field: 'driverName',
      headerName: 'Driver',
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.driverName?.trim() || '—',
    },
    {
      field: 'region',
      headerName: 'Region',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'status',
      headerName: 'Screen status',
      flex: 0.8,
      minWidth: 155,
      // Derived, not the stored column — a screen that has never sent a heartbeat is not Online
      // however its status row reads.
      renderCell: (params) => {
        const presented = presentScreen(params.row);
        return <StatusTag label={presented.label} variant={presented.tone} />;
      },
    },
    {
      field: 'networkStatus',
      headerName: 'Network',
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        <StatusTag
          label={params.row.networkStatus}
          variant={params.row.networkStatus === 'Connected' ? 'live' : 'error'}
        />
      ),
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
      headerName: 'Last signal',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => describeLastSignal(row.lastHeartbeatAtUtc),
    },
  ];
}

export default function AdminScreensPage() {
  const loaded = useAsyncData<{ screens: AdminScreen[]; vehicles: AdminVehicle[] }>(
    async (signal) => {
      const [screens, vehicles] = await Promise.all([
        fetchScreens(signal),
        fetchVehicles(undefined, 1, 200, signal)
          .then((page) => page.items)
          .catch(() => [] as AdminVehicle[]),
      ]);
      return { screens, vehicles };
    },
    [],
    'Screens could not be loaded.',
  );

  const screens = useMemo(() => loaded.data?.screens ?? [], [loaded.data]);
  const vehicleCount = loaded.data?.vehicles.length ?? 0;

  const { search, setSearch, filtered } = useSearchFilter(screens, [
    'serialNumber', 'plate', 'driverName', 'region',
  ]);

  const online = reportingScreens(screens);
  const connected = screens.filter((s) => s.networkStatus === 'Connected').length;
  const everSeen = screens.filter((s) => s.lastHeartbeatAtUtc !== null).length;

  return (
    <>
      <PageHeader title="Screens" subtitle="Rooftop hardware, and what it is reporting." />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(screens.length)} label="Screens registered" />
        <StatCard value={String(online)} label="Reporting now" color={online > 0 ? tokens.green : undefined} />
        <StatCard
          value={String(connected)}
          label="Network connected"
          color={connected > 0 ? tokens.green : undefined}
        />
        <StatCard value={String(everSeen)} label="Have ever checked in" />
        <StatCard
          value={vehicleCount === 0 ? '—' : `${Math.round((screens.length / vehicleCount) * 100)}%`}
          label={`Fitment across ${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'}`}
        />
      </Box>

      <DataCard
        title="Screen inventory"
        count={screens.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search serial, plate, driver or region' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns()}
        getRowId={(row) => row.screenId}
        emptyTitle="No screens exist"
        emptyDescription="No rooftop hardware has been built, so there is nothing to list. Every screen-derived figure on the platform is therefore zero rather than wrong."
        note="Provisioning is not built: a screen row has to be created directly in the database, and the vendor adapter that would talk to a supplier's CMS ships only a null implementation."
      />
    </>
  );
}
