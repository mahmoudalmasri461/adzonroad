import { apiGet } from './apiClient';

/**
 * Invoices, and what the advertiser owes.
 *
 * Read-only on purpose. There is no card on file, no payment endpoint, and nothing here that moves
 * money — invoices are settled offline by bank transfer. A "pay now" button would be a lie about
 * what the platform can do.
 *
 * Overdue is a status the server derives from the due date; the client never re-derives it, so the
 * two cannot disagree about whether somebody is late.
 */

export type InvoiceStatus = 'Open' | 'Paid' | 'Overdue';

export interface Invoice {
  invoiceId: string;
  number: string;
  description: string;
  campaignId: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  /** Signed: positive is days remaining, negative is days late. */
  daysUntilDue: number;
  issuedAtUtc: string;
  paidAtUtc: string | null;
  paymentReference: string | null;
}

export interface BillingSummary {
  outstanding: number;
  overdueAmount: number;
  paidThisMonth: number;
  openCount: number;
  overdueCount: number;
  nextDueDate: string | null;
  currency: string;
}

export function fetchInvoices(signal?: AbortSignal): Promise<Invoice[]> {
  return apiGet<Invoice[]>('/api/v1/billing/invoices', undefined, signal);
}

export function fetchBillingSummary(signal?: AbortSignal): Promise<BillingSummary> {
  return apiGet<BillingSummary>('/api/v1/billing/summary', undefined, signal);
}

// ---------------------------------------------------------------------------- presentation

/**
 * How urgent an invoice is, for colour.
 *
 * Paid is deliberately neutral rather than green: green reads as "good news", and an invoice being
 * settled is simply the ordinary end of its life, not an achievement to celebrate.
 */
export function toneFor(status: InvoiceStatus): 'neutral' | 'info' | 'bad' {
  if (status === 'Overdue') return 'bad';
  if (status === 'Open') return 'info';
  return 'neutral';
}

/**
 * When an invoice needs paying, in words.
 *
 * Says "today" rather than "in 0 days", and counts lateness in positive days — "9 days late" is
 * how a person would say it, where "-9 days" makes the reader do the arithmetic.
 */
export function describeDue(invoice: Invoice): string {
  if (invoice.status === 'Paid') {
    return invoice.paidAtUtc ? `Paid ${formatDate(invoice.paidAtUtc)}` : 'Paid';
  }

  const days = invoice.daysUntilDue;

  if (days < 0) return `${Math.abs(days)} ${plural(Math.abs(days), 'day')} late`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';

  return `Due in ${days} days`;
}

/**
 * The single line that answers "do I owe anything".
 *
 * Overdue is called out separately rather than folded into the total, because an advertiser who
 * owes $6,000 of which $1,500 is late needs to know about the $1,500 first.
 */
export function describePosition(summary: BillingSummary): string {
  if (summary.openCount === 0) return 'Nothing outstanding.';

  const owed = `${formatMoney(summary.outstanding, summary.currency)} across `
    + `${summary.openCount} ${plural(summary.openCount, 'invoice')}`;

  if (summary.overdueCount === 0) return `${owed}. Nothing is late.`;

  return `${owed}, of which ${formatMoney(summary.overdueAmount, summary.currency)} `
    + `${summary.overdueCount === 1 ? 'is' : 'are'} past due.`;
}

export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats either a full timestamp or a bare `YYYY-MM-DD`.
 *
 * The bare form is read as a local date rather than UTC midnight. `new Date('2026-08-27')` is
 * midnight UTC, which renders as the 26th anywhere west of Greenwich — a due date that silently
 * moves a day earlier depending on where the reader sits.
 */
export function formatDate(value: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
