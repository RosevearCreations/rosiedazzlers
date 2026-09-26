# Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity

## Purpose
Extend the retained Build 494 review into bounded continuity evidence for four independent domains: explicit service/add-on allocation, Southern Ontario seasonal operability, observed operational capacity and first-party technical reliability.

Build 504 does not create a new ledger, weather engine, capacity model, provider telemetry source, recovery engine or trend store. It remains read-only and manual-refresh only.

## Same-domain comparability rule
A continuity direction is descriptive only when the owning domain supplies at least two attributable like-for-like observations.

Evidence from one domain never closes another domain:
- allocation evidence cannot establish seasonal capability, capacity or technical reliability;
- seasonal evidence cannot establish margin, future capacity or application reliability;
- demand, revenue and historical work cannot establish observed live capacity;
- first-party technical activity cannot establish provider billing, CPU, quota, recovery success or field operability.

Missing comparable history remains insufficient_comparable_history rather than an inferred trend.

## Explicit allocation continuity
Comparable allocation continuity requires dated attributable observations for the same service/package or add-on cohort with explicit recorded linkage state.

Booking totals, equal splits, percentages, price weighting or overhead estimates are never allocation evidence. A recorded continuity direction does not establish a margin trend or authorize a price or discount change.

## Southern Ontario seasonal-operability continuity
Comparable seasonal continuity requires dated attributable observations for the same service identity using only the retained classifications:
- cold_snap_capable;
- temperature_limited_outdoor; and
- controlled_environment_required.

Exact working-temperature limits remain source-owned and are never inferred from historical classifications, weather, booking outcomes, demand, margin or technical uptime. A field restriction is not an application reliability failure, and continuity does not establish broad winter availability.

## Observed-capacity continuity
Comparable capacity continuity requires at least two attributable live observations for the same metric and unit.

Inquiry demand, historical fleet work, revenue, seasonal classification and technical activity are not capacity proxies. The review never forecasts future capacity, reserves a booking slot or changes availability. Existing availability and checkout collision revalidation remain authoritative for real scheduling decisions.

## Technical-reliability continuity
Technical continuity reuses the retained bounded first-party activity comparison from the reliability trend authority. It is descriptive only.

Provider-owned billing, CPU, quota and dollar cost remain separate external evidence. Source/runtime GREEN does not establish recovery success, and non-Production drill evidence does not establish a Production restore.

## Mutation boundary
No automatic allocation, price or discount change, booking or availability change, public winter claim, capacity change, scaling, provider action, Production restore, accounting or inventory posting, schema or storage mutation, outreach or permanent polling is authorized.

STARTUP_GO_LIVE_BLOCKERS.md remains the canonical HOLD inventory.

## Acceptance
The exact candidate must pass:
1. scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py;
2. scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs;
3. retained Build 494, seasonal, allocation, capacity and reliability authorities;
4. Current Source Gate and exact feature-preview deployment/runtime acceptance;
5. non-force promotion of the exact accepted candidate to dev;
6. independent exact-SHA Development deployment/runtime acceptance;
7. protected-main pull-request governance; and
8. independent exact resulting-main Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
Build 505 — Production Learning & Roadmap Renewal begins only after Build 504 is independently GREEN on protected main.
