import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MobileShell from '../layouts/MobileShell';
import BottomTabBar from '../components/BottomTabBar';
import ActionDialog from '../components/ActionDialog';
import { useToast } from '../contexts/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import { formatCurrency } from '../utils/format';
import { ApiError } from '../services/apiClient';
import {
  describeRecording,
  distanceToday,
  fetchCurrentCampaign,
  fetchEarnings,
  fetchMyDeviceStatus,
  fetchShifts,
  fetchVehicle,
  formatHours,
  greeting,
  hoursToday,
  submitSupportTicket,
  type CurrentCampaign,
  type DeviceStatus,
  type DriverEarnings,
  type ShiftSummary,
  type VehicleInfo,
} from '../services/driver';
import { tokens } from '../theme';

/**
 * The driver's own view of their work.
 *
 * Written to show only what the platform actually knows. The previous version displayed "verified
 * ad hours" and "screen uptime" that were derived from nothing — placeholders mirroring whether a
 * shift was running. Those are the two numbers a driver would most reasonably expect to be paid
 * against, so showing invented values here would be worse than showing none.
 */

const TONE_COLOR = {
  good: tokens.green,
  warn: tokens.warn,
  bad: tokens.red,
  idle: tokens.textMuted,
} as const;

export default function DriverDashboard() {
  const { showToast } = useToast();
  const { session } = useAuth();

  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [campaign, setCampaign] = useState<CurrentCampaign | null>(null);
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [damageOpen, setDamageOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchEarnings(controller.signal).catch(() => null),
      fetchShifts(20, controller.signal).catch(() => [] as ShiftSummary[]),
      fetchVehicle(controller.signal).catch(() => null),
      // 204 when nothing is assigned, which reads as a parse failure — absence, not an error.
      fetchCurrentCampaign(controller.signal).catch(() => null),
      fetchMyDeviceStatus(controller.signal).catch(() => null),
    ])
      .then(([e, s, v, c, d]) => {
        if (controller.signal.aborted) return;

        setEarnings(e);
        setShifts(s);
        setVehicle(v);
        setCampaign(c);
        setDevice(d);
        setLoading(false);

        if (!e && !v) setError('Could not load your details. Pull down to retry, or sign in again.');
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setError(e instanceof ApiError && e.isUnauthorized
          ? 'Sign in again to see your shifts.'
          : 'Could not reach the platform.');
      });

    return () => controller.abort();
  }, []);

  const recording = describeRecording(device);
  const todayHours = hoursToday(shifts);
  const todayKm = distanceToday(shifts);
  const firstName = session?.displayName?.split(' ')[0] ?? 'driver';

  const submitTicket = async (message: string, type: string, label: string) => {
    try {
      await submitSupportTicket(message, type);
      showToast(`${label} submitted`);
    } catch {
      showToast(`Could not submit your ${label.toLowerCase()} — try again`);
    }
  };

  if (loading) {
    return (
      <MobileShell avatarInitials={initials(session?.displayName)}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
          <CircularProgress size={24} />
        </Box>
        <BottomTabBar active="Home" />
      </MobileShell>
    );
  }

  return (
    <MobileShell avatarInitials={initials(session?.displayName)}>
      <Box>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
          {greeting()}, {firstName}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 22, mt: '6px', letterSpacing: '-0.01em' }}>
          {vehicle ? `${vehicle.plate} · ${vehicle.screenSerial}` : 'No vehicle assigned yet'}
        </Typography>
      </Box>

      {error && <Alert severity="info" sx={{ fontSize: 13 }}>{error}</Alert>}

      {/* EARNINGS — the figures the platform has actually recorded */}
      <Card sx={{ background: `linear-gradient(135deg, ${tokens.navy}, ${tokens.navy600})`, color: '#fff', border: 'none' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.6)' }}>
          Today's earnings
        </Typography>
        <Typography sx={{ mt: '6px', mb: '2px', fontWeight: 800, fontSize: 38 }}>
          {formatCurrency(earnings?.today ?? 0)}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
          {todayHours > 0 ? `${formatHours(todayHours)} driving today` : 'No shift recorded today yet'}
        </Typography>
        <Box sx={{ display: 'flex', gap: '18px', mt: '16px', pt: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <Box>
            <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>This month</Typography>
            <Typography sx={{ mt: '4px', fontSize: 18, fontWeight: 700 }}>{formatCurrency(earnings?.thisMonth ?? 0)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>All time</Typography>
            <Typography sx={{ mt: '4px', fontSize: 18, fontWeight: 700 }}>{formatCurrency(earnings?.allTime ?? 0)}</Typography>
          </Box>
        </Box>
      </Card>

      {/* RECORDING STATUS — server-derived, and the one thing a driver most needs to trust */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Recording status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mt: '8px' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: TONE_COLOR[recording.tone], flexShrink: 0 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{recording.headline}</Typography>
        </Box>
        <Typography sx={{ mt: '6px', fontSize: 13, color: 'text.secondary' }}>{recording.detail}</Typography>
        {device?.lastFixCapturedAtUtc && (
          <Typography sx={{ mt: '8px', fontSize: 12, color: 'text.secondary' }}>
            Last position recorded {new Date(device.lastFixCapturedAtUtc).toLocaleTimeString()}
          </Typography>
        )}
      </Card>

      {/* CURRENT CAMPAIGN */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Currently displaying
        </Typography>
        {campaign ? (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: 15, mt: '6px' }}>{campaign.name}</Typography>
            <Typography sx={{ mt: '6px', fontSize: 13, color: 'text.secondary' }}>
              {campaign.creativeDurationSeconds}-second advertisement · since{' '}
              {new Date(campaign.displayedSince).toLocaleTimeString()}
            </Typography>
          </>
        ) : (
          <Typography sx={{ mt: '6px', fontSize: 13, color: 'text.secondary' }}>
            No campaign is assigned to your screen at the moment. You still earn for the hours you drive.
          </Typography>
        )}
      </Card>

      {/* QUICK STATS — only what is measured */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Stat value={formatHours(todayHours)} label="Driving today" />
        <Stat value={`${todayKm.toFixed(1)} km`} label="Distance today" />
        <Stat value={String(shifts.length)} label="Shifts recorded" />
        <Stat
          value={shifts.some((s) => s.premiumAreaCovered) ? 'Yes' : 'No'}
          label="Premium area covered"
          color={shifts.some((s) => s.premiumAreaCovered) ? tokens.green : undefined}
        />
      </Box>

      {/* RECENT SHIFTS */}
      {shifts.length > 0 && (
        <Card>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
            Recent shifts
          </Typography>
          <Box sx={{ display: 'grid', gap: '2px', mt: '8px' }}>
            {shifts.slice(0, 5).map((s) => (
              <Box
                key={s.shiftId}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                  padding: '8px 0', borderBottom: '1px solid', borderColor: 'divider',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                    {new Date(s.startedAtUtc).toLocaleDateString()}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {formatHours(s.activeHours)} · {s.totalDistanceKm.toFixed(1)} km
                    {s.premiumAreaCovered && ' · premium area'}
                    {s.status === 'Active' && ' · running now'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                  {s.earningsTotal !== null ? formatCurrency(s.earningsTotal) : '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* VEHICLE & SCREEN */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Vehicle &amp; screen
        </Typography>
        {vehicle ? (
          <Box sx={{ display: 'grid', gap: '8px', fontSize: 14, mt: '10px' }}>
            <Row label="Plate" value={vehicle.plate} />
            <Row label="Screen" value={vehicle.screenSerial} />
            <Row label="Battery" value={vehicle.batteryStatus} />
            <Row label="Last maintenance" value={vehicle.lastMaintenanceDate} />
          </Box>
        ) : (
          <Typography sx={{ mt: '8px', fontSize: 13, color: 'text.secondary' }}>
            No vehicle is linked to your account yet.
          </Typography>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', mt: '16px' }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text, minHeight: 60, fontSize: 13.5, lineHeight: 1.3, whiteSpace: 'normal' }}
            onClick={() => setDamageOpen(true)}
          >
            Report damage
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text, minHeight: 60, fontSize: 13.5, lineHeight: 1.3, whiteSpace: 'normal' }}
            onClick={() => setMaintenanceOpen(true)}
          >
            Request maintenance
          </Button>
        </Box>
      </Card>

      <BottomTabBar active="Home" />

      <ActionDialog
        open={damageOpen}
        onClose={() => setDamageOpen(false)}
        title="Report vehicle damage"
        placeholder="Describe the damage (e.g. cracked screen, dent, scratch)…"
        onSubmitted={({ note }) => void submitTicket(note.trim() || 'Damage reported', 'Damage', 'Damage report')}
      />
      <ActionDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        title="Request maintenance"
        placeholder="What needs attention?"
        onSubmitted={({ note }) => void submitTicket(note.trim() || 'Maintenance requested', 'Maintenance', 'Maintenance request')}
      />
    </MobileShell>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <Card sx={{ padding: '14px 16px' }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: color ?? 'text.primary' }}>{value}</Typography>
      <Typography sx={{ mt: '4px', fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: tokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </Box>
  );
}

function initials(displayName?: string): string {
  if (!displayName) return 'DR';
  return displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}
