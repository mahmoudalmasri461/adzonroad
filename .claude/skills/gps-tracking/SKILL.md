---
name: gps-tracking
description: Use this skill whenever working with vehicle location, GPS coordinates, taxi markers, speed/heading data, or "where is the screen" style features — whether in the frontend mock data, the map components, or the native Android app's real location service.
---

# AdzOnRoad GPS Tracking Skill

## There is no real GPS backend anywhere yet

Nothing in this repo (`AdzOnRoadFinal`) receives, stores, or streams real GPS data. Every "live" location shown in the UI is static mock data. The only code that talks to real device GPS hardware is the separate native Android project (`C:\Users\malmasri\Desktop\AdzOnRoadDriverApp`, see [driver-app skill](../driver-app/SKILL.md)) via `FusedLocationProviderClient`, and even that currently posts to a mock/test API endpoint, not a real backend — there is no backend project in this workspace at all. Don't write code that assumes a `/api/gps` endpoint exists; if a task requires one, that's a "design/build the endpoint" task, not "wire up to the existing one."

## Mock data model (frontend)

`src/types/advertiser.ts` defines the shape real GPS data would eventually take:
- `Vehicle` — `taxiId`, `plate`, `driverName`, `region`, `speedKmh`, `lat`, `lng`, `heading`
- `GpsRecord` — `vehicleId`, `timestamp`, `lat`, `lng`, `speedKmh` (a point-in-time log entry — currently unused by any component, defined for future use)
- `Screen.status` (`Online`/`Offline`/`Inactive`/`Pending Sync`/`Maintenance`) and `Screen.networkStatus` (`Connected`/`Disconnected`) — the device-health side of the same picture

`src/data/advertiserMockData.ts` has 8 hardcoded `VEHICLES` with fixed lat/lng (real Beirut-area coordinates, but static — they never move) and a matching `SCREENS` array joined by `vehicleId`. `LiveCampaignMap.tsx` ([src/components/advertiser/LiveCampaignMap.tsx](../../../src/components/advertiser/LiveCampaignMap.tsx)) renders these as markers, but positions them using an **abstract deterministic offset within a hand-drawn zone** (`zonePosition()` — golden-angle spiral around a zone center), not the actual lat/lng values plotted on a real projection — there is no real Beirut street-level map in this app (see [maps skill](../maps/SKILL.md)). Don't assume the lat/lng fields are actually driving marker placement on screen; they're stored for realism/future use but not currently projected.

## If asked to "make GPS live"

That's a multi-part task, not a config flag:
1. A real backend endpoint (REST for history, WebSocket/SignalR for live push — SignalR is named in `CLAUDE.md` as the intended tech but nothing is implemented) to receive pings from the Android app's `ShiftRepository.kt`.
2. A frontend data-fetching layer — currently **zero** data-fetching libraries are installed (no Axios, no TanStack Query — check `package.json` before assuming otherwise; `CLAUDE.md` names them as target stack, not current reality).
3. Replacing `LiveCampaignMap`'s static `VEHICLES` import with live state, and deciding whether to keep the abstract zone-projection or switch to a real geo-projection (see maps skill for the `d3-geo` pattern already used in `LebanonMap.tsx`, which could be extended to Beirut street level if real basemap data is sourced).

Treat any of these as a distinct, explicitly-scoped task — don't half-wire one piece (e.g., add a fetch call with nowhere real to fetch from) without flagging the missing pieces to the user first.

## Sync/offline semantics already modeled

The `Screen.status` "Pending Sync" and the `PlaybackRecord.syncState` union (`'Live Verified' | 'Pending Sync' | 'Reconciled Verified'`) already encode the intended offline-tolerance behavior described in `CLAUDE.md` (never lose verified delivery data because of a temporary network gap). See the [offline-sync skill](../offline-sync/SKILL.md) for how this is meant to work end-to-end and how `VerificationStatusCard` currently buckets mock screens into these three states.
