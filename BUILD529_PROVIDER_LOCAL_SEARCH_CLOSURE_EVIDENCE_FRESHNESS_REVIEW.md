# Build 529 — Provider & Local Search Closure Evidence Freshness Review

## Purpose
Revalidate retained Build 509 provider/local-search closure evidence and retained Build 519 operator-reviewed manual closure/HOLD outcomes against current source identity, attribution and bounded freshness requirements.

This release is read-only. Provider/payment/refund/message evidence, Search Console property evidence, Google Business Profile location evidence and the explicit operator review remain separate freshness layers.

## Freshness contract
- All four provider evidence classes must remain source-available, provider-attributable, contract-satisfied, explicitly observed and dated within the bounded freshness window.
- Search Console and Google Business Profile rows must retain the correct property/location identity, distinct equal-length current/prior windows, the correct provider/property/location/window source, and a current attributable observation within the bounded freshness window.
- An operator-reviewed retain-HOLD or dated narrowing outcome is current only when the review remains within the freshness window and its combined evidence trace still matches the current provider plus local-search package.
- Current provider/local-search evidence without a current explicit operator review remains closure_evidence_current_operator_review_required; it is not treated as closed.
- A present but stale or otherwise non-current explicit operator review is classified as operator_review_freshness_required.
- Stale provider evidence, stale local-search evidence, stale operator review or evidence-trace mismatch remains review/HOLD.
- A stale or otherwise non-current explicit operator review is classified as `operator_review_freshness_required` and cannot be reused to narrow the current HOLD.

## Truth boundary
First-party referral/funnel context remains separate descriptive evidence and never substitutes for provider evidence. Provider/search evidence does not prove ranking, indexing, Maps visibility, demand, weather effects, booking-conversion causation, service availability or service working-temperature limits.

## Mutation boundary
Build 529 performs no provider contact, payment/refund/message mutation, Search Console/GBP write, provider snapshot write, booking/quote mutation, customer outreach, content publication, canonical-HOLD mutation, schema/storage mutation or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 529 checker/test, retained Build 519/509/499/489 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review** begins only after Build 529 is independently GREEN on protected main.

## Release checkpoint
This exact source contract is the final Build 529 candidate boundary. Source/runtime GREEN never substitutes for current provider/property/location/window evidence or an explicit current operator review.
