# Build 410 — Maintenance / Fleet Commercial Acceptance

Build 410 closes the next commercial-acceptance gap in the active Rosie Dazzlers roadmap without inventing maintenance-plan economics, fleet pricing, customer commitments, capacity, bookings, recurring billing, invoices or provider outcomes.

This release is schema-neutral. It does not authorize a database migration, automatic outreach, automatic enrolment, automatic booking, automatic discounting, automatic invoice creation, recurring billing, renewal, or payment-provider mutation.

## Source acceptance versus business readiness

Build 410 makes an important distinction explicit:

- **Source acceptance** asks whether the configured maintenance/fleet system is safe, fail-closed and internally consistent.
- **Business readiness** asks whether the owner has explicitly approved the real commercial terms needed to operate the offer.
- **Source release GREEN is not business approval.**

The current configured rulebooks remain intentionally `awaiting_business_approval`. That is a valid source-safe state. It must remain `owner_action` rather than being converted into fabricated commercial readiness.

## Current configured rulebooks

Maintenance authority remains `config/maintenance-plan-business-rulebook.json`.

The seven required maintenance domains remain:

- eligibility;
- cadence;
- price;
- inclusions;
- exclusions;
- cancellation;
- priority.

The current configured rulebook requires explicit business approval and currently leaves all seven domains unapproved. Plan enablement, pilot enrolment, automatic enrolment, recurring billing and automatic renewal therefore remain disabled.

Fleet authority remains `config/fleet-business-rulebook.json`.

The six required fleet domains remain:

- fleet minimums;
- service tiers;
- travel limits;
- volume pricing;
- invoicing;
- cancellation.

The current configured fleet rulebook requires explicit business approval and currently leaves all six domains unapproved. Fleet activation, automatic discounts, invoice creation, booking creation, recurring billing, provider mutation and direct commercial database mutation remain disabled.

Build 410 does not replace either rulebook and does not create a second commercial authority.

## Maintenance acceptance boundary

The retained vehicle-specific maintenance pilot still requires:

- all seven rulebook domains explicitly approved;
- canonical customer identity;
- canonical vehicle identity;
- vehicle/customer ownership match;
- explicit staff activation intent;
- the approved pilot-enrolment flag;
- the approved plan-enabled flag.

Until those conditions are satisfied, the maintenance offer remains `owner_action`.

No customer is automatically enrolled. No visit is automatically booked. No capacity is reserved. No payment method is charged. No recurring billing or automatic renewal is enabled.

## Fleet acceptance boundary

Fleet lead review, account operations and draft quote handoff remain available as operator-assisted workflows.

A fleet draft quote is deliberately not a customer commitment. A sent quote is also not a customer commitment.

Build 410 recognizes explicit accepted-quote evidence only when all of these are recorded:

- quote status is `accepted`;
- an acceptance timestamp exists;
- the quoted amount is a positive recorded amount;
- the accepted amount is a positive recorded amount.

Missing or contradictory acceptance evidence remains review/unavailable. Build 410 does not infer acceptance from a staff note, lead status, email, phone call, draft quote or sent timestamp.

A quote acceptance still does not automatically create a booking, invoice, recurring commitment or provider transaction. Those remain separately authorized workflows.

## Capacity acceptance

Capacity remains server-authoritative.

The retained capacity contract continues to require:

- one-vehicle-per-day default;
- half-day exceptions when supported;
- read-only capacity intelligence;
- `/api/availability` as the availability authority;
- `/api/checkout` as the final collision/revalidation authority;
- closed slots are never opened by the intelligence layer;
- no permanent background polling.

Build 410 does not infer live slot availability or reserve capacity merely because a maintenance/fleet commercial rulebook becomes approved.

Any real booking still revalidates the requested date/slot against the current booking authority.

## Commercial activation boundary

The retained commercial-activation layer continues to lock:

- automatic outreach;
- automatic enrolment;
- automatic discount application;
- fleet account activation;
- invoice creation;
- booking creation;
- recurring billing;
- automatic renewal;
- provider mutation.

Those actions require separate authority even after business terms are approved.

## Build 410 source authority

`functions/api/_lib/maintenance-fleet-commercial-acceptance.js` provides the pure read-only acceptance model.

It reports:

- source acceptance as `ready` or `review`;
- business readiness as `ready`, `owner_action` or `review`;
- current maintenance unapproved domains;
- current fleet unapproved domains;
- capacity-authority safety;
- explicit fleet quote acceptance evidence;
- locked automatic/commercial actions.

The current repository configuration is expected to evaluate as:

- source acceptance: `ready`;
- business readiness: `owner_action`;
- maintenance commercial terms: not yet approved;
- fleet commercial terms: not yet approved;
- inferred pricing: prohibited;
- inferred customer commitment: prohibited;
- inferred capacity: prohibited.

That state is truthful and intentionally fail-closed.

## Acceptance and promotion

Build 410 is source-acceptable only when:

1. the actual configured maintenance and fleet rulebooks are consumed by the executable contract test;
2. unresolved business decisions remain owner-action gated;
3. capacity remains under current availability/checkout authority;
4. draft/sent fleet quotes are never treated as customer commitments;
5. explicit accepted quote evidence requires a timestamp and recorded positive amounts;
6. automatic outreach, booking, discount, invoice, billing, renewal and provider mutation remain prohibited;
7. no Build 410 schema migration is introduced;
8. feature, exact Development, protected-main PR and exact Production acceptance all pass.

A GREEN Build 410 therefore means the software safely represents the real current business state. It does **not** mean the outstanding maintenance/fleet commercial decisions have been approved.