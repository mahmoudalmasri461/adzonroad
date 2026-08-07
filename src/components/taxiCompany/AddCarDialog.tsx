import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ImageUploadField from '../ImageUploadField';
import type { Car, CarType, PlateCategory } from '../../types/taxiCompany';

const PLATE_CATEGORIES: PlateCategory[] = ['Public (Taxi — Red)', 'Private', 'Rental (Green)', 'Transit', 'Diplomatic'];
const CAR_TYPES: CarType[] = ['Sedan', 'SUV', 'Van', 'Hatchback', 'Pickup', 'Minibus'];
const YEARS = Array.from({ length: 22 }, (_, i) => 2026 - i);

const BEIRUT_CENTER = { lat: 33.8938, lng: 35.5018 };

type AddCarDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (car: Car) => void;
};

export default function AddCarDialog({ open, onClose, onAdd }: AddCarDialogProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [plateCategory, setPlateCategory] = useState<PlateCategory>('Public (Taxi — Red)');
  const [carType, setCarType] = useState<CarType>('Sedan');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(YEARS[0]);
  const [papersImage, setPapersImage] = useState<File | null>(null);

  const reset = () => {
    setPlateNumber('');
    setPlateCategory('Public (Taxi — Red)');
    setCarType('Sedan');
    setModel('');
    setYear(YEARS[0]);
    setPapersImage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = plateNumber.trim().length > 0 && model.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const id = `car-${Date.now()}`;
    onAdd({
      id,
      plateNumber: plateNumber.trim(),
      plateCategory,
      carType,
      model: model.trim(),
      year,
      papersImageName: papersImage?.name ?? null,
      status: 'Idle',
      gpsStatus: 'Connected',
      screenId: `AZR-${Math.floor(1000 + Math.random() * 9000)}`,
      screenStatus: 'Pending Sync',
      currentCampaign: null,
      driverId: null,
      drivingHoursToday: 0,
      screenTimeHoursToday: 0,
      distanceKmToday: 0,
      lat: BEIRUT_CENTER.lat + (Math.random() - 0.5) * 0.03,
      lng: BEIRUT_CENTER.lng + (Math.random() - 0.5) * 0.03,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add car</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Plate number" required fullWidth value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 482913" />
          <TextField label="Plate category" select fullWidth value={plateCategory} onChange={(e) => setPlateCategory(e.target.value as PlateCategory)}>
            {PLATE_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Car type" select fullWidth value={carType} onChange={(e) => setCarType(e.target.value as CarType)}>
            {CAR_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Model" required fullWidth value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Kia Optima" />
          <TextField label="Year" select fullWidth value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
          <ImageUploadField label="Car papers" file={papersImage} onChange={setPapersImage} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!canSubmit} onClick={handleSubmit}>
          Add car
        </Button>
      </DialogActions>
    </Dialog>
  );
}
