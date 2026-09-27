# Build 512 — Booking & Quote Experiment Follow-Up Decision

## Purpose
Review comparable attributable outcomes from separately authorized booking/quote experiment executions and record an explicit owner follow-up decision without manufacturing a winner, success claim, causation finding or business mutation.

Build 512 is a read-only decision layer over Build 502 Booking & Quote Experiment Outcome Interpretation, which retains Build 492 controlled execution evidence and Build 481 owner-approved measurement locks. It does not create a second experiment engine, analytics store, pricing authority, booking flow or availability engine.

## Follow-up prerequisites
A follow-up decision can be accepted only when the retained Build 502 interpretation is recognized and review-ready, including:
- the exact retained measurement lock remains attributable;
- separately authorized allocation and bounded duration evidence remain intact;
- comparable primary-metric observations exist for every authorized allocation arm;
- Southern Ontario weather/service/site eligibility remains explicitly observed;
- weather-ineligible sessions remain excluded from the conversion denominator; and
- no retained stop condition is triggered.

Incomplete, incomparable, unavailable or stop-condition evidence never becomes a winner or success result.

## Explicit owner follow-up
The follow-up record is manual and attributable. Supported records are:
- `hold`;
- `continue_observation`;
- `close_no_change`; or
- `separate_change_review`.

An accepted record requires a non-empty owner/operator reference and valid decision timestamp. Even `separate_change_review` only records a request for a separate review; it does not authorize or execute a price, discount, booking-rule, availability, outreach or booking change.

## Review states
- `outcome_interpretation_source_unavailable` — retained Build 502 source is absent or unrecognized.
- `stop_condition_review_required` — a retained stop condition is triggered and blocks accepted follow-up decision readiness.
- `comparable_outcomes_required` — retained outcomes are incomplete or incomparable.
- `owner_follow_up_decision_required` — comparable outcomes are ready but no attributable owner follow-up record exists.
- `follow_up_hold_recorded` — an explicit hold is recorded.
- `continued_observation_decision_recorded` — continued observation is recorded without starting or extending execution automatically.
- `no_change_closure_decision_recorded` — a no-change closure record is accepted.
- `separate_change_review_decision_recorded` — a separate owner change-review request is recorded without authorizing the change.

No state selects a winner, declares experiment success or proves price causation.

## Seasonal truth boundary
Southern Ontario weather-ineligible sessions remain eligibility evidence, not conversion failures. Exact service temperature limits remain source-owned and are never inferred from experiment outcomes or follow-up decisions.

## Mutation and privacy boundary
Build 512 authorizes no automatic price/discount change, booking-rule change, availability mutation, booking creation/change, outreach, provider action, customer identity join, canonical HOLD mutation, schema/storage mutation or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 512 authority and behavioral proof, retained Build 502/492/481/471/461 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected-main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

## Next bounded release
**Build 513 — Staff & Mobile Remediation Closure Readiness** begins only after Build 512 is independently GREEN on protected main.
