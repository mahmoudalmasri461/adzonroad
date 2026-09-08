import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { tokens } from '../../theme';

/**
 * The admin console shell.
 *
 * Thirteen flat entries of equal weight made the sidebar a list to read rather than a map to
 * navigate. They are grouped now — what you operate, what you sell, what runs on the road, what
 * the business needs, and the system underneath — with the group labels deliberately quiet so the
 * destinations stay the loudest thing in the column.
 *
 * Badges carry counts that come from the review queues and nothing else. A badge on a navigation
 * item is a claim that something is waiting, so a badge nobody can act on is worse than no badge:
 * zero renders nothing at all rather than a grey "0".
 */

export type AdminNavItem = {
  /** Translation key, so a rename never has to be made in two languages and two files. */
  labelKey: string;
  href: string;
  /** Real, actionable count. `undefined` while loading or when the queue is empty. */
  badge?: number;
};

export type AdminNavGroup = {
  labelKey: string;
  items: AdminNavItem[];
};

const SIDEBAR_WIDTH = 244;

export default function AdminShell({
  groups,
  activeHref,
  userName,
  userInitials,
  userRole,
  title,
  subtitle,
  actions,
  children,
}: {
  groups: AdminNavGroup[];
  activeHref: string;
  userName: string;
  userInitials: string;
  userRole: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  const sidebar = (
    <Sidebar
      groups={groups}
      activeHref={activeHref}
      userName={userName}
      userInitials={userInitials}
      userRole={userRole}
      onNavigate={() => setNavOpen(false)}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F6F3' }}>
      {/* Docked from lg up, a drawer below it — one component either way, so a destination cannot
          exist on desktop and go missing on a tablet. */}
      <Box
        component="nav"
        sx={{ display: { xs: 'none', lg: 'block' }, width: SIDEBAR_WIDTH, flexShrink: 0 }}
      >
        <Box sx={{ position: 'fixed', top: 0, bottom: 0, width: SIDEBAR_WIDTH }}>{sidebar}</Box>
      </Box>

      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        sx={{ display: { lg: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 0 } }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* The context bar. Deliberately short — it names the page and carries its actions, and
            everything below it is the actual work. */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 3,
            backgroundColor: 'rgba(247,246,243,0.92)',
            backdropFilter: 'blur(6px)',
            borderBottom: '1px solid #E7E4DE',
            px: { xs: '18px', md: '28px', xl: '36px' },
            py: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <IconButton
            aria-label="Menu"
            onClick={() => setNavOpen(true)}
            sx={{ display: { lg: 'none' }, color: tokens.navy, ml: '-6px' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h1"
              sx={{ fontWeight: 700, fontSize: { xs: 19, md: 22 }, letterSpacing: '-0.02em', color: tokens.navy, lineHeight: 1.2 }}
              noWrap
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ mt: '2px', fontSize: 13, color: tokens.textMuted }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>

          {actions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>{actions}</Box>
          )}
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: '18px', md: '28px', xl: '36px' },
            py: { xs: '20px', md: '26px' },
            // Operational tables want width, but a 2560px monitor should not stretch a row of
            // metrics across a metre of glass.
            maxWidth: 1680,
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function Sidebar({
  groups,
  activeHref,
  userName,
  userInitials,
  userRole,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  activeHref: string;
  userName: string;
  userInitials: string;
  userRole: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        height: '100%',
        width: SIDEBAR_WIDTH,
        backgroundColor: tokens.navy,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* The mark had 4px of air around it and read as an afterthought. */}
      <Box sx={{ px: '20px', pt: '22px', pb: '18px', filter: 'brightness(0) invert(1)', width: 'fit-content' }}>
        <Logo size="md" />
      </Box>

      <Box sx={{ flex: 1, px: '12px', pb: '10px' }}>
        {groups.map((group) => (
          <Box key={group.labelKey} sx={{ mb: '14px' }}>
            <Typography
              sx={{
                px: '10px',
                mb: '5px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.34)',
              }}
            >
              {t(group.labelKey)}
            </Typography>

            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Box
                  key={item.href}
                  component={RouterLink}
                  to={item.href}
                  onClick={onNavigate}
                  data-active={active ? 'true' : undefined}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    minHeight: 34,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.68)',
                    transition: 'background-color .15s ease, color .15s ease',
                    '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.06)' },
                    // A thin amber rule and a slightly lifted surface, rather than a grey slab.
                    '&[data-active="true"]': {
                      color: '#fff',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.09)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        insetInlineStart: 0,
                        top: 7,
                        bottom: 7,
                        width: 3,
                        borderRadius: '0 3px 3px 0',
                        backgroundColor: tokens.amber,
                      },
                    },
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }}
                >
                  <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(item.labelKey)}
                  </Box>

                  {item.badge !== undefined && item.badge > 0 && (
                    <Box
                      component="span"
                      sx={{
                        flexShrink: 0,
                        minWidth: 20,
                        height: 18,
                        px: '6px',
                        borderRadius: '999px',
                        backgroundColor: tokens.amber,
                        color: tokens.navy,
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'grid',
                        placeItems: 'center',
                        // Counts are digits in both languages; keep them from being re-ordered.
                        direction: 'ltr',
                      }}
                    >
                      {item.badge}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ px: '16px', pb: '16px', pt: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ mb: '12px' }}>
          <LanguageSwitcher variant="dark" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: tokens.amber,
              color: tokens.navy,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {userInitials}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#fff' }} noWrap>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }} noWrap>
              {userRole}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
