import { useRef, useState } from 'react';
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
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { estimateCampaignPrice, type CreativeDurationSeconds } from '../services/pricingService';
import { formatCurrency } from '../utils/format';
import { useToast } from '../contexts/ToastProvider';
import { REGIONS as ADVERTISER_REGIONS } from '../data/advertiserMockData';
import { LEBANON_REGIONS } from '../data/lebanonRegions';

const STEPS = ['Info', 'Upload creative', 'Regions', 'Taxi count', 'Dates & hours', 'Price review', 'Submit'];
const REGIONS = LEBANON_REGIONS;
const DURATIONS: CreativeDurationSeconds[] = [15, 30, 45, 60, 75, 90];
const TOTAL_AVAILABLE_TAXIS = ADVERTISER_REGIONS.reduce((sum, r) => sum + r.activeTaxis, 0);
const MIN_TAXIS = 5;

type CreateCampaignDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateCampaignDialog({ open, onClose }: CreateCampaignDialogProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [regions, setRegions] = useState<string[]>(['Beirut']);
  const [taxiCount, setTaxiCount] = useState(50);
  const [duration, setDuration] = useState<CreativeDurationSeconds>(15);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isLast = activeStep === STEPS.length - 1;

  const handleClose = () => {
    setActiveStep(0);
    setCreativeFile(null);
    onClose();
  };

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) setCreativeFile(files[0]);
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
            <TextField
              label="Budget (USD)"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
              slotProps={{ input: { inputMode: 'numeric' } }}
              placeholder="e.g. 3000"
              fullWidth
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 1 }}>
            <input ref={fileInputRef} type="file" accept="video/*,image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              sx={{
                border: '1.5px dashed',
                borderColor: isDragOver ? 'primary.main' : 'divider',
                borderRadius: '12px',
                padding: 4,
                textAlign: 'center',
                color: 'text.secondary',
                cursor: 'pointer',
                backgroundColor: isDragOver ? 'action.hover' : 'transparent',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {creativeFile ? (
                <>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{creativeFile.name}</Typography>
                  <Typography sx={{ fontSize: 13 }}>{(creativeFile.size / (1024 * 1024)).toFixed(1)} MB — click or drop to replace</Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Drop creative assets here</Typography>
                  <Typography sx={{ fontSize: 13 }}>MP4, PNG or JPG — recommended 1920×1080</Typography>
                </>
              )}
            </Box>
            {creativeFile && (
              <Button
                size="small"
                color="inherit"
                onClick={() => setCreativeFile(null)}
                sx={{ mt: 1 }}
              >
                Remove file
              </Button>
            )}
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
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>
                Taxi count — {taxiCount} of {TOTAL_AVAILABLE_TAXIS} available
              </Typography>
              <Slider value={taxiCount} min={MIN_TAXIS} max={TOTAL_AVAILABLE_TAXIS} onChange={(_, v) => setTaxiCount(v as number)} />
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
              <DatePicker label="Start date" defaultValue={dayjs('2026-08-01')} slotProps={{ textField: { fullWidth: true } }} />
              <DatePicker label="End date" defaultValue={dayjs('2026-08-31')} slotProps={{ textField: { fullWidth: true } }} />
              <TimePicker label="Display hours from" defaultValue={dayjs('2026-08-01T07:00')} slotProps={{ textField: { fullWidth: true } }} />
              <TimePicker label="Display hours to" defaultValue={dayjs('2026-08-01T22:00')} slotProps={{ textField: { fullWidth: true } }} />
            </Box>
          </LocalizationProvider>
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
          <Box sx={{ pt: 1, pb: 1, display: 'grid', gap: 1.5, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'navy.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
              }}
            >
              <MarkEmailReadRoundedIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Ready to submit your inquiry</Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', maxWidth: 360, mx: 'auto' }}>
              We don't take payment online. Submit this campaign and our team will review the details, confirm screen availability, and reach out to arrange payment and launch.
            </Typography>
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
          onClick={() => {
            if (isLast) {
              showToast('Inquiry submitted — our team will review and reach out shortly');
              handleClose();
            } else {
              setActiveStep((s) => s + 1);
            }
          }}
        >
          {isLast ? 'Submit inquiry' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
