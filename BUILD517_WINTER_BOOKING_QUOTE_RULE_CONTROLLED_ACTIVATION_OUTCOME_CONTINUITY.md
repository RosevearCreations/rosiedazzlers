# Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity

## Purpose
Reconcile only explicit manually applied or explicitly retained-HOLD winter booking/quote rule outcomes that remain traceable to the retained Build 507 decision package and current service-specific operating evidence.

This release is read-only. It does not activate a rule, change availability, change quote logic, bypass checkout collision revalidation, publish customer messaging, widen a working-temperature limit, or create a broad winter-service promise.

## Outcome continuity contract
A service-specific row may be classified as:
- `controlled_activation_observed` only when an explicit dated attributable `activated` outcome exists, Build 507 is `controlled_activation_decision_ready`, current service capability/classification still matches, the observed booking and quote rules match the retained Build 507 candidates, customer-transparency wording matches, and both `/api/availability` plus checkout collision behavior have dated attributable revalidation evidence;
- `retain_hold_observed` only when an explicit dated attributable `retain_hold` outcome remains traceable to a retained Build 507 decision, current service capability/classification and customer-transparency wording still match, and availability plus checkout collision behavior have been revalidated;
- `controlled_activation_evidence_conflict` or `retain_hold_evidence_conflict` when an explicit outcome is recorded but the current evidence does not support it; or
- `outcome_owner_action_required` when the outcome itself is missing or unattributable.

Missing activation evidence never means activation, no action or success. Build 507 decision readiness never means live activation.

## Availability and checkout authority
`/api/availability` remains the booking availability authority and server-side checkout collision revalidation remains mandatory. Build 517 only records explicit observed evidence that those authorities were revalidated after a manual outcome.

No Build 517 state can bypass:
- current AM/PM availability;
- checkout collision revalidation;
- service-specific weather eligibility;
- source-owned working-temperature limits; or
- manual owner/operator control of booking and quote rules.

## Southern Ontario operating truth
Cold snaps do not make every detailing process safe or practical. `cold-snap-capable`, `temperature-limited-outdoor` and `controlled-environment-required` remain evidence-owned service classifications. Weather-ineligible sessions stay outside ordinary conversion interpretation and are not conversion failures.

## Mutation boundary
No schema/storage mutation, booking/availability mutation, quote-rule mutation, checkout mutation, customer message, public-content publication, price/discount change, provider action, accounting/inventory mutation, canonical-HOLD mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 517 checker/test, retained Build 507 controlled-activation decision and Build 516 outcome-continuity authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 518 — Controlled-Environment Routing Outcome Evidence Continuity** begins only after Build 517 is independently GREEN on protected `main`.
