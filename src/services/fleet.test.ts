import { describe, expect, it } from 'vitest';
import { gpsLabel, needsAttention, positionAge, type FleetVehicle } from './fleet';

const NOW = new Date('2026-08-20T12:00:00Z');

function vehicle(overrides: Partial<FleetVehicle> = {}): FleetVehicle {
  return {
    id: 'v1',
    plateNumber: '482913',
    plateCharacter: '',
    plateCategory: 'Public (Taxi — Red)',
    carType: 'Sedan',
    model: 'Kia Optima',
    year: 2020,
    status: 'Active',
    gpsStatus: 'Connected',
    screenId: 's1',
    screenSerialNumber: 'AZR-1001',
    screenStatus: 'Online',
    driverId: 'd1',
    driverName: 'Ali A',
    currentCampaign: null,
    drivingHoursToday: 0,
    distanceKmToday: 0,
    screenTimeHoursToday: 0,
    lat: 33.88,
    lng: 35.5,
    positionCapturedAtUtc: NOW.toISOString(),
    ...overrides,
  };
}

describe('how old a position is', () => {
  it('says so plainly when a vehicle has never reported', () => {
    // Not "0 min ago", which would read as a fresh fix at the map centre.
    expect(positionAge(null, NOW)).toBe('never reported');
  });

  it('reads as current within the minute', () => {
    expect(positionAge('2026-08-20T11:59:30Z', NOW)).toBe('just now');
  });

  it('counts minutes, then hours, then days', () => {
    expect(positionAge('2026-08-20T11:30:00Z', NOW)).toBe('30 min ago');
    expect(positionAge('2026-08-20T09:00:00Z', NOW)).toBe('3 h ago');
    expect(positionAge('2026-08-18T12:00:00Z', NOW)).toBe('2 d ago');
  });

  it('does not report a negative age when a device clock runs ahead', () => {
    // Clock drift, not a time machine. "in 5 minutes" would be alarming and wrong.
    expect(positionAge('2026-08-20T12:05:00Z', NOW)).toBe('just now');
  });
});

describe('which vehicles need attention', () => {
  it('flags a car that should be reporting and is not', () => {
    expect(needsAttention(vehicle({ status: 'Offline' }))).toBe(true);
  });

  it('flags a car under maintenance', () => {
    expect(needsAttention(vehicle({ status: 'Maintenance' }))).toBe(true);
  });

  it('leaves a parked car alone', () => {
    // The distinction that matters: nobody should ring a driver who has finished their shift.
    expect(needsAttention(vehicle({ status: 'Idle' }))).toBe(false);
  });

  it('leaves a car awaiting hardware alone', () => {
    expect(needsAttention(vehicle({ status: 'Not Fitted', screenId: null }))).toBe(false);
  });

  it('does not flag a working car', () => {
    expect(needsAttention(vehicle({ status: 'Active' }))).toBe(false);
  });
});

describe('how GPS reads on the vehicle row', () => {
  it('calls it "No device" when no screen is installed', () => {
    // The server derives GPS from the age of the last fix, so an unfitted car comes back "Lost".
    // Rendering that verbatim puts a red fault marker on a car that has nothing to lose a
    // signal with — and buries the cars that are genuinely out working and untracked.
    expect(gpsLabel(vehicle({ screenId: null, gpsStatus: 'Lost' }))).toBe('No device');
  });

  it('reports the real status once a screen is fitted', () => {
    expect(gpsLabel(vehicle({ screenId: 's1', gpsStatus: 'Lost' }))).toBe('Lost');
    expect(gpsLabel(vehicle({ screenId: 's1', gpsStatus: 'Connected' }))).toBe('Connected');
  });
});
