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
  fetchTaxiCompanies,
  fetchVehicles,
  readableStatus,
  toneForStatus,
  waitingFor,
  type AccountRegistration,
  type AdminVehicle,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * Every taxi company, and how much of the network each one actually brings.
 *
 * Fleet size is counted from the vehicle inventory rather than stored on the company, because a
 * stored count is a number that drifts the first time a car is added by a route that forgets to
 * increment it.
 */

function getColumns(vehiclesBy: Map<string, number>): GridColDef<AccountRegistration>[] {
  return [
    { field: 'companyName', headerName: 'Company', flex: 1.1, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1.1, minWidth: 200 },
    {
      field: 'mobileNumber',
      headerName: 'Mobile',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => row.mobileNumber ?? '—',
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
      headerName: 'Status',
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'vehicles',
      headerName: 'Vehicles',
      flex: 0.5,
      minWidth: 100,
      type: 'number',
      valueGetter: (_v, row) => vehiclesBy.get(row.accountId) ?? 0,
    },
    {
      field: 'createdAtUtc',
      headerName: 'Registered',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => `${waitingFor(row.createdAtUtc)} ago`,
    },
  ];
}

export default function TaxiCompaniesPage() {
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

  const { search, setSearch, filtered } = useSearchFilter(companies, [
    'companyName', 'email', 'region', 'status',
  ]);

  const approved = companies.filter((c) => c.status === 'Approved').length;
  const pending = companies.filter((c) => c.status === 'PendingVerification').length;
  const fleetCars = [...vehiclesByCompany.values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader
        title="Taxi companies"
        subtitle="Every fleet on the platform and the cars it brings."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(companies.length)} label="Companies" />
        <StatCard value={String(approved)} label="Approved" color={approved > 0 ? tokens.green : undefined} />
        <StatCard value={String(pending)} label="Awaiting review" color={pending > 0 ? tokens.warn : undefined} />
        <StatCard value={String(fleetCars)} label="Fleet-owned vehicles" />
      </Box>

      <DataCard
        title="Taxi companies"
        count={companies.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search company, email or region' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(vehiclesByCompany)}
        getRowId={(row) => row.accountId}
        emptyTitle="No taxi companies have registered"
        emptyDescription="Companies appear here as soon as one signs up, before anyone reviews it."
        note="A company cannot approve its own drivers — every driver it adds still goes to the platform review queue."
      />
    </>
  );
}
