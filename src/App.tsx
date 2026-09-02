import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './contexts/ToastProvider';
import DevSwitcher from './components/DevSwitcher';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          {/* A development convenience, not part of the product. It was rendering on every page
              in production, including the public homepage, where a floating bar offering Admin
              and Driver views is both confusing and an invitation. Dev builds keep it. */}
          {import.meta.env.DEV && <DevSwitcher />}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
