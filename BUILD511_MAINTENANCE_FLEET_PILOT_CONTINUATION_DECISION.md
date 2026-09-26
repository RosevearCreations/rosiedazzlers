# Build 511 — Maintenance & Fleet Pilot Continuation Decision

## Purpose
Review whether the retained maintenance/fleet pilot evidence is complete enough for an explicit owner continuation decision without manufacturing approval, execution, capacity, enrollment, billing or commercial activation.

Build 511 is a read-only decision layer over Build 501 Maintenance & Fleet Pilot Outcome Continuity Review, which in turn retains Build 491 outcome evidence and the earlier owner-decision / controlled-pilot authorities. It does not create a second pilot engine, participant registry, capacity ledger, invoicing workflow, recurring-billing path or booking flow.

## Decision prerequisites
A bounded continuation decision can be recorded only when the retained Build 501 continuity review is current and review-ready, including:
- explicit owner approval and bounded pilot authorization remain attributable;
- participant and duration evidence remain inside the recorded bounds;
- current attributable pilot execution rows are present;
- current availability and checkout collision revalidation evidence are complete;
- invoicing outcome is observed without creating or changing an invoice;
- travel evidence is observed without inventing a travel limit; and
- stop-condition evidence is complete for every attributable execution row.

Historical outcome evidence, source/runtime GREEN or a prior owner approval never substitutes for the current decision prerequisites.

## Explicit owner decision
The continuation decision record is manual and source-attributed. An accepted record requires:
- decision of `continue` or `hold`;
- an attributable non-empty owner/operator reference; and
- a valid decision timestamp.

A recorded `continue` decision is a decision record only. It does not execute continuation, enroll a customer, activate a fleet account, create a booking, reserve capacity, create/change an invoice, enable recurring billing or change price/discount terms.

A recorded `hold` decision remains non-activating and preserves the current bounded state for owner review.

## Stop-condition boundary
Any current triggered stop condition produces `pilot_stop_condition_review_required`. A `continue` decision cannot become an accepted bounded continuation decision while a stop condition is triggered.

No stop action is executed automatically by this release.

## Decision states
- `continuation_source_unavailable` — the retained Build 501 continuity source is unavailable or unrecognized.
- `owner_action_authorization_required` — explicit retained authorization is not attributable.
- `owner_action_execution_evidence_required` — current attributable pilot execution evidence is absent.
- `pilot_bounds_review_required` — participant or duration evidence is outside the explicit owner bounds.
- `pilot_stop_condition_review_required` — current evidence contains a triggered stop condition requiring explicit review.
- `continuation_evidence_incomplete` — capacity, invoicing, travel or stop-condition evidence is incomplete.
- `owner_action_continuation_decision_required` — evidence is review-ready but no complete explicit owner continuation decision is recorded.
- `continuation_hold_recorded` — an attributable explicit hold decision is recorded.
- `bounded_pilot_continuation_decision_recorded` — complete current evidence plus an attributable explicit continue decision are recorded.

No state executes continuation.

## Current truthful state
If the retained Build 501 evidence is not review-ready or no explicit owner continuation decision exists, Build 511 remains owner action. This is expected and truthful; GREEN Build 511 proves only that the decision boundary is represented safely.

## Privacy and mutation boundary
Only retained non-identity participant references may be summarized. No participant identity is exposed.

No customer activation, maintenance enrollment, fleet-account activation, booking mutation, capacity reservation, guaranteed-capacity inference, invoice creation/change, recurring billing, price/discount change, outreach, provider mutation, accounting/inventory mutation, schema/storage mutation, canonical-HOLD mutation or permanent polling is authorized.

## Acceptance
The exact candidate must pass the focused Build 511 checker/test, retained Build 501/491/479/469/421 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 512 — Booking & Quote Experiment Follow-Up Decision** begins only after Build 511 is independently GREEN on protected `main`.
