import { Routes, Route } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth';
import Homepage from '../pages/Homepage';
import AdvertiserDashboard from '../pages/AdvertiserDashboard';
import DriverDashboard from '../pages/DriverDashboard';
import AdminLayout from '../components/admin/AdminLayout';
import AdminOverviewPage from '../pages/admin/OverviewPage';
import AdminLiveOperationsPage from '../pages/admin/LiveOperationsPage';
import AdminCampaignsPage from '../pages/admin/CampaignsPage';
import AdminAdvertisersPage from '../pages/admin/AdvertisersPage';
import AdminDriversPage from '../pages/admin/DriversPage';
import AdminTaxiCompaniesPage from '../pages/admin/TaxiCompaniesPage';
import AdminVehiclesPage from '../pages/admin/VehiclesPage';
import AdminScreensPage from '../pages/admin/ScreensPage';
import AdminPricingPage from '../pages/admin/PricingPage';
import AdminFinancePage from '../pages/admin/FinancePage';
import AdminReportsPage from '../pages/admin/ReportsPage';
import AdminSupportPage from '../pages/admin/SupportPage';
import AdminSettingsPage from '../pages/admin/SettingsPage';
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
      {/* Layout route: the shell stays mounted across child navigation, so moving between
          sections does not rebuild the sidebar or re-read the session. */}
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="live" element={<AdminLiveOperationsPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="advertisers" element={<AdminAdvertisersPage />} />
        <Route path="drivers" element={<AdminDriversPage />} />
        <Route path="taxi-companies" element={<AdminTaxiCompaniesPage />} />
        <Route path="vehicles" element={<AdminVehiclesPage />} />
        <Route path="screens" element={<AdminScreensPage />} />
        <Route path="pricing" element={<AdminPricingPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
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
