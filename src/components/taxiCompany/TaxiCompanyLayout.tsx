import { Outlet, useLocation } from 'react-router-dom';
import DashboardShell from '../../layouts/DashboardShell';
import { FleetProvider, useFleet } from './FleetContext';

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

function initialsFor(companyName: string): string {
  return companyName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The shell reads the signed-in company from the fleet context, so it must live inside the
 * provider rather than beside it — which is why this is a separate component.
 */
function Shell() {
  const location = useLocation();
  const { profile } = useFleet();

  const navItems = NAV_ITEMS.map((item) => ({ ...item, active: location.pathname === item.href }));
  const companyName = profile?.companyName ?? '';

  return (
    <DashboardShell
      navItems={navItems}
      avatarInitials={companyName ? initialsFor(companyName) : '—'}
      userName={companyName || 'Loading…'}
      userSubtitle={profile?.region ?? ''}
    >
      <Outlet />
    </DashboardShell>
  );
}

/**
 * Layout route for the whole Taxi Company portal — child routes render into the <Outlet />, so
 * the shell and FleetProvider stay mounted across navigation.
 */
export default function TaxiCompanyLayout() {
  return (
    <FleetProvider>
      <Shell />
    </FleetProvider>
  );
}
