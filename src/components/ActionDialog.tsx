import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

export type ActionDialogVehicleOption = {
  value: string;
  label: string;
};

type ActionDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onSubmitted: (details: { note: string; vehicle?: string }) => void;
  /** When provided, shows a vehicle picker above the note field (for portals managing more than one vehicle). */
  vehicleOptions?: ActionDialogVehicleOption[];
  /** Preselects a vehicle (e.g. when opened from a specific row's action menu) — re-applied every time the dialog opens. */
  defaultVehicle?: string;
};

export default function ActionDialog({ open, onClose, title, placeholder, onSubmitted, vehicleOptions, defaultVehicle }: ActionDialogProps) {
  const [note, setNote] = useState('');
  const [vehicle, setVehicle] = useState(defaultVehicle ?? vehicleOptions?.[0]?.value ?? '');

  useEffect(() => {
    if (open) setVehicle(defaultVehicle ?? vehicleOptions?.[0]?.value ?? '');
  }, [open, defaultVehicle, vehicleOptions]);

  const handleClose = () => {
    setNote('');
    onClose();
  };

  const handleSubmit = () => {
    onSubmitted({ note, vehicle: vehicleOptions ? vehicle : undefined });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        {vehicleOptions && (
          <TextField select fullWidth label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} sx={{ mt: 1 }}>
            {vehicleOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder={placeholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: vehicleOptions ? 2 : 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
