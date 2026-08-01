import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/ToastProvider';

const ROLE_DASHBOARD: Record<'advertiser' | 'driver', string> = {
  advertiser: '/advertiser',
  driver: '/driver',
};

const ROLE_SECOND_FIELD: Record<'advertiser' | 'driver', string> = {
  advertiser: 'Company name',
  driver: 'Phone number',
};

function isSignupRole(value: string | null): value is 'advertiser' | 'driver' {
  return value === 'advertiser' || value === 'driver';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<'advertiser' | 'driver'>(isSignupRole(initialRole) ? initialRole : 'advertiser');
  const [name, setName] = useState('');
  const [secondField, setSecondField] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Account created for ${role}`);
    navigate(ROLE_DASHBOARD[role]);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AdzOnRoad in minutes"
      role={role}
      onRoleChange={(r) => setRole(r as 'advertiser' | 'driver')}
      roles={['advertiser', 'driver']}
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo={`/login?role=${role}`}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
        <TextField label="Full name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label={ROLE_SECOND_FIELD[role]}
          required
          fullWidth
          value={secondField}
          onChange={(e) => setSecondField(e.target.value)}
        />
        <TextField label="Email" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
          Create Account
        </Button>
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', mt: '16px' }}>
        This is a preview — no account data is actually stored.
      </Typography>
    </AuthLayout>
  );
}
