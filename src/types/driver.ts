export type DriverStatusChip = {
  label: string;
  pulse?: boolean;
};

export type VehicleInfoRow = {
  label: string;
  value: string;
};

export type DriverShiftMock = {
  activeHoursToday: number;
  verifiedAdHoursToday: number;
  screenUptimePercent: number;
  distanceTodayKm: number;
  daysWorkedThisMonth: number;
  /** Baabda (today's route) isn't a premium area — Verdun, Gemmayze, Saifi, Downtown, etc. are. */
  drivesPremiumAreasToday: boolean;
  drivesPremiumAreasThisMonth: boolean;
};
