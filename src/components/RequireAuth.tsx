import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { canReach, landingFor } from '../services/auth';

/**
 * Gate in front of the portal routes.
 *
 * This hides what a user has no business seeing; it does not secure it. Every endpoint enforces
 * its own permissions, and the tenant filters run in the database — so getting this wrong shows
 * someone an empty page, not someone else's data. It exists because offering an advertiser an
 * admin dashboard where every request fails is a worse experience than not offering it.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    // Where they were going is remembered, so signing in resumes the task rather than dumping
    // them on a dashboard to navigate back from.
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // A temporary password an administrator read out over the telephone is live until it is
  // replaced, so the portal will not go anywhere else until it has been. The API deliberately does
  // not enforce this - the driver app has no change-password screen and blocking there would
  // strand the people a reset exists to rescue - which makes this the only place it is insisted on.
  if (session.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!canReach(session.roles, location.pathname)) {
    return <Navigate to={landingFor(session.roles)} replace />;
  }

  return <>{children}</>;
}
