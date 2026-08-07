import type { StatusTagVariant } from '../StatusTag';
import type { CarStatus, GpsStatus, ScreenStatus, DriverAssignmentStatus } from '../../types/taxiCompany';

export const CAR_STATUS_VARIANT: Record<CarStatus, StatusTagVariant> = {
  Active: 'live',
  Offline: 'error',
  Maintenance: 'warn',
  Idle: 'neutral',
};

export const GPS_STATUS_VARIANT: Record<GpsStatus, StatusTagVariant> = {
  Connected: 'live',
  'Weak Signal': 'warn',
  Lost: 'error',
};

export const SCREEN_STATUS_VARIANT: Record<ScreenStatus, StatusTagVariant> = {
  Online: 'live',
  Offline: 'error',
  'Pending Sync': 'warn',
  Maintenance: 'outline',
};

export const DRIVER_STATUS_VARIANT: Record<DriverAssignmentStatus, StatusTagVariant> = {
  Assigned: 'live',
  Unassigned: 'outline',
  'Pending Documents': 'warn',
};
