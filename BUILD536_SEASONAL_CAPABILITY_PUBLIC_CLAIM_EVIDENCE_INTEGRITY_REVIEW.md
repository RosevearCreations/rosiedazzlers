# Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review

## Purpose
Verify that a retained current Build 526 seasonal/public-claim freshness outcome still maps to the correct service-specific owning evidence, explicit owner/manual action identity, bounded freshness window and source-owned classification/working limits.

Build 536 is read-only and fail-closed. It detects missing or drifted outcome-time evidence identity without publishing content, widening claims, changing booking/quote behavior or manufacturing missing evidence from source/runtime GREEN.

## Integrity contract
A row may be classified as:
- `integrity_current` only when Build 526 freshness remains current and the service-specific owning evidence identity, explicit owner-action identity and, for published outcomes, manual-publication identity all match recorded outcome-time snapshots;
- `owning_evidence_identity_review_required` when outcome-time owning-source identity was not recorded;
- `owning_evidence_identity_drift_review_required` when the current owning source does not match the recorded outcome-time source identity;
- `owner_action_identity_review_required` when the explicit outcome/manual-publication action identity is incomplete;
- `owner_action_identity_drift_review_required` when current owner/manual-publication references no longer match the recorded outcome-time identity;
- `freshness_window_integrity_review_required` when Build 526 freshness or the bounded observation/publication window is no longer current;
- `source_owned_limit_integrity_review_required` when service classification or an explicit source-owned temperature threshold has drifted;
- `public_claim_wording_integrity_review_required` when observed published wording has drifted;
- `public_claim_outcome_integrity_review_required` when the current explicit public-claim outcome differs from the retained outcome;
- `integrity_source_unavailable` or `service_specific_identity_review_required` when current attributable service-specific identity cannot be established.

Missing identity snapshots are not inferred from today's source. The safe default remains manual review/HOLD.

## Southern Ontario seasonal-service truth boundary
Cold-snap-capable, temperature-limited outdoor and controlled-environment-required classifications remain service-specific. Exact working-temperature limits remain source-owned and may not be widened from weather, demand, margin, uptime, historical publication or release status. A current service-specific claim never establishes broad winter availability.

## Owner/publication boundary
A current claim requires explicit traceable owner/outcome identity. Published outcomes additionally require an explicit manual-publication reference that matches the recorded outcome-time publication identity. Source, Development or Production GREEN is not owner/publication evidence.

## Mutation and storage boundary
Build 536 performs no public-content publication, booking/availability change, quote-rule activation, customer messaging, pricing/discount change, provider action, capacity reservation, accounting/inventory mutation, canonical-HOLD narrowing, Supabase table or schema migration, storage-object creation, persistent telemetry/event stream, outreach or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 536 checker/test, retained Build 526/516 seasonal/public-claim authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-`main` PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 537 — Winter Booking & Quote Rule Evidence Integrity Review** begins only after Build 536 is independently GREEN on protected `main`.
