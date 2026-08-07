import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ImageUploadField from '../ImageUploadField';
import type { CompanyDriver } from '../../types/taxiCompany';

type AddDriverDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (driver: CompanyDriver) => void;
};

export default function AddDriverDialog({ open, onClose, onAdd }: AddDriverDialogProps) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [idImage, setIdImage] = useState<File | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);

  const reset = () => {
    setName('');
    setMobileNumber('');
    setIdImage(null);
    setLicenseImage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = name.trim().length > 0 && mobileNumber.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      id: `drv-${Date.now()}`,
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      idImageName: idImage?.name ?? null,
      licenseImageName: licenseImage?.name ?? null,
      assignedCarId: null,
      status: idImage && licenseImage ? 'Unassigned' : 'Pending Documents',
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add driver</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Driver name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Mobile number" required fullWidth value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="e.g. +961 71 234 567" />
          <ImageUploadField label="ID image" file={idImage} onChange={setIdImage} />
          <ImageUploadField label="Driver license image" file={licenseImage} onChange={setLicenseImage} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" disabled={!canSubmit} onClick={handleSubmit}>
          Add driver
        </Button>
      </DialogActions>
    </Dialog>
  );
}
