import type { DriverStatusChip, VehicleInfoRow, DriverShiftMock } from '../types/driver';

export const STATUS_CHIPS: DriverStatusChip[] = [
  { label: 'Online', pulse: true },
  { label: 'GPS active' },
  { label: 'Screen active' },
];

export const VEHICLE_INFO: VehicleInfoRow[] = [
  { label: 'Plate', value: 'B 84 219' },
  { label: 'Screen serial', value: 'AZR-2291' },
  { label: 'Battery / power', value: 'Good' },
  { label: 'Last maintenance', value: 'Jun 12, 2026' },
];

export const SHIFT_MOCK: DriverShiftMock = {
  activeHoursToday: 6.2,
  verifiedAdHoursToday: 5.4,
  screenUptimePercent: 96,
  distanceTodayKm: 142,
  daysWorkedThisMonth: 21,
  drivesPremiumAreasToday: false,
  drivesPremiumAreasThisMonth: true,
};
