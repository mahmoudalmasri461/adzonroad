import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from 'react-i18next';
import StatusTag from '../StatusTag';
import SearchBox from '../SearchBox';
import {
  deriveAlerts,
  fetchDeviceStatuses,
  fetchLiveVehicles,
  fetchPlaybackConflicts,
  fetchScreens,
  reportingScreens,
  type AdminScreen,
  type DeviceStatus,
  type LiveVehicle,
  type PlaybackConflict,
} from '../../services/admin';
import { lastSignalParts, screenState, SCREEN_STATE_TONES } from '../../services/screenOperations';
import { tokens } from '../../theme';

/**
 * Operational state of the platform, from the platform.
 *
 * Everything here is counted rather than asserted. An earlier version carried a fixture list of
 * alerts, which reads convincingly while being wrong — an alert panel that cannot go quiet is
 * worse than none, because nobody learns to trust it.
 *
 * The load used to swallow every failure into an empty array, so an unreachable API rendered as
 * "0 screens registered, nothing needs attention": a dead network presented as a calm one. A
 * failure is now its own state and shows no figures at all.
 */

interface Loaded {
  screens: AdminScreen[];
  devices: DeviceStatus[];
  vehicles: LiveVehicle[];
  conflicts: PlaybackConflict[];
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; data: Loaded };

const SURFACE = {
  backgroundColor: '#fff',
  border: '1px solid #E7E4DE',
  borderRadius: '10px',
} as const;

