import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import SearchBox from '../../components/SearchBox';
import EmptyState from '../../components/EmptyState';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { SCREEN_STATUS_VARIANT, GPS_STATUS_VARIANT } from '../../components/taxiCompany/statusVariants';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import type { Car } from '../../types/taxiCompany';
import { tokens } from '../../theme';

export default function ScreensPage() {
  const { cars } = useFleet();
  const { search, setSearch, filtered } = useSearchFilter(cars, ['screenId', 'plateNumber']);

  const online = cars.filter((c) => c.screenStatus === 'Online').length;
  const offline = cars.filter((c) => c.screenStatus === 'Offline').length;
  const pendingSync = cars.filter((c) => c.screenStatus === 'Pending Sync').length;
  const maintenance = cars.filter((c) => c.screenStatus === 'Maintenance').length;
  const totalScreenTime = cars.reduce((sum, c) => sum + c.screenTimeHoursToday, 0);

  const columns = useMemo<GridColDef<Car>[]>(
    () => [
      { field: 'screenId', headerName: 'Screen ID', flex: 0.8, minWidth: 120 },
      { field: 'plateNumber', headerName: 'Vehicle', flex: 0.7, minWidth: 110 },
      {
        field: 'screenStatus',
        headerName: 'Screen status',
        flex: 0.8,
        minWidth: 140,
        renderCell: (params) => <StatusTag label={params.row.screenStatus} variant={SCREEN_STATUS_VARIANT[params.row.screenStatus]} />,
      },
      {
        field: 'gpsStatus',
        headerName: 'GPS',
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => <StatusTag label={params.row.gpsStatus} variant={GPS_STATUS_VARIANT[params.row.gpsStatus]} />,
      },
      {
        field: 'currentCampaign',
        headerName: 'Current campaign',
        flex: 1.1,
        minWidth: 180,
        valueGetter: (_v, row) => row.currentCampaign ?? 'None active',
      },
      { field: 'screenTimeHoursToday', headerName: 'Screen hrs today', flex: 0.8, minWidth: 140, type: 'number' },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Screens" subtitle="Every AdzOnRoad screen installed across your fleet, and what it's playing." />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '24px' }}>
        <StatCard value={String(cars.length)} label="Screens installed" />
        <StatCard value={String(online)} label="Online" color={tokens.green} />
        <StatCard value={String(offline)} label="Offline" color={tokens.red} />
        <StatCard value={String(pendingSync)} label="Pending sync" color={tokens.warn} />
        <StatCard value={String(maintenance)} label="In maintenance" />
        <StatCard value={`${totalScreenTime.toFixed(1)} hrs`} label="Screen time today" />
      </Box>

      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Screen inventory</Typography>
          <SearchBox value={search} onChange={setSearch} placeholder="Search screen ID or plate" width={240} />
        </Box>
        {filtered.length === 0 ? (
          <EmptyState title="No screens match your search" description="Try a different screen ID or plate number." />
        ) : (
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              sx={{ border: 'none' }}
            />
          </Box>
        )}
      </Card>
    </>
  );
}
