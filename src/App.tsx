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
          <DevSwitcher />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
