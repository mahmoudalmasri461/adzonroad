import { describe, expect, it } from 'vitest';
import {
  describeRecording,
  distanceToday,
  formatHours,
  greeting,
  hoursToday,
  type DeviceStatus,
  type ShiftSummary,
} from './driver';

function device(over: Partial<DeviceStatus> = {}): DeviceStatus {
  return {
    driverId: 'd1', shiftId: 's1', connectivity: 'Healthy', gpsFreshness: 'Fresh',
    syncHealth: 'Healthy', canPresentAsLive: true,
    lastHeartbeatAtUtc: '2026-08-12T12:00:00Z', lastFixCapturedAtUtc: '2026-08-12T11:59:55Z',
    pendingTelemetryCount: 0, batteryLevel: 72, networkType: 'cellular', clockSkewMs: 0,
    ...over,
  };
}

function shift(over: Partial<ShiftSummary> = {}): ShiftSummary {
  return {
    shiftId: 's1', startedAtUtc: new Date().toISOString(), endedAtUtc: null,
    totalDistanceKm: 12.5, activeHours: 3.5, premiumAreaCovered: false,
    status: 'Active', earningsTotal: 32.1, ...over,
  };
}

describe('what the driver is told about recording', () => {
  it('says everything is up to date when it is', () => {
    const { headline, tone } = describeRecording(device());

    expect(headline).toBe('Recording and up to date');
    expect(tone).toBe('good');
  });

  it('separates "not uploading" from "not recording" when offline', () => {
    // The distinction the whole local-first design exists to make. Telling a driver their work
    // is not being recorded would invite them to worry, or to stop driving.
    const { headline, detail, tone } = describeRecording(
      device({ connectivity: 'Offline', pendingTelemetryCount: 40 }));

    expect(headline).toBe('Recording, not uploading');
    expect(detail).toContain('40 readings saved on your phone');
    expect(tone).toBe('warn');
  });

  it('reassures even when nothing is queued yet on a lost connection', () => {
    const { detail } = describeRecording(device({ connectivity: 'Offline', pendingTelemetryCount: 0 }));

    expect(detail).toContain('saving everything');
  });

  it('reports a backlog that is draining as catching up, not as a failure', () => {
    const { headline, tone } = describeRecording(device({ pendingTelemetryCount: 120 }));

    expect(headline).toBe('Catching up');
    expect(tone).toBe('warn');
  });

  it('says no shift is running rather than implying a problem', () => {
    const { headline, tone } = describeRecording(device({ shiftId: null }));

    expect(headline).toBe('No shift running');
    expect(tone).toBe('idle');
  });

  it('treats an unreachable status the same as no shift, not as an error', () => {
    expect(describeRecording(null).tone).toBe('idle');
  });
});

describe('today', () => {
  it('counts only shifts that started today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const shifts = [
      shift({ activeHours: 3, totalDistanceKm: 20 }),
      shift({ shiftId: 's2', activeHours: 2, totalDistanceKm: 10 }),
      shift({ shiftId: 's3', activeHours: 9, totalDistanceKm: 90, startedAtUtc: yesterday.toISOString() }),
    ];

    expect(hoursToday(shifts)).toBe(5);
    expect(distanceToday(shifts)).toBe(30);
  });

  it('is zero when nothing has been recorded today', () => {
    expect(hoursToday([])).toBe(0);
    expect(distanceToday([])).toBe(0);
  });
});

describe('formatting', () => {
  it('reads in minutes below an hour and hours above', () => {
    expect(formatHours(0.5)).toBe('30 min');
    expect(formatHours(3)).toBe('3 hrs');
    expect(formatHours(3.5)).toBe('3h 30m');
  });

  it('greets by the time of day, so 3am does not say good afternoon', () => {
    expect(greeting(new Date('2026-08-12T03:00:00'))).toBe('Good morning');
    expect(greeting(new Date('2026-08-12T14:00:00'))).toBe('Good afternoon');
    expect(greeting(new Date('2026-08-12T21:00:00'))).toBe('Good evening');
  });
});
