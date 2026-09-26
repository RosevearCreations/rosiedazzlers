# Build 507 — Winter Booking & Quote Rule Controlled Activation Decision

## Purpose
Converge the retained Southern Ontario winter booking/quote readiness chain into a final bounded owner decision package for service-specific rule candidates.

This release remains read-only. It does not activate a booking rule, mutate quote logic, change availability, bypass checkout collision revalidation, publish customer messaging, or create a broad winter-service promise.

## Controlled activation decision contract
A service-specific rule package becomes `controlled_activation_decision_ready` only when all of the following are explicit:
- Build 497 already reports the service-specific rule package as `activation_readiness_review_ready`;
- the retained booking-rule and quote-rule candidates remain present and classification-compatible;
- retained Build 487 customer limitation wording is available;
- the owner explicitly confirms the customer-transparency wording for the rule package;
- the owner records `approve_controlled_activation`;
- a valid controlled-activation review date is recorded; and
- an attributable controlled-activation reference is recorded.

An explicit `hold_controlled_activation` remains an owner HOLD. Missing, stale, incompatible or incomplete evidence remains owner action.

## Manual activation boundary
`controlled_activation_decision_ready` means only that the owner has completed the bounded decision for a specific booking/quote rule pair. Actual rule implementation or activation remains a separate manual change in the owning booking/quote workflow and must preserve the current operational authorities.

Decision readiness does not authorize:
- automatic booking availability changes;
- automatic quote-rule changes;
- bypassing `/api/availability`;
- bypassing server-side checkout collision revalidation;
- automatic customer messaging;
- a broad winter-availability claim;
- a temperature threshold not present in owning evidence;
- a price or discount change; or
- automatic routing, rescheduling or outreach.

## Southern Ontario operating truth
Cold snaps do not make every detailing process safe or practical. `cold-snap-capable`, `temperature-limited-outdoor` and `controlled-environment-required` remain evidence-owned service classifications. Weather-ineligible sessions remain outside ordinary conversion interpretation and are not conversion failures.

## Mutation boundary
No schema/storage mutation, booking/availability mutation, quote-rule mutation, checkout mutation, customer message, public-content publication, price/discount change, provider action, accounting/inventory mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 507 checker/test, retained Builds 497/487/506 seasonal authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** begins only after Build 507 is independently GREEN on protected `main`.
