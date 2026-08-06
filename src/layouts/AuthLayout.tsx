import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Logo from '../components/Logo';
import { tokens } from '../theme';

export type AuthRole = 'advertiser' | 'admin' | 'driver';

const ROLE_LABELS: Record<AuthRole, string> = {
  advertiser: 'Advertiser',
  admin: 'Admin',
  driver: 'Driver',
};

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  role: AuthRole;
  onRoleChange: (role: AuthRole) => void;
  roles: AuthRole[];
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
};

export default function AuthLayout({
  title,
  subtitle,
  role,
  onRoleChange,
  roles,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <Box sx={{ mb: '28px' }}>
        <RouterLink to="/" style={{ display: 'block' }}>
          <Logo size="lg" />
        </RouterLink>
      </Box>

      <Card sx={{ width: '100%', maxWidth: 440, p: '36px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.01em', textAlign: 'center' }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', textAlign: 'center', mt: '6px', mb: '24px' }}>{subtitle}</Typography>

        {roles.length > 1 && (
          <Tabs
            value={role}
            onChange={(_, value) => onRoleChange(value)}
            variant="fullWidth"
            sx={{
              mb: '24px',
              minHeight: 40,
              backgroundColor: '#F1F2F6',
              borderRadius: '10px',
              p: '4px',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 32,
                borderRadius: '8px',
                fontSize: 13.5,
                fontWeight: 600,
                textTransform: 'none',
                color: tokens.textMuted,
              },
              '& .Mui-selected': {
                backgroundColor: '#fff',
                color: `${tokens.navy} !important`,
                boxShadow: tokens.shadowSm,
              },
            }}
          >
            {roles.map((r) => (
              <Tab key={r} value={r} label={ROLE_LABELS[r]} disableRipple />
            ))}
          </Tabs>
        )}

        {children}

        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', textAlign: 'center', mt: '24px' }}>
          {footerText}{' '}
          <Link component={RouterLink} to={footerLinkTo} sx={{ fontWeight: 600 }}>
            {footerLinkText}
          </Link>
        </Typography>
      </Card>

      <Link component={RouterLink} to="/" sx={{ fontSize: 13, color: 'text.secondary', mt: '24px' }} underline="hover">
        ← Back to homepage
      </Link>
    </Box>
  );
}

export { ROLE_LABELS };
