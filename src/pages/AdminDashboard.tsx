import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusTag, { type StatusTagVariant } from '../components/StatusTag';
import LebanonMap from '../components/LebanonMap';
import { useToast } from '../components/ToastProvider';
import { tokens } from '../theme';

const NAV_ITEMS = [
  { label: 'Overview', active: true },
  { label: 'Live Operations' },
  { label: 'Campaigns' },
  { label: 'Advertisers' },
  { label: 'Drivers' },
  { label: 'Taxi Companies' },
  { label: 'Vehicles' },
  { label: 'Screens' },
  { label: 'Pricing' },
  { label: 'Finance' },
  { label: 'Reports' },
  { label: 'Support' },
  { label: 'Settings' },
];

const KPIS = [
  { value: '142', label: 'Advertisers' },
  { value: '2,610', label: 'Drivers' },
  { value: '38', label: 'Taxi companies' },
  { value: '1,320', label: 'Registered taxis' },
  { value: '1,248', label: 'Active screens', color: tokens.green },
  { value: '72', label: 'Offline screens', color: tokens.red },
  { value: '86', label: 'Active campaigns' },
  { value: '$186K', label: 'Monthly revenue' },
  { value: '$92K', label: 'Driver payouts' },
  { value: '94.6%', label: 'Fulfilment rate' },
];

const ALERTS: { label: string; status: string; variant: StatusTagVariant }[] = [
  { label: 'AZR-1042 · Beirut', status: 'Disconnected', variant: 'error' },
  { label: 'AZR-0987 · Tripoli', status: 'Maintenance', variant: 'warn' },
  { label: 'AZR-1155 · Zahle', status: 'GPS unavailable', variant: 'neutral' },
  { label: 'AZR-1203 · Sidon', status: 'Suspected tamper', variant: 'error' },
];

type PendingCampaign = {
  id: number;
  name: string;
  advertiser: string;
  regions: string;
  taxis: number;
  budget: string;
  creative: string;
  creativeVariant: StatusTagVariant;
};

const PENDING_CAMPAIGNS: PendingCampaign[] = [
  { id: 1, name: 'Zahle Market Day', advertiser: 'Cedar Retail Group', regions: 'Beqaa', taxis: 26, budget: '$1,300', creative: 'Awaiting approval', creativeVariant: 'outline' },
  { id: 2, name: 'Byblos Summer Fest', advertiser: 'Jbeil Tourism Board', regions: 'Keserwan-Jbeil', taxis: 34, budget: '$2,100', creative: 'Awaiting approval', creativeVariant: 'outline' },
  { id: 3, name: 'North Coast Telecom', advertiser: 'Alfa Lebanon', regions: 'Tripoli, Akkar', taxis: 58, budget: '$5,400', creative: 'Revision requested', creativeVariant: 'neutral' },
];

function getPendingColumns(onReview: (campaign: PendingCampaign) => void): GridColDef<PendingCampaign>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.2, minWidth: 160 },
    { field: 'advertiser', headerName: 'Advertiser', flex: 1, minWidth: 160 },
    { field: 'regions', headerName: 'Regions', flex: 1, minWidth: 140 },
    { field: 'taxis', headerName: 'Taxis', flex: 0.5, minWidth: 80 },
    { field: 'budget', headerName: 'Budget', flex: 0.6, minWidth: 100 },
    {
      field: 'creative',
      headerName: 'Creative',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => <StatusTag label={params.row.creative} variant={params.row.creativeVariant} />,
    },
    {
      field: 'review',
      headerName: '',
      flex: 0.5,
      minWidth: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button size="small" sx={{ fontSize: 13, fontWeight: 600 }} onClick={() => onReview(params.row)}>
          Review
        </Button>
      ),
    },
  ];
}

type Screen = {
  id: number;
  screenId: string;
  plate: string;
  driver: string;
  region: string;
  status: string;
  statusVariant: StatusTagVariant;
  lastSignal: string;
};

const SCREENS: Screen[] = [
  { id: 1, screenId: 'AZR-2291', plate: 'B 84 219', driver: 'Joseph S.', region: 'Mount Lebanon', status: 'Active', statusVariant: 'live', lastSignal: 'Just now' },
  { id: 2, screenId: 'AZR-1042', plate: 'B 12 771', driver: 'Elie H.', region: 'Beirut', status: 'Disconnected', statusVariant: 'error', lastSignal: '3 hrs ago' },
  { id: 3, screenId: 'AZR-0987', plate: 'T 45 032', driver: 'Nadine K.', region: 'Tripoli', status: 'Maintenance', statusVariant: 'warn', lastSignal: '1 day ago' },
  { id: 4, screenId: 'AZR-1155', plate: 'Z 09 284', driver: 'Rami A.', region: 'Zahle', status: 'GPS unavailable', statusVariant: 'neutral', lastSignal: '6 hrs ago' },
  { id: 5, screenId: 'AZR-1310', plate: 'S 77 561', driver: 'Maya D.', region: 'Sidon', status: 'Active', statusVariant: 'live', lastSignal: 'Just now' },
];

