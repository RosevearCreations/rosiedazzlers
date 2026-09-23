# Build 483 — Service & Add-On Allocation Evidence Closure

## Purpose
Close service/package and add-on allocation-review gaps only where the retained Service Economics authority contains explicit recorded revenue, material, labour, cash/refund and posted COGS linkage. Build 483 reuses the Build 473 workbench and endpoint; it does not create a second ledger, costing engine or allocation store.

## Closure rule
A service/package cohort is closed only when every included row remains review-ready under the retained recorded booking-to-package linkage. An add-on cohort is closed only when explicit per-add-on allocation rows carry every required component link.

Never invent allocation from booking totals, percentages, equal splits or price weighting. A missing direct link remains an evidence gap.

## Southern Ontario seasonal-operability boundary
Seasonal operability is reviewed separately from margin evidence. Where an owning service/product/equipment/site source explicitly records it, the review may carry one of: `cold-snap-capable`, `temperature-limited-outdoor`, or `controlled-environment-required`.

Exact minimum/maximum working temperatures are displayed only when explicitly recorded by the owning evidence source. Build 483 never derives a threshold from weather, booking outcomes, margin, product category or operator assumption.

## Mutation boundary
This release is read-only. It authorizes no automatic price/discount change, allocation write, booking/availability change, public winter-capability claim, accounting/inventory posting, schema/storage mutation, provider action, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 483 checker/test, retained Build 473/463/453 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

Source/runtime GREEN does not manufacture missing allocation or seasonal-operability evidence.

## Next bounded release
**Build 484 — Reliability, Cost & Recovery Evidence Continuity** begins only after Build 483 is independently GREEN on protected `main`.
