# Build 518 — Controlled-Environment Routing Outcome Evidence Continuity

## Purpose
Reconcile only attributable service/site-specific controlled-environment routing outcomes, current site-confirmation observations and safe-reschedule outcomes that were actually observed over the retained Build 508 operational-readiness package.

This release is read-only. It does not move appointments, route work, reserve capacity, change availability, change quote logic, send customer messages, publish indoor/winter claims or narrow a canonical HOLD.

## Outcome continuity contract
A controlled-environment candidate may be classified as:
- `route_outcome_observed` only when Build 508 remains operational-review-ready, current site/workflow/equipment/product evidence is still complete, a dated attributable `routed_to_confirmed_site` outcome exists, the actual site-confirmation observation is dated and attributable, and the observed route site matches the retained qualified site;
- `safe_reschedule_outcome_observed` only when Build 508 remains operational-review-ready, current site/workflow/equipment/product evidence is still complete, and both the routing outcome plus the safe-reschedule observation are dated and attributable;
- `routing_outcome_evidence_conflict` when an explicit route or safe-reschedule outcome is recorded but the current retained evidence does not support it; or
- `outcome_owner_action_required` when the required observed outcome evidence is missing or unattributable.

An operational-review-ready path never means a route happened. A routing candidate never means a site was confirmed. Missing or stale site/workflow/equipment/product evidence remains manual review.

## Service/site specificity
Every observed route remains service/site-specific. Evidence for one package, add-on, service or controlled environment cannot be borrowed to another.

One successful route does not establish:
- universal indoor capability;
- future controlled-environment capacity;
- winter availability for another service;
- automatic routing permission; or
- automatic safe-reschedule permission.

## Southern Ontario truth boundary
Current site confirmation remains required for a routed outcome. Source-owned working-temperature limits and service-specific seasonal classifications remain authoritative. Cold weather, application uptime, demand, margin evidence or one indoor outcome never proves broad winter availability.

## Mutation boundary
No automatic appointment move, routing, reschedule, booking/availability change, quote-rule change, checkout change, customer message, public indoor/winter claim, capacity reservation, price/discount change, provider action, accounting/inventory mutation, canonical-HOLD mutation, schema/storage mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 518 checker/test, retained Build 508 operational-readiness and Build 517 outcome-continuity authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-`main` PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 519 — Provider & Local Search Manual Closure Outcome Continuity** begins only after Build 518 is independently GREEN on protected `main`.
