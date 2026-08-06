import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { advTokens, cardSx } from './theme';
import { useToast } from '../../contexts/ToastProvider';
import { formatCurrency } from '../../utils/format';
import { BILLING_SUMMARY, INVOICES } from '../../data/advertiserMockData';

const INVOICE_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  Paid: { color: advTokens.green, bg: '#E9F9EF' },
  Open: { color: advTokens.blue, bg: '#EAF0FE' },
  Overdue: { color: advTokens.red, bg: '#FDECEC' },
};

export default function BillingCard() {
  const { showToast } = useToast();

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Account
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Billing</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '16px' }}>
        <Box sx={{ padding: '12px', borderRadius: '10px', backgroundColor: advTokens.bg }}>
          <Typography sx={{ fontSize: 11, color: advTokens.textMuted, fontWeight: 600 }}>Current balance</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: advTokens.text }}>{formatCurrency(BILLING_SUMMARY.currentBalance)}</Typography>
        </Box>
        <Box sx={{ padding: '12px', borderRadius: '10px', backgroundColor: advTokens.bg }}>
          <Typography sx={{ fontSize: 11, color: advTokens.textMuted, fontWeight: 600 }}>Monthly spend</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: advTokens.text }}>{formatCurrency(BILLING_SUMMARY.monthlySpend)}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${advTokens.border}`, mb: '16px' }}>
        <ReceiptLongIcon sx={{ fontSize: 20, color: advTokens.textMuted }} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>Next invoice due {BILLING_SUMMARY.nextInvoiceDate}</Typography>
          <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>Invoices are settled offline by bank transfer — no card on file.</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 12, fontWeight: 700, color: advTokens.textMuted, mb: '8px' }}>Invoices</Typography>
      <Box sx={{ display: 'grid', gap: '4px', mb: '16px' }}>
        {INVOICES.map((inv) => {
          const style = INVOICE_STATUS_COLOR[inv.status];
          return (
            <Box key={inv.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: `1px solid ${advTokens.border}` }}>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: advTokens.text }}>{inv.number}</Typography>
                <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>Due {inv.dueDate}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: advTokens.text }}>{formatCurrency(inv.amount)}</Typography>
                <Box sx={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: style.color, backgroundColor: style.bg }}>
                  {inv.status}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Button
        fullWidth
        onClick={() => showToast('Full billing history isn\'t built in this preview yet')}
        sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
      >
        View all invoices
      </Button>
    </Box>
  );
}
