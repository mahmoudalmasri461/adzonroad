import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DashboardShell from '../layouts/DashboardShell';
import StatCard from '../components/StatCard';
import StatusTag from '../components/StatusTag';
import LebanonMap from '../components/LebanonMap';
import PageHeader from '../components/PageHeader';
import SearchBox from '../components/SearchBox';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastProvider';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { NAV_ITEMS, KPIS, ALERTS, PENDING_CAMPAIGNS, SCREENS } from '../data/adminMockData';
import type { PendingCampaign, AdminScreen } from '../types/admin';
import { tokens } from '../theme';

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

function getScreenColumns(onDetails: (screen: AdminScreen) => void): GridColDef<AdminScreen>[] {
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
  const { search, setSearch, filtered: filteredScreens } = useSearchFilter(SCREENS, ['screenId', 'plate', 'driver']);
  const pendingColumns = getPendingColumns((campaign) => showToast(`Reviewing ${campaign.name}…`));
  const screenColumns = getScreenColumns((screen) => showToast(`Opening details for ${screen.screenId}…`));

  return (
    <DashboardShell navItems={NAV_ITEMS} avatarInitials="OP" userName="Omar P." userSubtitle="Operations Lead">
      <PageHeader
        title="Operations overview"
        subtitle="Platform-wide health across advertisers, drivers and screens."
        actions={
          <>
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
          </>
        }
      />

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
          {ALERTS.length === 0 ? (
            <EmptyState title="No active alerts" description="Every screen is reporting normally." />
          ) : (
            <Box sx={{ display: 'grid', gap: '12px' }}>
              {ALERTS.map((alert) => (
                <Box key={alert.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
                  <span>{alert.label}</span>
                  <StatusTag label={alert.status} variant={alert.variant} />
                </Box>
              ))}
            </Box>
          )}
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
        {PENDING_CAMPAIGNS.length === 0 ? (
          <EmptyState title="No campaigns pending review" description="New submissions will show up here for approval." />
        ) : (
          <Box sx={{ height: 260 }}>
            <DataGrid rows={PENDING_CAMPAIGNS} columns={pendingColumns} hideFooter disableRowSelectionOnClick sx={{ border: 'none' }} />
          </Box>
        )}
      </Card>

      {/* SCREEN INVENTORY */}
      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Screen inventory</Typography>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by ID, plate, driver" width={240} />
        </Box>
        {filteredScreens.length === 0 ? (
          <EmptyState title="No screens match your search" description="Try a different screen ID, plate, or driver name." />
        ) : (
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
        )}
      </Card>
    </DashboardShell>
  );
}
