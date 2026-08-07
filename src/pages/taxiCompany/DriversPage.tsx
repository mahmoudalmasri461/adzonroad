import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import SearchBox from '../../components/SearchBox';
import EmptyState from '../../components/EmptyState';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { DRIVER_STATUS_VARIANT } from '../../components/taxiCompany/statusVariants';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import type { CompanyDriver } from '../../types/taxiCompany';
import { tokens } from '../../theme';

function DocumentChip({ present, label }: { present: boolean; label: string }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 12, color: present ? tokens.green : tokens.warn }}>
      {present ? <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> : <ErrorOutlineIcon sx={{ fontSize: 14 }} />}
      {label}
    </Box>
  );
}

export default function DriversPage() {
  const { drivers, cars, openAddDriver } = useFleet();
  const { search, setSearch, filtered } = useSearchFilter(drivers, ['name', 'mobileNumber']);

  const assigned = drivers.filter((d) => d.status === 'Assigned').length;
  const pendingDocs = drivers.filter((d) => d.status === 'Pending Documents').length;

  const columns = useMemo<GridColDef<CompanyDriver>[]>(
    () => [
      { field: 'name', headerName: 'Driver', flex: 1, minWidth: 160 },
      { field: 'mobileNumber', headerName: 'Mobile', flex: 0.9, minWidth: 150 },
      {
        field: 'assignedCarId',
        headerName: 'Assigned vehicle',
        flex: 0.9,
        minWidth: 150,
        renderCell: (params) => {
          const car = cars.find((c) => c.id === params.row.assignedCarId);
          return car ? `${car.plateNumber} — ${car.model}` : '—';
        },
      },
      {
        field: 'documents',
        headerName: 'Documents',
        flex: 1,
        minWidth: 190,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center', height: '100%' }}>
            <DocumentChip present={!!params.row.idImageName} label="ID" />
            <DocumentChip present={!!params.row.licenseImageName} label="License" />
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        minWidth: 150,
        renderCell: (params) => <StatusTag label={params.row.status} variant={DRIVER_STATUS_VARIANT[params.row.status]} />,
      },
    ],
    [cars],
  );

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Your registered drivers, their documents, and vehicle assignments."
        actions={
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openAddDriver}>
            Add Driver
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '24px' }}>
        <StatCard value={String(drivers.length)} label="Total drivers" />
        <StatCard value={String(assigned)} label="Assigned" color={tokens.green} />
        <StatCard value={String(pendingDocs)} label="Pending documents" color={tokens.warn} />
      </Box>

      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>All drivers</Typography>
          <SearchBox value={search} onChange={setSearch} placeholder="Search name or mobile" width={220} />
        </Box>
        {filtered.length === 0 ? (
          <EmptyState title="No drivers match your search" description="Try a different name or mobile number." />
        ) : (
          <Box sx={{ height: 480 }}>
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
