---
name: driver-app
description: Use this skill whenever building or modifying the AdzOnRoad Driver experience — either the web-based mobile-shell dashboard at src/pages/DriverDashboard.tsx, or the native Android driver app project. Clarifies which of the two "driver app" codebases a request is actually about.
---

# AdzOnRoad Driver App Skill

## Two separate codebases share the name "driver app" — check which one is meant

1. **Web driver dashboard** (this repo) — [src/pages/DriverDashboard.tsx](../../../src/pages/DriverDashboard.tsx). A phone-width web page (not a native app) using `MobileShell` + `BottomTabBar` for an app-like frame, reached via `/driver` after logging in with role=driver. It's a **preview/demo surface**, not what a real driver would use in production.
2. **Native Android app** — `C:\Users\malmasri\Desktop\AdzOnRoadDriverApp` (a **separate git-less project, sibling to this one, not a subfolder of it**). Kotlin + Jetpack Compose, actually runs on-device, does real GPS tracking via `FusedLocationProviderClient`. This is the real driver-facing product; the web page above is a stakeholder-facing mockup of the same ideas.

If a request just says "the driver app" without more context, ask (or infer from whether the task talks about `.tsx`/web vs `.kt`/Android/Play Store/APK) which one is meant — they have overlapping concepts (shift start/stop, earnings, GPS, sync status) but are not code-shared in any way and changes to one never need to be mirrored in the other unless explicitly requested.

## Web driver dashboard (this repo)

Current sections in `DriverDashboard.tsx`: greeting + live status chips, today's earnings card (navy gradient), current campaign card, quick stats grid, "recording status" sync card (synced vs. pending-sync rows — mock, static), vehicle & screen info, report-damage/request-maintenance dialogs, bottom tab bar. Status chips, vehicle info rows, and today's shift numbers (`SHIFT_MOCK`) live in [src/data/driverMockData.ts](../../../src/data/driverMockData.ts) / [src/types/driver.ts](../../../src/types/driver.ts), mirroring the Advertiser/Admin types+data split.

The report-damage/request-maintenance dialogs use [components/ActionDialog.tsx](../../../src/components/ActionDialog.tsx) — this used to be a small component defined locally inside `DriverDashboard.tsx`, but was extracted to `components/` when the [Taxi Company portal](../taxi-company-portal/SKILL.md) needed the same pattern (with a per-vehicle picker, which Driver doesn't use since it only ever manages one vehicle). If you touch this dialog's behavior, check both consumers.

Uses the **global navy/amber theme** (`tokens` from `../theme`) — this page predates the advertiser-scoped theme split and should stay on the global palette; do not introduce `advTokens` here.

The driver earnings formula (base $30 + $0.60/driving hour + a flat $20 bonus for the period if the driver covers premium areas — Verdun, Gemmayze, Saifi, Downtown, etc.) is implemented once, in [src/services/earningsService.ts](../../../src/services/earningsService.ts) (`calculateDriverEarnings`), and consumed by **both** the Homepage's interactive earnings estimator (`src/pages/Homepage.tsx`, the hours/days slider widget) and this dashboard's "Today's earnings"/"This month" figures. It previously existed only as inline logic duplicated in the Homepage widget while this dashboard showed unrelated hardcoded numbers ($24.60/$518) that didn't match the formula at all — that inconsistency is now resolved; don't reintroduce a second copy of this calculation anywhere. Today's route (Baabda) isn't a premium area, so the daily figure excludes the bonus; the monthly figure assumes some premium-area coverage across the mock `daysWorkedThisMonth` — both flags live on `SHIFT_MOCK` in `driverMockData.ts`, not hardcoded in the component.

`BottomTabBar` currently only has a working "Home" tab (`active="Home"` is hardcoded on this page) — the other tabs are visual only.

## Native Android app

Structure under `app/src/main/java/com/adzonroad/driverapp/`:
- `MainActivity.kt` / `ui/AppRoot.kt`, `LoginScreen.kt`, `ShiftScreen.kt`, `SettingsScreen.kt` — Compose UI
- `service/ShiftTrackingService.kt` (`LifecycleService`, `START_STICKY`, persistent notification) + `ShiftState.kt` — foreground GPS tracking service, required for reliable background location on Android 8+
- `data/ApiClient.kt` / `ApiService.kt` (Retrofit2 + Gson + OkHttp logging interceptor) — currently points at a **mock/test backend, not a real AdzOnRoad API** (no backend exists yet — see [gps-tracking skill](../gps-tracking/SKILL.md))
- `data/SessionManager.kt` — AndroidX DataStore Preferences for auth/session persistence
- `data/ShiftRepository.kt` — shift start/stop + GPS batching logic
- `util/BatteryUtils.kt`, `util/NetworkUtils.kt`, `util/DistanceTracker.kt`

Known environment constraint: **no JDK/Android SDK/Studio is available in this Claude Code environment** — this code has been written carefully but never locally compiled by Claude. The user builds/runs it themselves via their own Android Studio install on a physical Samsung Z Flip 3. Any change here should be double-checked by careful reading (imports, API signatures, Gradle config) since there is no build-here-verify-here loop available — flag this limitation to the user rather than claiming a change is "verified."

Android 10+/11+ requires background location permission as a **separate second step** after foreground location grant (the system won't offer "Allow all the time" in the same dialog) — already handled in the permission flow, don't regress this if touching permission code. Samsung/One UI aggressive battery optimization can kill the background service; there's already an in-app settings prompt for `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — keep it prominent if reworking Settings.
