# Build 537 — Winter Booking & Quote Rule Evidence Integrity Review

## Purpose
Verify that retained current Build 527 winter booking/quote rule evidence still maps to the exact controlled-activation decision trace, current service classification, customer-transparency wording, retained booking/quote rule pair, `/api/availability` authority and checkout collision-safety evidence.

Build 537 is read-only and fail-closed. It detects missing or drifted outcome-time identity without activating, widening or narrowing a winter booking/quote rule, changing checkout behavior, or manufacturing missing evidence from source/runtime GREEN.

## Integrity contract
A row may be classified as:
- `integrity_current` only when Build 527 freshness remains current and the decision reference, outcome action reference, service classification, transparency wording, retained rule pair and runtime-safety identity all match recorded outcome-time snapshots;
- `decision_trace_identity_review_required` when the outcome-time decision/action identity was not recorded;
- `decision_trace_identity_drift_review_required` when current decision/action identity does not match the recorded outcome-time identity;
- `service_classification_integrity_review_required` when current classification does not match the retained outcome-time classification;
- `customer_transparency_integrity_review_required` when current customer-transparency wording does not match the recorded outcome-time wording;
- `booking_quote_rule_integrity_review_required` when the retained booking/quote rule pair no longer matches the recorded outcome-time rule identity;
- `runtime_safety_identity_review_required` when the `/api/availability`, checkout-collision or runtime-proof identity was not recorded;
- `runtime_safety_identity_drift_review_required` when current runtime-safety proof no longer matches the recorded outcome-time identity;
- `runtime_safety_integrity_review_required` when availability or checkout collision revalidation is no longer current/positive;
- `freshness_window_integrity_review_required` when Build 527 freshness is not current;
- `integrity_source_unavailable` when current attributable service-specific winter-rule evidence is unavailable.

Missing identity snapshots are not inferred from today's source. The safe default remains manual review/HOLD.

## Seasonal and conversion truth boundary
Weather-ineligible sessions remain outside ordinary conversion interpretation. `/api/availability` and checkout collision revalidation remain safety/availability authorities, not proof of weather eligibility or broad winter availability. Service classifications and exact working-temperature limits remain source-owned and service-specific.

## Mutation and storage boundary
Build 537 performs no booking/availability mutation, quote-rule activation, checkout mutation, customer messaging, price/discount change, public winter claim, provider action, capacity reservation, accounting/inventory mutation, canonical-HOLD narrowing, Supabase table or schema migration, storage-object creation, persistent telemetry/event stream, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 537 checker/test, retained Build 527/517/507 winter-rule authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-`main` PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review** begins only after Build 537 is independently GREEN on protected `main`.
