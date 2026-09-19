# Build 429 — Retention & Rebooking Learning

Build 429 turns existing first-party completed-job, later booking, maintenance-interest and communication evidence into a bounded, staff-only learning surface. It is observational and read-only: it helps us understand repeat business without turning history into inferred marketing consent, automatic outreach or commercial action.

## Purpose

The release answers practical questions with recorded evidence where available:

- how many exact customer profiles show a completed-job followed by a later booking;
- how much elapsed time is observed between completed service and that later booking;
- which recorded package transitions occur in repeat-booking evidence;
- how much maintenance interest is recorded and which preferred cycles appear;
- what current communication consent and delivery evidence is actually present;
- which evidence is partial, provider-dependent or unavailable.

These counts are correlation, not causal proof. Build 429 does not claim that a reminder, package, maintenance interest, communication event or any other factor caused a customer to return.

## Staff learning surface

The protected Operations surface is:

- UI: `/admin-retention-learning.html`;
- API: `/api/admin/retention_rebooking_learning`;
- aggregation helper: `functions/api/_lib/retention-rebooking-learning.js`.

The page uses manual refresh only. No customer identities are returned or rendered. Aggregate evidence is loaded only for an authorized staff session.

## Exact-profile repeat-booking evidence

Booking linkage is identity-safe:

- bookings are grouped only by exact canonical `customer_profile_id`;
- missing profile IDs are counted as incomplete evidence rather than fuzzy-matched;
- a completed-job can contribute repeat evidence only when a later recorded booking exists for that same exact profile;
- elapsed-time and package-transition summaries are observational;
- missing timestamps or package codes remain explicit incomplete evidence;
- booking history does not create outreach eligibility, segmentation or a booking.

No fuzzy identity merge is authorized.

## Maintenance evidence

Maintenance-interest evidence is aggregate because the current source does not establish exact canonical profile linkage for every record.

Build 429 may summarize:

- total interest records;
- current recorded status counts;
- preferred-cycle counts;
- vehicle counts where recorded.

It may not infer customer identity, consent, follow-up eligibility, maintenance-plan enrollment, cadence approval or recurring billing.

## Communication and explicit-consent boundary

Build 429 reuses the retained customer communication consent and delivery authority.

- Current explicit-consent remains authoritative at dispatch time.
- Booking or maintenance history never expands consent.
- Provider acceptance is not treated as final delivery.
- Missing provider delivery evidence remains provider-dependent.
- A learning result never sends email, SMS, push or any other customer communication.

There is no automatic email, no automatic SMS and no automatic push.

There is no booking creation and no maintenance-plan enrollment from this learning surface.

## Evidence classifications

The learning surface fails closed:

- `ready` means the relevant aggregate evidence is sufficiently present for the bounded summary;
- `partial` means some relevant linkage or fields are incomplete;
- `provider_dependent` remains provider-dependent where the provider owns the missing outcome;
- `unavailable` means evidence was not observed or could not be safely established.

Unavailable evidence is never converted into a positive business conclusion.

## Locked actions

Build 429 authorizes no:

- automatic customer segmentation;
- automatic outreach;
- booking creation;
- maintenance-plan enrollment;
- automatic discount or pricing mutation;
- payment or provider mutation;
- accounting posting;
- inventory mutation;
- schema migration;
- destructive storage mutation;
- permanent polling.

The existing booking, availability, checkout, communication-consent and commercial authorities remain authoritative.

## Release acceptance

The focused Build 429 authority must pass:

```text
python scripts/retention_rebooking_learning_check.py
node scripts/retention_rebooking_learning_test.mjs
```

The retained customer communication-consent, booking/rebooking and retention/maintenance authorities remain mandatory. Current Source Gate and exact feature-preview acceptance must pass before the exact accepted candidate advances to `dev` by non-force fast-forward.

Development must independently pass exact-SHA deployment/runtime acceptance.

Production promotion remains a pull request to protected-main. The resulting exact `main` SHA must independently pass protected-main checks and Cloudflare Production deployment/runtime/business acceptance before Production is called GREEN.

## Next bounded release

Build 430 — Fleet & Commercial Operations Learning begins only after Build 429 is independently GREEN on protected `main`.
