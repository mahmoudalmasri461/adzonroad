import { describe, expect, it } from 'vitest';
import { driverEarningsCsv, toCsv, vehicleActivityCsv } from './fleetReports';
import type { FleetVehicle } from './fleet';

describe('CSV escaping', () => {
  it('quotes a field containing a comma', () => {
    // "Cedar Taxi, Beirut" split across two columns would silently shift every later column.
    expect(toCsv(['a'], [['Cedar Taxi, Beirut']])).toContain('"Cedar Taxi, Beirut"');
  });

  it('doubles embedded quotes', () => {
    expect(toCsv(['a'], [['He said "hello"']])).toContain('"He said ""hello"""');
  });

  it('quotes a field containing a newline', () => {
    expect(toCsv(['a'], [['line one\nline two']])).toContain('"line one\nline two"');
  });

  it('writes empty cells for null and undefined rather than the words', () => {
    const csv = toCsv(['a', 'b'], [[null, undefined]]);
    expect(csv.split('\r\n')[1]).toBe(',');
  });

  it('starts with a BOM so Excel reads UTF-8 correctly', () => {
    expect(toCsv(['a'], [['é']]).charCodeAt(0)).toBe(0xfeff);
  });

  it('separates rows with CRLF', () => {
    expect(toCsv(['a'], [['1'], ['2']])).toBe('﻿a\r\n1\r\n2');
  });
});

describe('vehicle activity export', () => {
  const vehicle: FleetVehicle = {
    id: 'v1',
    plateNumber: '482913',
    plateCharacter: 'B',
    plateCategory: 'Public (Taxi — Red)',
    carType: 'Sedan',
    model: 'Kia Optima',
    year: 2020,
    status: 'Not Fitted',
    gpsStatus: 'Lost',
    screenId: null,
    screenSerialNumber: null,
    screenStatus: null,
    driverId: null,
    driverName: null,
    currentCampaign: null,
    drivingHoursToday: 0,
    distanceKmToday: 0,
    screenTimeHoursToday: 0,
    lat: null,
    lng: null,
    positionCapturedAtUtc: null,
  };

  it('says a vehicle has no screen rather than leaving the cell blank', () => {
    // A blank reads as missing data; "Not fitted" is the actual state.
    expect(vehicleActivityCsv([vehicle])).toContain('Not fitted');
  });

  it('always emits a header row even with no vehicles', () => {
    expect(vehicleActivityCsv([]).split('\r\n')).toHaveLength(1);
  });
});

describe('driver earnings export', () => {
  it('writes money to two decimal places', () => {
    const csv = driverEarningsCsv([
      { driverId: 'd1', driverName: 'Ali A', shiftCount: 3, activeHours: 12.5, total: 91.5 },
    ]);

    expect(csv).toContain('91.50');
  });
});
