import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { ChartsDataProvider } from '@mui/x-charts/ChartsDataProvider';
import { ChartsSurface } from '@mui/x-charts/ChartsSurface';
import { BarPlot } from '@mui/x-charts/BarChart';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusTag, { type StatusTagVariant } from '../components/StatusTag';
import DataStatusLegend from '../components/DataStatusLegend';
import LebanonMap from '../components/LebanonMap';
import CreateCampaignDialog from '../components/CreateCampaignDialog';
import { useToast } from '../components/ToastProvider';
import { tokens } from '../theme';

const NAV_ITEMS = [
  { label: 'Overview', active: true },
  { label: 'Campaigns' },
  { label: 'Create Campaign' },
  { label: 'Live Map' },
  { label: 'Reports' },
  { label: 'Billing' },
  { label: 'Support' },
  { label: 'Settings' },
];

const KPIS = [
  { value: '6', label: 'Active campaigns' },
  { value: '$28,500', label: 'Total budget' },
  { value: '$16,940', label: 'Spent' },
  { value: '$11,560', label: 'Remaining balance' },
  { value: '312', label: 'Active taxis' },
  { value: '4,860', label: 'Verified hours' },
  { value: '97.2%', label: 'Screen uptime', color: tokens.green },
  { value: '~340K', label: 'Est. impressions' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DISPLAY_HOURS = [6, 7.8, 5, 9, 7, 10, 8.2];
const SPEND = [4.4, 6, 3.6, 8, 5, 8.6, 3.8];

const REGIONAL_DISTRIBUTION = [
  { name: 'Beirut', pct: 34 },
  { name: 'Mount Lebanon', pct: 21 },
  { name: 'Tripoli', pct: 14 },
  { name: 'Sidon', pct: 12 },
  { name: 'Other', pct: 19 },
];

type Campaign = {
  id: number;
  name: string;
  status: string;
  statusVariant: StatusTagVariant;
  regions: string;
  taxis: number;
  budget: string;
  spent: string;
  dates: string;
};

const CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Spring Retail Push', status: 'Active', statusVariant: 'live', regions: 'Beirut, Mount Lebanon', taxis: 84, budget: '$6,000', spent: '$3,420', dates: 'Jun 1 – Jul 31' },
  { id: 2, name: 'Zaatar & Co. Launch', status: 'Active', statusVariant: 'live', regions: 'Beirut', taxis: 40, budget: '$3,200', spent: '$2,910', dates: 'Jul 10 – Aug 20' },
  { id: 3, name: 'Tripoli Expansion', status: 'Scheduled', statusVariant: 'outline', regions: 'Tripoli, Akkar', taxis: 52, budget: '$4,100', spent: '$0', dates: 'Aug 5 – Sep 5' },
  { id: 4, name: 'Ramadan Campaign', status: 'Ended', statusVariant: 'neutral', regions: 'Nationwide', taxis: 310, budget: '$12,000', spent: '$11,860', dates: 'Mar 1 – Mar 30' },
  { id: 5, name: 'South Coast Awareness', status: 'Active', statusVariant: 'live', regions: 'Sidon, Tyre', taxis: 60, budget: '$2,900', spent: '$1,340', dates: 'Jul 15 – Aug 15' },
  { id: 6, name: 'Zahle Market Day', status: 'Pending review', statusVariant: 'outline', regions: 'Beqaa', taxis: 26, budget: '$1,300', spent: '$0', dates: 'Aug 1 – Aug 10' },
];

function getCampaignColumns(onView: (campaign: Campaign) => void): GridColDef<Campaign>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.2, minWidth: 160 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => <StatusTag label={params.row.status} variant={params.row.statusVariant} />,
    },
    { field: 'regions', headerName: 'Regions', flex: 1, minWidth: 160 },
    { field: 'taxis', headerName: 'Taxis', flex: 0.5, minWidth: 80 },
    { field: 'budget', headerName: 'Budget', flex: 0.6, minWidth: 100 },
    { field: 'spent', headerName: 'Spent', flex: 0.6, minWidth: 100 },
    { field: 'dates', headerName: 'Dates', flex: 1, minWidth: 150 },
    {
      field: 'view',
      headerName: '',
      flex: 0.4,
      minWidth: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button size="small" sx={{ fontSize: 13, fontWeight: 600 }} onClick={() => onView(params.row)}>
          View
        </Button>
      ),
    },
  ];
}

