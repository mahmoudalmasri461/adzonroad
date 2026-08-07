---
name: billing
description: Use this skill whenever working on invoices, billing summaries, payment methods, or pricing display — the mock BillingCard/Invoice UI in the advertiser portal, and where campaign pricing figures come from.
---

# AdzOnRoad Billing Skill

## What exists: display-only mock UI, no payment processing anywhere

No payment gateway, invoicing service, or billing backend exists in this workspace, and **there is no card-entry form anywhere in the app anymore** — `CreateCampaignDialog`'s old raw card-number/expiry/CVC step was removed at the user's request and replaced with a "Submit inquiry" confirmation (see [campaign-engine skill](../campaign-engine/SKILL.md)): a campaign is submitted for the team to review, not paid for online. Treat any request to "process a payment" or "collect a card" as building from scratch, and flag it clearly since real payment handling has PCI-compliance implications that go well beyond this codebase's current scope.

## Current mock billing surface

`BillingCard.tsx` ([src/components/advertiser/BillingCard.tsx](../../../src/components/advertiser/BillingCard.tsx)) — current balance, monthly spend, a "next invoice due" row, and a list of `Invoice` records (`src/types/advertiser.ts`: `number`, `amount`, `dueDate`, `status: 'Paid' | 'Open' | 'Overdue'`) from `INVOICES`/`BILLING_SUMMARY` in `src/data/advertiserMockData.ts`. "View all invoices" is a `useToast` stub. It's used both inline on the Dashboard and as the main content of the dedicated [src/pages/advertiser/BillingPage.tsx](../../../src/pages/advertiser/BillingPage.tsx) (`/advertiser/billing`, reached from the sidebar's "Billing" nav item), which adds four summary tiles above it.

**There is deliberately no saved-payment-method UI** — no card, no "Visa •••• 4821", no "Update payment method" button. The user explicitly asked for this to be removed since there's no real online payment; `BILLING_SUMMARY` no longer has a `savedPaymentMethod` field. `BillingCard` instead states invoices are "settled offline by bank transfer." **Don't reintroduce a saved-card UI** unless the user asks for one again.

The previously-flagged inconsistency here (`CreateCampaignDialog` still having a card form while Billing said there was no card on file) is **resolved** — the dialog's payment step is gone too (see [campaign-engine skill](../campaign-engine/SKILL.md)). Both surfaces now agree: no card is ever collected anywhere in this app.

## Pricing figures — mostly unified now, one gap remains

Both the **Homepage pricing section** (`src/pages/Homepage.tsx`) and **`CreateCampaignDialog`'s live estimate** now derive from the same source: `estimateCampaignPrice`/`PRICING_TIERS` in [src/services/pricingService.ts](../../../src/services/pricingService.ts) — see [campaign-engine skill](../campaign-engine/SKILL.md). Changing the formula there updates both surfaces automatically.

**`BillingCard`'s mock invoice amounts** (`INVOICES`/`BILLING_SUMMARY` in `src/data/advertiserMockData.ts`) are still independent, arbitrary fixture figures, not derived from `pricingService` or tied to any specific campaign's actual cost. If asked to make an advertiser's invoices reflect their real campaign spend, that requires either deriving invoice amounts from the `CAMPAIGNS` array's `spent` fields at billing-cycle boundaries (a mock-data-level fix) or a real backend billing engine — clarify which is meant before starting.

## If asked to build real billing

That's backend + payment-gateway integration work (Stripe or similar) with no existing scaffold. Per the agent's standing safety rules, Claude must never actually execute a financial transaction or handle raw card numbers/payment credentials — any billing feature must route real payment collection through a proper hosted payment element (e.g. Stripe Elements/Checkout), never a custom raw-card `TextField` posted to your own backend.
