import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastProvider';
import DevSwitcher from './components/DevSwitcher';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
        <DevSwitcher />
      </ToastProvider>
    </BrowserRouter>
  );
}
