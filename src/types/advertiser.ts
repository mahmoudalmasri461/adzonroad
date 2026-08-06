export type CampaignStatus = 'Draft' | 'Pending Approval' | 'Scheduled' | 'Active' | 'Paused' | 'Completed' | 'Rejected';

export type ScreenStatus = 'Online' | 'Offline' | 'Inactive' | 'Pending Sync' | 'Maintenance';

export type AlertSeverity = 'info' | 'warning' | 'success' | 'critical';

export type CreativeType = 'Image' | 'Video';

export type CreativeDuration = 10 | 15 | 30;

export type CreativeStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'In Review';

export interface Advertiser {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  accountVerified: boolean;
}

export interface Region {
  id: string;
  name: string;
  estimatedImpressions: number;
  verifiedPlays: number;
  activeTaxis: number;
  kilometresCovered: number;
  percentOfTotalExposure: number;
}

export interface Vehicle {
  id: string;
  taxiId: string;
  plate: string;
  driverName: string;
  region: string;
  speedKmh: number;
  lat: number;
  lng: number;
  heading: number;
}

export interface Screen {
  id: string;
  screenId: string;
  vehicleId: string;
  status: ScreenStatus;
  networkStatus: 'Connected' | 'Disconnected';
  currentCampaignId: string | null;
  lastUpdate: string;
}

export interface Creative {
  id: string;
  name: string;
  thumbnailColor: string;
  type: CreativeType;
  durationSeconds: CreativeDuration;
  plays: number;
  estimatedImpressions: number;
  completionRate: number;
  status: CreativeStatus;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  region: string;
  startDate: string;
  endDate: string;
  regions: string[];
  screens: number;
  verifiedPlays: number;
  impressions: number;
  budget: number;
  spent: number;
  deliveryPercent: number;
  verifiedHours: number;
  totalHours: number;
  activeTaxis: number;
  remainingLabel: string;
  thumbnailColor: string;
}

export interface PlaybackRecord {
  id: string;
  screenId: string;
  campaignId: string;
  timestamp: string;
  verified: boolean;
  syncState: 'Live Verified' | 'Pending Sync' | 'Reconciled Verified';
}

export interface GpsRecord {
  id: string;
  vehicleId: string;
  timestamp: string;
  lat: number;
  lng: number;
  speedKmh: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Open' | 'Overdue';
}

export interface CampaignAnalytics {
  verifiedPlaysByDay: { day: string; plays: number }[];
  impressionsByRegion: { region: string; impressions: number }[];
  exposureByTimeOfDay: { hour: string; exposure: number }[];
  screenUptimePercent: number;
}

export interface Notification {
  id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
}
