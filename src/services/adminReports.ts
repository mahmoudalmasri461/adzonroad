import { toCsv } from './fleetReports';
import type { AdminInvoice, AdminVehicle, DeliverySummaryRow } from './admin';
import { ownerOf, plateOf } from './admin';

/**
 * Operator reports, generated from rows already on the page.
 *
 * The same rule the fleet portal follows: a report either produces a real file from real data at
 * the moment of download, or the page says it does not exist. Nothing here is scheduled, emailed
 * or stored — a report is a view of the present, and calling it anything more would be a promise
 * about durability that nothing keeps.
 *
 * Days are UTC throughout, matching the buckets these are summed from. A Beirut reader sees
 * boundary hours fall on the neighbouring day; that is stated on the page rather than silently
 * shifted, because shifting it here would disagree with the invoices.
 */

/** Campaign delivery across the platform, verified against GPS and stated as such. */
export function platformDeliveryCsv(
  rows: DeliverySummaryRow[],
  names: Map<string, { name: string; advertiser: string | null }>,
): string {
  return toCsv(
    [
      'Campaign', 'Advertiser', 'Campaign ID', 'Verified plays', 'Verified seconds',
      'Pending plays', 'Conflicted plays', 'Screens', 'Hours with delivery',
    ],
    rows.map((row) => {
      const known = names.get(row.campaignId);
      return [
        known?.name ?? 'Unknown campaign',
        known?.advertiser ?? '',
        row.campaignId,
        row.verifiedPlays,
        row.verifiedSeconds,
        row.pendingPlays,
        row.conflictPlays,
        row.screens,
        row.hours,
      ];
    }),
  );
}

/** The ledger as a file, for whoever reconciles the bank statement. */
export function invoiceLedgerCsv(invoices: AdminInvoice[]): string {
  return toCsv(
    ['Invoice', 'Advertiser', 'Description', 'Amount', 'Currency', 'Status', 'Due', 'Issued', 'Paid', 'Reference'],
    invoices.map((invoice) => [
      invoice.number,
      invoice.advertiserName,
      invoice.description,
      invoice.amount,
      invoice.currency,
      invoice.status,
      invoice.dueDate,
      invoice.issuedAtUtc.slice(0, 10),
      invoice.paidAtUtc?.slice(0, 10) ?? '',
      invoice.paymentReference ?? '',
    ]),
  );
}

/** The fleet as it stands: who owns what, who drives it, and whether it carries a screen. */
export function vehicleInventoryCsv(vehicles: AdminVehicle[]): string {
  return toCsv(
    ['Plate', 'Car', 'Year', 'Owner', 'Driver', 'Driver status', 'Region', 'Screen', 'Last position'],
    vehicles.map((vehicle) => [
      plateOf(vehicle),
      [vehicle.carType, vehicle.model].filter(Boolean).join(' '),
      vehicle.year || '',
      ownerOf(vehicle),
      vehicle.driverName?.trim() ?? '',
      vehicle.driverStatus ?? '',
      vehicle.region ?? '',
      // "Not fitted" rather than blank: an empty cell reads as missing data, and this is a fact.
      vehicle.screenSerial ?? 'Not fitted',
      vehicle.lastFixAtUtc ?? 'never',
    ]),
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export const platformDeliveryFilename = () => `platform-delivery-${today()}.csv`;
export const invoiceLedgerFilename = () => `platform-invoices-${today()}.csv`;
export const vehicleInventoryFilename = () => `platform-vehicles-${today()}.csv`;
