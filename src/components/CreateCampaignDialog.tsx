import { useEffect, useMemo, useRef, useState } from 'react';
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
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { formatCurrency } from '../utils/format';
import { ApiError } from '../services/apiClient';
import { fetchRegions, type RegionOption } from '../services/registration';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  createCampaign,
  fetchQuote,
  submitCampaign,
  uploadCreative,
  CREATIVE_DURATIONS,
  MINIMUM_TAXIS,
  type CampaignPrice,
} from '../services/campaigns';

/**
 * Create a campaign, for real.
 *
 * Three things the previous mock version did not do. The dates and times you pick are actually
 * captured — they were `defaultValue` with no handler, so every campaign would have carried the
 * placeholder dates. The price comes from the server rather than a local copy of the rate card,
 * which cannot then drift from what is charged. And nothing here decides the campaign is
 * finished: it is created as a draft, and the server states what remains before it can be
 * submitted.
 */

const STEPS = ['Info', 'Creative', 'Regions', 'Taxis', 'Dates', 'Price', 'Submit'];
const MAX_TAXIS = 300;

type CreateCampaignDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful submission, so a list behind the dialog can refresh. */
  onCreated?: () => void;
};

export default function CreateCampaignDialog({ open, onClose, onCreated }: CreateCampaignDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [available, setAvailable] = useState<RegionOption[]>([]);
  const [taxiCount, setTaxiCount] = useState(10);
  const [duration, setDuration] = useState<number>(15);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(30, 'day'));
  const [dailyStart, setDailyStart] = useState<Dayjs | null>(dayjs().hour(8).minute(0));
  const [dailyEnd, setDailyEnd] = useState<Dayjs | null>(dayjs().hour(16).minute(0));

  const [price, setPrice] = useState<CampaignPrice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const isLast = activeStep === STEPS.length - 1;

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    fetchRegions(controller.signal)
      .then((list) => {
        setAvailable(list);
        setRegions((current) => (current.length > 0 ? current : list.slice(0, 1).map((r) => r.name)));
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable([]);
      });

    return () => controller.abort();
  }, [open]);

  // Priced by the server, so the figure shown is the one that will be charged. Debounced because
  // the taxi slider fires continuously while it is dragged.
  useEffect(() => {
    if (!open || regions.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchQuote(taxiCount, duration, regions.length, controller.signal)
        .then(setPrice)
        .catch(() => {
          if (!controller.signal.aborted) setPrice(null);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, taxiCount, duration, regions.length]);

  const reset = () => {
    setActiveStep(0);
    setName('');
    setCreativeFile(null);
    setProblems([]);
    setError(null);
    setDone(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) setCreativeFile(files[0]);
  };

  /**
   * Create, attach the creative, submit.
   *
   * Three calls rather than one, because that is the shape of the thing: a campaign exists as a
   * draft before it is complete, and a creative belongs to a campaign. If submission fails the
   * draft survives with its creative attached, so nothing typed is lost.
   */
  const submit = async () => {
    setError(null);
    setProblems([]);
    setSubmitting(true);

    try {
      const campaign = await createCampaign({
        name: name.trim(),
        startDate: (startDate ?? dayjs()).toISOString(),
        endDate: (endDate ?? dayjs().add(30, 'day')).toISOString(),
        dailyStartTime: (dailyStart ?? dayjs().hour(8).minute(0)).format('HH:mm:ss'),
        dailyEndTime: (dailyEnd ?? dayjs().hour(16).minute(0)).format('HH:mm:ss'),
        taxiCount,
        creativeDurationSeconds: duration,
        regions,
      });

      if (creativeFile) {
        await uploadCreative(campaign.campaignId, creativeFile, duration);
      }

      await submitCampaign(campaign.campaignId);

      setDone(true);
      onCreated?.();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message);
        setProblems(e.problems);
      } else {
        setError('Could not reach the server. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepIsIncomplete = useMemo(() => {
    if (activeStep === 0) return name.trim().length === 0;
    if (activeStep === 1) return creativeFile === null;
    if (activeStep === 2) return regions.length === 0;
    if (activeStep === 4) return !startDate || !endDate || !endDate.isAfter(startDate);
    return false;
  }, [activeStep, name, creativeFile, regions, startDate, endDate]);

  if (done) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogContent>
          <Box sx={{ py: 3, display: 'grid', gap: 1.5, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: '50%', backgroundColor: 'primary.main',
                color: 'navy.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto',
              }}
            >
              <MarkEmailReadRoundedIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Submitted for review</Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', maxWidth: 380, mx: 'auto' }}>
              Our team reviews every campaign before it goes live — they'll confirm screen
              availability and reach out to arrange payment. We don't take payment online.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={handleClose}>Done</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              The price is worked out from the taxis, ad length and regions you choose — there's
              nothing to type in.
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
              sx={{
                border: '1.5px dashed',
                borderColor: isDragOver ? 'primary.main' : 'divider',
                borderRadius: '12px',
                padding: 4,
                textAlign: 'center',
                color: 'text.secondary',
                cursor: 'pointer',
                backgroundColor: isDragOver ? 'action.hover' : 'transparent',
              }}
            >
              {creativeFile ? (
                <>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{creativeFile.name}</Typography>
                  <Typography sx={{ fontSize: 13 }}>
                    {(creativeFile.size / (1024 * 1024)).toFixed(1)} MB — click or drop to replace
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Drop your creative here</Typography>
                  <Typography sx={{ fontSize: 13 }}>MP4, PNG or JPG — recommended 1920×1080, up to 200 MB</Typography>
                </>
              )}
            </Box>
            {creativeFile && (
              <Button size="small" color="inherit" onClick={() => setCreativeFile(null)} sx={{ mt: 1 }}>
                Remove file
              </Button>
            )}
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 1.5 }}>
              It must run for exactly the ad length you pick on the next steps, or it can't be submitted.
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 1.5 }}>
              Select target regions{regions.length > 1 && ' — each one beyond the first adds a surcharge'}
            </Typography>
            {available.length === 0 ? (
              <Alert severity="warning" sx={{ fontSize: 13 }}>
                Couldn't load the region list. Check your connection and reopen this dialog.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {available.map((region) => (
                  <Chip
                    key={region.id}
                    label={region.isPremium ? `${region.name} ★` : region.name}
                    onClick={() => toggleRegion(region.name)}
                    color={regions.includes(region.name) ? 'primary' : 'default'}
                    variant={regions.includes(region.name) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ pt: 2, px: 1, display: 'grid', gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>
                Taxi count — {taxiCount}
              </Typography>
              <Slider
                value={taxiCount}
                min={MINIMUM_TAXIS}
                max={MAX_TAXIS}
                onChange={(_, v) => setTaxiCount(v as number)}
                valueLabelDisplay="auto"
              />
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Minimum {MINIMUM_TAXIS}. Availability is confirmed during review.
              </Typography>
            </Box>
            <TextField
              label="Ad duration per play"
              select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {CREATIVE_DURATIONS.map((d) => (
                <MenuItem key={d} value={d}>{d} seconds</MenuItem>
              ))}
            </TextField>
          </Box>
        );

      case 4:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              <DatePicker
                label="Start date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
                minDate={startDate ?? undefined}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TimePicker
                label="Display hours from"
                value={dailyStart}
                onChange={setDailyStart}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TimePicker
                label="Display hours to"
                value={dailyEnd}
                onChange={setDailyEnd}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        );

      case 5:
        return (
          <Box sx={{ pt: 1, display: 'grid', gap: 1 }}>
            <Row label="Regions" value={regions.length > 0 ? regions.join(', ') : '—'} />
            <Row label="Taxis" value={String(taxiCount)} />
            <Row label="Ad duration" value={`${duration} sec`} />
            <Row
              label="Dates"
              value={startDate && endDate ? `${startDate.format('D MMM')} – ${endDate.format('D MMM YYYY')}` : '—'}
            />
            <Row
              label="Daily hours"
              value={dailyStart && dailyEnd ? `${dailyStart.format('HH:mm')} – ${dailyEnd.format('HH:mm')}` : '—'}
            />

            {price ? (
              <>
                {price.regionSurcharge > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'text.secondary' }}>
                    <span>Additional-region surcharge</span>
                    <span>{formatCurrency(price.regionSurcharge)}</span>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <span style={{ fontSize: 14 }}>Total price</span>
                  <Typography sx={{ fontWeight: 800, fontSize: 20, color: 'navy.main' }}>
                    {formatCurrency(price.total)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Quoted by AdzOnRoad at {formatCurrency(price.ratePerTaxiPerSecond)} per taxi per
                  second. Confirmed at submission.
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: 13, color: 'text.secondary', pt: 1 }}>
                Working out the price…
              </Typography>
            )}
          </Box>
        );

      case 6:
        return (
          <Box sx={{ pt: 1, pb: 1, display: 'grid', gap: 1.5, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: '50%', backgroundColor: 'primary.main',
                color: 'navy.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto',
              }}
            >
              <MarkEmailReadRoundedIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Ready to submit</Typography>
            <Typography sx={{ fontSize: 13.5, color: 'text.secondary', maxWidth: 380, mx: 'auto' }}>
              We don't take payment online. Our team reviews the details, confirms screen
              availability, and reaches out to arrange payment and launch.
            </Typography>
            {price && (
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatCurrency(price.total)}</Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 700 }}>Create campaign</DialogTitle>
      <DialogContent>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            pt: 1,
            pb: { xs: 1, sm: 3 },
            // Seven labels across a 375px screen shred into single characters. On a phone the
            // stepper keeps only the dots, and the line below names where you are.
            '@media (max-width:599.95px)': { '& .MuiStepLabel-label': { display: 'none' } },
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Typography
          sx={{
            display: { xs: 'block', sm: 'none' },
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            pb: 2,
          }}
        >
          Step {activeStep + 1} of {STEPS.length} — {STEPS[activeStep]}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
            {problems.length > 0 && <AlertTitle sx={{ fontSize: 13.5 }}>{error}</AlertTitle>}
            {problems.length > 0 ? (
              // Every reason at once, as the server sent them — so it takes one pass to fix
              // rather than one round trip per problem.
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {problems.map((p) => <li key={p}>{p}</li>)}
              </Box>
            ) : error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button disabled={activeStep === 0 || submitting} onClick={() => setActiveStep((s) => s - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={stepIsIncomplete || submitting}
          startIcon={submitting ? <CircularProgress size={15} color="inherit" /> : undefined}
          onClick={() => {
            if (isLast) {
              void submit();
            } else {
              setActiveStep((s) => s + 1);
            }
          }}
        >
          {isLast ? (submitting ? 'Submitting…' : 'Submit for review') : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: 14 }}>
      <span style={{ color: 'rgba(0,0,0,0.6)' }}>{label}</span>
      <b style={{ textAlign: 'right' }}>{value}</b>
    </Box>
  );
}
