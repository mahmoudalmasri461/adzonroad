import { useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  countAccountsByFilter,
  filterAccounts,
  type AccountFilter,
} from '../../services/accountFilters';
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

/**
 * Every advertiser account, at whatever stage it has reached.
 *
 * Campaign and billing totals are joined in here rather than fetched per row: a table of forty
 * advertisers that fetches a summary each is forty round trips, and the figures would arrive at
 * forty different moments. Both lists are already needed whole for their own counts.
 */

function getColumns(
  t: (key: string, opts?: Record<string, unknown>) => string,
  campaignsBy: Map<string, number>,
  billedBy: Map<string, number>,
): GridColDef<AccountRegistration>[] {
  return [
    { field: 'companyName', headerName: t('admin.advertisers.company'), flex: 1.1, minWidth: 180 },
    {
      field: 'contactName',
      headerName: t('admin.advertisers.contact'),
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.contactName || '—',
    },
    { field: 'email', headerName: t('admin.advertisers.email'), flex: 1.1, minWidth: 200 },
    {
      field: 'mobileNumber',
      headerName: t('admin.advertisers.mobile'),
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => row.mobileNumber ?? '—',
    },
    {
      field: 'status',
      headerName: t('admin.advertisers.status'),
      flex: 0.7,
      minWidth: 140,
      renderCell: (params) => (
        <StatusTag label={readableStatus(params.row.status)} variant={toneForStatus(params.row.status)} />
      ),
    },
    {
      field: 'campaigns',
      headerName: t('admin.advertisers.campaigns'),
      flex: 0.6,
      minWidth: 110,
      type: 'number',
      valueGetter: (_v, row) => campaignsBy.get(row.accountId) ?? 0,
    },
    {
      field: 'billed',
      headerName: t('admin.advertisers.billed'),
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_v, row) => formatCurrency(billedBy.get(row.accountId) ?? 0),
    },
    {
      field: 'createdAtUtc',
      headerName: t('admin.advertisers.submitted'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => `${waitingFor(row.createdAtUtc)} ago`,
    },
  ];
}

export default function AdvertisersPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [search, setSearch] = useState('');

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

  const counts = useMemo(() => countAccountsByFilter(advertisers, (a) => a.status), [advertisers]);

  const filtered = useMemo(
    () =>
      filterAccounts(
        advertisers,
        filter,
        search,
        (a) => a.status,
        (a) => [a.companyName, a.contactName, a.email, a.status, a.region],
      ),
    [advertisers, filter, search],
  );

  return (
    <>
      <AdminFilterBar
        ariaLabel={t('admin.advertisers.status')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('admin.filters.all'), count: counts.all },
          { value: 'pending', label: t('admin.filters.pending'), count: counts.pending },
          { value: 'approved', label: t('admin.filters.approved'), count: counts.approved },
          { value: 'rejected', label: t('admin.filters.rejected'), count: counts.rejected },
          { value: 'suspended', label: t('admin.filters.suspended'), count: counts.suspended },
        ]}
        search={{ value: search, onChange: setSearch, placeholder: t('admin.advertisers.search') }}
      />

      <DataCard
        title={t('admin.nav.advertisers')}
        count={filtered.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(t, campaignsById, billedById)}
        getRowId={(row) => row.accountId}
        emptyTitle={advertisers.length === 0 ? t('admin.advertisers.empty') : t('admin.advertisers.noMatch')}
        emptyDescription={
          advertisers.length === 0 ? t('admin.advertisers.emptyDetail') : t('admin.advertisers.noMatchDetail')
        }
        note={t('admin.advertisers.note')}
      />
    </>
  );
}
