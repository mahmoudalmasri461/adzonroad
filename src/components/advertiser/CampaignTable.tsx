import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { advTokens, cardSx } from './theme';
import StatusChip from './StatusChip';
import EmptyState from './EmptyState';
import SearchBox from '../SearchBox';
import FilterBar from '../FilterBar';
import ConfirmationDialog from '../ConfirmationDialog';
import { useToast } from '../../contexts/ToastProvider';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { formatCurrency, formatNumber } from '../../utils/format';
import { CAMPAIGNS } from '../../data/advertiserMockData';
import type { Campaign, CampaignStatus } from '../../types/advertiser';

const STATUS_OPTIONS: (CampaignStatus | 'All statuses')[] = [
  'All statuses',
  'Draft',
  'Pending Approval',
  'Scheduled',
  'Active',
  'Paused',
  'Completed',
  'Rejected',
];

const ROW_ACTIONS = ['View', 'Edit', 'Pause', 'Duplicate', 'Download Report', 'Archive'];

function ActionsMenu({ campaign }: { campaign: Campaign }) {
  const { showToast } = useToast();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const runAction = (action: string) => {
    setAnchor(null);
    if (action === 'Archive') {
      setConfirmArchive(true);
      return;
    }
    showToast(`${action} isn't built in this preview yet — ${campaign.name}`);
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {ROW_ACTIONS.map((action) => (
          <MenuItem key={action} onClick={() => runAction(action)}>
            {action}
          </MenuItem>
        ))}
      </Menu>
      <ConfirmationDialog
        open={confirmArchive}
        title="Archive campaign?"
        description={`"${campaign.name}" will be moved out of your active campaigns list. This isn't wired up to real data in this preview yet.`}
        confirmLabel="Archive"
        destructive
        onConfirm={() => {
          setConfirmArchive(false);
          showToast(`Archived ${campaign.name}`);
        }}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}

function getColumns(): GridColDef<Campaign>[] {
  return [
    { field: 'name', headerName: 'Campaign', flex: 1.3, minWidth: 170 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <StatusChip status={params.row.status} size="small" />,
    },
    { field: 'region', headerName: 'Region', flex: 1, minWidth: 150 },
    { field: 'startDate', headerName: 'Start date', flex: 0.7, minWidth: 110 },
    { field: 'endDate', headerName: 'End date', flex: 0.7, minWidth: 110 },
    { field: 'screens', headerName: 'Screens', flex: 0.5, minWidth: 90, type: 'number' },
    {
      field: 'verifiedPlays',
      headerName: 'Verified plays',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (value: number) => formatNumber(value),
    },
    {
      field: 'impressions',
      headerName: 'Impressions',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (value: number) => formatNumber(value),
    },
    {
      field: 'budget',
      headerName: 'Budget',
      flex: 0.6,
      minWidth: 100,
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'spent',
      headerName: 'Spent',
      flex: 0.6,
      minWidth: 100,
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'deliveryPercent',
      headerName: 'Delivery',
      flex: 0.6,
      minWidth: 100,
      valueFormatter: (value: number) => `${value}%`,
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.4,
      minWidth: 56,
      sortable: false,
      filterable: false,
      renderCell: (params) => <ActionsMenu campaign={params.row} />,
    },
  ];
}

export default function CampaignTable() {
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('All statuses');
  const [region, setRegion] = useState('All regions');

  const regionOptions = useMemo(() => ['All regions', ...Array.from(new Set(CAMPAIGNS.map((c) => c.region)))], []);
  const columns = useMemo(() => getColumns(), []);

  const statusRegionFiltered = useMemo(
    () =>
      CAMPAIGNS.filter((c) => {
        if (status !== 'All statuses' && c.status !== status) return false;
        if (region !== 'All regions' && c.region !== region) return false;
        return true;
      }),
    [status, region],
  );
  const { search, setSearch, filtered } = useSearchFilter(statusRegionFiltered, ['name']);

  return (
    <Box sx={{ ...cardSx, p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '18px 20px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: advTokens.text }}>Recent Campaigns</Typography>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search campaigns" width={200} />
          <TextField size="small" select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} sx={{ width: 168 }}>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" select value={region} onChange={(e) => setRegion(e.target.value)} sx={{ width: 168 }}>
            {regionOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </FilterBar>
      </Box>
      {filtered.length === 0 ? (
        <EmptyState title="No campaigns match your filters" description="Try clearing search or filters to see more campaigns." />
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
      )}
    </Box>
  );
}
