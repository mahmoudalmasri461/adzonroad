import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import { estimateCampaignPrice, type CreativeDurationSeconds } from '../services/pricingService';
import { formatCurrency } from '../utils/format';

const STEPS = ['Info', 'Upload creative', 'Regions', 'Taxi count', 'Dates & hours', 'Price review', 'Payment'];
const REGIONS = ['Beirut', 'Mount Lebanon', 'Tripoli', 'Sidon', 'Tyre', 'Zahle', 'Byblos', 'Jounieh'];
const DURATIONS: CreativeDurationSeconds[] = [10, 15, 30];

type CreateCampaignDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateCampaignDialog({ open, onClose }: CreateCampaignDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [regions, setRegions] = useState<string[]>(['Beirut']);
  const [taxiCount, setTaxiCount] = useState(50);
  const [duration, setDuration] = useState<CreativeDurationSeconds>(15);

  const isLast = activeStep === STEPS.length - 1;

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  };

  const pricing = estimateCampaignPrice({ taxiCount, durationSeconds: duration, regionCount: regions.length });

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Objective" select defaultValue="awareness" fullWidth>
              <MenuItem value="awareness">Brand awareness</MenuItem>
              <MenuItem value="launch">Product launch</MenuItem>
              <MenuItem value="promo">Seasonal promo</MenuItem>
            </TextField>
            <TextField label="Budget (USD)" value={budget} onChange={(e) => setBudget(e.target.value)} fullWidth />
          </Box>
        );
      case 1:
        return (
          <Box
            sx={{
              mt: 1,
              border: '1.5px dashed',
              borderColor: 'divider',
              borderRadius: '12px',
              padding: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Drop creative assets here</Typography>
            <Typography sx={{ fontSize: 13 }}>MP4, PNG or JPG — recommended 1920×1080</Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 1.5 }}>Select target regions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {REGIONS.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  onClick={() => toggleRegion(region)}
                  color={regions.includes(region) ? 'primary' : 'default'}
                  variant={regions.includes(region) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ pt: 2, px: 1, display: 'grid', gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>Taxi count — {taxiCount}</Typography>
              <Slider value={taxiCount} min={10} max={400} onChange={(_, v) => setTaxiCount(v as number)} />
            </Box>
            <TextField label="Ad duration per play" select value={duration} onChange={(e) => setDuration(Number(e.target.value) as CreativeDurationSeconds)}>
              {DURATIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d} seconds
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
            <TextField label="Start date" type="date" slotProps={{ inputLabel: { shrink: true } }} defaultValue="2026-08-01" />
            <TextField label="End date" type="date" slotProps={{ inputLabel: { shrink: true } }} defaultValue="2026-08-31" />
            <TextField label="Display hours from" type="time" slotProps={{ inputLabel: { shrink: true } }} defaultValue="07:00" />
            <TextField label="Display hours to" type="time" slotProps={{ inputLabel: { shrink: true } }} defaultValue="22:00" />
          </Box>
        );
      case 5:
        return (
          <Box sx={{ pt: 1, display: 'grid', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Regions selected</span>
              <b>{regions.length || '—'}</b>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Taxis</span>
              <b>{taxiCount}</b>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Ad duration</span>
              <b>{duration} sec</b>
            </Box>
            {pricing.regionSurcharge > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'text.secondary' }}>
                <span>Additional-region surcharge</span>
                <span>{formatCurrency(pricing.regionSurcharge)}</span>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <span>Estimated total price</span>
              <Typography sx={{ fontWeight: 800, fontSize: 20, color: 'navy.main' }}>{formatCurrency(pricing.total)}</Typography>
            </Box>
          </Box>
        );
      case 6:
        return (
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Card number" placeholder="•••• •••• •••• ••••" fullWidth />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Expiry" placeholder="MM/YY" />
              <TextField label="CVC" placeholder="•••" />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create campaign</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1, pb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => (isLast ? handleClose() : setActiveStep((s) => s + 1))}
        >
          {isLast ? 'Launch campaign' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
