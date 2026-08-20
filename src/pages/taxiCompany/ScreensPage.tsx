import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import SearchBox from '../../components/SearchBox';
import EmptyState from '../../components/EmptyState';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { screenStatusLabel, screenStatusVariant } from '../../components/taxiCompany/statusVariants';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { getFleetScreens, positionAge, type FleetScreen } from '../../services/fleet';
import { tokens } from '../../theme';

export default function ScreensPage() {
  const { vehicles } = useFleet();

  const [screens, setScreens] = useState<FleetScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getFleetScreens(controller.signal)
      .then(setScreens)
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load your screens.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const { search, setSearch, filtered } = useSearchFilter(screens, ['serialNumber', 'vehiclePlate']);

  const online = screens.filter((s) => s.status === 'Online').length;
  const offline = screens.filter((s) => s.status === 'Offline').length;
  const pendingSync = screens.filter((s) => s.status === 'PendingSync').length;
  const maintenance = screens.filter((s) => s.status === 'Maintenance').length;

  // Verified delivery, summed across the fleet. The number the company is paid on.
  const totalScreenTime = vehicles.reduce((sum, v) => sum + v.screenTimeHoursToday, 0);

  const columns = useMemo<GridColDef<FleetScreen>[]>(
    () => [
      { field: 'serialNumber', headerName: 'Screen ID', flex: 0.8, minWidth: 130 },
      { field: 'vehiclePlate', headerName: 'Vehicle', flex: 0.7, minWidth: 110 },
      {
        field: 'status',
        headerName: 'Screen status',
        flex: 0.8,
        minWidth: 140,
        renderCell: (params) => (
          <StatusTag
            label={screenStatusLabel(params.row.status)}
            variant={screenStatusVariant(params.row.status)}
          />
        ),
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
        field: 'lastHeartbeatAtUtc',
        headerName: 'Last check-in',
        flex: 0.8,
        minWidth: 130,
        valueGetter: (_v, row) => positionAge(row.lastHeartbeatAtUtc),
      },
      {
        field: 'lastBatteryLevel',
        headerName: 'Battery',
        flex: 0.5,
        minWidth: 90,
        valueGetter: (_v, row) => (row.lastBatteryLevel === null ? '—' : `${row.lastBatteryLevel}%`),
      },
      {
        field: 'firmwareVersion',
        headerName: 'Firmware',
        flex: 0.6,
        minWidth: 110,
        valueGetter: (_v, row) => row.firmwareVersion ?? '—',
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Screens"
        subtitle="Every AdzOnRoad screen installed across your fleet, and what it is reporting."
      />

      {error && <Alert severity="error" sx={{ mb: '20px' }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '24px' }}>
        <StatCard value={String(screens.length)} label="Screens installed" />
        <StatCard value={String(online)} label="Online" color={tokens.green} />
        <StatCard value={String(offline)} label="Offline" color={tokens.red} />
        <StatCard value={String(pendingSync)} label="Pending sync" color={tokens.warn} />
        <StatCard value={String(maintenance)} label="In maintenance" />
        <StatCard value={`${totalScreenTime.toFixed(1)} hrs`} label="Verified screen time today" />
      </Box>

      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Screen inventory</Typography>
          <SearchBox value={search} onChange={setSearch} placeholder="Search screen ID or plate" width={240} />
        </Box>

        {loading ? (
          <EmptyState title="Loading screens…" description="Fetching your screen inventory." />
        ) : screens.length === 0 ? (
          <EmptyState
            title="No screens installed yet"
            description={
              vehicles.length === 0
                ? 'Register a car first. Screens are fitted after a vehicle is approved.'
                : 'Your vehicles are registered but no screen has been installed yet. AdzOnRoad fits the hardware.'
            }
          />
        ) : filtered.length === 0 ? (
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
