---
name: maps
description: Use this skill whenever building or modifying any map visualization — the island-wide LebanonMap, the district-level LiveCampaignMap, or the Taxi Company FleetMap — including adding new markers, zones, or interactions. LebanonMap is hand-built SVG; LiveCampaignMap and FleetMap are real Leaflet/OpenStreetMap maps.
---

# AdzOnRoad Maps Skill

## Three maps, two techniques — don't confuse them

`CLAUDE.md` names Mapbox GL JS as the aspirational target stack; it is still **not installed**. What's actually in `package.json` is `leaflet` + `react-leaflet` (added for `LiveCampaignMap`, reused by `FleetMap`) and `d3-geo`/`d3-shape` (used only by `LebanonMap`'s hand-built SVG). There is no Mapbox anywhere in this codebase.

## LebanonMap.tsx — hand-built SVG, real geography, island-wide

[src/components/LebanonMap.tsx](../../../src/components/LebanonMap.tsx). Renders the actual Lebanon national boundary from `src/assets/lebanon-boundary.json` (real GeoJSON) via `geoMercator().fitExtent(...)`, with 8 hardcoded `CITIES` (real lon/lat) projected onto it and a hover tooltip (`foreignObject`). Used by Admin dashboard and the pre-rebuild Advertiser dashboard. Shared — changing it affects every consumer. Still no map SDK/tiles here — this one stays pure SVG.

Known TS gotcha already hit and fixed here: iterating GeoJSON polygon rings with `.forEach` breaks TypeScript's control-flow narrowing on the nullable ring variable — use a `for...of` loop instead if adding similar ring-selection logic.

## LiveCampaignMap.tsx — a real Leaflet map with real OpenStreetMap tiles

[src/components/advertiser/LiveCampaignMap.tsx](../../../src/components/advertiser/LiveCampaignMap.tsx). This used to be an abstract hand-drawn SVG (fixed zones, CSS `transform: scale()` "zoom" that just scaled an image) — the user explicitly flagged both of those as wrong ("just a fixed image, not a real one" / zoom only scaling the image) and it was rebuilt on `react-leaflet`'s `<MapContainer>` + `<TileLayer>` pointed at the public OpenStreetMap tile server (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, no API key, free — chosen over Mapbox specifically to avoid a paid/keyed dependency). Real geographic zoom now (tile z/x/y changes on zoom, verified via the tile URL), not a CSS scale.

Key implementation details if extending this:
- **Vehicle markers now use the mock `Vehicle.lat`/`Vehicle.lng` fields directly** as `<CircleMarker center={[lat, lng]}>` — the old golden-angle `zonePosition()` spiral placement (keyed off matching `region` strings to abstract zone circles) is gone. The mock data already had real Beirut-area coordinates; the old map just wasn't using them.
- The six district zones (`ZONES` array: Beirut Central District, Hamra, Verdun, Badaro, Hazmieh, Sin El Fil) are now real `lat`/`lng` pairs, rendered as a tiny `CircleMarker` + permanent `Tooltip` label — real neighborhood pins on the real map, not abstract shapes.
- Zoom buttons are custom-styled (to match the app's card/shadow language) but call the *real* Leaflet API — a small `ZoomControls` component rendered as a child of `<MapContainer>` uses react-leaflet's `useMap()` hook to get the map instance and calls `map.zoomIn()`/`zoomOut()`. Leaflet's own default zoom control is disabled (`zoomControl={false}`) to avoid a duplicate.
- `scrollWheelZoom={false}` is intentional — the map sits inside a scrollable dashboard page, and leaving wheel-zoom on would hijack page scroll the moment the cursor crosses the map. Pan (drag) and double-click zoom stay enabled.
- No `L.Icon`/default marker images are used anywhere (that's the classic Leaflet+bundler broken-icon-path gotcha) — everything is `CircleMarker`, styled via `pathOptions`, so it doesn't apply here. Don't introduce `<Marker>` with a default icon without fixing the icon URLs first if you do.
- The click-marker-for-popup pattern (a docked bottom-left info panel, not a Leaflet `Popup`) was kept as-is from the old version — it needs richer content (`StatusChip`, multi-row layout) than a basic Leaflet popup, so it's a plain positioned `Box` sibling of `<MapContainer>`, triggered via `eventHandlers={{ click: ... }}` on each `CircleMarker`.
- Filter chips (`All`/`Active`/`Offline`/`Campaign`/`Region`/`Date`) are unchanged — `Date` is still just a filter-mode toggle with no real date-range logic behind it, `Region` still opens a `Menu` of zone names.

## FleetMap.tsx — the same real-Leaflet pattern, simplified, on the global theme

[src/components/taxiCompany/FleetMap.tsx](../../../src/components/taxiCompany/FleetMap.tsx). Built directly on the `LiveCampaignMap` pattern (same `MapContainer`/`TileLayer`/`CircleMarker`/custom `ZoomControls` approach) for the [Taxi Company portal](../taxi-company-portal/SKILL.md), but simpler and on the **global theme** (`tokens`, not `advTokens` — this portal isn't scoped like Advertiser) — no filter chips, no zone labels, just one `CircleMarker` per car colored by `CarStatus` (green/red/amber/gray) with a click-to-open detail panel.

**Takes `cars: Car[]` as a prop, not a direct mock-data import** — this was a real bug caught during verification: it used to `import { CARS } from '../../data/taxiCompanyMockData'` directly, so cars added via `AddCarDialog` (which only updates `TaxiCompanyDashboard`'s local `cars` state) never showed up on the map even though they appeared in the cars table. Fixed by making it accept `cars` as a prop and having the dashboard pass its live state through. **If you build another map that needs to reflect data the user can add/edit at runtime, take the data as a prop — don't import the mock array directly inside the map component.**

## If adding a new map anywhere else in the app

Follow whichever pattern matches the need: real-tiles-with-Leaflet (`LiveCampaignMap` pattern — free, no API key, real zoom/pan) for anything that should look and behave like an actual map; hand-built SVG (`LebanonMap` pattern, `d3-geo`) only if you specifically want a stylized/branded look rather than a real basemap. Don't introduce a third map library (Google Maps, Mapbox, etc.) without confirming with the user first — Leaflet+OSM was chosen specifically because it needs no API key or paid account; a different library may not have that property.
