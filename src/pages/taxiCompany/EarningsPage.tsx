import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import EmptyState from '../../components/EmptyState';
import EarningsSummary from '../../components/taxiCompany/EarningsSummary';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { DRIVER_HOURLY_RATE_USD } from '../../services/earningsService';
import { formatCurrency } from '../../utils/format';
import { FLEET_EARNINGS, PAYOUT_HISTORY } from '../../data/taxiCompanyMockData';
import type { PayoutRecord } from '../../types/taxiCompany';
import { tokens } from '../../theme';

type CarEarningsRow = {
  id: string;
  plateNumber: string;
  model: string;
  drivingHoursToday: number;
  screenTimeHoursToday: number;
  distanceKmToday: number;
  hoursPay: number;
};

const PAYOUT_STATUS_VARIANT = {
  Paid: 'live',
  Processing: 'warn',
  Scheduled: 'outline',
} as const;

export default function EarningsPage() {
  const { cars } = useFleet();

  const carRows = useMemo<CarEarningsRow[]>(
    () =>
      cars.map((c) => ({
        id: c.id,
        plateNumber: c.plateNumber,
        model: `${c.model} (${c.year})`,
        drivingHoursToday: c.drivingHoursToday,
        screenTimeHoursToday: c.screenTimeHoursToday,
        distanceKmToday: c.distanceKmToday,
        hoursPay: c.drivingHoursToday * DRIVER_HOURLY_RATE_USD,
      })),
    [cars],
  );

  const totalHoursPay = carRows.reduce((sum, r) => sum + r.hoursPay, 0);

  const carColumns = useMemo<GridColDef<CarEarningsRow>[]>(
    () => [
      { field: 'plateNumber', headerName: 'Plate', flex: 0.7, minWidth: 110 },
      { field: 'model', headerName: 'Model', flex: 1, minWidth: 160 },
      { field: 'drivingHoursToday', headerName: 'Driving hrs', flex: 0.7, minWidth: 110, type: 'number' },
      { field: 'screenTimeHoursToday', headerName: 'Screen hrs', flex: 0.7, minWidth: 110, type: 'number' },
      { field: 'distanceKmToday', headerName: 'Distance (km)', flex: 0.7, minWidth: 120, type: 'number' },
      {
        field: 'hoursPay',
        headerName: 'Hours pay',
        flex: 0.7,
        minWidth: 110,
        type: 'number',
        valueFormatter: (value: number) => formatCurrency(value, { decimals: 2 }),
      },
    ],
    [],
  );

  const payoutColumns = useMemo<GridColDef<PayoutRecord>[]>(
    () => [
      { field: 'period', headerName: 'Period', flex: 1, minWidth: 140 },
      { field: 'vehiclesIncluded', headerName: 'Vehicles', flex: 0.6, minWidth: 100, type: 'number' },
      {
        field: 'amount',
        headerName: 'Amount',
        flex: 0.8,
        minWidth: 120,
        type: 'number',
        valueFormatter: (value: number) => formatCurrency(value),
      },
      { field: 'paidOn', headerName: 'Payout date', flex: 0.8, minWidth: 130 },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.7,
        minWidth: 130,
        renderCell: (params) => <StatusTag label={params.row.status} variant={PAYOUT_STATUS_VARIANT[params.row.status]} />,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Earnings" subtitle={`Fleet payouts and per-vehicle contribution · next payout ${FLEET_EARNINGS.nextPayoutDate}`} />

      <Card sx={{ p: '20px', mb: '24px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Fleet payouts
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '12px' }}>Summary</Typography>
        <EarningsSummary columns={4} />
      </Card>

      <Card sx={{ p: 0, mb: '24px' }}>
        <Box sx={{ padding: '18px 22px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Per-vehicle activity today</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '4px' }}>
            Hours pay is driving hours × {formatCurrency(DRIVER_HOURLY_RATE_USD, { decimals: 2 })}/hr. The monthly base and premium-area
            bonus are paid per driver and aren't broken out per vehicle here — fleet total today: {formatCurrency(totalHoursPay, { decimals: 2 })}.
          </Typography>
        </Box>
        {carRows.length === 0 ? (
          <EmptyState title="No vehicles yet" description="Add a car to start tracking earnings." />
        ) : (
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={carRows}
              columns={carColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              sx={{ border: 'none' }}
            />
          </Box>
        )}
      </Card>

      <Card sx={{ p: 0 }}>
        <Box sx={{ padding: '18px 22px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Payout history</Typography>
        </Box>
        <Box sx={{ height: 360, borderTop: `1px solid ${tokens.border}` }}>
          <DataGrid
            rows={PAYOUT_HISTORY}
            columns={payoutColumns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            sx={{ border: 'none' }}
          />
        </Box>
      </Card>
    </>
  );
}
