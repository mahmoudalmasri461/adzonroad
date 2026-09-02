import { useMemo } from 'react';
import { geoMercator } from 'd3-geo';
import { curveCatmullRomClosed, line as d3line } from 'd3-shape';
import Box from '@mui/material/Box';
import lebanonBoundary from '../assets/lebanon-boundary.json';
import { tokens } from '../theme';

export type MapArea = {
  /** Display name, and the key the caller selects by. */
  name: string;
  lon: number;
  lat: number;
  /** True when the platform actually returned regions inside this area. */
  covered: boolean;
  /** Nudges a label off its pin where two pins sit close enough to collide. */
  labelDx?: number;
  labelDy?: number;
};

type LebanonMapProps = {
  areas: MapArea[];
  selected: string | null;
  onSelect: (name: string) => void;
};

const W = 480;
const H = 660;

type GeoFeature = {
  type: string;
  geometry: { type: string; coordinates: unknown };
};

/**
 * Lebanon, drawn from the real boundary, with a pin per area the platform can target.
 *
 * The pins used to carry screen counts — Beirut 420, Baabda 260, and so on, about 1,235 screens
 * across the country. None of it came from anywhere; the production database holds no screens at
 * all. Counts are gone entirely rather than zeroed, because a map full of zeroes says something
 * just as untrue in the other direction. Whether an area is covered is now passed in by the
 * caller, which derives it from what the regions endpoint actually returns.
 *
 * Coordinates are real geography and stay. The palette is the brand's: navy landmass, amber for
 * the selected area, muted for the rest.
 */
export default function LebanonMap({ areas, selected, onSelect }: LebanonMapProps) {
  const projected = useMemo(() => {
    const feature = (lebanonBoundary as unknown as { features: GeoFeature[] }).features[0];
    const geometry = feature.geometry;
    const polys = (geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.coordinates) as number[][][][];

    let ring: number[][] = polys[0][0];
    for (const p of polys) {
      if (p[0].length > ring.length) ring = p[0];
    }

    const proj = geoMercator().fitExtent(
      [
        [46, 44],
        [W - 46, H - 50],
      ],
      // d3's typings want a GeoJSON object here; the boundary file is one.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feature as any,
    );

    const pts = ring.map(([lon, lat]) => proj([lon, lat]) as [number, number]);
    const lineGen = d3line().curve(curveCatmullRomClosed.alpha(0.5));
    return { path: lineGen(pts) ?? '', proj };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        component="svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        sx={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <path d={projected.path} fill={tokens.navy} fillOpacity={0.055} stroke={tokens.navy} strokeOpacity={0.16} strokeWidth={1.2} />

        {areas.map((area) => {
          const [x, y] = projected.proj([area.lon, area.lat]) as [number, number];
          const isSelected = selected === area.name;
          const colour = !area.covered ? tokens.textMuted : isSelected ? tokens.amber : tokens.navy;

          return (
            <g
              key={area.name}
              transform={`translate(${x},${y})`}
              onClick={() => onSelect(area.name)}
              onMouseEnter={() => onSelect(area.name)}
              style={{ cursor: 'pointer' }}
            >
              {/* Generous invisible hit area: the visible pin is 4px and a 4px target is a miss. */}
              <circle r={18} fill="transparent" />
              {isSelected && <circle r={13} fill={tokens.amber} fillOpacity={0.18} />}
              <circle
                r={isSelected ? 6 : 4.5}
                fill={colour}
                fillOpacity={area.covered ? 1 : 0.45}
                stroke={tokens.surface}
                strokeWidth={2}
                style={{ transition: 'r .18s ease, fill .18s ease' }}
              />
              <text
                x={area.labelDx ?? 13}
                y={area.labelDy ?? 4}
                fontSize={13}
                fontWeight={isSelected ? 700 : 600}
                fill={isSelected ? tokens.navy : tokens.textMuted}
                style={{ pointerEvents: 'none' }}
              >
                {area.name}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
}
