import { useMemo, useState } from 'react';
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
import {
  fetchTaxiCompanies,
  fetchVehicles,
  readableStatus,
  toneForStatus,
  waitingFor,
  type AccountRegistration,
  type AdminVehicle,
} from '../../services/admin';

/**
 * Every taxi company, and how much of the network each one actually brings.
 *
 * Fleet size is counted from the vehicle inventory rather than stored on the company, because a
 * stored count is a number that drifts the first time a car is added by a route that forgets to
 * increment it.
 */

function getColumns(
  t: (key: string, opts?: Record<string, unknown>) => string,vehiclesBy: Map<string, number>): GridColDef<AccountRegistration>[] {
  return [
    { field: 'companyName', headerName: t('admin.fleets.company'), flex: 1.1, minWidth: 180 },
    { field: 'email', headerName: t('admin.fleets.email'), flex: 1.1, minWidth: 200 },
    {
      field: 'mobileNumber',
      headerName: t('admin.fleets.mobile'),
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => row.mobileNumber ?? '—',
    },
    {
      field: 'region',
      headerName: t('admin.fleets.region'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'status',
      headerName: t('admin.fleets.status'),
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'vehicles',
      headerName: t('admin.fleets.vehicles'),
      flex: 0.5,
      minWidth: 100,
      type: 'number',
      valueGetter: (_v, row) => vehiclesBy.get(row.accountId) ?? 0,
    },
    {
      field: 'createdAtUtc',
      headerName: t('admin.fleets.submitted'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => `${waitingFor(row.createdAtUtc)} ago`,
    },
  ];
}

export default function TaxiCompaniesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [search, setSearch] = useState('');

  const loaded = useAsyncData<{ companies: AccountRegistration[]; vehicles: AdminVehicle[] }>(
    async (signal) => {
      const [companies, vehicles] = await Promise.all([
        fetchTaxiCompanies('all', signal),
        fetchVehicles(undefined, 1, 200, signal)
          .then((page) => page.items)
          .catch(() => [] as AdminVehicle[]),
      ]);
      return { companies, vehicles };
    },
    [],
    'Taxi companies could not be loaded.',
  );

  const companies = useMemo(() => loaded.data?.companies ?? [], [loaded.data]);

  const vehiclesByCompany = useMemo(() => {
    const counts = new Map<string, number>();
    for (const vehicle of loaded.data?.vehicles ?? []) {
      if (!vehicle.taxiCompanyId) continue;
      counts.set(vehicle.taxiCompanyId, (counts.get(vehicle.taxiCompanyId) ?? 0) + 1);
    }
    return counts;
  }, [loaded.data]);

  const counts = useMemo(() => countAccountsByFilter(companies, (c) => c.status), [companies]);

  const filtered = useMemo(
    () =>
      filterAccounts(
        companies,
        filter,
        search,
        (c) => c.status,
        (c) => [c.companyName, c.contactName, c.email, c.region, c.status],
      ),
    [companies, filter, search],
  );

  const fleetCars = [...vehiclesByCompany.values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <AdminFilterBar
        ariaLabel={t('admin.fleets.status')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('admin.filters.all'), count: counts.all },
          { value: 'pending', label: t('admin.filters.pending'), count: counts.pending },
          { value: 'approved', label: t('admin.filters.approved'), count: counts.approved },
          { value: 'rejected', label: t('admin.filters.rejected'), count: counts.rejected },
          { value: 'suspended', label: t('admin.filters.suspended'), count: counts.suspended },
        ]}
        search={{ value: search, onChange: setSearch, placeholder: t('admin.fleets.search') }}
        trailing={
          // Cars brought by fleets, which no status tab covers.
          <StatusTag label={`${t('admin.fleets.vehicles')}: ${fleetCars}`} variant="neutral" />
        }
      />

      <DataCard
        title={t('admin.nav.fleetPartners')}
        count={filtered.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(t, vehiclesByCompany)}
        getRowId={(row) => row.accountId}
        emptyTitle={companies.length === 0 ? t('admin.fleets.empty') : t('admin.fleets.noMatch')}
        emptyDescription={companies.length === 0 ? t('admin.fleets.emptyDetail') : t('admin.fleets.noMatchDetail')}
        note={t('admin.fleets.note')}
      />
    </>
  );
}
