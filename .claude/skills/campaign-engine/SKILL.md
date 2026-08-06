---
name: campaign-engine
description: Use this skill whenever working on campaign creation, campaign status/lifecycle, campaign-to-screen assignment, pricing/estimation logic, or anything touching the Campaign type and its consumers (CreateCampaignDialog, CampaignTable, CampaignProgressCard).
---

# AdzOnRoad Campaign Engine Skill

## What actually exists: a status model and a UI flow, not an engine

There is no scheduling/assignment engine anywhere in this codebase. "Campaign engine" in `CLAUDE.md` describes a future backend service that would dynamically assign campaigns to eligible screens by region/availability/schedule/health/GPS status — none of that logic exists. What exists today:

- **The status lifecycle** — `CampaignStatus` in [src/types/advertiser.ts](../../../src/types/advertiser.ts): `'Draft' | 'Pending Approval' | 'Scheduled' | 'Active' | 'Paused' | 'Completed' | 'Rejected'`. This is the authoritative status union for the advertiser portal — `StatusChip` (see [design-system skill](../design-system/SKILL.md)) is keyed off it. Admin's `AdminDashboard.tsx` uses a separate, unreconciled ad-hoc status representation (`StatusTag` + free-form `label`/`variant` pairs) — see [admin-portal skill](../admin-portal/SKILL.md) for that gap.
- **The creation flow** — [src/components/CreateCampaignDialog.tsx](../../../src/components/CreateCampaignDialog.tsx), a 7-step MUI `Stepper` (Info → Upload creative → Regions → Taxi count & duration → Dates & hours → Price review → Payment). It's shared/reused as-is by both the Advertiser sidebar's "Create Campaign" nav item and any "Create Campaign" button — **don't fork it** per entry point; if it needs new fields, edit the one file and every entry point gets them.
- **The pricing formula** lives in [src/services/pricingService.ts](../../../src/services/pricingService.ts) (`estimateCampaignPrice`) — $20 per taxi per second of creative duration for the standard 8hr/day window, plus a flat $150 surcharge per region beyond the first. This was reverse-derived from and verified against the three published tiers (5 taxis/15s = $1,500, 10 taxis/15s = $3,000, 10 taxis/30s = $6,000 — all resolve to exactly $20/taxi/second) and is the **single source of truth** for both `CreateCampaignDialog`'s live estimate and the Homepage pricing section's displayed tier prices (`Homepage.tsx` imports `PRICING_TIERS` from the same service and formats them with `formatCurrency`) — they can no longer drift apart. The per-region surcharge amount is an implementation choice, not a verified business figure (the three known anchors are all single-region) — flag it to the user if a real number is specified later.
- **Read-only campaign displays** — `CampaignTable.tsx` (DataGrid, search/status/region filters via `useSearchFilter` + `FilterBar`, row-action menu with a real `ConfirmationDialog` on Archive, all other actions stubbed via `useToast`) and `CampaignProgressCard.tsx` (single delivery-progress row), both driven by the static `CAMPAIGNS` array in `src/data/advertiserMockData.ts`.

## If asked to change the pricing model further

Edit `estimateCampaignPrice` in `pricingService.ts` — both `CreateCampaignDialog` and `Homepage.tsx` consume it, so a change there propagates everywhere automatically. Don't reintroduce a second, independent pricing calculation anywhere else.

## If asked to build the real assignment engine

That's backend work with no existing scaffold — there is no backend project in this workspace. Treat it as a from-scratch architecture task (ASP.NET Core is the stated target stack per `CLAUDE.md`, but nothing has been started) rather than something to bolt onto the frontend mock data.
