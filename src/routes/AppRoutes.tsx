import { Routes, Route } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth';
import Homepage from '../pages/Homepage';
import AdvertiserDashboard from '../pages/AdvertiserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import DriverDashboard from '../pages/DriverDashboard';
import TaxiCompanyLayout from '../components/taxiCompany/TaxiCompanyLayout';
import TaxiOverviewPage from '../pages/taxiCompany/OverviewPage';
import TaxiCarsPage from '../pages/taxiCompany/CarsPage';
import TaxiDriversPage from '../pages/taxiCompany/DriversPage';
import TaxiEarningsPage from '../pages/taxiCompany/EarningsPage';
import TaxiScreensPage from '../pages/taxiCompany/ScreensPage';
import TaxiReportsPage from '../pages/taxiCompany/ReportsPage';
import TaxiSupportPage from '../pages/taxiCompany/SupportPage';
import TaxiSettingsPage from '../pages/taxiCompany/SettingsPage';
import LoginPage from '../pages/LoginPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import SignupPage from '../pages/SignupPage';
import CampaignsPage from '../pages/advertiser/CampaignsPage';
import LiveMapPage from '../pages/advertiser/LiveMapPage';
import AnalyticsPage from '../pages/advertiser/AnalyticsPage';
import CreativesPage from '../pages/advertiser/CreativesPage';
import ReportsPage from '../pages/advertiser/ReportsPage';
import BillingPage from '../pages/advertiser/BillingPage';
import SupportPage from '../pages/advertiser/SupportPage';
import SettingsPage from '../pages/advertiser/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
      <Route path="/signup" element={<SignupPage />} />
      {/* Everything below the public pages requires a session. The guard hides surfaces rather
          than securing them — every endpoint enforces its own permissions independently. */}
      <Route path="/advertiser" element={<RequireAuth><AdvertiserDashboard /></RequireAuth>} />
      <Route path="/advertiser/campaigns" element={<RequireAuth><CampaignsPage /></RequireAuth>} />
      <Route path="/advertiser/map" element={<RequireAuth><LiveMapPage /></RequireAuth>} />
      <Route path="/advertiser/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
      <Route path="/advertiser/creatives" element={<RequireAuth><CreativesPage /></RequireAuth>} />
      <Route path="/advertiser/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
      <Route path="/advertiser/billing" element={<RequireAuth><BillingPage /></RequireAuth>} />
      <Route path="/advertiser/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
      <Route path="/advertiser/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
      <Route path="/driver" element={<RequireAuth><DriverDashboard /></RequireAuth>} />
      {/* Layout route: the shell + FleetProvider stay mounted across child navigation,
          so cars/drivers added on one page are still there on the others. */}
      <Route path="/taxi-company" element={<RequireAuth><TaxiCompanyLayout /></RequireAuth>}>
        <Route index element={<TaxiOverviewPage />} />
        <Route path="cars" element={<TaxiCarsPage />} />
        <Route path="drivers" element={<TaxiDriversPage />} />
        <Route path="earnings" element={<TaxiEarningsPage />} />
        <Route path="screens" element={<TaxiScreensPage />} />
        <Route path="reports" element={<TaxiReportsPage />} />
        <Route path="support" element={<TaxiSupportPage />} />
        <Route path="settings" element={<TaxiSettingsPage />} />
      </Route>
    </Routes>
  );
}
