export type TaxiCompanyVerificationStatus = 'Pending Verification' | 'Verified' | 'Suspended';

/**
 * Lebanese plate categories are distinguished by color/series rather than a printed
 * letter code — this is a reasonable mock categorization, not a legal reference.
 */
export type PlateCategory = 'Private' | 'Public (Taxi — Red)' | 'Rental (Green)' | 'Transit' | 'Diplomatic';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Hatchback' | 'Pickup' | 'Minibus';

export type CarStatus = 'Active' | 'Offline' | 'Maintenance' | 'Idle';

export type GpsStatus = 'Connected' | 'Weak Signal' | 'Lost';

export type ScreenStatus = 'Online' | 'Offline' | 'Pending Sync' | 'Maintenance';

export interface Car {
  id: string;
  plateNumber: string;
  plateCategory: PlateCategory;
  carType: CarType;
  model: string;
  year: number;
  papersImageName: string | null;
  status: CarStatus;
  gpsStatus: GpsStatus;
  screenId: string;
  screenStatus: ScreenStatus;
  currentCampaign: string | null;
  driverId: string | null;
  drivingHoursToday: number;
  screenTimeHoursToday: number;
  distanceKmToday: number;
  lat: number;
  lng: number;
}

export type DriverAssignmentStatus = 'Assigned' | 'Unassigned' | 'Pending Documents';

export interface CompanyDriver {
  id: string;
  name: string;
  mobileNumber: string;
  idImageName: string | null;
  licenseImageName: string | null;
  assignedCarId: string | null;
  status: DriverAssignmentStatus;
}

export interface TaxiCompanyProfile {
  id: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  region: string;
  verificationStatus: TaxiCompanyVerificationStatus;
}

export interface FleetEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  nextPayoutDate: string;
}

export interface SupportContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface PayoutRecord {
  id: string;
  period: string;
  amount: number;
  paidOn: string;
  status: 'Paid' | 'Processing' | 'Scheduled';
  vehiclesIncluded: number;
}

export interface FleetReport {
  id: string;
  name: string;
  generatedOn: string;
}
