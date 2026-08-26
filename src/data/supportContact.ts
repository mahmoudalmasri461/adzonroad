import type { SupportContact } from '../types/taxiCompany';

/**
 * AdzOnRoad's own support line. Static on purpose — this is the platform's contact detail, not
 * fleet data, and there is no endpoint behind it because there is nothing tenant-specific to fetch.
 */
export const SUPPORT_CONTACT: SupportContact = {
  name: 'AdzOnRoad Fleet Support',
  role: 'Taxi Company Support Line',
  phone: '+961 71 600 011',
  email: 'fleet-support@adzonroad.com',
};

/**
 * The advertiser support line.
 *
 * A separate address rather than a shared inbox, because the two audiences ask different
 * questions — a fleet asks about a screen, an advertiser about delivery on a campaign. Still
 * static, and still no endpoint: the platform has no advertiser support ticket, so this card
 * hands over a real address instead of opening a conversation it cannot store.
 */
export const ADVERTISER_SUPPORT_CONTACT: SupportContact = {
  name: 'AdzOnRoad Advertiser Support',
  role: 'Campaign and delivery enquiries',
  phone: '+961 71 600 011',
  email: 'advertiser-support@adzonroad.com',
};
