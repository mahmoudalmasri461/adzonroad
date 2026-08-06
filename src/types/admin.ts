import type { StatusTagVariant } from '../components/StatusTag';

export type PendingCampaign = {
  id: number;
  name: string;
  advertiser: string;
  regions: string;
  taxis: number;
  budget: string;
  creative: string;
  creativeVariant: StatusTagVariant;
};

export type AdminScreen = {
  id: number;
  screenId: string;
  plate: string;
  driver: string;
  region: string;
  status: string;
  statusVariant: StatusTagVariant;
  lastSignal: string;
};

export type ScreenAlert = {
  label: string;
  status: string;
  variant: StatusTagVariant;
};

export type AdminKpi = {
  value: string;
  label: string;
  color?: string;
};
