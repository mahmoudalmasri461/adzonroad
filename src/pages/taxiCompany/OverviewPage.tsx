import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import EmptyState from '../../components/EmptyState';
import FleetMap from '../../components/taxiCompany/FleetMap';
import EarningsSummary from '../../components/taxiCompany/EarningsSummary';
import CarsTable from '../../components/taxiCompany/CarsTable';
import FleetSupportCard from '../../components/taxiCompany/FleetSupportCard';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { FLEET_EARNINGS, MOCK_TAXI_COMPANY } from '../../data/taxiCompanyMockData';
import { tokens } from '../../theme';

export default function OverviewPage() {
  const { cars, openAddCar, openAddDriver } = useFleet();

  const stats = useMemo(() => {
    const totals = cars.reduce(
      (acc, c) => ({
        hours: acc.hours + c.drivingHoursToday,
        screenTime: acc.screenTime + c.screenTimeHoursToday,
        distance: acc.distance + c.distanceKmToday,
      }),
      { hours: 0, screenTime: 0, distance: 0 },
    );
    return {
      active: cars.filter((c) => c.status === 'Active').length,
      offline: cars.filter((c) => c.status === 'Offline').length,
      maintenance: cars.filter((c) => c.status === 'Maintenance').length,
      gpsLost: cars.filter((c) => c.gpsStatus === 'Lost').length,
      ...totals,
    };
  }, [cars]);

  const onDisplayNow = cars.filter((c) => c.screenStatus === 'Online');

  return (
    <>
      <PageHeader
        title="Fleet overview"
        subtitle={`${MOCK_TAXI_COMPANY.companyName} · ${cars.length} vehicles registered`}
        actions={
          <>
            <Button variant="outlined" color="inherit" sx={{ borderColor: tokens.border, color: tokens.text }} startIcon={<AddIcon />} onClick={openAddDriver}>
              Add Driver
            </Button>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openAddCar}>
              Add Car
            </Button>
          </>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '28px' }}>
        <StatCard value={String(cars.length)} label="Total vehicles" />
        <StatCard value={String(stats.active)} label="Active now" color={tokens.green} />
        <StatCard value={String(stats.offline)} label="Offline" color={tokens.red} />
        <StatCard value={String(stats.maintenance)} label="In maintenance" color={tokens.warn} />
        <StatCard value={String(stats.gpsLost)} label="GPS signal lost" color={tokens.red} />
        <StatCard value={`${stats.hours.toFixed(1)} hrs`} label="Driving hours today" />
        <StatCard value={`${stats.screenTime.toFixed(1)} hrs`} label="Screen time today" />
        <StatCard value={`${stats.distance.toFixed(0)} km`} label="Distance driven today" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.4fr' }, gap: '20px', mb: '28px', alignItems: 'stretch' }}>
        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Fleet payouts
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '12px' }}>Earnings</Typography>
          <EarningsSummary />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '12px' }}>Next payout {FLEET_EARNINGS.nextPayoutDate}</Typography>
        </Card>
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <FleetMap cars={cars} />
        </Card>
      </Box>

      <Card sx={{ p: '20px', mb: '20px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Live right now
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '10px' }}>Screens on display now</Typography>
        {onDisplayNow.length === 0 ? (
          <EmptyState title="No screens currently displaying" description="Screens will show up here once a car starts a campaign." />
        ) : (
          <Box sx={{ display: 'grid', gap: '4px' }}>
            {onDisplayNow.map((c) => (
              <Box
                key={c.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 4px',
                  borderBottom: `1px solid ${tokens.border}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                    {c.plateNumber} · {c.screenId}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{c.currentCampaign}</Typography>
                </Box>
                <StatusTag label="Online" variant="live" />
              </Box>
            ))}
          </Box>
        )}
      </Card>

      <Box sx={{ mb: '20px' }}>
        <CarsTable title="All screens assigned" />
      </Box>

      <FleetSupportCard />
    </>
  );
}
