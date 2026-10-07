# Build 539 — Provider & Local Search Closure Evidence Integrity Review

## Purpose
Verify that retained current Build 529 provider/local-search closure evidence still maps to the exact provider source trace, Search Console property / Google Business Profile location and dated comparison-window identity, plus the explicit operator review tied to that same evidence trace.

Build 539 is read-only and fail-closed. Missing, stale, mismatched or unavailable source identity remains manual review/HOLD. Source/runtime GREEN never manufactures a provider result, local-search result or manual closure outcome.

## Integrity contract
A retained closure may be classified as:
- `closure_integrity_current` only when Build 529 freshness remains current, provider/payment/refund/message source identity is explicit and trace-matched, Search Console/GBP property-location-window identity is complete and trace-matched, and the explicit operator review is current and tied to that exact evidence;
- `retained_freshness_review_required` when Build 529 is no longer current;
- `provider_source_identity_review_required` or `provider_source_identity_drift_review_required` when provider/payment/refund/message source identity is missing or no longer matches the retained evidence trace;
- `local_search_identity_review_required` or `local_search_identity_drift_review_required` when Search Console property / GBP location / dated comparison-window identity is missing or trace-mismatched;
- `operator_review_identity_review_required` or `operator_review_identity_drift_review_required` when the explicit manual review identity is missing, stale or no longer tied to the exact current evidence trace;
- `integrity_source_unavailable` when required provider or local-search evidence is unavailable.

## Interpretation boundary
First-party landing/referral and anonymous same-session funnel context stays separate descriptive evidence. Provider or local-search movement does not prove ranking, indexing, Maps visibility, demand, weather effects, provider causation or booking-conversion causation.

## Mutation and storage boundary
Build 539 performs no provider contact, payment/refund/message mutation, Search Console/GBP write, provider snapshot write, booking/quote change, customer outreach, content publication, canonical-HOLD narrowing, Supabase table/schema/storage-object creation, persistent telemetry/event stream or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 539 checker/test, retained Build 529/519/509 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-`main` PR governance and independent exact resulting-`main` Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review** begins only after Build 539 is independently GREEN on protected `main`.
