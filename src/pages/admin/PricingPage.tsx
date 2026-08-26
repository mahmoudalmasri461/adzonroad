import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchPricing, type Pricing } from '../../services/admin';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * The rate card, read from the server that charges it.
 *
 * Read-only, and it says so. Pricing lives in a constant in the API, so a screen offering an
 * editable field would describe a capability the system does not have — the first administrator
 * to press Save would find quotes unchanged and no error to explain it. Showing the real figures
 * with the reason they cannot be edited here is the honest version of this page.
 *
 * It fetches rather than reading the frontend's own pricing module, which exists for the campaign
 * wizard's live estimate. Two copies of a rate is two rates the moment one of them moves.
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
  const loaded = useAsyncData<Pricing>(
    (signal) => fetchPricing(signal),
    [],
    'The rate card could not be loaded.',
  );

  const pricing = loaded.data;

  return (
    <>
      <PageHeader title="Pricing" subtitle="What the platform charges, and where the figures live." />

      <Alert severity="info" sx={{ mb: '20px', fontSize: 13 }}>
        These are read from the API, not from a copy held in the browser. They cannot be edited
        here: pricing is a constant in the server, so changing it is a deployment rather than a
        setting.
      </Alert>

      {loaded.error ? (
        <Card sx={{ p: 0 }}>
          <EmptyState
            title="The rate card could not be loaded"
            description={loaded.error}
            actionLabel="Try again"
            onAction={loaded.reload}
          />
        </Card>
      ) : loaded.loading || !pricing ? (
        <Card sx={{ p: 0 }}>
          <EmptyState title="Loading the rate card…" />
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', mb: '20px' }}>
            <StatCard
              value={`${formatCurrency(pricing.ratePerTaxiPerSecondUsd)}`}
              label="Per taxi, per second"
              color={tokens.green}
            />
            <StatCard
              value={formatCurrency(pricing.additionalRegionSurchargeUsd)}
              label="Per extra region"
              color={tokens.warn}
            />
            <StatCard value={String(pricing.validDurationsSeconds.length)} label="Permitted durations" />
            <StatCard value={pricing.currency} label="Currency" />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: '20px' }}>
            <Card sx={{ p: '22px' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                The rule
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '8px' }}>How a quote is built</Typography>

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

            <Card sx={{ p: '22px' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                Worked through
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '8px' }}>The published tiers</Typography>
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
                assumption held in one named constant. It is being invoiced on. Confirm it against a
                real commercial figure.
              </Alert>
            </Card>
          </Box>
        </>
      )}
    </>
  );
}
