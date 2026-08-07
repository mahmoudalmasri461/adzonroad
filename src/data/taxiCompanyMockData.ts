import type { Car, CompanyDriver, TaxiCompanyProfile, FleetEarnings, SupportContact, PayoutRecord, FleetReport } from '../types/taxiCompany';

export const MOCK_TAXI_COMPANY: TaxiCompanyProfile = {
  id: 'tc-001',
  companyName: 'Cedar Taxi Services',
  email: 'ops@cedartaxi.com',
  mobileNumber: '+961 3 456 789',
  region: 'Beirut',
  verificationStatus: 'Verified',
};

export const CARS: Car[] = [
  {
    id: 'car-1', plateNumber: '482913', plateCategory: 'Public (Taxi — Red)', carType: 'Sedan', model: 'Kia Optima', year: 2021,
    papersImageName: 'papers-482913.jpg', status: 'Active', gpsStatus: 'Connected', screenId: 'AZR-3301', screenStatus: 'Online',
    currentCampaign: 'Summer Launch', driverId: 'drv-1', drivingHoursToday: 6.4, screenTimeHoursToday: 5.9, distanceKmToday: 148,
    lat: 33.8959, lng: 35.4794,
  },
  {
    id: 'car-2', plateNumber: '117205', plateCategory: 'Public (Taxi — Red)', carType: 'Sedan', model: 'Hyundai Elantra', year: 2020,
    papersImageName: 'papers-117205.jpg', status: 'Active', gpsStatus: 'Connected', screenId: 'AZR-3302', screenStatus: 'Online',
    currentCampaign: 'Weekend Restaurant Campaign', driverId: 'drv-2', drivingHoursToday: 5.1, screenTimeHoursToday: 4.8, distanceKmToday: 121,
    lat: 33.8920, lng: 35.4950,
  },
  {
    id: 'car-3', plateNumber: '905478', plateCategory: 'Public (Taxi — Red)', carType: 'Van', model: 'Hyundai H-1', year: 2019,
    papersImageName: 'papers-905478.jpg', status: 'Offline', gpsStatus: 'Lost', screenId: 'AZR-3303', screenStatus: 'Offline',
    currentCampaign: null, driverId: 'drv-3', drivingHoursToday: 0, screenTimeHoursToday: 0, distanceKmToday: 0,
    lat: 33.8837, lng: 35.4780,
  },
  {
    id: 'car-4', plateNumber: '330871', plateCategory: 'Public (Taxi — Red)', carType: 'Sedan', model: 'Toyota Corolla', year: 2022,
    papersImageName: 'papers-330871.jpg', status: 'Active', gpsStatus: 'Connected', screenId: 'AZR-3304', screenStatus: 'Online',
    currentCampaign: 'Summer Launch', driverId: 'drv-4', drivingHoursToday: 7.2, screenTimeHoursToday: 6.6, distanceKmToday: 176,
    lat: 33.8788, lng: 35.5138,
  },
  {
    id: 'car-5', plateNumber: '664129', plateCategory: 'Public (Taxi — Red)', carType: 'SUV', model: 'Kia Sportage', year: 2023,
    papersImageName: 'papers-664129.jpg', status: 'Maintenance', gpsStatus: 'Weak Signal', screenId: 'AZR-3305', screenStatus: 'Maintenance',
    currentCampaign: null, driverId: null, drivingHoursToday: 0, screenTimeHoursToday: 0, distanceKmToday: 0,
    lat: 33.8534, lng: 35.5450,
  },
  {
    id: 'car-6', plateNumber: '248036', plateCategory: 'Public (Taxi — Red)', carType: 'Sedan', model: 'Hyundai Accent', year: 2021,
    papersImageName: 'papers-248036.jpg', status: 'Idle', gpsStatus: 'Connected', screenId: 'AZR-3306', screenStatus: 'Pending Sync',
    currentCampaign: null, driverId: 'drv-5', drivingHoursToday: 1.8, screenTimeHoursToday: 1.2, distanceKmToday: 32,
    lat: 33.8756, lng: 35.5389,
  },
];

export const DRIVERS: CompanyDriver[] = [
  { id: 'drv-1', name: 'Elie Haddad', mobileNumber: '+961 71 222 111', idImageName: 'id-elie.jpg', licenseImageName: 'license-elie.jpg', assignedCarId: 'car-1', status: 'Assigned' },
  { id: 'drv-2', name: 'Joseph Semaan', mobileNumber: '+961 76 333 222', idImageName: 'id-joseph.jpg', licenseImageName: 'license-joseph.jpg', assignedCarId: 'car-2', status: 'Assigned' },
  { id: 'drv-3', name: 'Nadine Khoury', mobileNumber: '+961 70 444 333', idImageName: 'id-nadine.jpg', licenseImageName: 'license-nadine.jpg', assignedCarId: 'car-3', status: 'Assigned' },
  { id: 'drv-4', name: 'Rami Abou Chaaya', mobileNumber: '+961 03 555 444', idImageName: 'id-rami.jpg', licenseImageName: 'license-rami.jpg', assignedCarId: 'car-4', status: 'Assigned' },
  { id: 'drv-5', name: 'Maya Daou', mobileNumber: '+961 71 666 555', idImageName: 'id-maya.jpg', licenseImageName: 'license-maya.jpg', assignedCarId: 'car-6', status: 'Assigned' },
  { id: 'drv-6', name: 'Karim Tabet', mobileNumber: '+961 76 777 666', idImageName: null, licenseImageName: null, assignedCarId: null, status: 'Pending Documents' },
];

export const FLEET_EARNINGS: FleetEarnings = {
  today: 186,
  thisWeek: 1240,
  thisMonth: 5280,
  total: 42600,
  nextPayoutDate: '2026-08-15',
};

export const SUPPORT_CONTACT: SupportContact = {
  name: 'AdzOnRoad Fleet Support',
  role: 'Taxi Company Support Line',
  phone: '+961 71 600 011',
  email: 'fleet-support@adzonroad.com',
};

export const PAYOUT_HISTORY: PayoutRecord[] = [
  { id: 'po-1', period: 'July 2026', amount: 5280, paidOn: '2026-08-15', status: 'Scheduled', vehiclesIncluded: 6 },
  { id: 'po-2', period: 'June 2026', amount: 4960, paidOn: '2026-07-15', status: 'Paid', vehiclesIncluded: 6 },
  { id: 'po-3', period: 'May 2026', amount: 5140, paidOn: '2026-06-15', status: 'Paid', vehiclesIncluded: 6 },
  { id: 'po-4', period: 'April 2026', amount: 4380, paidOn: '2026-05-15', status: 'Paid', vehiclesIncluded: 5 },
  { id: 'po-5', period: 'March 2026', amount: 4720, paidOn: '2026-04-15', status: 'Paid', vehiclesIncluded: 5 },
];

export const FLEET_REPORTS: FleetReport[] = [
  { id: 'rep-1', name: 'Fleet Earnings Statement — July 2026', generatedOn: 'Aug 1, 2026' },
  { id: 'rep-2', name: 'Vehicle Utilisation Report — July 2026', generatedOn: 'Aug 1, 2026' },
  { id: 'rep-3', name: 'Screen Uptime Summary — July 2026', generatedOn: 'Aug 1, 2026' },
  { id: 'rep-4', name: 'Driver Activity Log — July 2026', generatedOn: 'Aug 1, 2026' },
  { id: 'rep-5', name: 'Fleet Earnings Statement — June 2026', generatedOn: 'Jul 1, 2026' },
];
