import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import StatusTag from '../StatusTag';
import SearchBox from '../SearchBox';
import EmptyState from '../EmptyState';
import CarDetailDialog from './CarDetailDialog';
import { useFleet } from './FleetContext';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { CAR_STATUS_VARIANT, GPS_STATUS_VARIANT, SCREEN_STATUS_VARIANT } from './statusVariants';
import type { Car } from '../../types/taxiCompany';

function CarActionsMenu({ car, onView }: { car: Car; onView: (c: Car) => void }) {
  const { openDamageReport, openMaintenanceRequest } = useFleet();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const run = (fn: () => void) => () => {
    setAnchor(null);
    fn();
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={run(() => onView(car))}>View details</MenuItem>
        <MenuItem onClick={run(() => openDamageReport(car.id))}>Report damage</MenuItem>
        <MenuItem onClick={run(() => openMaintenanceRequest(car.id))}>Request maintenance</MenuItem>
      </Menu>
    </>
  );
}

type CarsTableProps = {
  title: string;
  /** Rows per page; the Overview page shows a shorter table than the Cars page. */
  pageSize?: number;
  height?: number;
};

export default function CarsTable({ title, pageSize = 5, height = 420 }: CarsTableProps) {
  const { cars } = useFleet();
  const [detailCar, setDetailCar] = useState<Car | null>(null);
  const { search, setSearch, filtered } = useSearchFilter(cars, ['plateNumber', 'model']);

  const columns = useMemo<GridColDef<Car>[]>(
    () => [
      { field: 'plateNumber', headerName: 'Plate', flex: 0.7, minWidth: 110 },
      { field: 'plateCategory', headerName: 'Category', flex: 1, minWidth: 160 },
      { field: 'model', headerName: 'Model', flex: 0.9, minWidth: 140, valueGetter: (_v, row) => `${row.model} (${row.year})` },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => <StatusTag label={params.row.status} variant={CAR_STATUS_VARIANT[params.row.status]} />,
      },
      {
        field: 'gpsStatus',
        headerName: 'GPS',
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => <StatusTag label={params.row.gpsStatus} variant={GPS_STATUS_VARIANT[params.row.gpsStatus]} />,
      },
      {
        field: 'screenStatus',
        headerName: 'Screen',
        flex: 0.7,
        minWidth: 130,
        renderCell: (params) => <StatusTag label={params.row.screenStatus} variant={SCREEN_STATUS_VARIANT[params.row.screenStatus]} />,
      },
      { field: 'drivingHoursToday', headerName: 'Driving hrs', flex: 0.6, minWidth: 100, type: 'number' },
      { field: 'distanceKmToday', headerName: 'Distance (km)', flex: 0.6, minWidth: 110, type: 'number' },
      {
        field: 'actions',
        headerName: '',
        flex: 0.4,
        minWidth: 56,
        sortable: false,
        filterable: false,
        renderCell: (params) => <CarActionsMenu car={params.row} onView={setDetailCar} />,
      },
    ],
    [],
  );

  return (
    <Card sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
        <SearchBox value={search} onChange={setSearch} placeholder="Search plate or model" width={220} />
      </Box>
      {filtered.length === 0 ? (
        <EmptyState title="No vehicles match your search" description="Try a different plate number or model." />
      ) : (
        <Box sx={{ height }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize } } }}
            sx={{ border: 'none' }}
          />
        </Box>
      )}
      <CarDetailDialog car={detailCar} onClose={() => setDetailCar(null)} />
    </Card>
  );
}
