# Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing

## Purpose
Extend the retained cold-weather capability and winter-eligibility workbench with read-only weather-safe routing guidance. This release does not create a second booking engine or weather rules engine.

## Routing rules
- `cold-snap-capable` work remains conditional on current site/weather confirmation. A controlled-environment or indoor option is shown only when explicit source evidence supports it.
- `temperature-limited-outdoor` work may show a controlled-environment alternative only when an explicit service/product/equipment/site/process reference supports that alternative. Otherwise the safe route is manual reschedule review until source-owned conditions are met.
- `controlled-environment-required` work requires current site suitability confirmation. If no specific site or indoor workflow is evidenced, the route remains owner/site review.

Not every service can move indoors. A capability classification never proves a specific bay/site is available, and current weather does not create service or indoor capability.

## Customer guidance
Prepared route wording is draft owner-review copy only. It is not published, sent or inserted into bookings automatically. Exact working-temperature limits remain source-owned.

## Safe rescheduling
For temperature-constrained outdoor work without an explicitly evidenced controlled alternative, safe rescheduling remains a manual review path until source-owned conditions are met. Build 488 does not choose a new appointment time and does not mutate availability.

## Mutation boundary
Read-only and manual refresh only. No automatic routing, rescheduling, booking/availability change, quote mutation, customer message, public winter claim, price/discount change, provider action, accounting/inventory mutation, schema/storage mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 488 checker/test, retained Build 487/486/483 seasonal authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 489 — Provider & Local Search Evidence Continuity** begins only after Build 488 is independently GREEN on protected `main`.
