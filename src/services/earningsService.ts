/**
 * Driver earnings formula (business rule, not derived from any API):
 * flat base + $0.60 per active driving hour + a $20 flat bonus for the period
 * if the driver covers premium areas (Verdun, Gemmayze, Saifi, Downtown, etc).
 * Previously duplicated inline in the Homepage earnings estimator; this is the
 * single source of truth both the Homepage widget and the Driver dashboard use.
 */
export const DRIVER_BASE_PAY_USD = 30;
export const DRIVER_HOURLY_RATE_USD = 0.6;
export const DRIVER_PREMIUM_AREA_BONUS_USD = 20;

export type DriverEarningsInput = {
  hoursPerDay: number;
  days: number;
  drivesPremiumAreas: boolean;
};

export type DriverEarningsBreakdown = {
  base: number;
  hourlyEarnings: number;
  premiumBonus: number;
  total: number;
};

export function calculateDriverEarnings({ hoursPerDay, days, drivesPremiumAreas }: DriverEarningsInput): DriverEarningsBreakdown {
  const totalHours = hoursPerDay * days;
  const hourlyEarnings = totalHours * DRIVER_HOURLY_RATE_USD;
  const premiumBonus = drivesPremiumAreas ? DRIVER_PREMIUM_AREA_BONUS_USD : 0;
  return {
    base: DRIVER_BASE_PAY_USD,
    hourlyEarnings,
    premiumBonus,
    total: DRIVER_BASE_PAY_USD + hourlyEarnings + premiumBonus,
  };
}
