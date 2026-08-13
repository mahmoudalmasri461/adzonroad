import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import EmptyState from '../../components/advertiser/EmptyState';
import { InvoiceRow, useBilling } from '../../components/advertiser/BillingCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';
import { formatDate, formatMoney } from '../../services/billing';

/**
 * Every invoice, and the position they add up to.
 *
 * The four tiles are counts and sums over the invoices below them, so the headline and the list
 * cannot disagree. There is deliberately no "available credit" tile: the product has no credit
 * facility, no limit, and nothing that could compute one — a number there would read as a spending
 * allowance that does not exist.
 */
export default function BillingPage() {
  const { summary, invoices, state } = useBilling();

  return (
    <AdvertiserLayout title="Billing">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>
          Billing
        </Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          An invoice is raised when a campaign is approved. Payments are settled offline by bank transfer.
        </Typography>
      </Box>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '48px' }}>
          <CircularProgress size={22} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your billing details.</Alert>
      )}

      {state === 'ready' && summary && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: '14px', mb: '24px' }}>
            <Tile label="Outstanding" value={formatMoney(summary.outstanding, summary.currency)} />
            <Tile
              label="Overdue"
              value={formatMoney(summary.overdueAmount, summary.currency)}
              emphasis={summary.overdueAmount > 0 ? advTokens.red : undefined}
            />
            <Tile label="Paid this month" value={formatMoney(summary.paidThisMonth, summary.currency)} />
            <Tile
              label="Next due"
              value={summary.nextDueDate ? formatDate(summary.nextDueDate) : '—'}
            />
          </Box>

          <Box sx={{ ...cardSx, padding: '20px' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '4px' }}>
              All invoices
            </Typography>
            <Typography sx={{ fontSize: 12, color: advTokens.textMuted, mb: '14px' }}>
              {invoices.length === 0
                ? 'Nothing has been invoiced yet.'
                : `${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}, newest first.`}
            </Typography>

            {invoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="Create a campaign and submit it for review — an invoice follows approval."
              />
            ) : (
              <Box sx={{ display: 'grid', gap: '4px' }}>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.invoiceId} invoice={invoice} />
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
    </AdvertiserLayout>
  );
}

function Tile({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return (
    <Box sx={{ ...cardSx, padding: '18px' }}>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: emphasis ?? advTokens.text }}>
        {value}
      </Typography>
      <Typography sx={{ mt: '4px', fontSize: 11.5, fontWeight: 600, color: advTokens.textMuted }}>
        {label}
      </Typography>
    </Box>
  );
}
