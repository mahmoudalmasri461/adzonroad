import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import RoomIcon from '@mui/icons-material/Room';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { advTokens, cardSx } from './theme';
import StatusChip from './StatusChip';
import { VEHICLES, SCREENS, CAMPAIGNS } from '../../data/advertiserMockData';

const BEIRUT_CENTER: [number, number] = [33.884, 35.508];
const DEFAULT_ZOOM = 12;

const ZONES = [
  { name: 'Beirut Central District', lat: 33.8959, lng: 35.5017 },
  { name: 'Hamra', lat: 33.8959, lng: 35.4818 },
  { name: 'Verdun', lat: 33.8837, lng: 35.478 },
  { name: 'Badaro', lat: 33.8788, lng: 35.5138 },
  { name: 'Hazmieh', lat: 33.8534, lng: 35.545 },
  { name: 'Sin El Fil', lat: 33.8756, lng: 35.5389 },
];

const FILTERS = ['All', 'Active', 'Offline', 'Campaign', 'Region', 'Date'] as const;
type FilterKey = (typeof FILTERS)[number];

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
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [regionAnchor, setRegionAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enriched = useMemo(
    () =>
      VEHICLES.map((v) => {
        const screen = SCREENS.find((s) => s.vehicleId === v.id);
        const campaign = screen?.currentCampaignId ? CAMPAIGNS.find((c) => c.id === screen.currentCampaignId) : null;
        return { vehicle: v, screen, campaign };
      }),
    [],
  );

  const filtered = enriched.filter(({ screen, vehicle }) => {
    if (activeFilter === 'Active') return screen?.status === 'Online';
    if (activeFilter === 'Offline') return screen?.status === 'Offline';
    if (activeFilter === 'Campaign') return !!screen?.currentCampaignId;
    if (activeFilter === 'Region') return regionFilter ? vehicle.region === regionFilter : true;
    return true;
  });

  const selected = enriched.find((e) => e.vehicle.id === selectedId) ?? null;

  return (
    <Box sx={{ ...cardSx, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '16px 18px 0' }}>
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            Live coverage
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text }}>Live Campaign Map</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: advTokens.green,
              animation: 'advLivePulse 1.8s infinite',
            }}
          />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: advTokens.green }}>Live</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', padding: '12px 18px 0' }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === 'Region' && regionFilter ? regionFilter : f}
            onClick={(e) => {
              if (f === 'Region') {
                setRegionAnchor(e.currentTarget);
                setActiveFilter('Region');
              } else {
                setActiveFilter(f);
              }
            }}
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
      <Menu anchorEl={regionAnchor} open={!!regionAnchor} onClose={() => setRegionAnchor(null)}>
        {ZONES.map((z) => (
          <MenuItem
            key={z.name}
            onClick={() => {
              setRegionFilter(z.name);
              setRegionAnchor(null);
            }}
          >
            {z.name}
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ position: 'relative', height: { xs: 320, md: 420 }, mt: '12px', borderTop: `1px solid ${advTokens.border}` }}>
        <MapContainer center={BEIRUT_CENTER} zoom={DEFAULT_ZOOM} zoomControl={false} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControls />

          {ZONES.map((z) => (
            <CircleMarker key={z.name} center={[z.lat, z.lng]} radius={3} pathOptions={{ color: advTokens.orange, fillColor: advTokens.orange, fillOpacity: 0.5, weight: 1 }}>
              <Tooltip permanent direction="top" offset={[0, -4]} className="adv-zone-label">
                {z.name}
              </Tooltip>
            </CircleMarker>
          ))}

          {filtered.map(({ vehicle, screen }) => {
            const online = screen?.status === 'Online';
            const isSelected = selectedId === vehicle.id;
            return (
              <CircleMarker
                key={vehicle.id}
                center={[vehicle.lat, vehicle.lng]}
                radius={isSelected ? 9 : online ? 7 : 5.5}
                pathOptions={{
                  color: online ? '#fff' : advTokens.textMuted,
                  fillColor: online ? advTokens.orange : '#fff',
                  fillOpacity: 1,
                  weight: isSelected ? 3 : online ? 2 : 1.5,
                }}
                eventHandlers={{ click: () => setSelectedId(vehicle.id) }}
              />
            );
          })}
        </MapContainer>

        {selected && (
          <Box
            sx={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              zIndex: 1000,
              width: 240,
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
                <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>{selected.vehicle.taxiId}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ color: advTokens.textMuted, p: '2px' }}>
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'grid', gap: '5px', fontSize: 12 }}>
              <Row label="Screen ID" value={selected.screen?.screenId ?? '—'} />
              <Row label="Campaign" value={selected.campaign?.name ?? 'None active'} />
              <Row label="Region" value={selected.vehicle.region} />
              <Row label="Speed" value={`${selected.vehicle.speedKmh} km/h`} />
              <Row label="Last update" value={selected.screen?.lastUpdate ?? '—'} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '4px' }}>
                <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted }}>Screen</Typography>
                {selected.screen && <StatusChip status={selected.screen.status} size="small" />}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ color: advTokens.textMuted }}>Network</span>
                <span style={{ fontWeight: 700, color: selected.screen?.networkStatus === 'Connected' ? advTokens.green : advTokens.red }}>
                  {selected.screen?.networkStatus ?? '—'}
                </span>
              </Box>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: advTokens.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </Box>
  );
}
