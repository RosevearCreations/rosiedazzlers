# Build 496 — Seasonal Capability Owner Review & Public Claim Decision

## Purpose
Converge the retained Southern Ontario seasonal-service capability matrix, source-owned temperature limits, weather-safe customer wording and explicit owner review into one read-only service-specific public-claim decision package.

This release does not publish website content, change booking or quote eligibility, create a weather engine, or manufacture owner approval.

## Owner review contract
A service-specific public claim becomes publication_review_ready only when all of the following are explicit:
- a valid retained service/package/add-on capability row;
- attributable service/product/equipment/site/process evidence;
- an explicit confirmation that the owning capability evidence is current;
- a supported weather-safe route and proposed service-specific wording;
- an owner decision of approve_public_claim_review;
- a valid owner review date; and
- an attributable owner review reference.

An explicit hold_public_claim remains an owner HOLD. Missing or invalid owner review remains owner_action.

## Public claim boundary
publication_review_ready means only that a specific claim is ready for final human publication review. It does not publish the claim and does not authorize a broad winter-availability statement.

Exact working-temperature limits remain source-owned. A temperature value that is not authorized by its owning evidence is not surfaced as a public threshold. Weather, booking demand, margin, local-search movement, uptime or source/runtime GREEN never create service capability or owner approval.

## Southern Ontario operating truth
Rosie Dazzlers can remain active during cold snaps only through services and environments whose actual evidence supports the work. Some work may be cold-snap-capable, some may be temperature-limited outdoors, and some may require a suitable controlled environment. Missing evidence stays a HOLD rather than being turned into a winter promise.

## Mutation boundary
Read-only and manual refresh only. No automatic publication, booking/availability change, quote-rule activation, route/reschedule action, customer message, price/discount change, provider action, accounting/inventory mutation, schema/storage mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 496 checker/test, retained Builds 488/487/486 seasonal authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 497 — Winter Booking & Quote Rule Activation Readiness** begins only after Build 496 is independently GREEN on protected main.
