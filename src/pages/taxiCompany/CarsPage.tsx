import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import CarsTable from '../../components/taxiCompany/CarsTable';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { tokens } from '../../theme';

export default function CarsPage() {
  const { vehicles, summary, error, openAddCar } = useFleet();

  const unassigned = vehicles.filter((v) => !v.driverId).length;

  return (
    <>
      <PageHeader
        title="Cars"
        subtitle="Every vehicle registered to your company, with its screen and GPS status."
        actions={
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openAddCar}>
            Add Car
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: '20px' }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '24px' }}>
        <StatCard value={String(summary?.totalVehicles ?? vehicles.length)} label="Total vehicles" />
        <StatCard value={String(summary?.activeVehicles ?? 0)} label="Active now" color={tokens.green} />
        <StatCard value={String(summary?.maintenanceVehicles ?? 0)} label="In maintenance" color={tokens.warn} />
        <StatCard value={String(unassigned)} label="No driver assigned" color={tokens.textMuted} />
        {/* Surfaced as its own tile: a car with no screen earns nothing, and it is easy to miss. */}
        <StatCard value={String(summary?.vehiclesWithoutScreen ?? 0)} label="Awaiting screen" color={tokens.textMuted} />
      </Box>

      <CarsTable title="Fleet vehicles" pageSize={10} height={560} />
    </>
  );
}
