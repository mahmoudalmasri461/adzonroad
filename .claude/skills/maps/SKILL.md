---
name: maps
description: Use this skill whenever building or modifying any map visualization — the island-wide LebanonMap or the district-level LiveCampaignMap — including adding new markers, zones, or interactions. Both are hand-built SVG maps with no third-party map SDK.
---

# AdzOnRoad Maps Skill

## No map SDK is installed — both maps are hand-built SVG

`CLAUDE.md` names Mapbox GL JS as the target stack, but it is **not installed** (`package.json` has no map library at all). Both existing maps are custom SVG rendered directly in React, using `d3-geo`/`d3-shape` only for the island-wide one. Don't assume a `<Map>`/`<Marker>` component from a map SDK exists — there isn't one.

## LebanonMap.tsx — real geography, island-wide

[src/components/LebanonMap.tsx](../../../src/components/LebanonMap.tsx). Renders the actual Lebanon national boundary from `src/assets/lebanon-boundary.json` (real GeoJSON) via `geoMercator().fitExtent(...)`, with 8 hardcoded `CITIES` (real lon/lat) projected onto it and a hover tooltip (`foreignObject`). Used by Admin dashboard and the pre-rebuild Advertiser dashboard. Shared — changing it affects every consumer.

Known TS gotcha already hit and fixed here: iterating GeoJSON polygon rings with `.forEach` breaks TypeScript's control-flow narrowing on the nullable ring variable — use a `for...of` loop instead if adding similar ring-selection logic.

## LiveCampaignMap.tsx — abstract district zones, no real geodata

[src/components/advertiser/LiveCampaignMap.tsx](../../../src/components/advertiser/LiveCampaignMap.tsx). This is **not a real Beirut street map** — there's no GeoJSON for Beirut-area neighborhoods in this repo, so the six district zones (Beirut Central District, Hamra, Verdun, Badaro, Hazmieh, Sin El Fil) are hand-placed circles at fixed `{x, y, r}` coordinates in an abstract `640×460` viewBox, not a real projection. Vehicle markers are placed via `zonePosition()` — a golden-angle spiral offset within each zone's circle, keyed off the vehicle's `region` string matching a zone `name` — **not** by projecting the vehicle's actual `lat`/`lng` fields (which exist on the mock `Vehicle` type but aren't used for on-screen placement here). If asked to make this a real geographic map, that's a "source real Beirut GeoJSON + switch to a `geoMercator` projection like `LebanonMap` does" task, not a small tweak.

Interactive features already built, to reuse rather than rebuild if extending: filter chips (`All`/`Active`/`Offline`/`Campaign`/`Region`/`Date` — `Date` is currently just a filter-mode toggle with no real date-range logic behind it, `Region` opens a `Menu` of zone names), click-marker-for-popup (a docked bottom-left info panel, not a floating tooltip — chosen deliberately over `foreignObject` positioning so it stays legible under the zoom transform), zoom via CSS `transform: scale()` on a wrapping `Box` (0.6–2.0 range), a pulsing "Live" indicator, and online/offline marker pulse animation via inline `<style>` keyframes scoped to the component.

## If adding a new map anywhere else in the app

Follow whichever of these two patterns matches the need: real-geography-with-GeoJSON (`LebanonMap` pattern, `d3-geo`) if real boundary data is available, or abstract-zone (`LiveCampaignMap` pattern) if not. Don't introduce a third map library (Leaflet, Google Maps, Mapbox) without confirming with the user first — that's a dependency + API-key + cost decision, not a drop-in swap.
