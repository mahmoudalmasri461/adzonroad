import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import SearchBox from '../SearchBox';
import FilterBar from '../FilterBar';
import { usePortfolio } from './PortfolioContext';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { formatCurrency, formatNumber } from '../../utils/format';
import { describeStatus, type CampaignStatus } from '../../services/campaigns';
import {
  describeSchedule,
  formatScreenTime,
  type CampaignDelivery,
} from '../../services/advertiserAnalytics';

/**
 * Every campaign on the account, with what each one actually delivered.
 *
 * The columns are the ones the platform can answer. Budget and spend are gone: a campaign carries
 * one agreed price, billed once when a reviewer schedules it, and there is no running spend to
 * report — the fixture's "$4,920 of $6,000 spent" described a metering model the product does not
 * have. Screens are gone for the same reason; assignment counts are not exposed to advertisers.
 */

const STATUS_OPTIONS: (CampaignStatus | 'All statuses')[] = [
  'All statuses',
  'Draft',
  'PendingApproval',
  'Scheduled',
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
  'Rejected',
];

/** Flattened for the grid, which wants one object per row with sortable primitive fields. */
interface CampaignRow {
  id: string;
  name: string;
  status: CampaignStatus;
  statusLabel: string;
  regions: string;
  startDate: string;
  endDate: string;
  schedule: string;
  taxiCount: number;
  verifiedPlays: number;
  verifiedSeconds: number;
  verifiedPercent: number | null;
  price: number;
  reported: boolean;
}

function toRow(row: CampaignDelivery): CampaignRow {
  const { campaign } = row;

  return {
    id: campaign.campaignId,
    name: campaign.name,
    status: campaign.status,
    statusLabel: describeStatus(campaign.status),
    regions: campaign.regions.length > 0 ? campaign.regions.join(', ') : '—',
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    schedule: describeSchedule(campaign),
    taxiCount: campaign.taxiCount,
    verifiedPlays: row.verifiedPlays,
    verifiedSeconds: row.verifiedSeconds,
    verifiedPercent: row.totalClaims === 0 ? null : Math.round(row.verifiedShare * 100),
    price: campaign.price,
    reported: row.totalClaims > 0,
  };
}

function ActionsMenu({ row }: { row: CampaignRow }) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  // One action, because one action exists. Pause, duplicate and archive were offered before and
  // every one of them raised a toast saying it was not built; an empty menu item is worse than a
  // short menu.
  const actions: { label: string; run: () => void }[] = [
    { label: 'Proof of delivery', run: () => navigate(`/advertiser/reports?campaign=${encodeURIComponent(row.id)}`) },
  ];

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => {
              setAnchor(null);
              action.run();
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function getColumns(): GridColDef<CampaignRow>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.3, minWidth: 170 },
    { field: 'statusLabel', headerName: 'Status', flex: 0.9, minWidth: 150 },
    { field: 'regions', headerName: 'Regions', flex: 1.1, minWidth: 150 },
    { field: 'startDate', headerName: 'Start date', flex: 0.7, minWidth: 110 },
    { field: 'endDate', headerName: 'End date', flex: 0.7, minWidth: 110 },
    { field: 'schedule', headerName: 'Schedule', flex: 0.8, minWidth: 120 },
    { field: 'taxiCount', headerName: 'Taxis', flex: 0.45, minWidth: 80, type: 'number' },
    {
      field: 'verifiedPlays',
      headerName: 'Verified plays',
      flex: 0.8,
      minWidth: 120,
      type: 'number',
      renderCell: (params) => (params.row.reported ? formatNumber(params.row.verifiedPlays) : '—'),
    },
    {
      field: 'verifiedSeconds',
      headerName: 'On screen',
      flex: 0.7,
      minWidth: 110,
      type: 'number',
      renderCell: (params) => (params.row.reported ? formatScreenTime(params.row.verifiedSeconds) : '—'),
    },
    {
      field: 'verifiedPercent',
      headerName: 'Verified',
      flex: 0.6,
      minWidth: 100,
      type: 'number',
      renderCell: (params) => (params.row.verifiedPercent === null ? '—' : `${params.row.verifiedPercent}%`),
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.6,
      minWidth: 100,
      type: 'number',
      renderCell: (params) => (params.row.price > 0 ? formatCurrency(params.row.price) : '—'),
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.4,
      minWidth: 56,
      sortable: false,
      filterable: false,
      renderCell: (params) => <ActionsMenu row={params.row} />,
    },
  ];
}

export default function CampaignTable() {
  const { portfolio, state, days } = usePortfolio();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('All statuses');
  const [region, setRegion] = useState('All regions');

  const rows = useMemo(() => (portfolio?.byCampaign ?? []).map(toRow), [portfolio]);
  const columns = useMemo(() => getColumns(), []);

  // Built from the campaigns themselves, so the filter can never offer a region nobody booked.
  const regionOptions = useMemo(() => {
    const named = new Set<string>();
    for (const row of portfolio?.byCampaign ?? []) {
      for (const name of row.campaign.regions) named.add(name);
    }
    return ['All regions', ...[...named].sort()];
  }, [portfolio]);

  const statusRegionFiltered = useMemo(
    () =>
      rows.filter((row) => {
        if (status !== 'All statuses' && row.status !== status) return false;
        if (region !== 'All regions' && !row.regions.split(', ').includes(region)) return false;
        return true;
      }),
    [rows, status, region],
  );
  const { search, setSearch, filtered } = useSearchFilter(statusRegionFiltered, ['name']);

  return (
    <Box sx={{ ...cardSx, p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '18px 20px' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: advTokens.text }}>Your Campaigns</Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted, mt: '2px' }}>
            Delivery figures cover the last {days} days
          </Typography>
        </Box>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search campaigns" width={200} />
          <TextField size="small" select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} sx={{ width: 190 }}>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option === 'All statuses' ? option : describeStatus(option)}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" select value={region} onChange={(e) => setRegion(e.target.value)} sx={{ width: 168 }}>
            {regionOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </FilterBar>
      </Box>

      {state === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
          <CircularProgress size={22} />
        </Box>
      )}

      {state === 'error' && (
        <Box sx={{ px: '20px', pb: '20px' }}>
          <Alert severity="info" sx={{ fontSize: 13 }}>Could not load your campaigns.</Alert>
        </Box>
      )}

      {state === 'ready' && (
        filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
            description={
              rows.length === 0
                ? 'Use "Create Campaign" to submit your first one for review.'
                : 'Try clearing the search or filters to see more campaigns.'
            }
          />
        ) : (
          <Box sx={{ height: 440 }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              sx={{ border: 'none', fontSize: 13 }}
            />
          </Box>
        )
      )}
    </Box>
  );
}
