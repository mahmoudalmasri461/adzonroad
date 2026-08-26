import { apiGet } from './apiClient';

/**
 * The advertiser's own account record.
 *
 * Read-only, matching the API. The details here are what a reviewer approved the account against,
 * and nothing in the platform re-verifies a change — so an editable form would let an approved
 * account quietly become a different company. The taxi company portal is read-only for the same
 * reason, and this says so on screen rather than accepting edits and discarding them.
 */

export type AccountStatus = 'PendingVerification' | 'Approved' | 'Rejected' | 'Suspended';

export interface AdvertiserProfile {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  mobileNumber: string | null;
  verificationStatus: string;
  createdAtUtc: string;
}

export function fetchAdvertiserProfile(signal?: AbortSignal): Promise<AdvertiserProfile> {
  return apiGet<AdvertiserProfile>('/api/v1/advertiser/profile', undefined, signal);
}

// ---------------------------------------------------------------------------- presentation

/** The account's standing, in words a reader recognises rather than the server's enum. */
export function describeAccountStatus(status: string): string {
  switch (status) {
    case 'Approved':
      return 'Approved';
    case 'PendingVerification':
      return 'Awaiting review';
    case 'Rejected':
      return 'Not approved';
    case 'Suspended':
      return 'Suspended';
    default:
      return status;
  }
}
