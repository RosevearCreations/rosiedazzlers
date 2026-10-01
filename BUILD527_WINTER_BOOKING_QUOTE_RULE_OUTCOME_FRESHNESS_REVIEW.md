# Build 527 — Winter Booking & Quote Rule Outcome Freshness Review

## Purpose
Revalidate retained Build 517 controlled-activation and retain-HOLD outcomes against the retained Build 507 decision trace and current service-specific runtime evidence.

This release is read-only. It detects stale observed rule outcomes, service-classification/capability drift, customer-transparency wording drift, applied booking/quote rule drift and missing or stale runtime safety revalidation. It never activates, widens or narrows a booking/quote rule automatically.

## Freshness contract
- `controlled_activation_current` requires a fresh observed activation, current matching classification/capability, matching customer wording and applied rule pair, and fresh attributable `/api/availability` plus checkout collision revalidation.
- `retain_hold_current` requires a fresh explicit retain-HOLD outcome against the same current classification, wording and runtime-safety evidence.
- `stale_outcome_review_required` means the observed outcome or runtime-safety revalidation exceeds the bounded freshness window.
- `service_classification_or_capability_drift_review_required` means current service-specific capability/classification no longer matches the retained decision trace.
- `customer_transparency_drift_review_required` means current observed customer wording no longer matches the retained limitation wording.
- `applied_rule_drift_review_required` means an activated booking or quote rule no longer matches the retained Build 507 pair.
- `runtime_safety_revalidation_required` means `/api/availability`, checkout collision revalidation, its date or attributable reference is missing.
- `outcome_evidence_conflict_review_required`, `predecessor_outcome_review_required` or `freshness_source_unavailable` means current evidence cannot support a current outcome.

Missing or stale evidence remains review/HOLD. Source, Development or Production GREEN never substitutes for a current observed rule outcome.

## Conversion and seasonal truth boundary
Weather-ineligible sessions remain outside ordinary conversion interpretation. `/api/availability` and checkout collision revalidation are safety/availability authorities, not proof of weather eligibility or broad winter availability. Service-specific temperature and controlled-environment requirements remain owned by their current attributable source evidence.

## Mutation boundary
Build 527 performs no booking/availability mutation, quote-rule activation, checkout mutation, customer message, price/discount change, public winter claim, provider action, capacity reservation, canonical-HOLD narrowing, schema/storage mutation, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 527 checker/test, retained Build 517 outcome-continuity authority, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review** begins only after Build 527 is independently GREEN on protected `main`.
