import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useFleet } from './FleetContext';
import { tokens } from '../../theme';
import type { Car } from '../../types/taxiCompany';

type CarDetailDialogProps = {
  car: Car | null;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: tokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </Box>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

export default function CarDetailDialog({ car, onClose }: CarDetailDialogProps) {
  const { drivers } = useFleet();
  const driver = car ? drivers.find((d) => d.id === car.driverId) : null;

  return (
    <Dialog open={!!car} onClose={onClose} maxWidth="xs" fullWidth>
      {car && (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>{car.plateNumber}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <SectionLabel>Vehicle info</SectionLabel>
            </Box>
            <Box sx={{ display: 'grid', gap: '6px', fontSize: 13, mt: '8px', mb: '16px' }}>
              <DetailRow label="Category" value={car.plateCategory} />
              <DetailRow label="Type" value={car.carType} />
              <DetailRow label="Model" value={`${car.model} (${car.year})`} />
              <DetailRow label="Papers on file" value={car.papersImageName ?? '—'} />
              <DetailRow label="Driving hours today" value={`${car.drivingHoursToday} hrs`} />
            </Box>

            <SectionLabel>Screen info</SectionLabel>
            <Box sx={{ display: 'grid', gap: '6px', fontSize: 13, mt: '8px', mb: '16px' }}>
              <DetailRow label="Screen ID" value={car.screenId} />
              <DetailRow label="Status" value={car.screenStatus} />
              <DetailRow label="Current campaign" value={car.currentCampaign ?? 'None active'} />
              <DetailRow label="Screen time today" value={`${car.screenTimeHoursToday} hrs`} />
              <DetailRow label="Distance today" value={`${car.distanceKmToday} km`} />
            </Box>

            <SectionLabel>Driver</SectionLabel>
            <Box sx={{ display: 'grid', gap: '6px', fontSize: 13, mt: '8px' }}>
              <DetailRow label="Name" value={driver?.name ?? 'Unassigned'} />
              <DetailRow label="Mobile" value={driver?.mobileNumber ?? '—'} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} color="inherit">
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
