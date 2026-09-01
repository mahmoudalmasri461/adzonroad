import { estimateCampaignPrice, type CreativeDurationSeconds } from './pricingService';
import {
  DRIVER_BASE_PAY_USD,
  DRIVER_HOURLY_RATE_USD,
  DRIVER_PREMIUM_AREA_BONUS_USD,
} from './earningsService';

/**
 * The commercial rate card: what advertisers are offered, what drivers are paid, and what a taxi
 * company earns for putting its fleet on the road.
 *
 * These three sit together because they are one commercial decision. Raising the advertiser price
 * without raising driver pay is a margin change, and the only way to see that is to have both
 * numbers on one screen.
 *
 * **This is a draft, and the platform does not charge from it yet.** Campaign quotes come from
 * `CampaignPricing` in the API, which is a compile-time constant — there is no write endpoint for
 * a rate, so nothing here can reach the server. Edits persist to this browser so the commercial
 * work can be done and reviewed; `loadRateCard`/`saveRateCard` are the two functions to repoint at
 * `/api/v1/admin/rate-card` once that exists, and nothing above them needs to change.
 */

export type OfferAudience = 'advertising' | 'drivers' | 'fleets';

/** A package sold to an advertiser. */
export interface AdvertisingOffer {
  id: string;
  name: string;
  taxiCount: number;
  durationSeconds: number;
  /** Regions covered by the headline price; beyond this the surcharge applies. */
  regionsIncluded: number;
  /** What the offer is sold at, which need not equal the rule price. */
  price: number;
  /** Highlighted on the public pricing section. */
  featured: boolean;
  notes: string;
}

/** One component of what a driver takes home. */
export interface DriverPayItem {
  id: string;
  name: string;
  amount: number;
  unit: DriverPayUnit;
  /** When this component applies at all — blank means always. */
  condition: string;
}

export type DriverPayUnit = 'per month' | 'per active hour' | 'per verified hour' | 'one-off';

export const DRIVER_PAY_UNITS: DriverPayUnit[] = [
  'per month',
  'per active hour',
  'per verified hour',
  'one-off',
];

/** What a taxi company earns, banded by fleet size. */
export interface FleetOffer {
  id: string;
  name: string;
  minVehicles: number;
  /** Null is "and above" — the open-ended top band. */
  maxVehicles: number | null;
  perVehicleMonthlyUsd: number;
  /** Share of the advertiser spend on that fleet's screens, as a percentage. */
  revenueSharePercent: number;
  notes: string;
}

export interface RateCard {
  currency: string;
  /** The base rule the campaign engine charges on. */
  ratePerTaxiPerSecondUsd: number;
  additionalRegionSurchargeUsd: number;
  advertising: AdvertisingOffer[];
  drivers: DriverPayItem[];
  fleets: FleetOffer[];
  /** Null until somebody has saved an edit. */
  updatedAtUtc: string | null;
}

const STORAGE_KEY = 'adz.rateCard.draft';

/** Crypto-free: these ids never leave the browser and only need to be distinct within one list. */
function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The rate card as the platform behaves today.
 *
 * Seeded from the same two modules that actually decide these numbers — `pricingService` for what
 * advertisers pay and `earningsService` for what drivers are paid — rather than retyped. A default
 * that disagrees with the running system is worse than no default, because it looks authoritative.
 */
export function defaultRateCard(): RateCard {
  const tier = (name: string, taxiCount: number, durationSeconds: CreativeDurationSeconds, featured: boolean, notes: string): AdvertisingOffer => ({
    id: newId(),
    name,
    taxiCount,
    durationSeconds,
    regionsIncluded: 1,
    price: estimateCampaignPrice({ taxiCount, durationSeconds }).total,
    featured,
    notes,
  });

  return {
    currency: 'USD',
    ratePerTaxiPerSecondUsd: 20,
    additionalRegionSurchargeUsd: 150,
    advertising: [
      tier('Starter', 5, 15, false, 'One ad unit of six, repeating through an 8-hour day.'),
      tier('Growth', 10, 15, true, 'Double the fleet, same unit and rotation.'),
      tier('Prime', 10, 30, false, 'A 30-second unit, for creative that needs the room.'),
    ],
    drivers: [
      { id: newId(), name: 'Base pay', amount: DRIVER_BASE_PAY_USD, unit: 'per month', condition: '' },
      { id: newId(), name: 'Driving hours', amount: DRIVER_HOURLY_RATE_USD, unit: 'per active hour', condition: '' },
      {
        id: newId(),
        name: 'Premium area bonus',
        amount: DRIVER_PREMIUM_AREA_BONUS_USD,
        unit: 'per month',
        condition: 'Covers Verdun, Gemmayzeh, Saifi or Downtown',
      },
    ],
    fleets: [
      { id: newId(), name: 'Small fleet', minVehicles: 1, maxVehicles: 9, perVehicleMonthlyUsd: 45, revenueSharePercent: 10, notes: 'Standard terms. Installation and insurance included.' },
      { id: newId(), name: 'Mid fleet', minVehicles: 10, maxVehicles: 29, perVehicleMonthlyUsd: 55, revenueSharePercent: 12, notes: 'Named account manager.' },
      { id: newId(), name: 'Large fleet', minVehicles: 30, maxVehicles: null, perVehicleMonthlyUsd: 65, revenueSharePercent: 15, notes: 'Priority campaign allocation and quarterly review.' },
    ],
    updatedAtUtc: null,
  };
}

