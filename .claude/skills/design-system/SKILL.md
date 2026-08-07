---
name: design-system
description: Use this skill whenever styling any AdzOnRoad page or component, adding a new status/state UI, or deciding where a color/token/shared component should live. Covers the two-tier token system, shared MUI theme overrides, and the status/empty/loading/error component conventions.
---

# AdzOnRoad Design System Skill

## Reality check first

This repo has **two token objects, but as of the advertiser portal's recolor they resolve to the same values**:

1. **Global theme** — [src/theme.ts](../../../src/theme.ts). Navy (`#0F1B3D`) / amber (`#F5A623`) / blue (`#2952CC`) palette. Powers the Homepage, Admin dashboard, Driver dashboard, Login/Signup pages, and the `layouts/` shells (`DashboardShell`/`MobileShell`/`AuthLayout`). Exported as `tokens` (plain hex values) plus a full MUI `createTheme()` default export wired up in `main.tsx`.
2. **Advertiser-scoped theme** — [src/components/advertiser/theme.ts](../../../src/components/advertiser/theme.ts). Exported as `advTokens` + a `cardSx` helper, imported by every file under `src/components/advertiser/**` and every page under `src/pages/advertiser/*.tsx` plus `src/pages/AdvertiserDashboard.tsx`. **`advTokens` no longer has its own orange/charcoal palette** — every value is now derived directly from `tokens` (e.g. `advTokens.orange = tokens.blue`, `advTokens.charcoal = tokens.navy`). The user explicitly asked for the advertiser portal to use the homepage's colors instead of its original orange/charcoal look; see [advertiser-portal skill](../advertiser-portal/SKILL.md). The key names (`orange`, `orangeHover`, `charcoal`, `mapBg`, ...) were kept as-is on purpose to avoid touching every consumer — don't be misled by the names, check the actual value in `theme.ts`.

**Rule (still applies, now mostly a maintenance-boundary concern rather than a color-clash one):** non-advertiser files use `tokens` from `../theme`; advertiser files use `advTokens`/`cardSx` from `./theme` (or `../components/advertiser/theme`). Keep this import boundary even though the resolved values now largely match — it's what lets the advertiser portal's palette be changed independently again later without touching every file.

Neither token file is a real design-token pipeline (no Figma sync, no CSS variables) — they're just TS constants. If asked to add a third portal with its own look, follow the same pattern: a local `theme.ts` next to that portal's components, not a global palette change.

## Global theme mechanics (src/theme.ts)

- `shape.borderRadius: 14`, `MuiCard` styleOverrides give every `<Card>` a 1px border + `tokens.shadowSm` automatically — don't re-specify border/shadow on Cards unless intentionally overriding.
- `MuiButton` variants array styles `variant="contained" color="primary"` specifically (amber bg, navy text) — this is how MUI v9 does conditional style overrides now (the old `containedPrimary` styleOverrides key is gone in v9).
- `shadows` array is force-filled with `tokens.shadowSm` for all 25 elevation levels — MUI's default elevation shadows are intentionally suppressed project-wide in favor of the flat `shadowSm`/`shadowMd`/`shadowLg` tokens.
- Custom palette colors `navy` and `blue` are added via module augmentation (`declare module '@mui/material/styles'`) — if you need a new custom palette color, augment the same way, in the same file, not inline.

## Status communication

Two parallel status-chip components exist — pick the right one, don't invent a third:

- **`StatusTag`** ([src/components/StatusTag.tsx](../../../src/components/StatusTag.tsx)) — global palette, five variants (`live`/`outline`/`neutral`/`error`/`warn`), plain `<Chip>` wrapper, used on Admin/Advertiser(old)/anywhere non-advertiser-scoped.
- **`StatusChip`** ([src/components/advertiser/StatusChip.tsx](../../../src/components/advertiser/StatusChip.tsx)) — advertiser-scoped, takes the actual `CampaignStatus | ScreenStatus` union types directly (not a generic `variant` string), always renders icon + text (accessibility requirement — never color alone), keyed off `advTokens`.

Both exist because the advertiser rebuild introduced strongly-typed status unions (`src/types/advertiser.ts`) instead of the older free-form `label` + `variant` pairing. When adding a new status-bearing entity to the advertiser portal, extend the union type first, then add a case to `StatusChip`'s `CONFIG` map — don't fall back to `StatusTag` there.

## Empty / loading / error states

Two parallel sets exist, same split logic as the status chips above:

