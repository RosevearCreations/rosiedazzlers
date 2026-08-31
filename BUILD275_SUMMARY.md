# Rosie Dazzlers Build 275 — Booking & Retention Convergence

**Status: ACTIVE — Development-first**

## Release boundary

Build 275 starts from the accepted Build 274 Development hotfix `4c37ac0f4756bb80d6627412c99f14c4364d9583` on feature branch `build275-booking-retention-convergence`.

This build continues the already-approved roadmap rather than reopening Build 274. The first bounded slice closes a customer-facing booking contradiction: Rosie-supplied utilities are an operating authority, not a customer-supplied prerequisite or a separate utility quote.

## Slice 1 — Rosie-supplied utilities

- Rosie brings standard detailing water and power.
- Booking no longer requires the customer to acknowledge/provide water or power.
- The retained `ack_power_water` and `need_mobile_water_power` DOM hooks remain temporarily as hidden compatibility hooks because the historical Build 274 guard still verifies those legacy source anchors.
- The acknowledgement is automatically satisfied and removed from the customer interaction path.
- The old mobile-water/power quote option is automatically cleared and hidden.
- A visible Rosie-supplied utilities notice explains that the customer only needs a safe, private and permitted work area; unusual parking, property-access, runoff or site restrictions can still be reviewed.
- The booking review UI is guarded so old `Customer provides water and power` / utility-quote wording cannot reappear after the legacy review renderer refreshes.
- The Build 274 vPIC fail-open behavior remains retained: vehicle suggestions may degrade, but booking remains usable with manual make/model entry.

## Build 275 source authority

The focused Build 275 guard pins the utility compatibility bridge and retained vehicle-catalogue fail-open behavior. The Build 275 feature source gate also reruns the cumulative release guard plus retained Builds 271, 272, 273 and 274 guards.

No Production/main mutation occurs during this feature-source phase. Development promotion happens only after the Build 275 source gate is green and the bounded slice is reviewed.

## Outstanding Build 275 queue

This first slice does **not** close the rest of Build 275. The active queue remains:

1. Replace open-day shortcuts with **true next-three available slots** using the existing availability authority rather than inventing slot logic.
2. Add the **returning-customer short rebook** path using saved Garage/prior-booking authorities.
3. Complete booking **funnel instrumentation**, including meaningful abandon/drop-off evidence.
4. Continue detailed service/add-on landing-page convergence with condition-based effort and quote-safe scope.
5. Continue proof/review mechanics and local SEO/service-area depth.
6. Continue maintenance-plan and fleet/workplace paths without inventing undecided pricing, perks or vehicle-count minimums.
7. Add the remaining analytics-ingest/reliability regression protection and close payment/rollback/manual external evidence where applicable.

## Non-negotiable business authorities

- Rosie is self-contained for standard detailing water and power.
- Safe/private workspace, access, parking, bylaw/runoff and property rules may still affect whether a job can be performed safely and legally.
- Condition-dependent restoration work remains photo/inspection/quote safe.
- Fleet minimums and final maintenance-plan pricing/perks remain undecided and must not be invented.
- Public SEO continues to preserve one H1 per public page and original, useful service/location content.
