import { tokens } from '../theme';
import type { AdminKpi, ScreenAlert, PendingCampaign, AdminScreen } from '../types/admin';

export const NAV_ITEMS = [
  { label: 'Overview', active: true },
  { label: 'Live Operations' },
  { label: 'Campaigns' },
  { label: 'Advertisers' },
  { label: 'Drivers' },
  { label: 'Taxi Companies' },
  { label: 'Vehicles' },
  { label: 'Screens' },
  { label: 'Pricing' },
  { label: 'Finance' },
  { label: 'Reports' },
  { label: 'Support' },
  { label: 'Settings' },
];

export const KPIS: AdminKpi[] = [
  { value: '142', label: 'Advertisers' },
  { value: '2,610', label: 'Drivers' },
  { value: '38', label: 'Taxi companies' },
  { value: '1,320', label: 'Registered taxis' },
  { value: '1,248', label: 'Active screens', color: tokens.green },
  { value: '72', label: 'Offline screens', color: tokens.red },
  { value: '86', label: 'Active campaigns' },
  { value: '$186K', label: 'Monthly revenue' },
  { value: '$92K', label: 'Driver payouts' },
  { value: '94.6%', label: 'Fulfilment rate' },
];

export const ALERTS: ScreenAlert[] = [
  { label: 'AZR-1042 · Beirut', status: 'Disconnected', variant: 'error' },
  { label: 'AZR-0987 · Tripoli', status: 'Maintenance', variant: 'warn' },
  { label: 'AZR-1155 · Zahle', status: 'GPS unavailable', variant: 'neutral' },
  { label: 'AZR-1203 · Sidon', status: 'Suspected tamper', variant: 'error' },
];

export const PENDING_CAMPAIGNS: PendingCampaign[] = [
  { id: 1, name: 'Zahle Market Day', advertiser: 'Cedar Retail Group', regions: 'Beqaa', taxis: 26, budget: '$1,300', creative: 'Awaiting approval', creativeVariant: 'outline' },
  { id: 2, name: 'Byblos Summer Fest', advertiser: 'Jbeil Tourism Board', regions: 'Keserwan-Jbeil', taxis: 34, budget: '$2,100', creative: 'Awaiting approval', creativeVariant: 'outline' },
  { id: 3, name: 'North Coast Telecom', advertiser: 'Alfa Lebanon', regions: 'Tripoli, Akkar', taxis: 58, budget: '$5,400', creative: 'Revision requested', creativeVariant: 'neutral' },
];

export const SCREENS: AdminScreen[] = [
  { id: 1, screenId: 'AZR-2291', plate: 'B 84 219', driver: 'Joseph S.', region: 'Mount Lebanon', status: 'Active', statusVariant: 'live', lastSignal: 'Just now' },
  { id: 2, screenId: 'AZR-1042', plate: 'B 12 771', driver: 'Elie H.', region: 'Beirut', status: 'Disconnected', statusVariant: 'error', lastSignal: '3 hrs ago' },
  { id: 3, screenId: 'AZR-0987', plate: 'T 45 032', driver: 'Nadine K.', region: 'Tripoli', status: 'Maintenance', statusVariant: 'warn', lastSignal: '1 day ago' },
  { id: 4, screenId: 'AZR-1155', plate: 'Z 09 284', driver: 'Rami A.', region: 'Zahle', status: 'GPS unavailable', statusVariant: 'neutral', lastSignal: '6 hrs ago' },
  { id: 5, screenId: 'AZR-1310', plate: 'S 77 561', driver: 'Maya D.', region: 'Sidon', status: 'Active', statusVariant: 'live', lastSignal: 'Just now' },
];
