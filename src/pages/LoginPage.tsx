import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import AuthLayout, { type AuthRole } from '../layouts/AuthLayout';
import { useToast } from '../contexts/ToastProvider';

const ROLE_DASHBOARD: Record<AuthRole, string> = {
  advertiser: '/advertiser',
  admin: '/admin',
  driver: '/driver',
  taxiCompany: '/taxi-company',
};

function isAuthRole(value: string | null): value is AuthRole {
  return value === 'advertiser' || value === 'admin' || value === 'driver' || value === 'taxiCompany';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<AuthRole>(isAuthRole(initialRole) ? initialRole : 'advertiser');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Signed in as ${role}`);
    navigate(ROLE_DASHBOARD[role]);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AdzOnRoad account"
      role={role}
      onRoleChange={setRole}
      roles={['advertiser', 'admin', 'driver', 'taxiCompany']}
      footerText={role === 'admin' ? 'Admin accounts are managed by your organization.' : "Don't have an account?"}
      footerLinkText={role === 'admin' ? 'Contact support' : 'Sign up'}
      footerLinkTo={role === 'admin' ? '/' : `/signup?role=${role}`}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
        <TextField
          label={role === 'taxiCompany' ? 'Email or mobile number' : 'Email'}
          type={role === 'taxiCompany' ? 'text' : 'email'}
          required
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Box>
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '6px' }}>
            <Link
              component="button"
              type="button"
              onClick={() => showToast('Password reset isn\'t wired up in this preview yet')}
              sx={{ fontSize: 12.5, background: 'none', border: 0, p: 0, cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>
        <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
          Sign In
        </Button>
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', mt: '16px' }}>
        This is a preview — any email and password will sign you in.
      </Typography>
    </AuthLayout>
  );
}
