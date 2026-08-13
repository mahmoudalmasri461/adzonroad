import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import {
  describeDue,
  describePosition,
  fetchBillingSummary,
  fetchInvoices,
  formatMoney,
  toneFor,
  type BillingSummary,
  type Invoice,
  type InvoiceStatus,
} from '../../services/billing';

const TONE_STYLE: Record<'neutral' | 'info' | 'bad', { color: string; bg: string }> = {
  neutral: { color: advTokens.textMuted, bg: '#F1F1F0' },
  info: { color: advTokens.blue, bg: '#EAF0FE' },
  bad: { color: advTokens.red, bg: '#FDECEC' },
};

/**
 * The advertiser's billing position and their most recent invoices.
 *
 * There is no "pay now" control and no card summary, because the platform does not collect payment
 * online — invoices are settled by bank transfer. A payment button that only showed instructions
 * would be worse than the sentence saying so.
 */
export default function BillingCard({ limit = 5 }: { limit?: number }) {
  const { summary, invoices, state } = useBilling();

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        Account
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Billing</Typography>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '28px' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {state === 'error' && (
        <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your billing details.</Alert>
      )}

      {state === 'ready' && summary && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '16px' }}>
            <Tile label="Outstanding" value={formatMoney(summary.outstanding, summary.currency)} />
            <Tile label="Paid this month" value={formatMoney(summary.paidThisMonth, summary.currency)} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${advTokens.border}`, mb: '16px' }}>
            <ReceiptLongIcon sx={{ fontSize: 20, color: advTokens.textMuted, mt: '1px' }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: advTokens.text }}>
                {describePosition(summary)}
              </Typography>
              <Typography sx={{ fontSize: 11, color: advTokens.textMuted }}>
                Settled offline by bank transfer — no card on file.
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: 12, fontWeight: 700, color: advTokens.textMuted, mb: '8px' }}>
            Invoices
          </Typography>

          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="An invoice is raised when a campaign is approved."
            />
          ) : (
            <Box sx={{ display: 'grid', gap: '4px' }}>
              {invoices.slice(0, limit).map((invoice) => (
                <InvoiceRow key={invoice.invoiceId} invoice={invoice} />
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 4px',
        borderBottom: `1px solid ${advTokens.border}`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: advTokens.text }}>
          {invoice.number}
        </Typography>
        <Typography sx={{ fontSize: 11, color: advTokens.textMuted }} noWrap>
          {invoice.description}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: advTokens.text }}>
            {formatMoney(invoice.amount, invoice.currency)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: advTokens.textMuted }}>
            {describeDue(invoice)}
          </Typography>
        </Box>
        <StatusChip status={invoice.status} />
      </Box>
    </Box>
  );
}

export function StatusChip({ status }: { status: InvoiceStatus }) {
  const style = TONE_STYLE[toneFor(status)];

  return (
    <Box sx={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: style.color, backgroundColor: style.bg, whiteSpace: 'nowrap' }}>
      {status}
    </Box>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ padding: '12px', borderRadius: '10px', backgroundColor: advTokens.bg }}>
      <Typography sx={{ fontSize: 11, color: advTokens.textMuted, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: advTokens.text }}>{value}</Typography>
    </Box>
  );
}

/**
 * Summary and invoices together, so the card never renders a total from one request beside a list
 * from another that failed.
 */
export function useBilling() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchBillingSummary(controller.signal),
      fetchInvoices(controller.signal),
    ])
      .then(([loadedSummary, loadedInvoices]) => {
        if (controller.signal.aborted) return;
        setSummary(loadedSummary);
        setInvoices(loadedInvoices);
        setState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });

    return () => controller.abort();
  }, []);

  return { summary, invoices, state };
}
