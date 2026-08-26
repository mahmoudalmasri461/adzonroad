import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import EmptyState from '../EmptyState';
import { describeAge, type VehiclePresentation } from '../../services/vehicleInterpolation';
import type { LiveVehicle } from '../../services/admin';
import type { LiveConnectionState } from '../../services/liveConnection';
import type { RenderedVehicle } from '../../services/vehicleInterpolation';
import { tokens } from '../../theme';

const BEIRUT_CENTER: [number, number] = [33.884, 35.508];
const DEFAULT_ZOOM = 11;

/**
 * Presented state decides the marker, and nothing else does.
 *
 * A vehicle whose fixes have stopped is drawn hollow and dashed rather than removed, because
 * removing it would read as "no vehicle there" when what is true is "we no longer know".
 */
const MARKER_STYLES: Record<VehiclePresentation, {
  fill: string; stroke: string; fillOpacity: number; weight: number; dashArray?: string;
}> = {
  live: { fill: tokens.green, stroke: '#0B7A38', fillOpacity: 0.9, weight: 2 },
  stale: { fill: tokens.warn, stroke: '#9A5B04', fillOpacity: 0.45, weight: 2, dashArray: '3 3' },
  offline: { fill: 'transparent', stroke: tokens.red, fillOpacity: 0, weight: 2, dashArray: '2 4' },
};

function ZoomControls() {
  const map = useMap();

  return (
    <Box
      sx={{
        position: 'absolute', bottom: 14, right: 14, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '4px',
        backgroundColor: '#fff', borderRadius: '10px', boxShadow: tokens.shadowMd, p: '4px',
      }}
    >
      <IconButton size="small" onClick={() => map.zoomIn()} sx={{ color: tokens.text }}>
        <AddIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => map.zoomOut()} sx={{ color: tokens.text }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

type OperationsMapProps = {
  /** Positions from the hub, interpolated for smoothness and flagged when derived. */
  vehicles: RenderedVehicle[];
  /**
   * Plates, drivers and regions from the REST fallback. The hub broadcasts a position and its
   * age and nothing else; an operator, unlike an advertiser, is entitled to the rest, so the two
   * are joined on the vehicle id rather than the map settling for a truncated identifier.
   */
  metadata: LiveVehicle[];
  connectionState: LiveConnectionState;
};

const CONNECTION_LABEL: Record<LiveConnectionState, string> = {
  connected: 'Live feed connected',
  connecting: 'Connecting to the live feed',
  reconnecting: 'Reconnecting to the live feed',
  disconnected: 'Live feed disconnected',
};

export default function OperationsMap({ vehicles, metadata, connectionState }: OperationsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(metadata.map((v) => [v.vehicleId, v])),
    [metadata],
  );

  const live = vehicles.filter((v) => v.presentation === 'live').length;

  const labelFor = (vehicleId: string) => {
    const known = byId.get(vehicleId);
    // A plate when we have one; the identifier when we do not. Never a plausible-looking
    // placeholder — this map is what an operator dispatches against.
    return known?.plate?.trim() || vehicleId.slice(0, 8).toUpperCase();
  };

  return (
    <Card sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', flexWrap: 'wrap', gap: '10px',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Where the fleet is now</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            {vehicles.length === 0
              ? 'No vehicle is reporting a position.'
              : `${live} of ${vehicles.length} reporting live`}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={CONNECTION_LABEL[connectionState]}
          sx={{
            fontWeight: 700,
            fontSize: 11.5,
            backgroundColor: connectionState === 'connected' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.14)',
            color: connectionState === 'connected' ? tokens.green : tokens.warn,
          }}
        />
      </Box>

      {vehicles.length === 0 ? (
        <EmptyState
          title="Nothing is reporting"
          description={
            connectionState === 'connected'
              ? 'The feed is connected and no vehicle is sending a position. No shift is running.'
              : 'Not connected to the live feed. Reconnecting automatically.'
          }
        />
      ) : (
        <Box sx={{ position: 'relative', height: { xs: 340, md: 460 }, borderTop: '1px solid', borderColor: 'divider' }}>
          <MapContainer
            center={BEIRUT_CENTER}
            zoom={DEFAULT_ZOOM}
            zoomControl={false}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControls />

            {vehicles.map((vehicle) => {
              const style = MARKER_STYLES[vehicle.presentation];
              const selected = selectedId === vehicle.vehicleId;
              const known = byId.get(vehicle.vehicleId);

              return (
                <CircleMarker
                  key={vehicle.vehicleId}
                  center={[vehicle.lat, vehicle.lng]}
                  radius={selected ? 9 : vehicle.presentation === 'live' ? 7 : 5.5}
                  pathOptions={{
                    color: style.stroke,
                    fillColor: style.fill,
                    fillOpacity: style.fillOpacity,
                    weight: selected ? 3 : style.weight,
                    dashArray: style.dashArray,
                  }}
                  eventHandlers={{ click: () => setSelectedId(vehicle.vehicleId) }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <Box sx={{ fontSize: 12 }}>
                      <strong>{labelFor(vehicle.vehicleId)}</strong>
                      {known?.driverName && <> — {known.driverName}</>}
                      <br />
                      {known?.region ?? 'Region unresolved'} · last fix {describeAge(vehicle.fixAgeSeconds)}
                      <br />
                      {vehicle.isDerived ? 'Position estimated between fixes' : 'Confirmed GPS'}
                    </Box>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </Box>
      )}
    </Card>
  );
}