export default function AdvertiserDashboard() {
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCampaigns = CAMPAIGNS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const columns = getCampaignColumns((campaign) => showToast(`Opening ${campaign.name}…`));

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    onClick: item.label === 'Create Campaign' ? () => setDialogOpen(true) : undefined,
  }));

  return (
    <DashboardShell navItems={navItems} avatarInitials="RK" userName="Rania K." userSubtitle="Cedar Retail Group">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.01em' }}>Overview</Typography>
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: 'text.secondary' }}>
            Welcome back — here's how your campaigns are performing.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text }}
            onClick={() => showToast('Reports isn\'t built in this preview yet')}
          >
            Reports
          </Button>
          <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
            Create Campaign
          </Button>
        </Box>
      </Box>

      {/* KPI ROW */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: '14px', mb: '28px' }}>
        {KPIS.map((kpi) => (
          <StatCard key={kpi.label} value={kpi.value} label={kpi.label} color={kpi.color} padding={20} />
        ))}
      </Box>

      {/* CHARTS ROW */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr' }, gap: '20px', mb: '28px' }}>
        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Last 7 days
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '4px' }}>Verified advertising hours &amp; spend</Typography>
          <Box sx={{ height: 220 }}>
            <ChartsDataProvider
              series={[
                { type: 'bar', data: DISPLAY_HOURS, label: 'Display hours', color: '#C9D5F5', yAxisId: 'hours' },
                { type: 'line', data: SPEND, label: 'Daily spend ($00s)', color: tokens.amber, yAxisId: 'spend' },
              ]}
              xAxis={[{ scaleType: 'band', data: DAYS, id: 'days' }]}
              yAxis={[{ id: 'hours' }, { id: 'spend' }]}
              height={220}
            >
              <ChartsSurface>
                <BarPlot />
                <LinePlot />
                <MarkPlot />
                <ChartsXAxis axisId="days" />
                <ChartsYAxis axisId="hours" />
                <ChartsTooltip />
              </ChartsSurface>
            </ChartsDataProvider>
          </Box>
          <Box sx={{ display: 'flex', gap: '16px', mt: '4px', fontSize: 12, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#C9D5F5' }} />
              Display hours
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.amber }} />
              Daily spend ($00s)
            </Box>
          </Box>
        </Card>
        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            By region
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '14px' }}>Regional distribution</Typography>
          <Box sx={{ display: 'grid', gap: '10px' }}>
            {REGIONAL_DISTRIBUTION.map((r) => (
              <Box key={r.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, mb: '4px' }}>
                  <span>{r.name}</span>
                  <span style={{ color: tokens.textMuted }}>{r.pct}%</span>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={r.pct}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: '#EEF1F8', '& .MuiLinearProgress-bar': { backgroundColor: tokens.blue, borderRadius: 3 } }}
                />
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      {/* DATA STATUS LEGEND */}
      <Box sx={{ mb: '28px' }}>
        <DataStatusLegend />
      </Box>

      {/* MAP + FLEET STATUS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.8fr 1.2fr' }, gap: '20px', mb: '28px', alignItems: 'stretch' }}>
        <Card sx={{ p: 0, overflow: 'hidden', position: 'relative', minHeight: 320 }}>
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <LebanonMap />
          </Box>
        </Card>
        <Card sx={{ p: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Active now
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '10px' }}>Fleet status</Typography>
          <Box sx={{ display: 'grid', gap: '10px', fontSize: 14 }}>
            {[
              ['Taxis displaying now', '288'],
              ['Online, not displaying', '16'],
              ['Offline / GPS lost', '8'],
              ['Distance covered today', '4,120 km'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: tokens.textMuted }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: '16px', pt: '16px', borderTop: `1px solid ${tokens.border}` }}>
            <StatusTag label="Beirut — high fulfilment" variant="live" />
          </Box>
        </Card>
      </Box>

      {/* CAMPAIGNS TABLE */}
      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Campaigns</Typography>
          <TextField
            size="small"
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 220 }}
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
        <Box sx={{ height: 420 }}>
          <DataGrid
            rows={filteredCampaigns}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            sx={{ border: 'none' }}
          />
        </Box>
      </Card>

      <CreateCampaignDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </DashboardShell>
  );
}
