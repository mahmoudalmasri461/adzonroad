---
name: billing
description: Use this skill whenever working on invoices, billing summaries, payment methods, or pricing display — the mock BillingCard/Invoice UI in the advertiser portal, and where campaign pricing figures come from.
---

# AdzOnRoad Billing Skill

## What exists: display-only mock UI, no payment processing anywhere

No payment gateway, invoicing service, or billing backend exists in this workspace. `CreateCampaignDialog`'s final step has a raw card-number/expiry/CVC `TextField` form (see [campaign-engine skill](../campaign-engine/SKILL.md)) that **does not submit anywhere** — it's a visual step in the mock flow only. Treat any request to "process a payment" as building from scratch, and flag it clearly since real payment handling has PCI-compliance implications that go well beyond this codebase's current scope.

## Current mock billing surface

`BillingCard.tsx` ([src/components/advertiser/BillingCard.tsx](../../../src/components/advertiser/BillingCard.tsx)) — current balance, monthly spend, saved payment method (masked, display-only, e.g. "Visa •••• 4821"), a list of `Invoice` records (`src/types/advertiser.ts`: `number`, `amount`, `dueDate`, `status: 'Paid' | 'Open' | 'Overdue'`) from `INVOICES`/`BILLING_SUMMARY` in `src/data/advertiserMockData.ts`. Every action ("Update" payment method, "View all invoices") is a `useToast` stub.

## Pricing figures — mostly unified now, one gap remains

Both the **Homepage pricing section** (`src/pages/Homepage.tsx`) and **`CreateCampaignDialog`'s live estimate** now derive from the same source: `estimateCampaignPrice`/`PRICING_TIERS` in [src/services/pricingService.ts](../../../src/services/pricingService.ts) — see [campaign-engine skill](../campaign-engine/SKILL.md). Changing the formula there updates both surfaces automatically.

**`BillingCard`'s mock invoice amounts** (`INVOICES`/`BILLING_SUMMARY` in `src/data/advertiserMockData.ts`) are still independent, arbitrary fixture figures, not derived from `pricingService` or tied to any specific campaign's actual cost. If asked to make an advertiser's invoices reflect their real campaign spend, that requires either deriving invoice amounts from the `CAMPAIGNS` array's `spent` fields at billing-cycle boundaries (a mock-data-level fix) or a real backend billing engine — clarify which is meant before starting.

## If asked to build real billing

That's backend + payment-gateway integration work (Stripe or similar) with no existing scaffold. Per the agent's standing safety rules, Claude must never actually execute a financial transaction or handle raw card numbers/payment credentials — any billing feature must route real payment collection through a proper hosted payment element (e.g. Stripe Elements/Checkout), never a custom raw-card `TextField` posted to your own backend.
