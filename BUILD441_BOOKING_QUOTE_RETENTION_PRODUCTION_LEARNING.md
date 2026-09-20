# Build 441 — Booking, Quote & Retention Production Learning

## Purpose
Use current first-party booking, estimate/quote and repeat-booking evidence to identify supported conversion and retention priorities without creating a new business-state ledger or automatic action engine.

## Implemented evidence model
The protected Operations surface `/admin-booking-quote-retention-learning.html` is manual-refresh only. Its GET-only aggregator composes retained authorities for:

- anonymous booking/rebooking funnel evidence;
- current quote-pipeline rows, reduced server-side to aggregate status/value counts with customer identity omitted; and
- retained retention/rebooking learning based on exact persisted customer-profile linkage where that authority permits it.

The three evidence layers remain separate. Anonymous web sessions are never identity-joined to persisted customer records, and aggregate quote status does not establish why a quote was accepted or declined.

## Supported learning outputs
The learning surface may identify bounded operator review priorities for:

- the largest observed anonymous booking-stage drop;
- current accepted, declined and unresolved quote counts;
- exact-profile repeat-booking observations and bounded timing;
- aggregate maintenance-interest evidence; and
- provider-dependent communication-delivery evidence.

Every priority carries an evidence state and states that automatic action is not authorized.

## Evidence boundary
Recorded evidence remains correlation rather than causal proof.

- A stage drop does not prove UI, price, service choice or customer intent caused abandonment.
- Quote status counts do not prove price sensitivity and do not authorize a pricing change.
- Repeat-booking counts do not prove why a customer returned and do not authorize segmentation or outreach.
- Maintenance interest does not establish exact-profile linkage, consent or enrollment eligibility where the source lacks that authority.
- Provider acceptance is not definitive message delivery.
- Missing identity, consent, price/cost or provider-delivery evidence remains partial, `provider_dependent` or unavailable.

The Build 441 response excludes customer names, customer email addresses and raw quote identifiers.

## Mutation boundary
No automatic outreach, segmentation, discount, pricing change, booking creation, maintenance enrollment, payment or provider mutation is authorized.

Specifically, no automatic:

- outreach;
- segmentation;
- discount;
- pricing change;
- booking creation;
- maintenance enrollment;
- payment/refund action; or
- provider mutation

is authorized.

There is no schema migration, accounting/inventory posting, destructive storage mutation or permanent polling.

## Role boundary
The page remains inside the existing Operations module ceiling and the endpoint requires the retained `manage_bookings` staff authority. Existing source endpoints independently retain their own authorization checks.

## Acceptance
The exact candidate must pass:

1. `scripts/booking_quote_retention_production_learning_check.py`;
2. `scripts/booking_quote_retention_production_learning_test.mjs`;
3. retained booking/rebooking, quote-conversion, retention and customer-journey authorities;
4. Current Source Gate;
5. exact feature-preview acceptance;
6. exact Development deployment/runtime acceptance after non-force promotion to `dev`;
7. protected-main PR checks; and
8. independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing provider/owner/observed evidence remains a truthful HOLD or unavailable state.

## Next bounded release
Build 442 — Staff Workflow & Support Exception Learning begins only after this release is independently GREEN on protected `main`.
