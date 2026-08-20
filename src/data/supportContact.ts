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