function getScreenColumns(onDetails: (screen: Screen) => void): GridColDef<Screen>[] {
  return [
    { field: 'screenId', headerName: 'Screen ID', flex: 0.8, minWidth: 120 },
    { field: 'plate', headerName: 'Vehicle plate', flex: 0.8, minWidth: 120 },
    { field: 'driver', headerName: 'Driver', flex: 0.8, minWidth: 120 },
    { field: 'region', headerName: 'Region', flex: 0.9, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => <StatusTag label={params.row.status} variant={params.row.statusVariant} />,
    },
    { field: 'lastSignal', headerName: 'Last signal', flex: 0.7, minWidth: 110 },
    {
      field: 'details',
      headerName: '',
      flex: 0.5,
      minWidth: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button size="small" sx={{ fontSize: 13, fontWeight: 600 }} onClick={() => onDetails(params.row)}>
          Details
        </Button>
      ),
    },
  ];
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const filteredScreens = SCREENS.filter(
    (s) => s.screenId.toLowerCase().includes(search.toLowerCase()) || s.plate.toLowerCase().includes(search.toLowerCase()) || s.driver.toLowerCase().includes(search.toLowerCase()),
  );
  const pendingColumns = getPendingColumns((campaign) => showToast(`Reviewing ${campaign.name}…`));
  const screenColumns = getScreenColumns((screen) => showToast(`Opening details for ${screen.screenId}…`));

  return (
    <DashboardShell navItems={NAV_ITEMS} avatarInitials="OP" userName="Omar P." userSubtitle="Operations Lead">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.01em' }}>Operations overview</Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: 'text.secondary' }}>
            Platform-wide health across advertisers, drivers and screens.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text }}
            onClick={() => showToast('Export report isn\'t built in this preview yet')}
          >
            Export report
          </Button>
          <Button variant="contained" color="primary" onClick={() => showToast('Live Operations isn\'t built in this preview yet')}>
            Live Operations
          </Button>
        </Box>
      </Box>

      {/* KPI ROW */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '28px' }}>
        {KPIS.map((kpi) => (
          <StatCard key={kpi.label} value={kpi.value} label={kpi.label} color={kpi.color} />
        ))}
      </Box>

      {/* MAP + ALERTS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: '20px', mb: '28px', alignItems: 'stretch' }}>
        <Card sx={{ p: 0, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <LebanonMap />
          </Box>
        </Card>
        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Needs attention
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '12px' }}>Screen alerts</Typography>
          <Box sx={{ display: 'grid', gap: '12px' }}>
            {ALERTS.map((alert) => (
              <Box key={alert.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
                <span>{alert.label}</span>
                <StatusTag label={alert.status} variant={alert.variant} />
              </Box>
            ))}
          </Box>
          <Link
            component="button"
            onClick={() => showToast('Alerts list isn\'t built in this preview yet')}
            sx={{ display: 'inline-block', mt: '14px', fontSize: 13, fontWeight: 600, background: 'none', border: 0, p: 0, cursor: 'pointer' }}
          >
            View all alerts →
          </Link>
        </Card>
      </Box>

      {/* CAMPAIGN APPROVALS */}
      <Card sx={{ p: 0, mb: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Campaigns pending review</Typography>
          <Link
            component="button"
            onClick={() => showToast('Full campaigns list isn\'t built in this preview yet')}
            sx={{ fontSize: 13, fontWeight: 600, background: 'none', border: 0, p: 0, cursor: 'pointer' }}
          >
            See all campaigns
          </Link>
        </Box>
        <Box sx={{ height: 260 }}>
          <DataGrid
            rows={PENDING_CAMPAIGNS}
            columns={pendingColumns}
            hideFooter
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Box>
      </Card>

      {/* SCREEN INVENTORY */}
      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Screen inventory</Typography>
          <TextField
            size="small"
            placeholder="Search by ID, plate, driver"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ height: 380 }}>
          <DataGrid
            rows={filteredScreens}
            columns={screenColumns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            sx={{ border: 'none' }}
          />
        </Box>
      </Card>
    </DashboardShell>
  );
}
