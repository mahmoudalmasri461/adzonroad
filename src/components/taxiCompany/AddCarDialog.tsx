import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import type { CarType, PlateCategory } from '../../types/taxiCompany';
import type { RegisterVehicleInput } from '../../services/fleet';

const PLATE_CATEGORIES: PlateCategory[] = ['Public (Taxi — Red)', 'Private', 'Rental (Green)', 'Transit', 'Diplomatic'];
const CAR_TYPES: CarType[] = ['Sedan', 'SUV', 'Van', 'Hatchback', 'Pickup', 'Minibus'];
const YEARS = Array.from({ length: 22 }, (_, i) => 2026 - i);

type AddCarDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Rejects with the server's message when the plate is already registered. */
  onAdd: (input: RegisterVehicleInput) => Promise<void>;
};

/**
 * Registers a real vehicle against the signed-in company.
 *
 * This dialog used to fabricate a screen serial, a GPS status and a random position near Beirut
 * so the new row looked populated. It no longer invents anything: a car arrives with no screen
 * and no position, reads as "Not Fitted", and stays that way until hardware is actually
 * installed and starts reporting.
 */
export default function AddCarDialog({ open, onClose, onAdd }: AddCarDialogProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [plateCategory, setPlateCategory] = useState<PlateCategory>('Public (Taxi — Red)');
  const [carType, setCarType] = useState<CarType>('Sedan');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(YEARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPlateNumber('');
    setPlateCategory('Public (Taxi — Red)');
    setCarType('Sedan');
    setModel('');
    setYear(YEARS[0]);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const canSubmit = plateNumber.trim().length > 0 && model.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await onAdd({
        plateNumber: plateNumber.trim(),
        plateCategory,
        carType,
        model: model.trim(),
        year,
      });
      reset();
      onClose();
    } catch (e) {
      // Stays open with the reason. A duplicate plate is the common case and the message names it.
      setError(e instanceof Error ? e.message : 'Could not add the car.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add car</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>}

          <TextField
            label="Plate number"
            required
            fullWidth
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 482913"
          />
          <TextField
            label="Plate category"
            select
            fullWidth
            value={plateCategory}
            onChange={(e) => setPlateCategory(e.target.value as PlateCategory)}
          >
            {PLATE_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Car type"
            select
            fullWidth
            value={carType}
            onChange={(e) => setCarType(e.target.value as CarType)}
          >
            {CAR_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Model"
            required
            fullWidth
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Kia Optima"
          />
          <TextField
            label="Year"
            select
            fullWidth
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>

          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            The car will show as <strong>Not Fitted</strong> until a screen is installed and starts
            reporting.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!canSubmit}
          onClick={handleSubmit}
          startIcon={submitting ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : undefined}
        >
          {submitting ? 'Adding…' : 'Add car'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
