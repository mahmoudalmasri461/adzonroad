---
name: offline-sync
description: Use this skill whenever working on offline tolerance, sync status, "pending sync" states, or reconciliation between locally-recorded driver/screen data and the platform — either the mock UI representation here or the real local-storage logic in the Android app.
---

# AdzOnRoad Offline Sync Skill

## The principle (from CLAUDE.md, not yet backed by real infrastructure)

If a screen/driver loses internet: keep displaying downloaded ads, keep recording GPS and playback events locally, sync automatically on reconnect, never lose verified delivery records because of a temporary gap. This is a **business requirement**, and parts of its vocabulary are already baked into the type system — but there is no real offline storage, queueing, or reconciliation service anywhere in this workspace yet.

## Where the concept already appears

- `PlaybackRecord.syncState` in [src/types/advertiser.ts](../../../src/types/advertiser.ts): `'Live Verified' | 'Pending Sync' | 'Reconciled Verified'` — the three-state model every sync UI should use. Don't invent different label text for the same concept elsewhere (e.g. don't add a fourth ad-hoc "syncing…" state without extending this union first).
- `Screen.status` includes `'Pending Sync'` as one of five screen states (alongside `Online`/`Offline`/`Inactive`/`Maintenance`).
- `VerificationStatusCard.tsx` ([src/components/advertiser/VerificationStatusCard.tsx](../../../src/components/advertiser/VerificationStatusCard.tsx)) buckets the mock `SCREENS` array into Live Verified / Pending Sync / Reconciled Verified counts — this is the reference UI pattern for showing sync health. It's derived client-side from static mock data (`screen.status === 'Online'` → Live Verified, `'Pending Sync'` → Pending Sync, everything else → Reconciled Verified) — a real implementation would get these counts from a backend aggregation instead of deriving them in the component.
- The **web** Driver dashboard's "Recording status" card ([src/pages/DriverDashboard.tsx](../../../src/pages/DriverDashboard.tsx)) shows a two-row mock ("Synced to platform — 2 min ago" / "4 min pending sync — queued") — purely static text, not driven by any real queue.

## Where real (partial) offline logic exists

The **native Android app**'s `data/ShiftRepository.kt` and `service/ShiftTrackingService.kt` (see [driver-app skill](../driver-app/SKILL.md)) are the only place actual local persistence for shift/GPS data is implemented (AndroidX DataStore for session state) — but confirm current behavior by reading those files before assuming a queue-and-retry sync mechanism exists; it may currently just be "post immediately, fail silently if offline" rather than a durable local queue. If asked to build real offline queueing, that's Android-side work (e.g. a Room database or a WorkManager-backed retry queue) plus a backend reconciliation endpoint that doesn't exist yet.

## If asked to build real sync

Scope it explicitly as: (1) local durable storage on the Android side for GPS/playback events generated while offline, (2) a backend endpoint that accepts batched/backdated events and reconciles them against the campaign's verified-delivery totals, (3) frontend surfacing of the resulting Live Verified/Pending Sync/Reconciled Verified counts from real data instead of the current static derivation. Don't implement just the frontend piece and call it "sync" — there'd be nothing behind it to sync from.
