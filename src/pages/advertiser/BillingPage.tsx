import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import BillingCard from '../../components/advertiser/BillingCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { formatCurrency } from '../../utils/format';
import { BILLING_SUMMARY } from '../../data/advertiserMockData';

const SUMMARY_TILES = [
  { label: 'Current balance', value: formatCurrency(BILLING_SUMMARY.currentBalance) },
  { label: 'Monthly spend', value: formatCurrency(BILLING_SUMMARY.monthlySpend) },
  { label: 'Open invoices', value: String(BILLING_SUMMARY.openInvoicesCount) },
  { label: 'Available credit', value: formatCurrency(BILLING_SUMMARY.availableCredit) },
];

export default function BillingPage() {
  return (
    <AdvertiserLayout title="Billing">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Billing</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Invoices and account balance. Payments are settled offline by bank transfer.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '14px', mb: '24px' }}>
        {SUMMARY_TILES.map((tile) => (
          <Box key={tile.label} sx={{ ...cardSx, padding: '18px' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: advTokens.text }}>{tile.value}</Typography>
            <Typography sx={{ mt: '4px', fontSize: 11.5, fontWeight: 600, color: advTokens.textMuted }}>{tile.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ maxWidth: 640 }}>
        <BillingCard />
      </Box>
    </AdvertiserLayout>
  );
}