- `src/components/advertiser/EmptyState.tsx` / `LoadingState.tsx` / `ErrorState.tsx` — advertiser-scoped (`advTokens`). Use inside `components/advertiser/**` and `src/pages/AdvertiserDashboard.tsx`/`src/pages/advertiser/*.tsx` only (see `CampaignTable`'s zero-result state and `CreativePerformanceCard`'s empty-library state).
- `src/components/EmptyState.tsx` / `LoadingState.tsx` / `ErrorState.tsx` — global-theme versions (`tokens`/MUI palette refs), same prop shapes. Use everywhere else — see `AdminDashboard.tsx`'s screen-inventory and pending-campaigns tables for real usage.

Every list/table/card that can be empty, loading, or failed should route through the matching pair instead of ad-hoc "No data" text or relying on `DataGrid`'s default "No rows" — pick global vs. advertiser-scoped by which theme the surrounding page uses, not by which one you reach for first.

## Other shared components (global, `src/components/`)

- **`PageHeader`** — title/subtitle/actions row. Use for standard page headers (see `AdminDashboard.tsx`). Every advertiser page (`AdvertiserDashboard.tsx` and all of `src/pages/advertiser/*.tsx`) currently uses its own inline `advTokens`-styled header block instead (same title/subtitle/action-row shape, slightly different type scale — `fontWeight: 800`/`fontSize: 24` vs `PageHeader`'s `700`/`26`) rather than `PageHeader`. That was a deliberate choice back when `advTokens` had its own orange palette and `PageHeader` would have pulled in mismatched global-theme colors; now that `advTokens` is aliased to `tokens` (see above) that risk is gone, but the 9 advertiser pages weren't retrofitted to `PageHeader` since it wasn't asked for and the inline version works — don't assume it's still unsafe to consolidate them if asked.
- **`SearchBox`** — the `TextField` + search-icon adornment pattern, previously duplicated in `AdminDashboard.tsx` and `CampaignTable.tsx`. Safe to use inside `components/advertiser/**` too (it doesn't hardcode any theme colors), see `CampaignTable.tsx`.
- **`FilterBar`** — a thin flex-wrap layout wrapper for grouping search + filter `TextField`s consistently; not a config-driven component, just consistent spacing/wrapping.
- **`ConfirmationDialog`** — generic confirm/cancel dialog (`destructive` prop switches the confirm button to `error` color). See `CampaignTable.tsx`'s "Archive" row action for the reference usage — the first real destructive-sounding action in the app wired to an actual confirmation step instead of firing straight to a toast.

## Business logic belongs in services/, not components

`src/services/pricingService.ts` (campaign price estimation) and `src/services/earningsService.ts` (driver earnings formula) are the pattern for any calculation used in more than one place, or that shouldn't live inline in a component. Both are consumed from multiple call sites (pricing: `CreateCampaignDialog` + `Homepage.tsx`; earnings: `Homepage.tsx`'s estimator + `DriverDashboard.tsx`) — see the [campaign-engine](../campaign-engine/SKILL.md) and [driver-app](../driver-app/SKILL.md) skills. `src/utils/format.ts` (`formatCurrency`/`formatNumber`) is the shared formatting layer — prefer it over ad-hoc `` `$${value.toLocaleString()}` `` inline.

## MUI version gotchas (v9, not v6 — don't trust older MUI docs/muscle memory)

- No `InputProps`/`InputLabelProps` — use `slotProps={{ input: {...}, inputLabel: {...} }}`.
- No `containedPrimary` styleOverrides key — use the `variants` array with `props: { variant, color }`.
- `@mui/x-charts` has no all-in-one `<ChartContainer>` — compose `ChartsDataProvider` + `ChartsSurface` + plot components (`BarPlot`/`LinePlot`/`AreaPlot`/`MarkPlot`/`PiePlot`) + `ChartsXAxis`/`ChartsYAxis`/`ChartsTooltip`/`ChartsLegend`. See [analytics skill](../analytics/SKILL.md) for the exact working pattern.
- `@mui/icons-material` in this repo's installed version does **not** ship bare `ErrorOutline`/`HelpOutline`/`CheckCircleOutline` — only the suffixed variants exist (`ErrorOutlineOutlined`, `HelpOutlineOutlined`, `CheckCircleOutlineOutlined`, etc.). If an icon import 404s at build time, check `node_modules/@mui/icons-material` for the actual exported name before guessing.
- `ChartsLegend` has no `position` prop in this version — only `direction`, `onItemClick`, `toggleVisibilityOnClick`, `sx`.

## When verifying visual changes

The `computer` screenshot tool has been unreliable in this environment. Prefer `get_page_text`, `read_page` (accessibility tree), `read_console_messages`, and `javascript_tool` (`getComputedStyle`, `getBoundingClientRect`) to verify styling/layout instead of relying on screenshots.
