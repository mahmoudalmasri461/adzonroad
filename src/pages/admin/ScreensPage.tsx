import { useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchScreens, fetchVehicles, type AdminScreen, type AdminVehicle } from '../../services/admin';
import {
  countScreensByFilter,
  filterScreens,
  fitmentPercent,
  lastSignalParts,
  screenState,
  SCREEN_STATE_TONES,
  type ScreenFilter,
} from '../../services/screenOperations';
import { tokens } from '../../theme';

/**
 * The screen estate.
 *
 * There is nothing in it. No rooftop hardware has been built, so every screen-derived figure on
 * the platform is zero — which is a different thing from wrong, and the page says which.
 *
 * The row of stat cards this page used to open with has gone: four of its five numbers were the
 * chip counts restated a second time, and a page whose whole content is five zeroes reads as a
 * broken query rather than an empty estate. The counts now live inside the controls that use
 * them, which is also the only place they can be pressed.
 *
 * Status is derived by `screenState`, never read from the stored `Screen.Status` column — a
 * screen that has never sent a heartbeat is not Online however that column reads. The chips are
 * built from the same function as the badges and a test pins the two together, so a chip can
 * never hide a row whose badge contradicts it.
 */

function getColumns(t: (key: string, opts?: Record<string, unknown>) => string): GridColDef<AdminScreen>[] {
  const dash = <span style={{ color: tokens.textMuted }}>—</span>;

  return [
    // Serial and plate are identifiers, not prose: left-to-right in both languages.
    {
      field: 'serialNumber',
      headerName: t('admin.screens.serial'),
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => <span dir="ltr">{params.row.serialNumber}</span>,
    },
    {
      field: 'plate',
      headerName: t('admin.screens.vehicle'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (params.row.plate ? <span dir="ltr">{params.row.plate}</span> : dash),
    },
    {
      field: 'driverName',
      headerName: t('admin.screens.driver'),
      flex: 0.9,
      minWidth: 150,
      valueGetter: (_v, row) => row.driverName?.trim() || '—',
    },
    {
      field: 'region',
      headerName: t('admin.screens.region'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => row.region ?? '—',
    },
    {
      field: 'status',
      headerName: t('admin.screens.status'),
      flex: 0.8,
      minWidth: 165,
      renderCell: (params) => {
        const state = screenState(params.row);
        return <StatusTag label={t(`admin.screens.states.${state}`)} variant={SCREEN_STATE_TONES[state]} />;
      },
    },
    {
      field: 'networkStatus',
      headerName: t('admin.screens.network'),
      flex: 0.7,
      minWidth: 120,
      // The server's own vocabulary, left untranslated like every other backend enum on the
      // platform, so what is shown here matches what an engineer would find in the database.
      renderCell: (params) => (
        <StatusTag
          label={params.row.networkStatus}
          variant={params.row.networkStatus === 'Connected' ? 'live' : 'error'}
        />
      ),
    },
    {
      field: 'batteryLevel',
      headerName: t('admin.screens.battery'),
      flex: 0.5,
      minWidth: 95,
      renderCell: (params) =>
        params.row.batteryLevel === null ? dash : <span dir="ltr">{`${params.row.batteryLevel}%`}</span>,
    },
    {
      field: 'lastHeartbeatAtUtc',
      headerName: t('admin.screens.lastSignal'),
      flex: 0.7,
      minWidth: 130,
      valueGetter: (_v, row) => {
        const { unit, count } = lastSignalParts(row.lastHeartbeatAtUtc);
        return t(`admin.screens.signal.${unit}`, { n: count });
      },
    },
  ];
}

export default function AdminScreensPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ScreenFilter>('all');
  const [search, setSearch] = useState('');

  const loaded = useAsyncData<{ screens: AdminScreen[]; vehicles: AdminVehicle[] | null }>(
    async (signal) => {
      const [screens, vehicles] = await Promise.all([
        fetchScreens(signal),
        // Only the fitment denominator. Null when it could not be read, so a failed vehicle query
        // says the fleet size is unknown rather than quietly claiming a fleet of zero — which
        // would put every screen at 0% fitment against a fleet that does exist.
        fetchVehicles(undefined, 1, 200, signal)
          .then((page) => page.items)
          .catch(() => null),
      ]);
      return { screens, vehicles };
    },
    [],
    t('admin.screens.error'),
  );

  const screens = useMemo(() => loaded.data?.screens ?? [], [loaded.data]);
  const vehicles = loaded.data?.vehicles ?? null;

  const counts = useMemo(() => countScreensByFilter(screens), [screens]);
  const filtered = useMemo(() => filterScreens(screens, filter, search), [screens, filter, search]);

  const fitted = vehicles === null ? null : fitmentPercent(screens.length, vehicles.length);

  return (
    <>
      <AdminFilterBar
        ariaLabel={t('admin.nav.screens')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('admin.screens.filters.all'), count: counts.all },
          { value: 'online', label: t('admin.screens.filters.online'), count: counts.online },
          { value: 'attention', label: t('admin.screens.filters.attention'), count: counts.attention },
          { value: 'never', label: t('admin.screens.filters.never'), count: counts.never },
        ]}
        search={{ value: search, onChange: setSearch, placeholder: t('admin.screens.search') }}
        trailing={
          // Shown only once the estate has loaded: before that there is no ratio to state, and
          // "0 of 0 fitted" during a load is a claim, not a placeholder.
          loaded.loading || loaded.error ? null : vehicles === null ? (
            <StatusTag label={t('admin.screens.fitmentUnknown')} variant="warn" />
          ) : (
            <StatusTag
              label={t('admin.screens.fitment', { n: screens.length, total: vehicles.length })}
              variant={fitted !== null && fitted > 0 ? 'neutral' : 'outline'}
            />
          )
        }
      />

      <DataCard
        title={t('admin.nav.screens')}
        count={filtered.length}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={getColumns(t)}
        getRowId={(row) => row.screenId}
        emptyTitle={screens.length === 0 ? t('admin.screens.empty') : t('admin.screens.noMatch')}
        emptyDescription={
          screens.length === 0 ? t('admin.screens.emptyDetail') : t('admin.screens.noMatchDetail')
        }
        noMatchTitle={t('admin.screens.noMatch')}
        note={t('admin.screens.note')}
      />
    </>
  );
}
