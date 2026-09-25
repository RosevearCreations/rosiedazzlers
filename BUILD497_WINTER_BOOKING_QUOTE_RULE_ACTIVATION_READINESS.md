# Build 497 — Winter Booking & Quote Rule Activation Readiness

## Purpose
Prepare service-specific owner-reviewed winter booking and quote rule activation-readiness evidence without activating any rule.

The retained operational authorities remain /api/availability for current appointment availability and server-side checkout collision revalidation immediately before booking creation. Build 497 does not replace, bypass or weaken either authority.

## Readiness contract
A service-specific rule package becomes activation_readiness_review_ready only when:
- Build 496 already reports the service-specific capability/public-claim package as publication-review-ready;
- an explicit owner activation-readiness decision is recorded;
- the owner review is dated and attributable;
- a service-specific booking-rule candidate is present;
- a service-specific quote-rule candidate is present; and
- the rule pair is compatible with the retained seasonal capability classification.

An explicit owner hold_activation stays HOLD. Missing or incompatible evidence remains owner action.

## Southern Ontario operating truth
Cold-snap-capable, temperature-limited outdoor and controlled-environment-required services remain distinct. Exact temperature limits remain source-owned. A service-specific readiness package never creates broad winter availability.

Weather-ineligible sessions remain outside ordinary conversion interpretation and are not conversion failures.

## Operational authority boundary
Current slot availability remains owned by /api/availability. Checkout must continue to revalidate booking collisions server-side before a booking is created. Neither authority proves weather eligibility or seasonal capability by itself.

## Mutation boundary
Read-only only. No automatic activation, booking-rule change, quote-rule change, availability mutation, checkout mutation, public winter claim, customer message, price/discount change, provider action, accounting/inventory mutation, schema/storage mutation, outreach or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 497 checker/test, retained Builds 496/487/486 seasonal authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence** begins only after Build 497 is independently GREEN on protected main.
