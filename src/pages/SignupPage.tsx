import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AuthLayout from '../layouts/AuthLayout';
import { useToast } from '../contexts/ToastProvider';
import { LEBANON_REGIONS } from '../data/lebanonRegions';
import { tokens } from '../theme';

type SignupRole = 'advertiser' | 'driver' | 'taxiCompany';

const ROLE_DASHBOARD: Record<SignupRole, string> = {
  advertiser: '/advertiser',
  driver: '/driver',
  taxiCompany: '/taxi-company',
};

function isSignupRole(value: string | null): value is SignupRole {
  return value === 'advertiser' || value === 'driver' || value === 'taxiCompany';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState<SignupRole>(isSignupRole(initialRole) ? initialRole : 'advertiser');
  const [name, setName] = useState('');
  const [secondField, setSecondField] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [region, setRegion] = useState(LEBANON_REGIONS[0]);
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'taxiCompany') {
      setPendingVerification(true);
      return;
    }
    showToast(`Account created for ${role}`);
    navigate(ROLE_DASHBOARD[role]);
  };

  if (pendingVerification) {
    return (
      <AuthLayout
        title="Application submitted"
        subtitle="Your taxi company account is being reviewed"
        role={role}
        onRoleChange={(r) => setRole(r as SignupRole)}
        roles={['advertiser', 'driver', 'taxiCompany']}
        footerText="Already have an account?"
        footerLinkText="Log in"
        footerLinkTo="/login?role=taxiCompany"
      >
        <Box sx={{ textAlign: 'center', py: '8px' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 48, color: tokens.green, mb: '12px' }} />
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '8px' }}>Thanks, {name || 'partner'} — we've got it.</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Our team reviews every taxi company application before activating an account — this usually takes 1–2 business
            days. We'll email and call you once you're verified.
          </Typography>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AdzOnRoad in minutes"
      role={role}
      onRoleChange={(r) => setRole(r as SignupRole)}
      roles={['advertiser', 'driver', 'taxiCompany']}
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo={`/login?role=${role}`}
    >
      {role === 'taxiCompany' ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
          <TextField label="Company name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Email" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Mobile number" required fullWidth value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <TextField label="Region" select required fullWidth value={region} onChange={(e) => setRegion(e.target.value)}>
            {LEBANON_REGIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
            Submit for verification
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
          <TextField label="Full name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label={role === 'advertiser' ? 'Company name' : 'Phone number'}
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
      )}
      <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', mt: '16px' }}>
        This is a preview — no account data is actually stored.
      </Typography>
    </AuthLayout>
  );
}
