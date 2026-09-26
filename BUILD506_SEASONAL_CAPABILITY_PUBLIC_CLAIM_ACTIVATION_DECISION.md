# Build 506 — Seasonal Capability & Public Claim Activation Decision

## Purpose
Converge the retained Southern Ontario seasonal capability/public-claim review chain into one final bounded owner activation-decision package for service-specific public wording.

This release remains read-only. It does not publish website content, change booking or quote eligibility, widen a temperature limit, or manufacture an owner decision.

## Activation decision contract
A service-specific public claim becomes `public_claim_activation_decision_ready` only when all of the following are explicit:
- the retained Build 496 row is `publication_review_ready`;
- current attributable capability evidence still supports the service classification;
- any exact working-temperature limit remains source-owned;
- supported service-specific customer wording is present;
- the owner records `approve_public_claim_activation`;
- a valid activation review date and attributable activation reference are recorded; and
- the owner explicitly confirms the final service-specific wording being considered.

An explicit `hold_public_claim_activation` remains an owner HOLD. Missing, stale or incomplete activation evidence remains `owner_action`.

## Manual publication boundary
`public_claim_activation_decision_ready` means only that the owner has completed the bounded activation decision for a specific service claim. Actual publication remains a separate manual action in the owning content workflow.

Decision readiness does not authorize:
- automatic publication;
- a broad winter-availability claim;
- a customer-facing temperature threshold not present in the owning evidence;
- a booking or quote rule change;
- a customer promise that exceeds the reviewed service-specific wording; or
- automatic outreach, routing or rescheduling.

## Southern Ontario operating truth
Cold snaps do not make every detailing process safe or practical. `cold-snap-capable`, `temperature-limited-outdoor` and `controlled-environment-required` remain evidence-owned classifications. A service-specific reviewed claim never becomes proof that every service is available throughout winter.

## Mutation boundary
No schema/storage mutation, public content publication, booking/availability change, quote-rule activation, customer message, price/discount change, provider action, accounting/inventory mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 506 checker/test, retained Builds 496–498 seasonal authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** begins only after Build 506 is independently GREEN on protected `main`.
