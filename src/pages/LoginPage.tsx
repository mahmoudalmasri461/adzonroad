import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AuthLayout, { type AuthRole } from '../layouts/AuthLayout';
import PasswordField from '../components/PasswordField';
import { useToast } from '../contexts/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import { canReach, landingFor, SignInError } from '../services/auth';

function isAuthRole(value: string | null): value is AuthRole {
  return value === 'advertiser' || value === 'admin' || value === 'driver' || value === 'taxiCompany';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { signInWithEmail, signInWithMobile } = useAuth();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role');
  const next = searchParams.get('next');

  const [role, setRole] = useState<AuthRole>(isAuthRole(initialRole) ? initialRole : 'advertiser');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Drivers authenticate by mobile number against a different endpoint; the portal one refuses
  // them outright, since a driver's place is the app.
  const isDriver = role === 'driver';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(null);
    setSubmitting(true);

    try {
      const session = isDriver
        ? await signInWithMobile(identifier.trim(), password)
        : await signInWithEmail(identifier.trim(), password);

      // Where they land follows the roles the server issued, not the tab they chose. Someone who
      // picks "Admin" and holds an advertiser account belongs on the advertiser dashboard — the
      // alternative is a screen that implies access they do not have.
      const destination =
        next && canReach(session.roles, decodeURIComponent(next))
          ? decodeURIComponent(next)
          : landingFor(session.roles);

      showToast(`Signed in as ${session.displayName}`);
      navigate(destination, { replace: true });
    } catch (e: unknown) {
      if (e instanceof SignInError && e.isAwaitingReview) {
        // Not a credential problem. Telling them the password was wrong would send them round a
        // reset loop that cannot possibly help.
        setPending(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AdzOnRoad account"
      role={role}
      onRoleChange={(r) => {
        setRole(r);
        setError(null);
        setPending(null);
      }}
      roles={['advertiser', 'admin', 'driver', 'taxiCompany']}
      footerText={role === 'admin' ? 'Admin accounts are managed by your organization.' : "Don't have an account?"}
      footerLinkText={role === 'admin' ? 'Contact support' : 'Sign up'}
      footerLinkTo={role === 'admin' ? '/' : `/signup?role=${role}`}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '16px' }}>
        {error && <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>}
        {pending && <Alert severity="info" sx={{ fontSize: 13 }}>{pending}</Alert>}

        <TextField
          label={isDriver ? 'Mobile number' : 'Email'}
          type={isDriver ? 'tel' : 'email'}
          autoComplete={isDriver ? 'tel' : 'email'}
          required
          fullWidth
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={submitting}
        />
        <Box>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '6px' }}>
            {/* Carries the chosen role across: who restores an account differs by role, and
                arriving on that page having to pick the tab again wastes the one thing the
                person already told us. */}
            <Link
              component={RouterLink}
              to={`/forgot-password?role=${role}`}
              sx={{ fontSize: 12.5 }}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
