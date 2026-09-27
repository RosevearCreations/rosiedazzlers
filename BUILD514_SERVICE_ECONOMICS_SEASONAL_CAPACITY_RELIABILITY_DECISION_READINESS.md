# Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness

## Purpose
Reconcile retained Build 504 same-domain continuity evidence into bounded human decision readiness for four independent domains: explicit service/add-on allocation, Southern Ontario seasonal operability, observed operational capacity and first-party technical reliability.

Build 514 does not create a new ledger, weather engine, capacity model, provider telemetry source, recovery engine or decision store. It is read-only and manual-refresh only.

## Independent-domain decision readiness
A domain is decision-review-ready only when its retained Build 504 continuity evidence is attributable and like-for-like within that owning evidence class.

The four domains remain independent:
- explicit allocation evidence never establishes seasonal capability, capacity or technical reliability;
- seasonal evidence never establishes margin, future capacity or application reliability;
- observed capacity never establishes demand, future capacity or provider capacity; and
- first-party technical reliability never establishes provider billing/CPU/quota, recovery success or field operability.

Missing comparable history remains `insufficient_comparable_history`. Evidence from another domain cannot close the gap.

## Explicit allocation
Decision review may use repeated explicit recorded linkage for the same service/package or add-on cohort. Booking totals, equal splits, percentages, price weighting and overhead estimates remain invalid allocation substitutes.

Decision readiness does not establish a margin trend, price sensitivity or authorization for any price, discount or allocation change.

## Southern Ontario seasonal operability
Only retained source-owned classifications remain valid: `cold_snap_capable`, `temperature_limited_outdoor` and `controlled_environment_required`.

Exact working-temperature limits remain source-owned. Historical classifications, weather, demand, margin, technical uptime or booking outcomes never create a threshold or broad winter-availability claim. A field restriction is not an application reliability failure.

## Observed capacity
Capacity decision review requires retained comparable live observations using the same metric and unit. Inquiry demand, historical work, revenue, seasonal classification and technical traffic are not capacity proxies.

Observed capacity does not forecast future capacity, reserve a slot or change availability. Existing availability and checkout collision revalidation remain authoritative for actual scheduling.

## Technical reliability and adjacent external evidence
Technical decision review remains bounded to retained first-party comparable reliability evidence. It does not establish Cloudflare/provider billing, CPU, quota, dollar cost, scaling need, causal explanation or recovery success.

Provider-owned cost/quota evidence and recovery evidence remain adjacent independent evidence classes. Source/runtime GREEN does not manufacture either class.

## Decision package boundary
`bounded_decision_readiness_review_ready` means only that all four independent retained domains contain the required comparable evidence and are ready for explicit human review.

It is not an instruction to change the business. Without explicit separately authorized action, the default is `retain_current_controls_and_holds`.

## Mutation boundary
No automatic allocation/margin change, price/discount change, booking/availability change, public winter claim, capacity/scaling action, provider action, Production restore, accounting/inventory posting, canonical-HOLD mutation, schema/storage mutation, outreach or permanent polling is authorized.

`STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory.

## Acceptance
The exact candidate must pass:
1. `scripts/service_economics_seasonal_capacity_reliability_decision_readiness_check.py`;
2. `scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs`;
3. retained Build 504/494 allocation, seasonal, capacity and reliability authorities;
4. Current Source Gate and exact feature-preview deployment/runtime acceptance;
5. non-force promotion of the exact accepted candidate to `dev`;
6. independent exact-SHA Development deployment/runtime acceptance;
7. protected-main pull-request governance; and
8. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 515 — Production Learning & Roadmap Renewal** begins only after Build 514 is independently GREEN on protected `main`.
