import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import AuthShell, { AuthField, authFieldSx } from '../layouts/AuthShell';
import PasswordField from '../components/PasswordField';
import { useToast } from '../contexts/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import { canReach, landingFor, SignInError } from '../services/auth';
import { tokens } from '../theme';

/**
 * What a 403 means, in the platform's own words.
 *
 * These are the statuses the API actually returns — `AccountStatus` and `DriverStatus` share the
 * three names, and both 403 bodies carry `{ status, message }`. Nothing here is invented, and the
 * server's own message is always shown underneath: it is the authority on why, and it is what an
 * administrator would have to change to let the person in.
 */
const BLOCKED_ACCOUNT_STATES: Record<string, { title: string; lead: string }> = {
  PendingVerification: {
    title: 'Account under review',
    lead: 'Your AdzOnRoad account has been submitted and is still awaiting activation.',
  },
  Rejected: {
    title: 'Account not approved',
    lead: 'This account was reviewed and not approved.',
  },
  Suspended: {
    title: 'Account suspended',
    lead: 'This account is currently suspended.',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { signInWithEmail, signInWithMobile } = useAuth();
  const [searchParams] = useSearchParams();

  const next = searchParams.get('next');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<SignInError | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setBlocked(null);
    setSubmitting(true);

    try {
      // Which endpoint to call is a property of what was typed, not something to make somebody
      // declare first. Portal accounts authenticate with an email and drivers with a mobile
      // number, and neither endpoint is sent a role — the four tabs that used to sit here only
      // chose between these two calls, and three of them chose the same one.
      const session = identifier.includes('@')
        ? await signInWithEmail(identifier.trim(), password)
        : await signInWithMobile(identifier.trim(), password);

      // Where they land follows the roles the server issued. Someone holding an advertiser account
      // belongs on the advertiser dashboard whatever they believed they were signing into.
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
        setBlocked(e);
      } else {
        setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const blockedState =
    blocked && blocked.accountStatus ? BLOCKED_ACCOUNT_STATES[blocked.accountStatus] : undefined;

  return (
    <AuthShell
      eyebrow="The AdzOnRoad network"
      headline={
        <>
          Welcome back
          <Box component="span" sx={{ display: 'block' }}>
            to the road.
          </Box>
        </>
      }
      copy="Access your campaigns, vehicle activity, fleet operations and AdzOnRoad tools from one place."
      footerTitle="Built for Lebanon"
      footerCopy="Moving digital advertising, designed around the city."
      align="center"
      contentMaxWidth={480}
      showBackLink={blocked === null}
    >
      {blocked ? (
        <Box>
          <Typography
            sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber, mb: '10px' }}
          >
            {blockedState ? 'Account status' : 'Cannot sign in yet'}
          </Typography>

          <Typography
            component="h1"
            sx={{ fontWeight: 800, fontSize: { xs: 26, md: 31 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.12 }}
          >
            {blockedState?.title ?? 'This account is not active'}
          </Typography>

          {blockedState && (
            <Typography sx={{ mt: '14px', fontSize: 15, color: 'text.secondary', lineHeight: 1.7 }}>
              {blockedState.lead}
            </Typography>
          )}

          {/* The server's wording, always. It is the authority on why, and on what would change it. */}
          <Typography sx={{ mt: '12px', fontSize: 14.5, color: 'text.secondary', lineHeight: 1.7 }}>
            {blocked.message}
          </Typography>

          <Box sx={{ mt: '26px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              color="primary"
              size="large"
              sx={{ minHeight: 50, borderRadius: '11px' }}
            >
              Back to homepage
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setBlocked(null);
                setPassword('');
              }}
              sx={{ minHeight: 50, borderRadius: '11px', borderColor: '#DFE3EA', color: tokens.navy }}
            >
              Use a different account
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Typography
            component="h1"
            sx={{ fontWeight: 800, fontSize: { xs: 28, md: 34 }, letterSpacing: '-0.03em', color: tokens.navy, lineHeight: 1.1 }}
          >
            Welcome back.
          </Typography>
          <Typography sx={{ mt: '8px', fontSize: 15, color: 'text.secondary' }}>
            Sign in to your AdzOnRoad account.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: '28px', display: 'grid', gap: '16px' }}>
            {error && (
              <Alert severity="error" sx={{ fontSize: 13, borderRadius: '11px' }}>
                {error}
              </Alert>
            )}

            {/* One field for both endpoints. Drivers sign in with the mobile number they registered
                with, everyone else with their email, and the label says so rather than making the
                distinction a thing to choose up front. */}
            <AuthField id="login-identifier" label="Email or mobile number" required>
              <TextField
                id="login-identifier"
                autoComplete="username"
                required
                fullWidth
                placeholder="name@company.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={submitting}
                sx={authFieldSx}
              />
            </AuthField>

            <AuthField
              id="login-password"
              label="Password"
              required
              /* Recovery differs by role — that page names who restores each kind of account —
                 so the one role signal available here is forwarded. A mobile number in the
                 identifier field means a driver; anything else lets the page default. */
              action={
                <Link
                  component={RouterLink}
                  to={identifier.trim() && !identifier.includes('@') ? '/forgot-password?role=driver' : '/forgot-password'}
                  underline="hover"
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: tokens.textMuted,
                    '&:hover': { color: tokens.navy },
                    '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '3px', borderRadius: '4px' },
                  }}
                >
                  Forgot password?
                </Link>
              }
            >
              <PasswordField
                id="login-password"
                autoComplete="current-password"
                required
                fullWidth
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                sx={authFieldSx}
              />
            </AuthField>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={submitting}
              sx={{ mt: '4px', minHeight: 52, borderRadius: '11px', fontSize: 15.5 }}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting && (
                <Box component="span" aria-hidden sx={{ ml: '9px', fontSize: 16, lineHeight: 1 }}>
                  &rarr;
                </Box>
              )}
            </Button>
          </Box>

          {/* Says why nobody is asked to pick an account type any more. */}
          <Typography sx={{ mt: '20px', fontSize: 13, color: tokens.textMuted, lineHeight: 1.6 }}>
            One login for every AdzOnRoad account. We&rsquo;ll take you to the right workspace after
            you sign in.
          </Typography>

          <Box sx={{ mt: '26px', pt: '22px', borderTop: '1px solid #E9E3D9' }}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              New to AdzOnRoad?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                underline="hover"
                sx={{ fontWeight: 700, color: tokens.navy }}
              >
                Create an account &rarr;
              </Link>
            </Typography>
          </Box>
        </>
      )}
    </AuthShell>
  );
}
