import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import RoomIcon from '@mui/icons-material/Room';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { advTokens, cardSx } from './theme';
import EmptyState from './EmptyState';
import { useLiveVehicles } from '../../hooks/useLiveVehicles';
import { describeAge, type VehiclePresentation } from '../../services/vehicleInterpolation';

const BEIRUT_CENTER: [number, number] = [33.884, 35.508];
const DEFAULT_ZOOM = 12;

/**
 * Filters the feed can actually answer.
 *
 * Campaign, Region and Date were offered before and were backed by fixture metadata; the live
 * hub sends a position and a fix age and nothing else, so filtering by campaign meant filtering
 * a fabricated field. What is left is what a vehicle's own reporting state supports.
 */

const FILTERS = ['All', 'Reporting live', 'Not reporting'] as const;
type FilterKey = (typeof FILTERS)[number];

/**
 * One taxi as the map draws it, from either source.
 *
 * `presentation` and `isDerived` are the two fields that keep the map honest: the first says
 * whether the position can be shown as current, the second whether these exact coordinates were
 * measured or computed between two measured ones.
 */
interface MapVehicle {
  id: string;
  label: string;
  lat: number;
  lng: number;
  presentation: VehiclePresentation;
  isDerived: boolean;
  fixAgeSeconds: number;
}

