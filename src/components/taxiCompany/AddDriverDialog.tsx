import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ImageUploadField from '../ImageUploadField';
import { toCompressedBase64 } from '../../services/imageUpload';
import type { AddFleetDriverInput } from '../../services/fleet';

type AddDriverDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddFleetDriverInput) => Promise<void>;
};

/**
 * Adds a driver to the company's fleet.
 *
 * The password is real — the driver signs into the Android app with their mobile number and this
 * password, and the server marks the account as needing a change on first use, because somebody
 * else chose it.
 *
 * The two documents are optional in the form but matter: without them the driver sits at
 * "Pending Documents" and an administrator cannot approve them. A fleet-added driver never passes
 * through self-registration, so this dialog is their only route in.
 */
export default function AddDriverDialog({ open, onClose, onAdd }: AddDriverDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [idImage, setIdImage] = useState<File | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setMobileNumber('');
    setPassword('');
    setIdImage(null);
    setLicenseImage(null);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const canSubmit =
    firstName.trim().length > 0 &&
    mobileNumber.trim().length > 0 &&
    password.length >= 8 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await onAdd({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        nationalIdImageBase64: idImage ? await toCompressedBase64(idImage) : undefined,
        driverLicenseImageBase64: licenseImage ? await toCompressedBase64(licenseImage) : undefined,
      });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the driver.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add driver</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>}

          <TextField
            label="First name"
            required
            fullWidth
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last name"
            fullWidth
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            label="Mobile number"
            required
            fullWidth
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="e.g. 71234567"
            helperText="The driver signs into the app with this number."
          />
          <TextField
            label="Temporary password"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="At least 8 characters. The driver must replace it on first sign-in."
          />

          <ImageUploadField label="ID image" file={idImage} onChange={setIdImage} />
          <ImageUploadField label="Driver license image" file={licenseImage} onChange={setLicenseImage} />

          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Without both documents the driver stays at <strong>Pending Documents</strong> and cannot
            be approved.
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
          {submitting ? 'Adding…' : 'Add driver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
