import { useMemo } from 'react';
import Box from '@mui/material/Box';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import {
  fetchAdvertisers,
  fetchCampaigns,
  fetchInvoices,
  readableStatus,
  toneForStatus,
  waitingFor,
  type AccountRegistration,
  type AdminCampaign,
  type AdminInvoice,
} from '../../services/admin';
import { formatCurrency } from '../../utils/format';
import { tokens } from '../../theme';

/**
 * Every advertiser account, at whatever stage it has reached.
 *
 * Campaign and billing totals are joined in here rather than fetched per row: a table of forty
 * advertisers that fetches a summary each is forty round trips, and the figures would arrive at
 * forty different moments. Both lists are already needed whole for their own counts.
 */

function getColumns(
  campaignsBy: Map<string, number>,
  billedBy: Map<string, number>,
): GridColDef<AccountRegistration>[] {
  return [
    { field: 'companyName', headerName: 'Company', flex: 1.1, minWidth: 180 },
    {
      field: 'contactName',
      headerName: 'Contact',
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.contactName || '—',
    },
    { field: 'email', headerName: 'Email', flex: 1.1, minWidth: 200 },
    {
      field: 'mobileNumber',
      headerName: 'Mobile',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => row.mobileNumber ?? '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'campaigns',
      headerName: 'Campaigns',
      flex: 0.6,
      minWidth: 110,
      type: 'number',
      valueGetter: (_v, row) => campaignsBy.get(row.accountId) ?? 0,
    },
    {
      field: 'billed',
      headerName: 'Billed',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_v, row) => formatCurrency(billedBy.get(row.accountId) ?? 0),
    },
    {
      field: 'createdAtUtc',
      headerName: 'Registered',
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => `${waitingFor(row.createdAtUtc)} ago`,
    },
  ];
}

export default function AdvertisersPage() {
  const loaded = useAsyncData<{
    advertisers: AccountRegistration[];
    campaigns: AdminCampaign[];
    invoices: AdminInvoice[];
  }>(
    async (signal) => {
      const [advertisers, campaigns, invoices] = await Promise.all([
        fetchAdvertisers('all', signal),
        // Both are optional enrichment: an administrator without campaign or finance permission
        // still gets the account list rather than an error page.
        fetchCampaigns('all', signal).catch(() => [] as AdminCampaign[]),
        fetchInvoices(undefined, signal).catch(() => [] as AdminInvoice[]),
      ]);
      return { advertisers, campaigns, invoices };
    },
    [],
    'Advertisers could not be loaded.',
  );

  const advertisers = useMemo(() => loaded.data?.advertisers ?? [], [loaded.data]);

  // Campaigns carry an advertiser name rather than an id, so the count is keyed by name and the
  // invoice total — which does carry the id — by id. Nothing here invents a match it cannot make.
  const campaignsByName = useMemo(() => {
    const counts = new Map<string, number>();
    for (const campaign of loaded.data?.campaigns ?? []) {
      if (!campaign.advertiser) continue;
      counts.set(campaign.advertiser, (counts.get(campaign.advertiser) ?? 0) + 1);
    }
    return counts;
  }, [loaded.data]);

  const campaignsById = useMemo(() => {
    const counts = new Map<string, number>();
    for (const advertiser of advertisers) {
      const count = campaignsByName.get(advertiser.companyName);
      if (count) counts.set(advertiser.accountId, count);
    }
    return counts;
  }, [advertisers, campaignsByName]);

  const billedById = useMemo(() => {
    const totals = new Map<string, number>();
    for (const invoice of loaded.data?.invoices ?? []) {
      totals.set(invoice.advertiserId, (totals.get(invoice.advertiserId) ?? 0) + invoice.amount);
    }
    return totals;
  }, [loaded.data]);

  const { search, setSearch, filtered } = useSearchFilter(advertisers, [
    'companyName', 'contactName', 'email', 'status',
  ]);

  const approved = advertisers.filter((a) => a.status === 'Approved').length;
  const pending = advertisers.filter((a) => a.status === 'PendingVerification').length;
  const rejected = advertisers.filter((a) => a.status === 'Rejected').length;

  return (
    <>
      <PageHeader
        title="Advertisers"
        subtitle="Every advertiser account and what it has bought."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '20px' }}>
        <StatCard value={String(advertisers.length)} label="Accounts" />
        <StatCard value={String(approved)} label="Approved" color={approved > 0 ? tokens.green : undefined} />
        <StatCard value={String(pending)} label="Awaiting review" color={pending > 0 ? tokens.warn : undefined} />
        <StatCard value={String(rejected)} label="Rejected" />
      </Box>

      <DataCard
        title="Advertiser accounts"
        count={advertisers.length}
        search={{ value: search, onChange: setSearch, placeholder: 'Search company, contact or email' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(campaignsById, billedById)}
        getRowId={(row) => row.accountId}
        emptyTitle="No advertisers have registered"
        emptyDescription="Accounts appear here the moment somebody signs up, before anyone reviews them."
        note="Approving and rejecting happens on the Overview review queue, so every decision is recorded against a reviewer and a reason."
      />
    </>
  );
}