function ZoomControls() {
  const map = useMap();
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 14,
        right: 14,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        backgroundColor: advTokens.white,
        borderRadius: '10px',
        boxShadow: advTokens.shadowMd,
        p: '4px',
      }}
    >
      <IconButton size="small" onClick={() => map.zoomIn()} sx={{ color: advTokens.text }}>
        <AddIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => map.zoomOut()} sx={{ color: advTokens.text }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function LiveCampaignMap() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { vehicles: liveVehicles, connectionState, lastReconciliation } = useLiveVehicles();

  const mapVehicles = useMemo<MapVehicle[]>(
    () => liveVehicles.map((v) => ({
      id: v.vehicleId,
      // Until vehicle metadata is fetched alongside the feed, the identifier is all the hub
      // sends. A short prefix is enough to tell markers apart without implying a plate number.
      label: v.vehicleId.slice(0, 8).toUpperCase(),
      lat: v.lat,
      lng: v.lng,
      presentation: v.presentation,
      isDerived: v.isDerived,
      fixAgeSeconds: v.fixAgeSeconds,
    })),
    [liveVehicles],
  );

  const filtered = mapVehicles.filter((v) => {
    if (activeFilter === 'Reporting live') return v.presentation === 'live';
    if (activeFilter === 'Not reporting') return v.presentation !== 'live';
    return true;
  });

  const selected = mapVehicles.find((v) => v.id === selectedId) ?? null;

  const liveCount = mapVehicles.filter((v) => v.presentation === 'live').length;

  return (
    <Box sx={{ ...cardSx, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '16px 18px 0' }}>
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Live coverage
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text }}>Live Campaign Map</Typography>
        </Box>
        <FeedStatus
          connectionState={connectionState}
          liveCount={liveCount}
          total={mapVehicles.length}
        />
      </Box>

      {lastReconciliation && (
        <Box sx={{ mx: '18px', mt: '10px', px: '10px', py: '6px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: advTokens.text }}>
            Offline evidence synchronised — {lastReconciliation.claimsReconciled} playback claim
            {lastReconciliation.claimsReconciled === 1 ? '' : 's'} re-checked,{' '}
            {lastReconciliation.nowVerified} now verified.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', padding: '12px 18px 0' }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            onClick={() => setActiveFilter(f)}
            size="small"
            variant={activeFilter === f ? 'filled' : 'outlined'}
            sx={{
              flexShrink: 0,
              fontWeight: 700,
              color: activeFilter === f ? '#fff' : advTokens.textMuted,
              backgroundColor: activeFilter === f ? advTokens.orange : 'transparent',
              borderColor: advTokens.border,
              '&:hover': { backgroundColor: activeFilter === f ? advTokens.orangeHover : advTokens.bg },
            }}
          />
        ))}
      </Box>

      <Box sx={{ position: 'relative', height: { xs: 320, md: 420 }, mt: '12px', borderTop: `1px solid ${advTokens.border}` }}>
        <MapContainer center={BEIRUT_CENTER} zoom={DEFAULT_ZOOM} zoomControl={false} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControls />

          {filtered.map((v) => {
            const isSelected = selectedId === v.id;
            const style = MARKER_STYLES[v.presentation];
            return (
              <CircleMarker
                key={v.id}
                center={[v.lat, v.lng]}
                radius={isSelected ? 9 : v.presentation === 'live' ? 7 : 5.5}
                pathOptions={{
                  color: style.stroke,
                  fillColor: style.fill,
                  fillOpacity: style.fillOpacity,
                  weight: isSelected ? 3 : style.weight,
                  dashArray: style.dashArray,
                }}
                eventHandlers={{ click: () => setSelectedId(v.id) }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {v.label}
                  {v.presentation !== 'live' ? ` — last fix ${describeAge(v.fixAgeSeconds)}` : ''}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Nothing to draw. The map stays visible underneath so the reader can see it is the
            fleet that is quiet, not the page that is broken. */}
        {mapVehicles.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.86)',
            }}
          >
            <EmptyState
              icon={<RoomIcon />}
              title="No vehicles reporting"
              description={
                connectionState === 'connected'
                  ? 'Connected to the live feed, and nothing is currently sending a position.'
                  : 'Not connected to the live feed. Reconnecting automatically.'
              }
            />
          </Box>
        )}

        {selected && (
          <Box
            sx={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              zIndex: 1000,
              width: 250,
              backgroundColor: advTokens.white,
              border: `1px solid ${advTokens.border}`,
              borderRadius: '12px',
              boxShadow: advTokens.shadowMd,
              padding: '14px',
              color: advTokens.text,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: '8px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RoomIcon sx={{ fontSize: 16, color: advTokens.orange }} />
                <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>{selected.label}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ color: advTokens.textMuted, p: '2px' }}>
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'grid', gap: '5px', fontSize: 12 }}>
              <Row label="Last GPS fix" value={describeAge(selected.fixAgeSeconds)} />

              {/* The distinction the whole architecture rests on: a smoothly moving marker is not
                  the same thing as a confirmed position. */}
              <MuiTooltip
                title={
                  selected.isDerived
                    ? 'Drawn between two confirmed GPS fixes to keep movement smooth. Delivery is only ever counted against confirmed fixes.'
                    : 'These are the coordinates the vehicle actually reported.'
                }
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'help' }}>
                  <span style={{ color: advTokens.textMuted }}>Position</span>
                  <span style={{ fontWeight: 700, color: selected.isDerived ? advTokens.textMuted : advTokens.green }}>
                    {selected.isDerived ? 'Estimated' : 'Confirmed GPS'}
                  </span>
                </Box>
              </MuiTooltip>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, pt: '2px' }}>
                <span style={{ color: advTokens.textMuted }}>Reporting</span>
                <span style={{ fontWeight: 700, color: PRESENTATION_COLORS[selected.presentation] }}>
                  {PRESENTATION_LABELS[selected.presentation]}
                </span>
              </Box>

              {/* Plate, screen serial and current campaign are not on the live feed. They were
                  fixture fields before; the hub sends a vehicle id, a position and its age. */}
            </Box>
          </Box>
        )}
      </Box>
      <style>{`
        @keyframes advLivePulse { 0%{opacity:0.4;} 50%{opacity:1;} 100%{opacity:0.4;} }
        .adv-zone-label { background: rgba(255,255,255,0.92); border: none; box-shadow: 0 1px 4px rgba(16,24,40,0.15); font-weight: 700; font-size: 11px; color: ${advTokens.text}; padding: 2px 6px; }
        .adv-zone-label::before { display: none; }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </Box>
  );
}

const MARKER_STYLES: Record<VehiclePresentation, {
  stroke: string; fill: string; fillOpacity: number; weight: number; dashArray?: string;
}> = {
  live: { stroke: '#fff', fill: advTokens.orange, fillOpacity: 1, weight: 2 },
  // Hollow and dashed: the vehicle was here, but this is a last-known position, not a current one.
  stale: { stroke: advTokens.orange, fill: '#fff', fillOpacity: 0.9, weight: 2, dashArray: '3 3' },
  offline: { stroke: advTokens.textMuted, fill: '#fff', fillOpacity: 0.7, weight: 1.5 },
};

const PRESENTATION_LABELS: Record<VehiclePresentation, string> = {
  live: 'Reporting live',
  stale: 'Last known position',
  offline: 'Not reporting',
};

const PRESENTATION_COLORS: Record<VehiclePresentation, string> = {
  live: advTokens.green,
  stale: advTokens.orange,
  offline: advTokens.textMuted,
};

/**
 * Header indicator.
 *
 * Separates two failures that look identical if you conflate them: the dashboard losing its own
 * connection, and the taxis going quiet. Only the second is a fleet problem.
 */
function FeedStatus({
  connectionState,
  liveCount,
  total,
}: {
  connectionState: string;
  liveCount: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <MuiTooltip
        title={
          connectionState === 'connected'
            ? 'Connected to the live feed. No vehicle is currently reporting a position.'
            : 'Not connected to the live feed.'
        }
      >
        <Chip
          size="small"
          label={connectionState === 'connected' ? 'No vehicles reporting' : 'Reconnecting…'}
          sx={{ fontWeight: 700, fontSize: 11, color: advTokens.textMuted, backgroundColor: advTokens.bg, cursor: 'help' }}
        />
      </MuiTooltip>
    );
  }

  // Green only when something is actually reporting. A connected socket with a silent fleet is not
  // a live map, and a pulsing green dot over frozen markers is precisely the wrong impression.
  const reporting = connectionState === 'connected' && liveCount > 0;
  const color = reporting ? advTokens.green : advTokens.orange;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          animation: reporting ? 'advLivePulse 1.8s infinite' : 'none',
        }}
      />
      <Typography sx={{ fontSize: 12, fontWeight: 700, color }}>
        {connectionState === 'connected'
          ? `${liveCount} of ${total} reporting live`
          : 'Reconnecting…'}
      </Typography>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: advTokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </Box>
  );
}
