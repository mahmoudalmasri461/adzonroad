import { describe, expect, it } from 'vitest';
import {
  describeDue,
  describePosition,
  formatDate,
  formatMoney,
  toneFor,
  type BillingSummary,
  type Invoice,
} from './billing';

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    invoiceId: 'i1',
    number: 'INV-2026-0001',
    description: 'Beirut Summer Push — 10 taxis, 15s',
    campaignId: 'c1',
    amount: 3000,
    currency: 'USD',
    status: 'Open',
    dueDate: '2026-08-27',
    daysUntilDue: 14,
    issuedAtUtc: '2026-08-13T10:00:00Z',
    paidAtUtc: null,
    paymentReference: null,
    ...overrides,
  };
}

function summary(overrides: Partial<BillingSummary> = {}): BillingSummary {
  return {
    outstanding: 0,
    overdueAmount: 0,
    paidThisMonth: 0,
    openCount: 0,
    overdueCount: 0,
    nextDueDate: null,
    currency: 'USD',
    ...overrides,
  };
}

describe('when an invoice is due', () => {
  it('says today rather than in 0 days', () => {
    expect(describeDue(invoice({ daysUntilDue: 0 }))).toBe('Due today');
  });

  it('says tomorrow rather than in 1 days', () => {
    expect(describeDue(invoice({ daysUntilDue: 1 }))).toBe('Due tomorrow');
  });

  it('counts lateness in positive days, the way a person would say it', () => {
    // "-9 days" would make the reader do the arithmetic to learn they are late.
    expect(describeDue(invoice({ daysUntilDue: -9, status: 'Overdue' }))).toBe('9 days late');
  });

  it('says one day late in the singular', () => {
    expect(describeDue(invoice({ daysUntilDue: -1, status: 'Overdue' }))).toBe('1 day late');
  });

  it('reports when a paid invoice was settled rather than when it was due', () => {
    const settled = invoice({ status: 'Paid', paidAtUtc: '2026-08-20T09:00:00Z', daysUntilDue: -30 });

    expect(describeDue(settled)).toContain('Paid');
    expect(describeDue(settled)).not.toContain('late');
  });
});

describe('invoice tone', () => {
  it('marks only overdue as bad', () => {
    expect(toneFor('Overdue')).toBe('bad');
    expect(toneFor('Open')).toBe('info');
  });

  it('treats paid as neutral, not as good news', () => {
    // Settling an invoice is the ordinary end of its life, not an achievement.
    expect(toneFor('Paid')).toBe('neutral');
  });
});

describe('the billing position', () => {
  it('says plainly when nothing is owed', () => {
    expect(describePosition(summary())).toBe('Nothing outstanding.');
  });

  it('reports what is owed and that none of it is late', () => {
    const position = describePosition(summary({ outstanding: 3000, openCount: 1 }));

    expect(position).toContain('$3,000');
    expect(position).toContain('1 invoice');
    expect(position).toContain('Nothing is late');
  });

  it('calls out the overdue portion separately from the total', () => {
    // An advertiser owing $6,000 of which $1,500 is late needs the $1,500 first.
    const position = describePosition(summary({
      outstanding: 6000, openCount: 3, overdueAmount: 1500, overdueCount: 1,
    }));

    expect(position).toContain('$6,000');
    expect(position).toContain('3 invoices');
    expect(position).toContain('$1,500');
    expect(position).toContain('past due');
  });
});

describe('formatting', () => {
  it('renders a bare due date as that calendar day, not as UTC midnight', () => {
    // new Date('2026-08-27') is midnight UTC, which renders as the 26th west of Greenwich.
    expect(formatDate('2026-08-27')).toContain('27');
  });

  it('leaves an unparseable date alone rather than printing Invalid Date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('shows whole dollars, since no invoice is priced in cents', () => {
    expect(formatMoney(3150)).toBe('$3,150');
  });
});
