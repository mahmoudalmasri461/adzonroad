import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import AdminShell, { type AdminNavGroup } from './AdminShell';
import { useAuth } from '../../contexts/AuthProvider';
import { ReviewCountsProvider, useSharedReviewCounts } from '../../contexts/ReviewCountsProvider';
import { tokens } from '../../theme';

/**
 * The console shell's contents: what is in the sidebar, and what the context bar says per page.
 *
 * Every entry goes somewhere. The sidebar once listed thirteen sections of which only the first
 * existed — the rest raised a toast saying so, which is an honest thing to do once and an
 * embarrassing thing to ship.
 *
 * "Taxi Companies" reads "Fleet Partners". The route stays `/admin/taxi-companies` and the API
 * still speaks of taxi companies, because those are identifiers; only the word on screen changed.
 */
const NAV_GROUPS: AdminNavGroup[] = [
  {
    labelKey: 'admin.groups.operations',
    items: [
      { labelKey: 'admin.nav.overview', href: '/admin' },
      { labelKey: 'admin.nav.live', href: '/admin/live' },
    ],
  },
  {
    labelKey: 'admin.groups.commercial',
    items: [
      { labelKey: 'admin.nav.campaigns', href: '/admin/campaigns' },
      { labelKey: 'admin.nav.advertisers', href: '/admin/advertisers' },
    ],
  },
  {
    labelKey: 'admin.groups.network',
    items: [
      { labelKey: 'admin.nav.drivers', href: '/admin/drivers' },
      { labelKey: 'admin.nav.fleetPartners', href: '/admin/taxi-companies' },
      { labelKey: 'admin.nav.vehicles', href: '/admin/vehicles' },
      { labelKey: 'admin.nav.screens', href: '/admin/screens' },
    ],
  },
  {
    labelKey: 'admin.groups.business',
    items: [
      { labelKey: 'admin.nav.pricing', href: '/admin/pricing' },
      { labelKey: 'admin.nav.finance', href: '/admin/finance' },
      { labelKey: 'admin.nav.reports', href: '/admin/reports' },
    ],
  },
  {
    labelKey: 'admin.groups.system',
    items: [
      { labelKey: 'admin.nav.support', href: '/admin/support' },
      { labelKey: 'admin.nav.settings', href: '/admin/settings' },
    ],
  },
];

/** Which page the context bar is describing, keyed by the same hrefs the sidebar uses. */
const PAGE_TITLES: Record<string, { titleKey: string; subtitleKey?: string }> = {
  '/admin': { titleKey: 'admin.overview.title', subtitleKey: 'admin.overview.subtitle' },
  '/admin/live': { titleKey: 'admin.nav.live', subtitleKey: 'admin.subtitles.live' },
  '/admin/campaigns': { titleKey: 'admin.nav.campaigns', subtitleKey: 'admin.subtitles.campaigns' },
  '/admin/advertisers': { titleKey: 'admin.nav.advertisers', subtitleKey: 'admin.subtitles.advertisers' },
  '/admin/drivers': { titleKey: 'admin.nav.drivers', subtitleKey: 'admin.subtitles.drivers' },
  '/admin/taxi-companies': { titleKey: 'admin.nav.fleetPartners', subtitleKey: 'admin.subtitles.fleetPartners' },
  '/admin/vehicles': { titleKey: 'admin.nav.vehicles', subtitleKey: 'admin.subtitles.vehicles' },
  '/admin/screens': { titleKey: 'admin.nav.screens', subtitleKey: 'admin.subtitles.screens' },
  '/admin/pricing': { titleKey: 'admin.nav.pricing', subtitleKey: 'admin.subtitles.pricing' },
  '/admin/finance': { titleKey: 'admin.nav.finance', subtitleKey: 'admin.subtitles.finance' },
  '/admin/reports': { titleKey: 'admin.nav.reports', subtitleKey: 'admin.subtitles.reports' },
  '/admin/support': { titleKey: 'admin.nav.support', subtitleKey: 'admin.subtitles.support' },
  '/admin/settings': { titleKey: 'admin.nav.settings', subtitleKey: 'admin.subtitles.settings' },
};

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
function roleLabelKey(roles: readonly string[]): string | null {
  if (roles.includes('SuperAdmin')) return 'admin.user.superAdmin';
  if (roles.includes('Admin')) return 'admin.user.admin';
  return null;
}

export default function AdminLayout() {
  // The provider has to sit above the component that reads it, so the shell body is its own
  // component rather than this one reading a context it is also creating.
  return (
    <ReviewCountsProvider>
      <AdminShellBody />
    </ReviewCountsProvider>
  );
}

function AdminShellBody() {
  const location = useLocation();
  const { session } = useAuth();
  const { t } = useTranslation();
  const review = useSharedReviewCounts();

  // Exact match for the index, longest prefix for the rest — otherwise every section highlights at
  // once, because every path begins with /admin.
  const activeHref =
    location.pathname === '/admin'
      ? '/admin'
      : Object.keys(PAGE_TITLES)
          .filter((href) => href !== '/admin' && location.pathname.startsWith(href))
          .sort((a, b) => b.length - a.length)[0] ?? '/admin';

  const counts = review.status === 'loaded' ? review.counts : null;

  const groups: AdminNavGroup[] = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      // Only the four queues that actually have a waiting count get a badge.
      const badge =
        counts === null
          ? undefined
          : item.href === '/admin/campaigns'
            ? counts.campaign
            : item.href === '/admin/drivers'
              ? counts.driver
              : item.href === '/admin/advertisers'
                ? counts.advertiser
                : item.href === '/admin/taxi-companies'
                  ? counts.fleet
                  : undefined;
      return { ...item, badge };
    }),
  }));

  const page = PAGE_TITLES[activeHref] ?? { titleKey: 'admin.nav.overview' };
  const name = session?.displayName ?? '';
  const roleKey = roleLabelKey(session?.roles ?? []);

  return (
    <AdminShell
      groups={groups}
      activeHref={activeHref}
      userName={name || '—'}
      userInitials={name ? initialsFor(name) : '—'}
      userRole={roleKey ? t(roleKey) : (session?.roles?.[0] ?? '')}
      title={t(page.titleKey)}
      subtitle={page.subtitleKey ? t(page.subtitleKey) : undefined}
      actions={
        activeHref === '/admin' ? (
          <>
            <Button
              component={RouterLink}
              to="/admin/reports"
              variant="outlined"
              size="small"
              sx={{ borderColor: '#DDD9D1', color: tokens.navy, borderRadius: '9px' }}
            >
              {t('admin.nav.reports')}
            </Button>
            <Button
              component={RouterLink}
              to="/admin/live"
              variant="contained"
              color="primary"
              size="small"
              sx={{ borderRadius: '9px' }}
            >
              {t('admin.nav.live')}
            </Button>
          </>
        ) : undefined
      }
    >
      <Outlet />
    </AdminShell>
  );
}
