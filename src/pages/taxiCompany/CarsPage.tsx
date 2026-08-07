import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import CarsTable from '../../components/taxiCompany/CarsTable';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import { tokens } from '../../theme';

export default function CarsPage() {
  const { cars, openAddCar } = useFleet();

  const active = cars.filter((c) => c.status === 'Active').length;
  const maintenance = cars.filter((c) => c.status === 'Maintenance').length;
  const unassigned = cars.filter((c) => !c.driverId).length;

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

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '24px' }}>
        <StatCard value={String(cars.length)} label="Total vehicles" />
        <StatCard value={String(active)} label="Active now" color={tokens.green} />
        <StatCard value={String(maintenance)} label="In maintenance" color={tokens.warn} />
        <StatCard value={String(unassigned)} label="No driver assigned" color={tokens.textMuted} />
      </Box>

      <CarsTable title="Fleet vehicles" pageSize={10} height={560} />
    </>
  );
}
