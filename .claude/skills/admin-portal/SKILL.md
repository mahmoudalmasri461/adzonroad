---
name: admin-portal
description: Use this skill whenever building or modifying the AdzOnRoad Admin (operations) dashboard — platform-wide KPIs, screen inventory, campaign approvals, alerts, or anything under src/pages/AdminDashboard.tsx.
---

# AdzOnRoad Admin Portal Skill

## Current state

[src/pages/AdminDashboard.tsx](../../../src/pages/AdminDashboard.tsx) is a single-file "operations overview" — `PageHeader`, platform-wide KPI row, Lebanon map + screen-alerts card, a pending-campaign-approvals `DataGrid`, and a screen-inventory `DataGrid` with search. It is **not yet split into the 12+ sub-pages** implied by its own `NAV_ITEMS` list (Live Operations, Advertisers, Drivers, Taxi Companies, Vehicles, Screens, Pricing, Finance, Reports, Support, Settings) — every nav item except "Overview" routes through `useToast` with an "isn't built in this preview yet" stub via `DashboardShell`'s default nav-click behavior (see [design-system skill](../design-system/SKILL.md) and [src/layouts/DashboardShell.tsx](../../../src/layouts/DashboardShell.tsx)).

This page uses the **global navy/amber theme** (`tokens` from `../theme`), not the advertiser-scoped orange/charcoal one — do not import `advTokens` here.

## Building out a stub nav item

When asked to build one of the stub sections (e.g. "Advertisers" or "Screens" as a real page):

1. Decide if it belongs as a new route (`/admin/screens`) or stays inline on Overview as a bigger card/table — check with the user if ambiguous, since `routes/AppRoutes.tsx` currently only wires a single flat `/admin` route with no nested admin routing yet.
2. Reuse `DashboardShell` ([src/layouts/DashboardShell.tsx](../../../src/layouts/DashboardShell.tsx)) for the shell/sidebar (same component Advertiser used to use before its rebuild), `StatCard` for KPIs, `StatusTag` for status pills, `PageHeader` for the title/subtitle/actions row, `SearchBox`/`FilterBar` for search and filter controls, `EmptyState` for zero-result tables, and `DataGrid` for tabular data — all already proven patterns in this file (see [design-system skill](../design-system/SKILL.md) for the full shared-component list).
3. Follow the existing `getXColumns(onAction)` factory-function pattern for `GridColDef` arrays (see `getPendingColumns`/`getScreenColumns`) rather than inlining columns — keeps the render function readable and the action-callback wiring explicit.
4. Wire every new action through `useToast` (`showToast('X isn't built in this preview yet')`) unless the user asks for the action to actually do something — this keeps the whole app's "honesty about what's real" convention consistent (every stub button in Admin/Advertiser/Driver currently says so explicitly rather than silently doing nothing).
5. Free-text search over a fixed set of fields (e.g. the screen inventory search) should use `hooks/useSearchFilter` rather than a hand-rolled `.filter()` — see the screen-inventory search in `AdminDashboard.tsx` for the reference usage (`useSearchFilter(SCREENS, ['screenId', 'plate', 'driver'])`).

## Data model — now split out, still not reconciled with Advertiser

Admin's mock types live in [src/types/admin.ts](../../../src/types/admin.ts) (`PendingCampaign`, `AdminScreen`, `ScreenAlert`, `AdminKpi`) with the fixture arrays in [src/data/adminMockData.ts](../../../src/data/adminMockData.ts) — mirroring the same types/data split already used for the Advertiser portal. These are still **separate from** `src/types/advertiser.ts`'s `Campaign`/`Screen` — they were extracted out of `AdminDashboard.tsx` for consistency, not reconciled with the Advertiser types. If a task asks to make Admin and Advertiser share real screen/campaign data (e.g. so an admin-approved campaign shows up as "Active" in the advertiser view), that requires either a real backend (see the "not built yet" note in [campaign-engine skill](../campaign-engine/SKILL.md)) or deliberately unifying the two type modules — flag this as a design decision rather than silently duplicating more mock shapes.

## Map reuse

The Admin overview embeds `LebanonMap` (island-wide city markers, hover tooltips) — the same component Advertiser's old dashboard used before its rebuild introduced the district-level `LiveCampaignMap`. See the [maps skill](../maps/SKILL.md) before changing either map component, since `LebanonMap` is shared and a change here affects any other page still using it.
