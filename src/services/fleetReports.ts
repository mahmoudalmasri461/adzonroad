import { gpsLabel, type FleetDriverEarnings, type FleetScreen, type FleetVehicle } from './fleet';

/**
 * Fleet reports, generated in the browser from data already on screen.
 *
 * The portal previously listed five named statements — "Fleet Earnings Statement — July 2026" and
 * friends — behind a Download button that only raised a toast. Nothing was ever generated. These
 * produce real files from real rows, so a report either exists or the list says it does not.
 */

/** RFC 4180: quote everything containing a comma, quote or newline, and double any quotes. */
function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // A leading BOM, so Excel opens UTF-8 correctly instead of mangling accented names.
  return '﻿' + [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export function vehicleActivityCsv(vehicles: FleetVehicle[]): string {
  return toCsv(
    [
      'Plate',
      'Category',
      'Model',
      'Year',
      'Status',
      'GPS',
      'Screen',
      'Screen status',
      'Driver',
      'Current campaign',
      'Driving hours today',
      'Verified screen hours today',
      'Distance km today',
      'Last position (UTC)',
    ],
    vehicles.map((v) => [
      v.plateNumber,
      v.plateCategory,
      v.model,
      v.year || '',
      v.status,
      gpsLabel(v),
      v.screenSerialNumber ?? 'Not fitted',
      v.screenStatus ?? '',
      v.driverName ?? '',
      v.currentCampaign ?? '',
      v.drivingHoursToday,
      v.screenTimeHoursToday,
      v.distanceKmToday,
      v.positionCapturedAtUtc ?? '',
    ]),
  );
}

export function driverEarningsCsv(rows: FleetDriverEarnings[]): string {
  return toCsv(
    ['Driver', 'Shifts', 'Active hours', 'Generated (USD)'],
    rows.map((d) => [d.driverName, d.shiftCount, d.activeHours, d.total.toFixed(2)]),
  );
}

export function screenUptimeCsv(screens: FleetScreen[]): string {
  return toCsv(
    ['Screen', 'Vehicle', 'Status', 'Network', 'Last check-in (UTC)', 'Battery %', 'Firmware'],
    screens.map((s) => [
      s.serialNumber,
      s.vehiclePlate,
      s.status,
      s.networkStatus,
      s.lastHeartbeatAtUtc ?? '',
      s.lastBatteryLevel ?? '',
      s.firmwareVersion ?? '',
    ]),
  );
}

export const vehicleActivityFilename = () => `fleet-vehicle-activity-${today()}.csv`;
export const driverEarningsFilename = () => `fleet-driver-earnings-${today()}.csv`;
export const screenUptimeFilename = () => `fleet-screen-uptime-${today()}.csv`;
