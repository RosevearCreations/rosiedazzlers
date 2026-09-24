# Build 494 — Service Economics, Seasonal Operations & Reliability Review

## Purpose
Reconcile the retained service/add-on allocation, Southern Ontario seasonal-capability, observed operational-capacity and reliability-continuity authorities in one bounded read-only review.

Build 494 consumes the existing Service Economics and Reliability reports. It does not create a new ledger, costing engine, pricing model, weather engine, capacity model, provider telemetry source, recovery engine or evidence store.

## Service economics boundary
Service/package and add-on allocation is reviewable only from the retained explicit recorded linkage. Missing revenue, material, labour, cash/refund or posted COGS linkage remains a gap.

Booking totals, equal splits, percentages, price weighting, overhead estimates or quote totals never manufacture allocation or margin evidence. Build 494 does not infer price sensitivity or authorize a price/discount change.

## Southern Ontario seasonal operations boundary
Cold-weather capability remains limited to the retained explicit classifications:
- `cold_snap_capable`;
- `temperature_limited_outdoor`; and
- `controlled_environment_required`.

Exact working-temperature limits remain source-owned. A threshold is never inferred from weather, booking outcomes, margin, demand, application uptime or operator assumption.

A cold-weather field restriction is not an application reliability failure. Capability evidence does not establish broad winter availability, and not every service can be moved indoors.

## Observed operational-capacity boundary
Operational capacity is considered observed only when the retained capacity authority explicitly reports observed live-capacity evidence. Inquiry demand, historical fleet work, revenue and seasonal classification are not capacity proxies.

Real scheduling decisions remain owned by the existing availability and checkout collision-revalidation authorities. Build 494 reserves no slot and makes no future-capacity claim.

## Reliability continuity boundary
First-party technical activity, provider-owned billing/CPU/quota evidence, recovery observations and field-operability evidence remain separate evidence classes.

Build 494 never infers:
- provider billing, CPU, quota or dollar cost from first-party traffic;
- recovery success from source/runtime GREEN;
- a Production restore from a non-Production drill;
- field operability from technical availability; or
- price sensitivity, winter availability or future capacity from reliability continuity.

## Review state
The reconciliation can be `bounded_reconciliation_review_ready` only when both owning read-only sources are available and the retained allocation, seasonal capability, observed capacity and reliability-continuity authorities independently satisfy their own bounded evidence rules.

Otherwise the result remains `bounded_reconciliation_review_required` or `evidence_sources_unavailable`. Missing evidence is not closed by evidence from another domain.

## Permissions, privacy and mutation boundary
The cross-domain endpoint preserves the underlying Service Economics and I.T. Reliability permissions. It exposes aggregate evidence only; customer identity, staff identity and raw booking/support identifiers remain excluded.

No automatic allocation, price/discount, booking/availability, public winter claim, scaling, provider action, Production restore, accounting/inventory posting, schema/storage mutation, outreach or permanent polling is authorized.

`STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory. Source/runtime GREEN never manufactures economics, seasonal, capacity, provider-cost or recovery evidence.

## Acceptance
The exact candidate must pass:
1. `scripts/service_economics_seasonal_operations_reliability_review_check.py`;
2. `scripts/service_economics_seasonal_operations_reliability_review_test.mjs`;
3. retained service/add-on allocation, cold-weather capability, weather-safe routing and reliability-continuity authorities;
4. Current Source Gate and exact feature-preview deployment/runtime acceptance;
5. non-force promotion of the exact accepted candidate to `dev`;
6. independent exact-SHA Development deployment/runtime acceptance;
7. protected-main pull-request governance; and
8. independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 495 — Production Learning & Roadmap Renewal** begins only after Build 494 is independently GREEN on protected `main`.
