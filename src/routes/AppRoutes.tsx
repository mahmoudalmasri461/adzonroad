import { Routes, Route } from 'react-router-dom';
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
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/advertiser" element={<AdvertiserDashboard />} />
      <Route path="/advertiser/campaigns" element={<CampaignsPage />} />
      <Route path="/advertiser/map" element={<LiveMapPage />} />
      <Route path="/advertiser/analytics" element={<AnalyticsPage />} />
      <Route path="/advertiser/creatives" element={<CreativesPage />} />
      <Route path="/advertiser/reports" element={<ReportsPage />} />
      <Route path="/advertiser/billing" element={<BillingPage />} />
      <Route path="/advertiser/support" element={<SupportPage />} />
      <Route path="/advertiser/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/driver" element={<DriverDashboard />} />
      {/* Layout route: the shell + FleetProvider stay mounted across child navigation,
          so cars/drivers added on one page are still there on the others. */}
      <Route path="/taxi-company" element={<TaxiCompanyLayout />}>
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
