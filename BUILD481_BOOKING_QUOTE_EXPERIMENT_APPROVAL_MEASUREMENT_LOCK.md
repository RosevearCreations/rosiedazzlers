# Build 481 — Booking & Quote Experiment Approval & Measurement Lock

## Purpose
Advance retained Build 461/471 booking-and-quote experiment definitions only when the owner explicitly records the complete measurement contract and approval. Lock that declaration before any separately authorized execution.

Build 481 reuses the retained booking/quote learning workbench and existing `app_management_settings` store. It does not create a second experiment, booking, quote, pricing or analytics system and introduces no schema migration.

## Retained authorities
- Build 441 remains booking/quote/retention production-learning authority.
- Build 451 remains booking-funnel/quote/pricing-learning authority.
- Build 461 remains experiment-readiness authority.
- Build 471 remains controlled-experiment definition authority.
- `/api/admin/booking_funnel_quote_pricing_learning` remains the read-only current-state endpoint.
- `/admin-booking-quote-retention-learning.html` remains the operator workbench.

## Explicit owner approval
A retained experiment definition may reach `measurement_locked` only when all of the following are explicitly recorded:
- owner approval;
- success threshold;
- target direction;
- winner rule;
- positive bounded duration;
- allocation/comparison rule;
- every retained fail-closed stop condition;
- Southern Ontario seasonal/weather eligibility rule;
- required treatment of weather-ineligible sessions; and
- explicit confirmation of the measurement lock.

Nothing is inferred from source/runtime GREEN, historical observations or a supported hypothesis.

## Measurement lock
The dedicated POST endpoint `/api/admin/booking_quote_experiment_approval_lock_save` writes only the declared governance record to the existing `booking_quote_experiment_approval_lock` app setting.

A lock:
- records approver and lock timestamps;
- is immutable through the Build 481 endpoint once recorded;
- does not start the experiment;
- does not select a winner;
- does not change price, discount, booking rules, availability or outreach;
- does not create a booking, quote or payment;
- does not alter provider state; and
- does not close any canonical HOLD.

Any later change to a locked contract requires a separately authorized governance revision.

## Retained stop conditions
Every lock must explicitly preserve:
- retained evidence unavailable, restricted or materially truncated;
- minimum evidence no longer met;
- like-for-like comparison window breaks;
- any need for price, discount, booking-rule or outreach mutation;
- owner withdrawal of approval; and
- a material confounder that breaks comparability.

## Southern Ontario seasonal/weather eligibility
Weather/site constraints are a separate eligibility dimension.

Build 481 requires the owner to record how weather-ineligible services/sessions are identified from explicit service, product, equipment or site constraints. Weather-ineligible sessions must be excluded from the conversion denominator for the locked measurement contract.

Build 481 does not:
- treat a cold-weather restriction as conversion failure;
- infer seasonal demand from conversion movement;
- invent a minimum or maximum service temperature; or
- claim a service is cold-snap capable without explicit operational evidence.

## Execution boundary
`measurement_locked` means the pre-declared measurement contract is complete. It is not experiment execution authorization.

Every Build 481 definition retains:
- `execution_authorized: false`;
- `experiment_started: false`;
- automatic activation disabled;
- automatic winner selection disabled;
- price/discount mutation disabled;
- booking-rule and availability mutation disabled;
- outreach disabled; and
- customer identity joins disabled.

## Acceptance
The exact candidate must pass:
1. Build 481 Booking & Quote Experiment Approval & Measurement Lock authority;
2. retained Build 471 controlled-experiment framework authority;
3. retained Build 461 experiment-readiness authority;
4. retained Build 451 learning authority;
5. retained Build 441 production-learning authority;
6. Current Source Gate;
7. exact feature-preview acceptance;
8. exact-SHA Development deployment/runtime acceptance;
9. protected-main PR checks; and
10. independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 482 — Staff & Mobile Remediation Execution Evidence Readiness** begins only after Build 481 is independently GREEN on protected `main`.
