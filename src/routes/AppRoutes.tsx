import { Routes, Route } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import AdvertiserDashboard from '../pages/AdvertiserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import DriverDashboard from '../pages/DriverDashboard';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/advertiser" element={<AdvertiserDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/driver" element={<DriverDashboard />} />
    </Routes>
  );
}
