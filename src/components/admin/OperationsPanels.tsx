import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import StatCard from '../StatCard';
import StatusTag from '../StatusTag';
import SearchBox from '../SearchBox';
import EmptyState from '../EmptyState';
import {
  deriveAlerts,
  describeLastSignal,
  fetchDeviceStatuses,
  fetchLiveVehicles,
  fetchPlaybackConflicts,
  fetchScreens,
  type AdminScreen,
  type DeviceStatus,
  type LiveVehicle,
  type PlaybackConflict,
} from '../../services/admin';
import { tokens } from '../../theme';

/**
 * Operational state of the platform, from the platform.
 *
 * Everything here is counted rather than asserted. The previous version of this page carried a
 * fixture list of alerts, which is the kind of thing that reads convincingly while being wrong —
 * an alert panel that cannot go quiet is worse than none, because nobody learns to trust it.
 */

interface Loaded {
  screens: AdminScreen[];
  devices: DeviceStatus[];
  vehicles: LiveVehicle[];
  conflicts: PlaybackConflict[];
}

export default function OperationsPanels() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchScreens(controller.signal).catch(() => [] as AdminScreen[]),
      fetchDeviceStatuses(controller.signal).catch(() => [] as DeviceStatus[]),
      fetchLiveVehicles(controller.signal).catch(() => [] as LiveVehicle[]),
      fetchPlaybackConflicts(50, controller.signal).catch(() => [] as PlaybackConflict[]),
    ])
      .then(([screens, devices, vehicles, conflicts]) => {
        if (controller.signal.aborted) return;
        setData({ screens, devices, vehicles, conflicts });
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load operational data.');
      });

    return () => controller.abort();
  }, []);

  const alerts = useMemo(
    () => (data ? deriveAlerts(data.devices, data.screens, data.conflicts) : []),
    [data],
  );

  const filteredScreens = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.screens;

    return data.screens.filter((s) =>
      [s.serialNumber, s.plate, s.driverName, s.region]
        .some((field) => field?.toLowerCase().includes(q)));
  }, [data, search]);

  if (error) return <Alert severity="error" sx={{ fontSize: 13, mb: '20px' }}>{error}</Alert>;

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  const online = data.screens.filter((s) => s.status === 'Online').length;
  const reporting = data.devices.filter((d) => d.connectivity === 'Healthy').length;

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px', mb: '28px' }}>
        <StatCard value={String(data.screens.length)} label="Screens registered" />
        <StatCard value={String(online)} label="Screens online" color={online > 0 ? tokens.green : undefined} />
        <StatCard value={String(data.vehicles.length)} label="Vehicles with a position" />
        <StatCard value={String(reporting)} label="Devices reporting" color={reporting > 0 ? tokens.green : undefined} />
        <StatCard
          value={String(data.conflicts.length)}
          label="Playback in doubt"
          color={data.conflicts.length > 0 ? tokens.red : undefined}
        />
      </Box>

      <Card sx={{ p: '20px', mb: '20px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Needs attention
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '12px' }}>Operational alerts</Typography>

        {alerts.length === 0 ? (
          <EmptyState
            title="Nothing needs attention"
            description="Every device is reporting and no playback claim is in doubt."
          />
        ) : (
          <Box sx={{ display: 'grid', gap: '10px' }}>
            {alerts.map((alert) => (
              <Box key={alert.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{alert.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{alert.detail}</Typography>
                </Box>
                <StatusTag
                  label={alert.tone === 'error' ? 'Action needed' : alert.tone === 'warn' ? 'Review' : 'Watch'}
                  variant={alert.tone === 'error' ? 'error' : alert.tone === 'warn' ? 'warn' : 'neutral'}
                />
              </Box>
            ))}
          </Box>
        )}
      </Card>

      <Card sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: '10px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            Screen inventory{data.screens.length > 0 && ` (${data.screens.length})`}
          </Typography>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by serial, plate, driver" width={240} />
        </Box>

        {data.screens.length === 0 ? (
          <EmptyState
            title="No screens registered yet"
            description="Screens appear here once an administrator provisions them against a vehicle."
          />
        ) : filteredScreens.length === 0 ? (
          <EmptyState title="No screens match your search" description="Try a different serial, plate, or driver name." />
        ) : (
          <Box sx={{ overflowX: 'auto', px: '22px', pb: '18px' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
              <Box component="thead">
                <Box component="tr" sx={{ '& th': { textAlign: 'left', padding: '8px 10px', fontSize: 11.5, fontWeight: 700, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <th>Serial</th><th>Plate</th><th>Driver</th><th>Region</th><th>Status</th><th>Battery</th><th>Last signal</th>
                </Box>
              </Box>
              <Box component="tbody">
                {filteredScreens.map((s) => (
                  <Box
                    key={s.screenId}
                    component="tr"
                    sx={{ '& td': { padding: '9px 10px', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}
                  >
                    <td style={{ fontWeight: 600 }}>{s.serialNumber}</td>
                    <td>{s.plate ?? '—'}</td>
                    <td>{s.driverName?.trim() || '—'}</td>
                    <td>{s.region ?? '—'}</td>
                    <td>
                      <StatusTag
                        label={s.status}
                        variant={s.status === 'Online' ? 'live' : s.status === 'Offline' ? 'error' : 'warn'}
                      />
                    </td>
                    <td>{s.batteryLevel !== null ? `${s.batteryLevel}%` : '—'}</td>
                    <td style={{ color: tokens.textMuted }}>{describeLastSignal(s.lastHeartbeatAtUtc)}</td>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Card>
    </>
  );
}
