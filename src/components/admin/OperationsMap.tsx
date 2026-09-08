import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
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
        position: 'absolute', bottom: 14, insetInlineEnd: 14, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '4px',
        backgroundColor: '#fff', borderRadius: '9px', boxShadow: tokens.shadowMd, p: '3px',
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
   * Plates, drivers and regions from the REST fallback. The hub broadcasts a position and its age
   * and nothing else; an operator, unlike an advertiser, is entitled to the rest, so the two are
   * joined on the vehicle id rather than the map settling for a truncated identifier.
   */
  metadata: Map<string, LiveVehicle>;
  connectionState: LiveConnectionState;
  /** Selection is owned by the page, so a marker and a list row stay in step. */
  selectedId: string | null;
  onSelect: (vehicleId: string) => void;
};

export default function OperationsMap({
  vehicles,
  metadata,
  connectionState,
  selectedId,
  onSelect,
}: OperationsMapProps) {
  const { t } = useTranslation();

  const labelFor = (vehicleId: string) => {
    // A plate when we have one; the identifier when we do not. Never a plausible-looking
    // placeholder — this map is what an operator dispatches against.
    return metadata.get(vehicleId)?.plate?.trim() || vehicleId.slice(0, 8).toUpperCase();
  };

  if (vehicles.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: '30px', textAlign: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: tokens.navy }}>
            {t('admin.liveOps.map.nothing')}
          </Typography>
          <Typography sx={{ mt: '4px', fontSize: 12.5, color: tokens.textMuted, maxWidth: '46ch' }}>
            {connectionState === 'connected'
              ? t('admin.liveOps.map.nothingConnected')
              : t('admin.liveOps.map.nothingDisconnected')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
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
          const known = metadata.get(vehicle.vehicleId);

          return (
            <CircleMarker
              key={vehicle.vehicleId}
              center={[vehicle.lat, vehicle.lng]}
              radius={selected ? 10 : vehicle.presentation === 'live' ? 7 : 5.5}
              pathOptions={{
                color: selected ? tokens.navy : style.stroke,
                fillColor: style.fill,
                fillOpacity: style.fillOpacity,
                weight: selected ? 3.5 : style.weight,
                dashArray: style.dashArray,
              }}
              eventHandlers={{ click: () => onSelect(vehicle.vehicleId) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <Box sx={{ fontSize: 12 }}>
                  <strong dir="ltr">{labelFor(vehicle.vehicleId)}</strong>
                  {known?.driverName && <> — {known.driverName}</>}
                  <br />
                  {known?.region ?? t('admin.liveOps.panel.unknownRegion')} · {describeAge(vehicle.fixAgeSeconds)}
                  <br />
                  {vehicle.isDerived ? t('admin.liveOps.panel.derived') : t('admin.liveOps.panel.confirmed')}
                </Box>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
}
