import { API_BASE_URL } from './apiConfig';

/**
 * Self-service sign-up for the three account types the platform accepts.
 *
 * One property runs through all of them: **nothing self-approves.** Every endpoint here creates an
 * account held at PendingVerification and returns no token, so no path through this module can
 * sign anyone in. A form that navigated to a dashboard after registering would be describing an
 * account that does not exist yet.
 */

export type SignupRole = 'advertiser' | 'driver' | 'taxiCompany';

export interface RegionOption {
  id: string;
  code: string;
  name: string;
  isPremium: boolean;
}

export interface RegistrationResult {
  /** Advertiser and fleet registrations return an account id; drivers return a driver id. */
  id: string;
  status: string;
  message: string;
}

/** Thrown when the server refuses, carrying enough for the form to say something useful. */
export class RegistrationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'RegistrationError';
    this.status = status;
  }

  /** The email or mobile number is already registered — an invitation to sign in, not to retry. */
  get isAlreadyRegistered() {
    return this.status === 409;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new RegistrationError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (response.ok) return (await response.json()) as T;

  const problem = await response.json().catch(() => null);

  throw new RegistrationError(
    response.status,
    problem?.message ?? problem?.error ?? problem?.title ?? 'Registration failed. Please try again.',
  );
}

/**
 * Regions as the platform actually holds them.
 *
 * Fetched rather than hardcoded because a client list that drifts from the seeded regions fails
 * silently — registration succeeds, the region resolves to nothing, and the account is excluded
 * from every region-based rule with no error anywhere.
 */
export async function fetchRegions(signal?: AbortSignal): Promise<RegionOption[]> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/v1/regions`, { signal });
  if (!response.ok) throw new RegistrationError(response.status, 'Could not load the region list.');

  return (await response.json()) as RegionOption[];
}

export interface AdvertiserRegistration {
  companyName: string;
  contactName: string;
  email: string;
  mobileNumber?: string;
  password: string;
}

export async function registerAdvertiser(input: AdvertiserRegistration): Promise<RegistrationResult> {
  const response = await post<{ accountId: string; status: string; message: string }>(
    '/api/v1/advertisers/registrations',
    input,
  );

  return { id: response.accountId, status: response.status, message: response.message };
}

export interface TaxiCompanyRegistration {
  companyName: string;
  email: string;
  mobileNumber: string;
  region: string;
  password: string;
}

export async function registerTaxiCompany(input: TaxiCompanyRegistration): Promise<RegistrationResult> {
  const response = await post<{ accountId: string; status: string; message: string }>(
    '/api/v1/taxi-companies/registrations',
    input,
  );

  return { id: response.accountId, status: response.status, message: response.message };
}

export interface DriverRegistration {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  region: string;
  plateNumber: string;
  plateCharacter: string;
  carType: string;
  carModel: string;
  carYear: number;
  password: string;
  idImageBase64: string;
  licenseImageBase64: string;
  carPapersImageBase64: string;
}

/**
 * Driver registration, on the same path the Android app uses.
 *
 * The three documents travel as base64 in the body, which is what the shipped app sends and
 * therefore what the endpoint accepts. They are downscaled first — see `imageUpload`.
 */
export async function registerDriver(input: DriverRegistration): Promise<RegistrationResult> {
  const response = await post<{ driverId: string; status: string }>('/api/auth/signup', input);

  return {
    id: response.driverId,
    status: response.status,
    message: "Your application is being reviewed. You'll be able to sign in once it's approved.",
  };
}

// ---------------------------------------------------------------------------- form options

/**
 * Vehicle option lists, mirroring `SignupOptions.kt` in the driver app so a driver sees the same
 * choices whichever surface they register from.
 */
export const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Van', 'Pickup', 'Coupe'] as const;

/**
 * Letter shown after the plate number. Lebanese plates are Arabic-lettered in practice; this
 * Latin-transliterated set is an assumed placeholder carried over from the driver app, not
 * sourced from an official reference.
 */
export const PLATE_CHARACTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function carYears(now = new Date()): number[] {
  const current = now.getFullYear();
  return Array.from({ length: current - 1989 }, (_, i) => current - i);
}
