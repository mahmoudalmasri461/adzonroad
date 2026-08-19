import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../contexts/AuthProvider';
import { changePassword, problemsWith } from '../services/password';
import { ApiError } from '../services/apiClient';
import { landingFor } from '../services/auth';

/**
 * Choosing your own password, and the screen an administrator's temporary password leads to.
 *
 * When the session is flagged, this is presented as something that must be done rather than
 * something offered: the temporary password was read aloud over a telephone, so anyone who
 * overheard it can sign in until it is replaced.
 */
export default function ChangePasswordPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverProblems, setServerProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const forced = session?.mustChangePassword === true;
  const localProblems = next.length > 0 ? problemsWith(next, confirmation) : [];
  const canSubmit = current.length > 0 && next.length > 0 && localProblems.length === 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setServerProblems([]);

    try {
      await changePassword({ currentPassword: current, newPassword: next });

      // The server revokes every refresh token on success, including this one, so the session in
      // hand is already half dead. Signing out and back in is honest about that rather than
      // letting the next request fail for reasons the user cannot connect to what they just did.
      await signOut();
      navigate('/login?changed=1', { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        const problems = (e.problems ?? []) as string[];
        if (problems.length > 0) setServerProblems(problems);
        else setError(e.message);
      } else {
        setError('That did not go through. Try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 8, backgroundColor: '#F7F7F5', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#1F2933', letterSpacing: '-0.01em' }}>
          {forced ? 'Choose your own password' : 'Change your password'}
        </Typography>

        <Typography sx={{ mt: '6px', mb: '20px', fontSize: 13.5, color: '#6B7280' }}>
          {forced
            ? 'You are signed in with a temporary password an administrator gave you. Anyone who heard it can use it until you replace it.'
            : 'You will be signed out afterwards, on every device.'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '14px' }}>
          <TextField
            label={forced ? 'Temporary password' : 'Current password'}
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            fullWidth
            required
          />

          <TextField
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            fullWidth
            required
          />

          <TextField
            label="New password again"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="new-password"
            fullWidth
            required
          />

          {localProblems.length > 0 && (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              <Box component="ul" sx={{ m: 0, pl: '18px' }}>
                {localProblems.map((p) => <li key={p}>{p}</li>)}
              </Box>
            </Alert>
          )}

          {serverProblems.length > 0 && (
            <Alert severity="error" sx={{ fontSize: 13 }}>
              <Box component="ul" sx={{ m: 0, pl: '18px' }}>
                {serverProblems.map((p) => <li key={p}>{p}</li>)}
              </Box>
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>}

          <Button
            type="submit"
            disabled={!canSubmit}
            startIcon={submitting ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : undefined}
            sx={{
              mt: '4px',
              backgroundColor: '#E8590C',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              py: '10px',
              '&:hover': { backgroundColor: '#C94F0B' },
              '&.Mui-disabled': { backgroundColor: '#E4E2DD', color: '#6B7280' },
            }}
          >
            {submitting ? 'Changing…' : 'Change password'}
          </Button>

          {/* No way out while forced — leaving would strand a live temporary password. */}
          {!forced && (
            <Button
              onClick={() => navigate(session ? landingFor(session.roles) : '/login')}
              sx={{ textTransform: 'none', color: '#6B7280' }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
