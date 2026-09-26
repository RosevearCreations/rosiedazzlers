# Build 509 — Provider & Local Search Closure Evidence Continuity Review

## Purpose
Review fresh provider-outcome and local-search closure evidence from retained source-owned authorities without contacting providers, mutating provider data, or turning descriptive evidence into ranking, weather, demand or conversion causation.

## Provider closure-evidence contract
Build 509 reuses the retained Build 499 outcome refresh. The four provider evidence classes remain independent and provider-owned:
- Stripe payment outcome;
- PayPal payment outcome;
- linked definitive refund outcome; and
- definitive message-delivery outcome.

A provider closure review can become `provider_closure_evidence_review_ready` only when all four retained rows are source-available, provider-attributable, validly dated, current, observed and covered by the retained evidence trace key. Missing, stale, unavailable or unattributed provider evidence remains provider-dependent.

## Local-search closure-evidence contract
Search Console and Google Business Profile remain provider-owned. Local-search closure review requires:
- the correct Search Console property identity;
- the correct Google Business Profile location identity;
- distinct current/prior dated windows of equal length;
- a current attributable observation timestamp; and
- the retained Build 499 correct-provider/property/location/window classification.

First-party referral/funnel context remains separate descriptive evidence. It never substitutes for Search Console/GBP evidence and is not joined to provider metrics, customer identity or persisted bookings.

## Closure boundary
`closure_evidence_continuity_review_ready` means only that the retained evidence package is ready for explicit manual source-owned closure review. Build 509 does not close or narrow a canonical HOLD automatically. Any provider/local-search HOLD change remains a separate explicit operator-reviewed update to `STARTUP_GO_LIVE_BLOCKERS.md`.

## Southern Ontario truth boundary
Payment, refund, message, Search Console, GBP or first-party movement does not prove ranking, indexing, Maps visibility, weather effects, winter demand, service availability, booking-conversion causation or any service working-temperature threshold. Cold-weather operability remains owned by the retained service/product/equipment/site authorities.

## Mutation boundary
Read-only only. No payment/refund/message send, provider contact, Search Console/GBP write, provider snapshot write, booking/quote mutation, customer outreach, content publication, HOLD mutation, schema/storage mutation or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 509 checker/test, retained Build 499 outcome-refresh authority, retained Build 489 provider/local-search continuity authority, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 510 — Recovery Drill & Authenticated Device Closure Review** begins only after Build 509 is independently GREEN on protected `main`.
