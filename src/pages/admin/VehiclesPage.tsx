import { useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import { tokens } from '../../theme';
import {
  describeLastSignal,
  fetchVehicles,
  ownerOf,
  plateOf,
  readableStatus,
  toneForStatus,
  type AdminVehicle,
} from '../../services/admin';

/**
 * Every car on the platform, fleet-owned and independent alike.
 *
 * A car with no company is an independent driver's own, not a missing field, and it says
 * "Independent" rather than a dash. A car with no screen reads "Not fitted" rather than an empty
 * cell — which is currently every car, because no screen hardware has been built.
 */

type VehicleRow = AdminVehicle & { plate: string; owner: string };

function getColumns(
  t: (key: string, opts?: Record<string, unknown>) => string,): GridColDef<VehicleRow>[] {
  return [
    { field: 'plate', headerName: t('admin.vehicles.plate'), flex: 0.7, minWidth: 120 },
    {
      field: 'model',
      headerName: t('admin.vehicles.car'),
      flex: 1,
      minWidth: 170,
      valueGetter: (_v, row) => [row.carType, row.model, row.year || null].filter(Boolean).join(' · '),
    },
    { field: 'owner', headerName: t('admin.vehicles.owner'), flex: 0.9, minWidth: 160 },
    {
      field: 'driverName',
      headerName: t('admin.vehicles.driver'),
      flex: 0.9, minWidth: 150,
      valueGetter: (_v, row) => row.driverName?.trim() || 'Unassigned',
    },
    {
      field: 'driverStatus',
      headerName: t('admin.vehicles.driverStatus'),
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) =>
        params.row.driverStatus
          ? <StatusTag label={readableStatus(params.row.driverStatus)} variant={toneForStatus(params.row.driverStatus)} />
          : <span style={{ color: tokens.textMuted }}>—</span>,
    },
    {
      field: 'region',
      headerName: t('admin.vehicles.region'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'screenSerial',
      headerName: t('admin.vehicles.screen'),
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) =>
        params.row.screenSerial
          ? <span>{params.row.screenSerial}</span>
          : <StatusTag label="Not fitted" variant="neutral" />,
    },
    {
      field: 'lastFixAtUtc',
      headerName: t('admin.vehicles.lastFix'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => (row.lastFixAtUtc ? describeLastSignal(row.lastFixAtUtc) : 'never'),
    },
  ];
}

export default function VehiclesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'fitted' | 'unfitted'>('all');
  const [search, setSearch] = useState('');

  const loaded = useAsyncData<AdminVehicle[]>(
    (signal) => fetchVehicles(undefined, 1, 200, signal).then((page) => page.items),
    [],
    'Vehicles could not be loaded.',
  );

  const rows = useMemo<VehicleRow[]>(
    () => (loaded.data ?? []).map((v) => ({ ...v, plate: plateOf(v), owner: ownerOf(v) })),
    [loaded.data],
  );

  const fitted = rows.filter((v) => v.screenSerial !== null).length;
  const unassigned = rows.filter((v) => !v.driverId).length;
  const reporting = rows.filter((v) => v.lastFixAtUtc !== null).length;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return rows.filter((v) => {
      // "Fitted" is a property the row carries, not a derived health state.
      if (filter === 'fitted' && v.screenSerial === null) return false;
      if (filter === 'unfitted' && v.screenSerial !== null) return false;
      if (!needle) return true;
      return [v.plate, v.model, v.owner, v.driverName, v.region].some((field) =>
        field?.toLowerCase().includes(needle),
      );
    });
  }, [rows, filter, search]);

  return (
    <>
      <AdminFilterBar
        ariaLabel={t('admin.vehicles.screen')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('admin.vehicles.filters.all'), count: rows.length },
          { value: 'fitted', label: t('admin.vehicles.filters.fitted'), count: fitted },
          { value: 'unfitted', label: t('admin.vehicles.filters.unfitted'), count: rows.length - fitted },
        ]}
        search={{ value: search, onChange: setSearch, placeholder: t('admin.vehicles.search') }}
        trailing={
          <>
            {unassigned > 0 && (
              <StatusTag label={`${t('admin.vehicles.noDriver')}: ${unassigned}`} variant="warn" />
            )}
            <StatusTag label={`${t('admin.vehicles.reported')}: ${reporting}`} variant="neutral" />
          </>
        }
      />

      <DataCard
        title={t('admin.nav.vehicles')}
        count={filtered.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(t)}
        getRowId={(row) => row.vehicleId}
        emptyTitle={rows.length === 0 ? t('admin.vehicles.empty') : t('admin.vehicles.noMatch')}
        emptyDescription={rows.length === 0 ? t('admin.vehicles.emptyDetail') : t('admin.vehicles.noMatchDetail')}
        note={t('admin.vehicles.note')}
      />
    </>
  );
}