/**
 * The saved draft, or today's behaviour if nothing has been saved.
 *
 * A malformed or half-shaped stored value falls back to the default rather than throwing: this is
 * a browser key anybody can edit, and a console that will not render because of it is worse than
 * one that quietly starts again from the real figures.
 */
export function loadRateCard(): RateCard {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return defaultRateCard();
  }

  if (!raw) return defaultRateCard();

  try {
    const parsed = JSON.parse(raw) as Partial<RateCard>;
    const fallback = defaultRateCard();

    if (!Array.isArray(parsed.advertising) || !Array.isArray(parsed.drivers) || !Array.isArray(parsed.fleets)) {
      return fallback;
    }

    return {
      currency: parsed.currency ?? fallback.currency,
      ratePerTaxiPerSecondUsd: numberOr(parsed.ratePerTaxiPerSecondUsd, fallback.ratePerTaxiPerSecondUsd),
      additionalRegionSurchargeUsd: numberOr(parsed.additionalRegionSurchargeUsd, fallback.additionalRegionSurchargeUsd),
      advertising: parsed.advertising,
      drivers: parsed.drivers,
      fleets: parsed.fleets,
      updatedAtUtc: parsed.updatedAtUtc ?? null,
    };
  } catch {
    return defaultRateCard();
  }
}

/** Returns the card as stored, with the save time filled in. */
export function saveRateCard(card: RateCard): RateCard {
  const stamped = { ...card, updatedAtUtc: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // A full or blocked store is worth reporting, not crashing on — the caller shows the toast.
    throw new Error('This browser would not store the draft rate card.');
  }
  return stamped;
}

/** Drops the draft so the card returns to what the platform actually does today. */
export function resetRateCard(): RateCard {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to undo if it was never stored.
  }
  return defaultRateCard();
}

// ---------------------------------------------------------------------------- derived figures

/** What the campaign engine would charge for this offer, ignoring what the offer is priced at. */
export function rulePriceOf(offer: AdvertisingOffer, card: RateCard): number {
  const base = offer.taxiCount * offer.durationSeconds * card.ratePerTaxiPerSecondUsd;
  const extraRegions = Math.max(0, offer.regionsIncluded - 1);
  return base + extraRegions * card.additionalRegionSurchargeUsd;
}

/**
 * What a driver on this card earns in a typical month, so a pay change can be read as a number
 * rather than as three separate components.
 */
export function monthlyDriverPay(items: DriverPayItem[], hoursPerDay = 8, days = 24): number {
  return items.reduce((total, item) => {
    if (item.unit === 'per month') return total + item.amount;
    if (item.unit === 'per active hour' || item.unit === 'per verified hour') {
      return total + item.amount * hoursPerDay * days;
    }
    return total; // A one-off is not part of a monthly figure.
  }, 0);
}

/** Describes a band as "10–29 vehicles" or "30+ vehicles". */
export function describeBand(offer: FleetOffer): string {
  return offer.maxVehicles === null
    ? `${offer.minVehicles}+ vehicles`
    : `${offer.minVehicles}–${offer.maxVehicles} vehicles`;
}

// ---------------------------------------------------------------------------- blanks

export function blankAdvertisingOffer(): AdvertisingOffer {
  return { id: newId(), name: '', taxiCount: 5, durationSeconds: 15, regionsIncluded: 1, price: 0, featured: false, notes: '' };
}

export function blankDriverPayItem(): DriverPayItem {
  return { id: newId(), name: '', amount: 0, unit: 'per month', condition: '' };
}

export function blankFleetOffer(): FleetOffer {
  return { id: newId(), name: '', minVehicles: 1, maxVehicles: null, perVehicleMonthlyUsd: 0, revenueSharePercent: 0, notes: '' };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
