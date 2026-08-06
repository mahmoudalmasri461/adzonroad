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
import { advTokens, cardSx } from './theme';
import StatusChip from './StatusChip';
import { VEHICLES, SCREENS, CAMPAIGNS } from '../../data/advertiserMockData';

const W = 640;
const H = 460;

const ZONES = [
  { name: 'Beirut Central District', x: 300, y: 240, r: 70 },
  { name: 'Hamra', x: 150, y: 180, r: 56 },
  { name: 'Verdun', x: 130, y: 320, r: 54 },
  { name: 'Badaro', x: 400, y: 300, r: 56 },
  { name: 'Hazmieh', x: 500, y: 380, r: 58 },
  { name: 'Sin El Fil', x: 470, y: 150, r: 54 },
];

const FILTERS = ['All', 'Active', 'Offline', 'Campaign', 'Region', 'Date'] as const;
type FilterKey = (typeof FILTERS)[number];

function zonePosition(regionName: string, index: number) {
  const zone = ZONES.find((z) => z.name === regionName) ?? ZONES[0];
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = zone.r * 0.35;
  return { x: zone.x + Math.cos(angle) * radius, y: zone.y + Math.sin(angle) * radius };
}

export default function LiveCampaignMap() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [regionAnchor, setRegionAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const enriched = useMemo(
    () =>
      VEHICLES.map((v, i) => {
        const screen = SCREENS.find((s) => s.vehicleId === v.id);
        const campaign = screen?.currentCampaignId ? CAMPAIGNS.find((c) => c.id === screen.currentCampaignId) : null;
        const pos = zonePosition(v.region, i);
        return { vehicle: v, screen, campaign, pos };
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
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="advStreets" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="#E1E5EF" strokeWidth={1} />
              </pattern>
              <pattern id="advAvenues" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M160 0H0V160" fill="none" stroke="#CBD2E0" strokeWidth={2} />
              </pattern>
              <filter id="advMarkerShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0F1B3D" floodOpacity="0.25" />
              </filter>
            </defs>

            <rect width={W} height={H} fill={advTokens.mapBg} />
            <rect width={W} height={H} fill="url(#advStreets)" />
            <rect width={W} height={H} fill="url(#advAvenues)" />

            {/* Stylized Mediterranean coastline along the west edge */}
            <path d={`M0,0 L70,0 C110,80 60,180 90,260 C115,330 60,400 100,${H} L0,${H} Z`} fill="#CFE3F5" opacity={0.7} />
            <path
              d={`M70,0 C110,80 60,180 90,260 C115,330 60,400 100,${H}`}
              fill="none"
              stroke="#AFCDEA"
              strokeWidth={1.5}
            />

            {ZONES.map((z) => (
              <g key={z.name}>
                <circle cx={z.x} cy={z.y} r={z.r} fill="rgba(41,82,204,0.05)" />
                <text
                  x={z.x}
                  y={z.y - z.r - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={advTokens.text}
                  style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}
                >
                  {z.name}
                </text>
              </g>
            ))}

            {filtered.map(({ vehicle, screen, pos }) => {
              const online = screen?.status === 'Online';
              const isSelected = selectedId === vehicle.id;
              return (
                <g
                  key={vehicle.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(vehicle.id)}
                >
                  {isSelected && <circle r={11} fill="none" stroke={advTokens.orange} strokeWidth={2} />}
                  <circle
                    r={online ? 6 : 5}
                    fill={online ? advTokens.orange : '#fff'}
                    stroke={online ? '#fff' : advTokens.textMuted}
                    strokeWidth={online ? 2 : 1.5}
                    filter="url(#advMarkerShadow)"
                  />
                  <circle r={14} fill="transparent" />
                </g>
              );
            })}
          </svg>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: advTokens.white,
            borderRadius: '10px',
            boxShadow: advTokens.shadowMd,
            p: '4px',
          }}
        >
          <IconButton size="small" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} sx={{ color: advTokens.text }}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} sx={{ color: advTokens.text }}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Box>

        {selected && (
          <Box
            sx={{
              position: 'absolute',
              left: 14,
              bottom: 14,
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
