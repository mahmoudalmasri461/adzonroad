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
  fetchVehicles,
  ownerOf,
  plateOf,
  readableStatus,
  toneForStatus,
  type AdminVehicle,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * Every car on the platform, fleet-owned and independent alike.
 *
 * A car with no company is an independent driver's own, not a missing field, and it says
 * "Independent" rather than a dash. A car with no screen reads "Not fitted" rather than an empty
 * cell — which is currently every car, because no screen hardware has been built.
 */

type VehicleRow = AdminVehicle & { plate: string; owner: string };

function getColumns(): GridColDef<VehicleRow>[] {
  return [
    { field: 'plate', headerName: 'Plate', flex: 0.7, minWidth: 120 },
    {
      field: 'model',
      headerName: 'Car',
      flex: 1,
      minWidth: 170,
      valueGetter: (_v, row) => [row.carType, row.model, row.year || null].filter(Boolean).join(' · '),
    },
    { field: 'owner', headerName: 'Owner', flex: 0.9, minWidth: 160 },
    {
      field: 'driverName',
      headerName: 'Driver',
      flex: 0.9, minWidth: 150,
      valueGetter: (_v, row) => row.driverName?.trim() || 'Unassigned',
    },
    {
      field: 'driverStatus',
      headerName: 'Driver status',
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) =>
        params.row.driverStatus
          ? <StatusTag label={readableStatus(params.row.driverStatus)} variant={toneForStatus(params.row.driverStatus)} />
          : <span style={{ color: tokens.textMuted }}>—</span>,
    },
    {
      field: 'region',
      headerName: 'Region',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'screenSerial',
      headerName: 'Screen',
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) =>
        params.row.screenSerial
          ? <span>{params.row.screenSerial}</span>
          : <StatusTag label="Not fitted" variant="neutral" />,
    },
    {
      field: 'lastFixAtUtc',
      headerName: 'Last position',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => (row.lastFixAtUtc ? describeLastSignal(row.lastFixAtUtc) : 'never'),
    },
  ];
}

export default function VehiclesPage() {
  const loaded = useAsyncData<AdminVehicle[]>(
    (signal) => fetchVehicles(undefined, 1, 200, signal).then((page) => page.items),
    [],
    'Vehicles could not be loaded.',
  );

  const rows = useMemo<VehicleRow[]>(
    () => (loaded.data ?? []).map((v) => ({ ...v, plate: plateOf(v), owner: ownerOf(v) })),
    [loaded.data],
  );

  const { search, setSearch, filtered } = useSearchFilter(rows, [
    'plate', 'model', 'owner', 'driverName', 'region',
  ]);

  const fitted = rows.filter((v) => v.screenSerial !== null).length;
  const independent = rows.filter((v) => v.taxiCompanyId === null).length;
  const unassigned = rows.filter((v) => !v.driverId).length;
  const reporting = rows.filter((v) => v.lastFixAtUtc !== null).length;

  return (
    <>
      <PageHeader title="Vehicles" subtitle="Every registered car, who runs it, and whether it carries a screen." />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(rows.length)} label="Vehicles" />
        <StatCard value={String(fitted)} label="Screen fitted" color={fitted > 0 ? tokens.green : undefined} />
        <StatCard value={String(rows.length - fitted)} label="Not fitted" />
        <StatCard value={String(independent)} label="Independent" />
        <StatCard
          value={String(unassigned)}
          label="No driver assigned"
          color={unassigned > 0 ? tokens.warn : undefined}
        />
        <StatCard value={String(reporting)} label="Have reported a position" />
      </Box>

      <DataCard
        title="Vehicle inventory"
        count={rows.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search plate, model, owner or driver' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns()}
        getRowId={(row) => row.vehicleId}
        emptyTitle="No vehicles registered"
        emptyDescription="Cars appear here when a driver signs up with their own, or a taxi company adds one."
        note="Screens cannot be provisioned from any interface — a screen row has to be created directly in the database, which is the only way any of these came to be fitted."
      />
    </>
  );
}
