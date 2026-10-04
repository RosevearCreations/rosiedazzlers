# Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review

## Purpose
Revalidate retained Build 524 human decision outcomes against current Build 514 decision readiness and current Build 504 same-domain evidence for four independent domains: explicit service/add-on allocation, Southern Ontario seasonal operability, observed operational capacity and first-party technical reliability.

Build 534 is GET-only, read-only and manual-refresh only. It creates no ledger, pricing engine, weather engine, capacity forecast, provider telemetry source, recovery engine, database table, schema migration, storage object, background telemetry stream or permanent poller.

## Freshness rule
A retained Build 524 outcome remains current only while the exact owning domain remains decision-review ready, its same-domain comparable evidence remains present and current, the retained readiness identity has not drifted, and the explicit owner decision review remains current.

Missing comparable history remains insufficient. Stale, missing, mismatched or unavailable evidence returns to bounded review; source/runtime GREEN never manufactures business evidence.

## Independent evidence domains
Allocation, seasonal operability, observed capacity and first-party technical reliability remain independent evidence classes. Evidence from one domain never closes another domain and is never substituted to preserve a prior outcome.

## Southern Ontario seasonal truth boundary
Seasonal review uses only source-owned service classifications and source-owned limits. Build 534 does not infer or widen working-temperature thresholds, broad winter availability or controlled-environment capability. A weather- or site-limited field process is not an application reliability failure.

## Reliability and provider boundary
First-party technical reliability evidence does not establish Cloudflare/provider billing, CPU, quota, dollar cost, scaling need or recovery success. Provider-owned evidence and recovery evidence remain adjacent independent classes.

## Capacity and pricing boundary
Observed capacity remains descriptive live evidence only; it does not forecast future capacity, reserve a booking slot or authorize availability changes. Allocation/economics evidence does not establish price sensitivity, a margin action, discount action or customer demand response.

## Mutation boundary
No automatic allocation/margin change, price/discount change, booking/availability change, public winter claim, capacity/scaling action, provider action, Production restore, accounting/inventory posting, canonical-HOLD mutation, schema/storage mutation, outreach or permanent polling is authorized. `STARTUP_GO_LIVE_BLOCKERS.md` remains the canonical HOLD inventory.

## Supabase/storage boundary
This release adds no Supabase table, migration, storage object or persistent event stream. Freshness is calculated at request time from retained read-only authorities, so Build 534 does not create a new database-growth path.

## Acceptance
The exact candidate must pass the focused Build 534 checker/test, retained Build 524/514/504/494 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance. Source promotion alone is never Production GREEN.

## Next bounded release
**Build 535 — Production Learning & Roadmap Renewal** begins only after Build 534 is independently GREEN on protected `main`.
