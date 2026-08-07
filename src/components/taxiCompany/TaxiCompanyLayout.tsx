import { Outlet, useLocation } from 'react-router-dom';
import DashboardShell from '../../layouts/DashboardShell';
import { FleetProvider } from './FleetContext';
import { MOCK_TAXI_COMPANY } from '../../data/taxiCompanyMockData';

const NAV_ITEMS = [
  { label: 'Overview', href: '/taxi-company' },
  { label: 'Cars', href: '/taxi-company/cars' },
  { label: 'Drivers', href: '/taxi-company/drivers' },
  { label: 'Earnings', href: '/taxi-company/earnings' },
  { label: 'Screens', href: '/taxi-company/screens' },
  { label: 'Reports', href: '/taxi-company/reports' },
  { label: 'Support', href: '/taxi-company/support' },
  { label: 'Settings', href: '/taxi-company/settings' },
];

const COMPANY_INITIALS = MOCK_TAXI_COMPANY.companyName
  .split(' ')
  .map((w) => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

/**
 * Layout route for the whole Taxi Company portal — child routes render into the
 * <Outlet />, so the shell and FleetProvider stay mounted across navigation.
 */
export default function TaxiCompanyLayout() {
  const location = useLocation();
  const navItems = NAV_ITEMS.map((item) => ({ ...item, active: location.pathname === item.href }));

  return (
    <FleetProvider>
      <DashboardShell
        navItems={navItems}
        avatarInitials={COMPANY_INITIALS}
        userName={MOCK_TAXI_COMPANY.companyName}
        userSubtitle={MOCK_TAXI_COMPANY.region}
      >
        <Outlet />
      </DashboardShell>
    </FleetProvider>
  );
}