export default function OperationsPanels() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [search, setSearch] = useState('');
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    Promise.all([
      fetchScreens(controller.signal),
      fetchDeviceStatuses(controller.signal),
      fetchLiveVehicles(controller.signal),
      fetchPlaybackConflicts(50, controller.signal),
    ])
      .then(([screens, devices, vehicles, conflicts]) => {
        if (controller.signal.aborted) return;
        setState({ status: 'loaded', data: { screens, devices, vehicles, conflicts } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });

    return () => controller.abort();
  }, [nonce]);

  const data = state.status === 'loaded' ? state.data : null;

  const alerts = useMemo(
    () => (data ? deriveAlerts(data.devices, data.screens, data.conflicts) : []),
    [data],
  );

  const filteredScreens = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.screens;

    return data.screens.filter((s) =>
      [s.serialNumber, s.plate, s.driverName, s.region].some((field) => field?.toLowerCase().includes(q)),
    );
  }, [data, search]);

  if (state.status === 'error') {
    return (
      <Box sx={{ ...SURFACE, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.navy }}>
            {t('admin.states.errorTitle')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: tokens.textMuted, mt: '3px', maxWidth: '62ch' }}>
            {t('admin.states.errorDetail')}
          </Typography>
        </Box>
        <Button onClick={reload} variant="outlined" size="small" sx={{ borderColor: '#DDD9D1', color: tokens.navy, borderRadius: '8px' }}>
          {t('admin.states.retry')}
        </Button>
      </Box>
    );
  }

  const loading = state.status === 'loading';

  // Derived from heartbeats, not from the stored status column. Counting the column produced
  // "9 screens online" sitting directly above an alert reading "8 screens disconnected".
  const online = data ? reportingScreens(data.screens) : 0;
  const devicesReporting = data ? data.devices.filter((d) => d.connectivity === 'Healthy').length : 0;

  return (
    <>
      {/* NETWORK STATUS — grouped by what the figure is about, rather than five identical cards. */}
      <Box
        sx={{
          ...SURFACE,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          mb: '20px',
          overflow: 'hidden',
        }}
      >
        <Metric
          label={t('admin.overview.screens')}
          loading={loading}
          primary={data ? `${online} / ${data.screens.length}` : null}
          caption={t('admin.overview.screensReporting')}
          emptyNote={data && data.screens.length === 0 ? t('admin.overview.noScreensRegistered') : undefined}
        />
        <Metric
          label={t('admin.overview.vehicles')}
          loading={loading}
          primary={data ? String(data.vehicles.length) : null}
          caption={t('admin.overview.vehiclesPositioned')}
        />
        <Metric
          label={t('admin.overview.devices')}
          loading={loading}
          primary={data ? String(devicesReporting) : null}
          caption={t('admin.overview.devicesReporting')}
        />
        <Metric
          label={t('admin.overview.playback')}
          loading={loading}
          primary={data ? String(data.conflicts.length) : null}
          caption={t('admin.overview.playbackReview')}
          // The only figure here with a definite reading: anything above zero is work.
          tone={data && data.conflicts.length > 0 ? 'attention' : undefined}
        />
      </Box>

      {/* OPERATIONAL ALERTS — one line when there is nothing to say. */}
      <Box sx={{ ...SURFACE, padding: '16px 18px', mb: '20px' }}>
        <Typography
          sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.amber600, mb: '12px' }}
        >
          {t('admin.alerts.title')}
        </Typography>

        {loading ? (
          <Skeleton rows={2} />
        ) : alerts.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#0F7A3D', flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>
                {t('admin.alerts.none')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: tokens.textMuted }}>
                {t('admin.alerts.noneDetail')}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: '1px' }}>
            {alerts.map((alert) => (
              <Box
                key={alert.key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '9px 8px',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#F7F6F3' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.navy }}>{alert.label}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: tokens.textMuted }}>{alert.detail}</Typography>
                </Box>
                <StatusTag
                  label={
                    alert.tone === 'error'
                      ? t('admin.alerts.actionNeeded')
                      : alert.tone === 'warn'
                        ? t('admin.alerts.reviewTone')
                        : t('admin.alerts.watch')
                  }
                  variant={alert.tone === 'error' ? 'error' : alert.tone === 'warn' ? 'warn' : 'neutral'}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* SCREEN INVENTORY */}
      <Box sx={{ ...SURFACE, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '1px solid #EFEDE8',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: tokens.navy }}>
            {t('admin.inventory.title')}
            {data && data.screens.length > 0 && (
              <Box component="span" sx={{ ml: '7px', color: tokens.textMuted, fontWeight: 500, direction: 'ltr', display: 'inline-block' }}>
                {data.screens.length}
              </Box>
            )}
          </Typography>
          <SearchBox value={search} onChange={setSearch} placeholder={t('admin.inventory.search')} width={260} />
        </Box>

        {loading ? (
          <Box sx={{ p: '18px' }}><Skeleton rows={4} /></Box>
        ) : data && data.screens.length === 0 ? (
          <CompactEmpty title={t('admin.inventory.empty')} detail={t('admin.inventory.emptyDetail')} />
        ) : filteredScreens.length === 0 ? (
          <CompactEmpty title={t('admin.inventory.noMatch')} detail={t('admin.inventory.noMatchDetail')} />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 720 }}>
              <Box component="thead">
                <Box
                  component="tr"
                  sx={{
                    '& th': {
                      textAlign: 'start',
                      padding: '10px 16px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: tokens.textMuted,
                      borderBottom: '1px solid #EFEDE8',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#FBFAF8',
                    },
                  }}
                >
                  <th>{t('admin.inventory.serial')}</th>
                  <th>{t('admin.inventory.plate')}</th>
                  <th>{t('admin.inventory.driver')}</th>
                  <th>{t('admin.inventory.region')}</th>
                  <th>{t('admin.inventory.status')}</th>
                  <th>{t('admin.inventory.battery')}</th>
                  <th>{t('admin.inventory.lastSignal')}</th>
                </Box>
              </Box>
              <Box component="tbody">
                {filteredScreens.map((s) => {
                  // Same derivation as the Screens page, so one screen never carries two
                  // different states depending on which page it is looked at from.
                  const state = screenState(s);
                  const signal = lastSignalParts(s.lastHeartbeatAtUtc);
                  return (
                    <Box
                      key={s.screenId}
                      component="tr"
                      sx={{
                        '& td': { padding: '12px 16px', borderBottom: '1px solid #F2F0EC', whiteSpace: 'nowrap' },
                        '&:hover td': { backgroundColor: '#FBFAF8' },
                      }}
                    >
                      {/* Serials and plates are identifiers: they read left-to-right in Arabic too. */}
                      <td style={{ fontWeight: 600, direction: 'ltr', textAlign: 'start' }}>{s.serialNumber}</td>
                      <td style={{ direction: 'ltr', textAlign: 'start' }}>{s.plate ?? '—'}</td>
                      <td>{s.driverName?.trim() || '—'}</td>
                      <td>{s.region ?? '—'}</td>
                      <td>
                        <StatusTag
                          label={t(`admin.screens.states.${state}`)}
                          variant={SCREEN_STATE_TONES[state]}
                        />
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'start' }}>
                        {s.batteryLevel !== null ? `${s.batteryLevel}%` : '—'}
                      </td>
                      <td style={{ color: tokens.textMuted }}>
                        {t(`admin.screens.signal.${signal.unit}`, { n: signal.count })}
                      </td>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}

/**
 * One figure in the status strip.
 *
 * `primary` is null while loading, and the component shows a placeholder rather than a zero —
 * flashing "0 screens" before the data lands says something false, briefly, about the network.
 */
function Metric({
  label,
  primary,
  caption,
  emptyNote,
  tone,
  loading,
}: {
  label: string;
  primary: string | null;
  caption: string;
  emptyNote?: string;
  tone?: 'attention';
  loading: boolean;
}) {
  return (
    <Box sx={{ padding: '15px 18px', borderInlineEnd: '1px solid #EFEDE8', '&:last-of-type': { borderInlineEnd: 0 } }}>
      <Typography
        sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMuted, mb: '7px' }}
      >
        {label}
      </Typography>

      {loading ? (
        <Box sx={{ height: 27, width: 62, borderRadius: '6px', backgroundColor: '#F1EFEA' }} />
      ) : emptyNote ? (
        <Typography sx={{ fontSize: 13.5, color: tokens.textMuted, py: '3px' }}>{emptyNote}</Typography>
      ) : (
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            direction: 'ltr',
            textAlign: 'start',
            color: tone === 'attention' ? '#B42318' : tokens.navy,
          }}
        >
          {primary}
        </Typography>
      )}

      {!emptyNote && (
        <Typography sx={{ mt: '3px', fontSize: 12, color: tokens.textMuted }}>{caption}</Typography>
      )}
    </Box>
  );
}

function CompactEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <Box sx={{ padding: '26px 18px', textAlign: 'center' }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.navy }}>{title}</Typography>
      <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, mt: '3px' }}>{detail}</Typography>
    </Box>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <Box sx={{ display: 'grid', gap: '8px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <Box
          key={i}
          sx={{
            height: 18,
            borderRadius: '6px',
            backgroundColor: '#F1EFEA',
            '@keyframes adzPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
            animation: 'adzPulse 1.4s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
      ))}
    </Box>
  );
}
