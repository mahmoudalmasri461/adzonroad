import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import RateCardEditor from '../../components/admin/RateCardEditor';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../contexts/ToastProvider';
import { fetchPricing, type Pricing } from '../../services/admin';
import {
  loadRateCard,
  monthlyDriverPay,
  resetRateCard,
  saveRateCard,
  type RateCard,
} from '../../services/rateCard';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * The rate card: what the server charges, and what the commercial team intends to charge.
 *
 * Two things on one page, kept visibly apart. The top is the live rule the campaign engine bills
 * on, read from the API — still read-only, because pricing is a compile-time constant in
 * `CampaignPricing` and there is no write endpoint to point a field at. Below it are the editable
 * price lists for the three audiences the platform has a commercial relationship with.
 *
 * Those edits are a draft held in this browser. That is stated on the page rather than implied,
 * because the failure mode of pretending otherwise is an administrator raising a rate, seeing it
 * accepted, and finding quotes unchanged with no error to explain it.
 */

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box
      sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
        padding: '14px 0', borderBottom: '1px solid', borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{label}</Typography>
        {note && <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '2px' }}>{note}</Typography>}
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );
}

/** The three published anchors, priced by the same rule the server uses. */
const TIERS = [
  { taxis: 5, seconds: 15 },
  { taxis: 10, seconds: 15 },
  { taxis: 10, seconds: 30 },
];

export default function PricingPage() {
  const { showToast } = useToast();

  const loaded = useAsyncData<Pricing>(
    (signal) => fetchPricing(signal),
    [],
    'The rate card could not be loaded.',
  );

  // `saved` is what is on disk; `card` is what is on screen. Keeping both is what makes "unsaved
  // changes" a fact rather than a guess, and lets Discard put the page back without a reload.
  const [saved, setSaved] = useState<RateCard>(() => loadRateCard());
  const [card, setCard] = useState<RateCard>(saved);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify({ ...card, updatedAtUtc: null }) !== JSON.stringify({ ...saved, updatedAtUtc: null }),
    [card, saved],
  );

  const pricing = loaded.data;
  const featured = card.advertising.filter((offer) => offer.featured).length;
  const monthly = monthlyDriverPay(card.drivers);

  const save = () => {
    try {
      const stamped = saveRateCard(card);
      setSaved(stamped);
      setCard(stamped);
      showToast('Rate card saved as a draft on this device.');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'The draft could not be saved.');
    }
  };

  const discard = () => {
    setCard(saved);
    showToast('Unsaved changes discarded.');
  };

  const reset = () => {
    const fresh = resetRateCard();
    setSaved(fresh);
    setCard(fresh);
    setConfirmingReset(false);
    showToast('Rate card reset to what the platform does today.');
  };

  return (
    <>
      <PageHeader
        title="Pricing"
        subtitle="What the platform charges, what it pays, and where each figure lives."
        actions={
          <>
            <Button
              size="small"
              color="inherit"
              disabled={!dirty}
              onClick={discard}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!dirty}
              onClick={save}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {dirty ? 'Save changes' : 'Saved'}
            </Button>
          </>
        }
      />

      <Alert severity="warning" sx={{ mb: '20px', fontSize: 13 }}>
        <AlertTitle sx={{ fontSize: 13.5, fontWeight: 700 }}>These lists are a draft</AlertTitle>
        Campaign quotes are still calculated from the constant in the API, so editing a price here
        does not change what an advertiser is billed. The draft is stored on this device so the
        commercial figures can be agreed; wiring it to the server is one endpoint away.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(card.advertising.length)} label="Advertising offers" color={tokens.blue} />
        <StatCard value={String(featured)} label="Featured publicly" color={tokens.amber600} />
        <StatCard value={formatCurrency(monthly)} label="Typical driver month" color={tokens.green} />
        <StatCard value={String(card.fleets.length)} label="Fleet bands" />
      </Box>

      <Box sx={{ mb: '20px' }}>
        <RateCardEditor card={card} onChange={setCard} />
      </Box>

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '14px !important',
          backgroundColor: 'background.paper',
          '&::before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: { xs: '16px', sm: '22px' }, minHeight: 60 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
              Live on the server
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>What is actually being charged</Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: { xs: '16px', sm: '22px' }, pt: 0, pb: '22px' }}>
          {loaded.error ? (
            <EmptyState
              title="The live rate card could not be loaded"
              description={loaded.error}
              actionLabel="Try again"
              onAction={loaded.reload}
            />
          ) : loaded.loading || !pricing ? (
            <EmptyState title="Loading the live rate card…" />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: '20px' }}>
              <Card sx={{ p: '20px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: '4px' }}>How a quote is built</Typography>

                <Row
                  label="Base"
                  value={`taxis × seconds × ${formatCurrency(pricing.ratePerTaxiPerSecondUsd)}`}
                  note="Derived from the three published tiers, all of which resolve to exactly this rate."
                />
                <Row
                  label="Regional surcharge"
                  value={`${formatCurrency(pricing.additionalRegionSurchargeUsd)} × (regions − 1)`}
                  note="An implementation choice, not a verified commercial figure — every published anchor is single-region."
                />
                <Row
                  label="Permitted durations"
                  value={pricing.validDurationsSeconds.map((s) => `${s}s`).join(' · ')}
                  note="10 seconds is deliberately not an option."
                />
                <Row label="Payment" value="Bank transfer" note="There is no card, token or payment-method field anywhere in the system." />

                <Box sx={{ mt: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={pricing.editable ? 'Editable' : 'Read-only'}
                    sx={{ fontWeight: 700, fontSize: 11.5, backgroundColor: '#F1F2F6', color: tokens.textMuted }}
                  />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
                    {pricing.source}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" onClick={loaded.reload} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Refresh
                  </Button>
                </Box>
              </Card>

              <Card sx={{ p: '20px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: '4px' }}>The published tiers</Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '6px' }}>
                  Priced here by the same rule the server applies, single-region.
                </Typography>

                {TIERS.map((tier) => (
                  <Row
                    key={`${tier.taxis}-${tier.seconds}`}
                    label={`${tier.taxis} taxis · ${tier.seconds}s`}
                    value={formatCurrency(tier.taxis * tier.seconds * pricing.ratePerTaxiPerSecondUsd)}
                  />
                ))}

                <Alert severity="warning" sx={{ mt: '14px', fontSize: 12.5 }}>
                  The {formatCurrency(pricing.additionalRegionSurchargeUsd)} regional surcharge is an
                  assumption held in one named constant. It is being invoiced on. Confirm it against
                  a real commercial figure.
                </Alert>
              </Card>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', mt: '20px' }}>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {saved.updatedAtUtc
            ? `Draft last saved ${new Date(saved.updatedAtUtc).toLocaleString()}.`
            : 'No draft saved yet — these are the figures the platform uses today.'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          color="inherit"
          onClick={() => setConfirmingReset(true)}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Reset to platform defaults
        </Button>
      </Box>

      <ConfirmationDialog
        open={confirmingReset}
        title="Reset the rate card?"
        description="The saved draft is discarded and every list goes back to what the platform charges and pays today. This cannot be undone."
        confirmLabel="Reset"
        destructive
        onConfirm={reset}
        onCancel={() => setConfirmingReset(false)}
      />
    </>
  );
}
