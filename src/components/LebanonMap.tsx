import { useMemo, useState } from 'react';
import { geoMercator } from 'd3-geo';
import { curveCatmullRomClosed, line as d3line } from 'd3-shape';
import Box from '@mui/material/Box';
import lebanonBoundary from '../assets/lebanon-boundary.json';

type City = {
  region: string;
  name: string;
  lon: number;
  lat: number;
  status: 'active' | 'limited';
  screens: number;
  dx: number;
  dy: number;
};

const CITIES: City[] = [
  { region: 'North', name: 'Tripoli', lon: 35.8497, lat: 34.4367, status: 'active', screens: 140, dx: 12, dy: -16 },
  { region: 'Keserwan-Jbeil', name: 'Byblos', lon: 35.6481, lat: 34.1208, status: 'active', screens: 70, dx: 12, dy: -16 },
  { region: 'Keserwan-Jbeil', name: 'Jounieh', lon: 35.6178, lat: 33.9808, status: 'active', screens: 110, dx: 12, dy: -38 },
  { region: 'Beirut', name: 'Beirut', lon: 35.5018, lat: 33.8938, status: 'active', screens: 420, dx: 12, dy: -10 },
  { region: 'Mount Lebanon', name: 'Baabda', lon: 35.63, lat: 33.82, status: 'active', screens: 260, dx: 12, dy: 20 },
  { region: 'Beqaa', name: 'Zahle', lon: 35.902, lat: 33.8463, status: 'limited', screens: 80, dx: 12, dy: -16 },
  { region: 'South', name: 'Sidon', lon: 35.3758, lat: 33.5606, status: 'active', screens: 95, dx: 12, dy: -16 },
  { region: 'South', name: 'Tyre', lon: 35.2038, lat: 33.2704, status: 'limited', screens: 60, dx: 12, dy: -16 },
];

const STATUS_COLOR: Record<City['status'], string> = { active: '#5fd88f', limited: '#e8b04b' };
const W = 480;
const H = 660;

type GeoFeature = {
  type: string;
  geometry: { type: string; coordinates: unknown };
};

export default function LebanonMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const smoothPath = useMemo(() => {
    const feature = (lebanonBoundary as unknown as { features: GeoFeature[] }).features[0];
    const geometry = feature.geometry;
    const polys = (geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.coordinates) as number[][][][];
    let ring: number[][] = polys[0][0];
    for (const p of polys) {
      if (p[0].length > ring.length) ring = p[0];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proj = geoMercator().fitExtent(
      [
        [52, 50],
        [W - 52, H - 56],
      ],
      feature as any,
    );

    const pts = ring.map(([lon, lat]) => proj([lon, lat]) as [number, number]);
    const lineGen = d3line().curve(curveCatmullRomClosed.alpha(0.5));
    return { path: lineGen(pts) ?? '', proj };
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', background: '#eef0f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}>
        <defs>
          <linearGradient id="topFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f4580" />
            <stop offset="55%" stopColor="#2b2741" />
            <stop offset="100%" stopColor="#221f36" />
          </linearGradient>
          <linearGradient id="sheen" x1="0%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="rgba(233,233,237,0.22)" />
            <stop offset="35%" stopColor="rgba(233,233,237,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id="dropshadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1e293b" floodOpacity="0.22" />
          </filter>
        </defs>

        <g filter="url(#dropshadow)">
          <path d={smoothPath.path} transform="translate(7,10)" fill="#17151f" />
          <path d={smoothPath.path} transform="translate(4.5,6.5)" fill="#201c30" />
          <path d={smoothPath.path} transform="translate(2.3,3.3)" fill="#2b2741" />
          <path d={smoothPath.path} fill="url(#topFill)" stroke="#2952CC" strokeWidth={1.3} strokeOpacity={0.55} />
          <path d={smoothPath.path} fill="url(#sheen)" />
        </g>

        {CITIES.map((c) => {
          const [x, y] = smoothPath.proj([c.lon, c.lat]) as [number, number];
          const isHovered = hovered === c.name;
          return (
            <g
              key={c.name}
              transform={`translate(${x},${y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(c.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                r={7}
                fill={STATUS_COLOR[c.status]}
                opacity={0.22}
                style={{ animation: 'pinPulse 2.4s infinite', transformOrigin: 'center' }}
              />
              <circle r={3.6} fill={STATUS_COLOR[c.status]} stroke="#292b31" strokeWidth={1.4} />
              <circle r={12} fill="transparent" />
              {!isHovered && (
                <text x={10} y={-4} fontSize={11.5} fontWeight={500} fill="#cfd3e5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {c.name}
                </text>
              )}
              {isHovered && (
                <foreignObject x={c.dx} y={c.dy} width={200} height={60} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      gap: 1,
                      background: 'rgba(35,37,50,0.94)',
                      border: '1px solid rgba(145,132,217,0.4)',
                      borderRadius: 6,
                      padding: '4px 9px',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 12,
                      color: '#e9e9ed',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                    }}
                  >
                    <b style={{ fontWeight: 600 }}>{c.region}</b>
                    <span style={{ color: '#9397ab', fontSize: 10 }}>
                      {c.name} &middot; {c.screens}
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
      <style>{`
        @keyframes pinPulse { 0%{opacity:0.55;} 50%{opacity:1;} 100%{opacity:0.55;} }
      `}</style>
    </Box>
  );
}
