import { describe, expect, it } from 'vitest';
import { invoiceLedgerCsv, platformDeliveryCsv, vehicleInventoryCsv } from './adminReports';
import type { AdminInvoice, AdminVehicle, DeliverySummaryRow } from './admin';

const lines = (csv: string) => csv.replace('﻿', '').split('\r\n');

describe('platform delivery export', () => {
  const row = (over: Partial<DeliverySummaryRow>): DeliverySummaryRow => ({
    campaignId: 'c1', verifiedPlays: 12, verifiedSeconds: 180,
    pendingPlays: 3, conflictPlays: 1, screens: 2, hours: 5,
    ...over,
  });

  it('resolves the campaign id to a name and carries the advertiser', () => {
    const csv = platformDeliveryCsv(
      [row({})],
      new Map([['c1', { name: 'Zahle Market Day', advertiser: 'Cedar Retail' }]]),
    );

    expect(lines(csv)[1]).toBe('Zahle Market Day,Cedar Retail,c1,12,180,3,1,2,5');
  });

  /**
   * A rollup can outlive the campaign list the page happened to load. Dropping the row would
   * silently undercount delivery in an export somebody reconciles against an invoice.
   */
  it('keeps a row whose campaign it cannot name', () => {
    const csv = platformDeliveryCsv([row({ campaignId: 'ghost' })], new Map());

    expect(lines(csv)[1]).toContain('Unknown campaign');
    expect(lines(csv)[1]).toContain('ghost');
  });

  it('quotes a campaign name containing a comma rather than splitting the row', () => {
    const csv = platformDeliveryCsv(
      [row({})],
      new Map([['c1', { name: 'Beirut, Sidon and Tyre', advertiser: null }]]),
    );

    expect(lines(csv)[1]).toContain('"Beirut, Sidon and Tyre"');
    expect(lines(csv)).toHaveLength(2);
  });
});

describe('invoice ledger export', () => {
  const invoice: AdminInvoice = {
    invoiceId: 'i1', number: 'INV-0001', description: 'Zahle Market Day',
    advertiserId: 'a1', advertiserName: 'Cedar Retail', campaignId: 'c1',
    amount: 1300, currency: 'USD', status: 'Overdue', dueDate: '2026-08-01',
    daysUntilDue: -12, issuedAtUtc: '2026-07-02T09:30:00Z', paidAtUtc: null,
    paymentReference: null,
  };

  it('writes an unpaid invoice with empty cells rather than the word null', () => {
    const csv = invoiceLedgerCsv([invoice]);

    expect(lines(csv)[1]).toBe('INV-0001,Cedar Retail,Zahle Market Day,1300,USD,Overdue,2026-08-01,2026-07-02,,');
  });

  it('reduces a paid timestamp to the day it arrived', () => {
    const csv = invoiceLedgerCsv([{ ...invoice, status: 'Paid', paidAtUtc: '2026-08-14T16:02:11Z' }]);

    expect(lines(csv)[1]).toContain('2026-08-14');
    expect(lines(csv)[1]).not.toContain('16:02');
  });
});

describe('vehicle inventory export', () => {
  const vehicle: AdminVehicle = {
    vehicleId: 'v1', plateNumber: '123456', plateCharacter: 'B', plateCategory: 'Public',
    carType: 'Sedan', model: 'Corolla', year: 2019,
    taxiCompanyId: null, taxiCompanyName: null,
    driverId: 'd1', driverName: 'Elie Haddad', driverStatus: 'Approved',
    region: 'Beirut', screenSerial: null, screenStatus: null,
    lastFixAtUtc: null, createdAtUtc: '2026-08-01T00:00:00Z',
  };

  /**
   * An empty cell reads as missing data. "Not fitted" and "never" are facts, and the whole point
   * of this file is that somebody can act on it without asking what a blank meant.
   */
  it('states an absence rather than leaving it blank', () => {
    const csv = vehicleInventoryCsv([vehicle]);

    expect(lines(csv)[1]).toContain('Not fitted');
    expect(lines(csv)[1]).toContain('never');
    expect(lines(csv)[1]).toContain('Independent');
  });

  it('carries the screen serial through when one is fitted', () => {
    const csv = vehicleInventoryCsv([{ ...vehicle, screenSerial: 'AZR-2291' }]);

    expect(lines(csv)[1]).toContain('AZR-2291');
    expect(lines(csv)[1]).not.toContain('Not fitted');
  });
});
