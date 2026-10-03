# Build 532 — Booking & Quote Follow-Up Evidence Freshness Review

## Purpose
Revalidate retained Build 522 booking/quote follow-up outcomes against current evidence rather than carrying a historical experiment follow-up outcome forward indefinitely.

Build 532 is read-only. It does not select a winner, declare success, change price or discount, alter booking or availability rules, send outreach, create or modify a booking, mutate a provider, join customer identity, narrow the canonical HOLD, change schema/storage or run permanent polling.

## Freshness contract
A retained follow-up outcome is current only when:
- Build 522 outcome continuity remains recognized and trace-attributable;
- the retained measurement-lock revision and primary metric still match the recorded follow-up evidence;
- comparable allocation coverage and bounded duration remain valid;
- Southern Ontario weather eligibility was explicitly observed and weather-ineligible sessions remain excluded from the conversion denominator;
- the explicit owner outcome review remains within the bounded freshness window;
- a retained `continue_observation` outcome has a separate current authorization plus a later current attributable observation;
- allocation arms, duration bounds and comparable observations still match the retained evidence package; and
- neither retained nor follow-up evidence has a triggered stop condition.

Missing, stale, incomparable, trace-mismatched or stop-blocked evidence remains review/HOLD. Source/runtime GREEN never proves a current follow-up outcome.

## Status states
- `follow_up_freshness_source_unavailable`
- `retained_comparable_evidence_review_required`
- `follow_up_outcome_required`
- `follow_up_outcome_trace_conflict_review_required`
- `owner_outcome_freshness_review_required`
- `follow_up_authorization_freshness_review_required`
- `follow_up_observation_freshness_review_required`
- `follow_up_evidence_freshness_review_required`
- `follow_up_stop_condition_review_required`
- `follow_up_hold_outcome_current`
- `no_change_closure_outcome_current`
- `separate_change_review_outcome_current`
- `bounded_follow_up_observation_outcome_current`

## Truth boundary
A current follow-up observation remains descriptive evidence only. It does not establish a winner, success, price sensitivity, customer motive, exact service temperature threshold or general future conversion. Weather-ineligible sessions are never silently counted as conversion failures.

## Mutation boundary
Build 532 performs no winner selection, success declaration, price/discount change, booking-rule change, availability change, outreach, booking mutation, provider mutation, customer-identity join, canonical-HOLD mutation, schema/storage mutation or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 532 checker/test, retained Build 522/512/502/492/481/471/461 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 533 — Staff & Mobile Closure Evidence Freshness Review** begins only after Build 532 is independently GREEN on protected main.
