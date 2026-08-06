export type CreativeDurationSeconds = 10 | 15 | 30;

/**
 * $ per taxi per second of creative duration, for the standard 8-hour/day display window.
 * Derived from the three published pricing tiers: 5 taxis/15s = $1,500, 10 taxis/15s = $3,000,
 * 10 taxis/30s = $6,000 — all three resolve to exactly $20/taxi/second at 8hrs/day.
 */
const RATE_PER_TAXI_PER_SECOND_USD = 20;

export type CampaignPricingInput = {
  taxiCount: number;
  durationSeconds: CreativeDurationSeconds;
  regionCount?: number;
};

export type CampaignPricingBreakdown = {
  baseTotal: number;
  regionSurcharge: number;
  total: number;
};

/** Flat surcharge per additional region beyond the first, covering cross-region logistics. */
const ADDITIONAL_REGION_SURCHARGE_USD = 150;

export function estimateCampaignPrice({ taxiCount, durationSeconds, regionCount = 1 }: CampaignPricingInput): CampaignPricingBreakdown {
  const baseTotal = taxiCount * durationSeconds * RATE_PER_TAXI_PER_SECOND_USD;
  const additionalRegions = Math.max(0, regionCount - 1);
  const regionSurcharge = additionalRegions * ADDITIONAL_REGION_SURCHARGE_USD;
  return { baseTotal, regionSurcharge, total: baseTotal + regionSurcharge };
}

export const PRICING_TIERS = [
  { taxiCount: 5, durationSeconds: 15 as CreativeDurationSeconds, label: '5 Taxis' },
  { taxiCount: 10, durationSeconds: 15 as CreativeDurationSeconds, label: '10 Taxis' },
  { taxiCount: 10, durationSeconds: 30 as CreativeDurationSeconds, label: '10 Taxis' },
].map((tier) => ({ ...tier, price: estimateCampaignPrice({ taxiCount: tier.taxiCount, durationSeconds: tier.durationSeconds }).total }));
