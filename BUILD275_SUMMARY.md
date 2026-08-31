# Rosie Dazzlers Build 275 — Booking & Retention Convergence

**Status: ACTIVE — Development-first**

## Release boundary

Build 275 starts from the accepted Build 274 Development hotfix `4c37ac0f4756bb80d6627412c99f14c4364d9583` on feature branch `build275-booking-retention-convergence`.

This build continues the already-approved roadmap rather than reopening Build 274.

## Slice 1 — Rosie-supplied utilities

- Rosie brings standard detailing water and power.
- Booking no longer requires the customer to acknowledge/provide water or power.
- The retained `ack_power_water` and `need_mobile_water_power` DOM hooks remain temporarily as hidden compatibility hooks because the historical Build 274 guard still verifies those legacy source anchors.
- The acknowledgement is automatically satisfied and removed from the customer interaction path.
- The old mobile-water/power quote option is automatically cleared and hidden.
- A visible Rosie-supplied utilities notice explains that the customer only needs a safe, private and permitted work area; unusual parking, property-access, runoff or site restrictions can still be reviewed.
- The booking review UI is guarded so old customer-provides / utility-quote wording cannot reappear after the legacy review renderer refreshes.
- County fallback utility wording is normalized at presentation time while the retained inline fallback source is queued for later structural cleanup.
- The Build 274 vPIC fail-open behavior remains retained: vehicle suggestions may degrade, but booking remains usable with manual make/model entry.

## Slice 2 — true next-three available slots

The Build 274 Quick Book shortcut showed three open **days**. Build 275 now projects the first three real AM/PM openings from the canonical date-pill results already produced by the existing booking engine.

- No parallel availability call was added.
- No duplicate business-hours/conflict calculation was added.
- The shortcut reads only the existing open/partial date pills after the canonical booking engine has resolved availability.
- Selecting a shortcut clicks the existing date control and then the existing enabled AM/PM slot control, preserving the booking engine's normal refresh, validation and analytics behavior.
- Full-day selection remains in the canonical slot controls whenever both AM and PM are open.
- If the optional Build 275 presentation layer cannot load, the retained legacy booking flow remains available.

This closes the roadmap item for **true next-three available slots** at the feature-source level; Development deployment acceptance is still required before Build 275 can call this slice Development-proven.

## Slice 3 — returning-customer short rebook

Build 275 now adds a guarded acceleration path for authenticated returning customers using the existing `/api/client/dashboard` authority.

- The shortcut appears only when the customer is authenticated, has at least one saved Garage vehicle, and has a past non-cancelled booking with a retained `package_code`.
- The prior package is reused only as a starting selection in the current booking form.
- When exactly one Garage vehicle exists, that saved vehicle can be loaded automatically through the existing Garage button behavior.
- When multiple Garage vehicles exist, Build 275 does **not** guess which vehicle the old booking belonged to; the customer is sent to the existing Garage picker to choose the correct vehicle.
- The shortcut does not auto-book, bypass current availability, skip vehicle-size review, freeze old pricing, or skip current add-on/deposit rules.
- Failure to load returning-customer history remains fail-open; anonymous/current booking continues normally.

This closes the **returning-customer short rebook** source slice while preserving current booking authority and review.

## Build 275 source authority

The focused Build 275 guard pins the utility compatibility bridge, slot-projection boundary, returning-customer prefill boundary and retained vehicle-catalogue fail-open behavior. The Build 275 feature source gate also reruns the cumulative release guard plus retained Builds 271, 272, 273 and 274 guards.

No Production/main mutation occurs during this feature-source phase. Development promotion happens only after the Build 275 source gate is green and the bounded slices are reviewed.

## Outstanding Build 275 queue

The active queue remains:

1. Complete booking **funnel instrumentation**, including meaningful abandon/drop-off evidence.
2. Continue detailed service/add-on landing-page convergence with condition-based effort and quote-safe scope.
3. Continue proof/review mechanics and local SEO/service-area depth.
4. Continue maintenance-plan and fleet/workplace paths without inventing undecided pricing, perks or vehicle-count minimums.
5. Add the remaining analytics-ingest/reliability regression protection and close payment/rollback/manual external evidence where applicable.
6. Structurally remove the remaining stale inline booking fallback utility source once retained historical guard compatibility can be advanced safely.

## Non-negotiable business authorities

- Rosie is self-contained for standard detailing water and power.
- Safe/private workspace, access, parking, bylaw/runoff and property rules may still affect whether a job can be performed safely and legally.
- Condition-dependent restoration work remains photo/inspection/quote safe.
- Fleet minimums and final maintenance-plan pricing/perks remain undecided and must not be invented.
- Public SEO continues to preserve one H1 per public page and original, useful service/location content.
