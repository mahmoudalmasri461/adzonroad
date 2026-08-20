import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { tokens } from '../../theme';
import { gpsLabel, positionAge, type FleetVehicle, type FleetVehicleStatus } from '../../services/fleet';

const BEIRUT_CENTER: [number, number] = [33.884, 35.508];
const DEFAULT_ZOOM = 12;

const STATUS_COLOR: Record<FleetVehicleStatus, string> = {
  Active: tokens.green,
  Offline: tokens.red,
  Maintenance: tokens.warn,
  Idle: tokens.textMuted,
  'Not Fitted': tokens.textMuted,
};

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
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: tokens.shadowMd,
        p: '4px',
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

type FleetMapProps = {
  vehicles: FleetVehicle[];
};

/**
 * Where the company's cars actually are.
 *
 * Only vehicles that have reported a position are plotted. A car with no fix is absent from the
 * map rather than placed somewhere plausible, and every marker carries the age of its fix — the
 * map must never imply a taxi is still where it was seen an hour ago.
 */
export default function FleetMap({ vehicles }: FleetMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const located = vehicles.filter(
    (v): v is FleetVehicle & { lat: number; lng: number } => v.lat !== null && v.lng !== null,
  );

  const selected = located.find((v) => v.id === selectedId) ?? null;

  return (
    <Box sx={{ position: 'relative', height: { xs: 320, md: 420 }, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${tokens.border}` }}>
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
        {located.map((vehicle) => {
          const isSelected = selectedId === vehicle.id;
          return (
            <CircleMarker
              key={vehicle.id}
              center={[vehicle.lat, vehicle.lng]}
              radius={isSelected ? 9 : 7}
              pathOptions={{
                color: '#fff',
                fillColor: STATUS_COLOR[vehicle.status] ?? tokens.textMuted,
                fillOpacity: 1,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{ click: () => setSelectedId(vehicle.id) }}
            />
          );
        })}
      </MapContainer>

      {located.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.82)',
            textAlign: 'center',
            px: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>No vehicle positions yet</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: '4px', maxWidth: 320 }}>
              Cars appear here once a driver starts a shift and the device begins reporting GPS.
            </Typography>
          </Box>
        </Box>
      )}

      {selected && (
        <Box
          sx={{
            position: 'absolute',
            left: 14,
            bottom: 14,
            zIndex: 1000,
            width: 230,
            backgroundColor: '#fff',
            border: `1px solid ${tokens.border}`,
            borderRadius: '12px',
            boxShadow: tokens.shadowMd,
            padding: '14px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: '8px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DirectionsCarIcon sx={{ fontSize: 16, color: tokens.blue }} />
              <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>{selected.plateNumber}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ color: tokens.textMuted, p: '2px' }}>
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
          <Box sx={{ display: 'grid', gap: '5px', fontSize: 12 }}>
            <Row label="Screen" value={selected.screenSerialNumber ?? 'Not fitted'} />
            <Row label="Model" value={selected.year ? `${selected.model} (${selected.year})` : selected.model} />
            <Row label="Status" value={selected.status} color={STATUS_COLOR[selected.status]} />
            <Row label="GPS" value={gpsLabel(selected)} />
            {/* The age is the honest part — a position without it invites the wrong conclusion. */}
            <Row label="Last fix" value={positionAge(selected.positionCapturedAtUtc)} />
            <Row label="Campaign" value={selected.currentCampaign ?? 'None active'} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: tokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </Box>
  );
}
