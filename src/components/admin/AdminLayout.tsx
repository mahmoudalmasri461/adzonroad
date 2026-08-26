import { Outlet, useLocation } from 'react-router-dom';
import DashboardShell from '../../layouts/DashboardShell';
import { useAuth } from '../../contexts/AuthProvider';

/**
 * The console shell.
 *
 * Every entry here goes somewhere. The sidebar previously listed thirteen sections and only the
 * first existed — the other twelve raised a toast saying so, which is an honest thing to do once
 * and an embarrassing thing to ship. A navigation item is a promise that there is something behind
 * it, and these now keep it.
 */
const NAV_ITEMS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Live Operations', href: '/admin/live' },
  { label: 'Campaigns', href: '/admin/campaigns' },
  { label: 'Advertisers', href: '/admin/advertisers' },
  { label: 'Drivers', href: '/admin/drivers' },
  { label: 'Taxi Companies', href: '/admin/taxi-companies' },
  { label: 'Vehicles', href: '/admin/vehicles' },
  { label: 'Screens', href: '/admin/screens' },
  { label: 'Pricing', href: '/admin/pricing' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Support', href: '/admin/support' },
  { label: 'Settings', href: '/admin/settings' },
];

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The most privileged role the account actually holds, rather than a job title nobody entered.
 * The old shell said "Omar P. — Operations Lead" to whoever signed in.
 */
function roleLabel(roles: readonly string[]): string {
  if (roles.includes('SuperAdmin')) return 'Super administrator';
  if (roles.includes('Admin')) return 'Administrator';
  return roles[0] ?? '';
}

export default function AdminLayout() {
  const location = useLocation();
  const { session } = useAuth();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    // Exact match for the index, prefix match for the rest — otherwise every section would be
    // highlighted at once, because every path begins with /admin.
    active: item.href === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.href),
  }));

  const name = session?.displayName ?? '';

  return (
    <DashboardShell
      navItems={navItems}
      avatarInitials={name ? initialsFor(name) : '—'}
      userName={name || 'Loading…'}
      userSubtitle={roleLabel(session?.roles ?? [])}
    >
      <Outlet />
    </DashboardShell>
  );
}
