import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  restoreSession,
  signInAsDriver,
  signInToPortal,
  signOut as endSession,
  type Session,
} from '../services/auth';

/**
 * Who is signed in, for the whole app.
 *
 * The session is read from storage once at startup rather than fetched, so a page reload does not
 * flash an empty dashboard or bounce someone to the login screen while a request is in flight.
 * The tokens themselves live in `apiConfig`, which is what the API and hub clients read — this
 * context is the React-facing view of the same thing.
 */

interface AuthContextValue {
  session: Session | null;
  isSignedIn: boolean;
  signInWithEmail: (email: string, password: string) => Promise<Session>;
  signInWithMobile: (mobileNumber: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialiser form: reading storage on every render would be wasteful, and reading it in an
  // effect would render one frame as signed out.
  const [session, setSession] = useState<Session | null>(() => restoreSession());

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const next = await signInToPortal(email, password);
    setSession(next);
    return next;
  }, []);

  const signInWithMobile = useCallback(async (mobileNumber: string, password: string) => {
    const next = await signInAsDriver(mobileNumber, password);
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    // Cleared locally first: whatever the server says, the person in front of the screen is
    // signed out now.
    setSession(null);
    await endSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isSignedIn: session !== null, signInWithEmail, signInWithMobile, signOut }),
    [session, signInWithEmail, signInWithMobile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
