/**
 * Types the Taxi Company portal still owns.
 *
 * Everything describing an actual fleet — vehicles, drivers, screens, earnings, payouts — now
 * lives in `services/fleet.ts` and is shaped by what the server returns. What is left here is
 * the form vocabulary (which plate categories and car types a person may pick) and the platform's
 * own support contact, neither of which is fleet data.
 */

/**
 * Lebanese plate categories are distinguished by colour/series rather than a printed letter code.
 * This is a reasonable working categorisation, not a legal reference.
 */
export type PlateCategory = 'Private' | 'Public (Taxi — Red)' | 'Rental (Green)' | 'Transit' | 'Diplomatic';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Hatchback' | 'Pickup' | 'Minibus';

export interface SupportContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}
