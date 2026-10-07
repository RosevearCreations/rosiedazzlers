# Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review

## Purpose
Verify that retained current Build 528 controlled-environment routing/capacity evidence still maps to the exact service/site/workflow identity, routing outcome, current site-confirmation or safe-reschedule evidence and bounded observed-capacity context recorded for that outcome.

Build 538 is read-only and fail-closed. It detects missing or drifted outcome-time identity without moving an appointment, routing or rescheduling automatically, reserving capacity, widening an indoor-capability claim, or manufacturing missing evidence from source/runtime GREEN.

## Integrity contract
A controlled-environment candidate may be classified as:
- `integrity_current` only when Build 528 routing/capacity freshness remains current and service classification, retained site, workflow reference, routing outcome identity, applicable site-confirmation or safe-reschedule identity, and bounded capacity context all match recorded outcome-time snapshots;
- `retained_routing_capacity_review_required` when Build 528 no longer supports a current route/safe-reschedule plus bounded capacity context;
- `service_site_workflow_identity_review_required` or `service_site_workflow_identity_drift_review_required` when the outcome-time service/site/workflow identity is missing or no longer matches;
- `routing_outcome_identity_review_required` or `routing_outcome_identity_drift_review_required` when routing outcome identity is missing or drifted;
- `site_confirmation_identity_review_required` or `site_confirmation_identity_drift_review_required` for a routed outcome whose current qualified-site confirmation identity is missing or mismatched;
- `safe_reschedule_identity_review_required` or `safe_reschedule_identity_drift_review_required` for a safe-reschedule outcome whose attributable evidence identity is missing or mismatched;
- `bounded_capacity_context_identity_review_required` or `bounded_capacity_context_identity_drift_review_required` when retained capacity state/context is not represented by the exact recorded outcome-time snapshot;
- `integrity_source_unavailable` when current attributable service/site/workflow evidence is unavailable.

Missing identity snapshots remain manual review/HOLD. `capacity_not_observed` remains a truthful no-capacity-claim state; it is never converted into inferred capacity.

## Capability and capacity truth boundary
A qualified site or successful route does not establish universal indoor capability, another service's safe operability, or future capacity. A bounded observed-capacity sample remains dated, site-specific historical evidence only and never reserves capacity.

## Mutation and storage boundary
Build 538 performs no appointment move, automatic routing, reschedule, booking/availability or quote-rule change, customer message, public indoor/winter claim, price/discount change, capacity reservation, provider action, accounting/inventory mutation, canonical-HOLD narrowing, Supabase table or schema migration, storage-object creation, persistent telemetry/event stream, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 538 checker/test, retained Build 528/518/508 controlled-environment authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-`main` PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 539 — Provider & Local Search Closure Evidence Integrity Review** begins only after Build 538 is independently GREEN on protected `main`.
