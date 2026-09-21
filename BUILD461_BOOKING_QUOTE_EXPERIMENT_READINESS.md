# Build 461 — Booking & Quote Experiment Readiness

## Purpose
Translate supported first-party booking-stage, quote-band and accepted-value signals into bounded owner-review hypotheses and measurement plans without creating a second booking, quote, pricing or analytics authority.

Build 461 enriches the retained Build 451 Booking Funnel, Quote & Pricing Learning workbench at `/admin-booking-quote-retention-learning.html`. The existing GET-only `/api/admin/booking_funnel_quote_pricing_learning` endpoint remains the single source for this evidence family.

## Supported readiness plans
The retained aggregate evidence may produce three owner-review plans:

1. **Booking-stage clarity** — based on an observed price-adjacent booking-stage drop. The plan may propose copy, explanation or layout clarity review only. A stage drop does not prove price caused abandonment.
2. **Quote-band clarity** — based on an existing broad quote-value cohort that already meets the retained minimum review threshold. The plan may propose quote wording/presentation review only. Quote decline does not prove price sensitivity or customer motive.
3. **Accepted-work scope/value clarity** — based on accepted quote rows where quoted and accepted values are both positive. The plan may propose clearer scope/value explanation at acceptance only. An accepted quote is not proof of completed work, discounting, scope change, correction or realized margin.

## Measurement-plan boundary
Each plan states:
- the retained aggregate evidence basis;
- a primary metric from the existing source;
- a bounded like-for-like comparison rule;
- a minimum evidence threshold;
- the only class of owner-approved clarity change that could be reviewed;
- known confounders that must not be converted into causal claims; and
- that the owner must define the test change and review threshold before any activation.

Readiness means **ready for owner review**, not ready for automatic activation and not proof that a proposed change will improve results.

## Mutation boundary
Build 461 authorizes no automatic:
- price or discount change;
- booking-rule, availability or catalogue change;
- outreach or follow-up;
- quote acceptance or booking creation;
- winner selection or experiment activation;
- payment/refund/provider action;
- schema/storage mutation; or
- permanent polling.

No customer/session identity join is introduced.

## Role and privacy boundary
The existing endpoint continues to require the retained `manage_bookings` staff capability. Customer names, emails, raw session identifiers and raw quote identifiers remain excluded from the learning response.

## Acceptance
The exact candidate must pass:
1. `scripts/booking_quote_experiment_readiness_check.py`;
2. `scripts/booking_quote_experiment_readiness_test.mjs`;
3. retained Build 451 Booking Funnel, Quote & Pricing Learning authority;
4. retained Build 441 Booking, Quote & Retention Production Learning authority;
5. Current Source Gate;
6. exact feature-preview acceptance before `dev` moves;
7. independent exact-SHA Development deployment/runtime acceptance;
8. protected-main pull-request checks; and
9. independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing or small-sample evidence remains `needs_more_evidence` or `unavailable`; source/runtime GREEN never fabricates experiment success.

Retained Build 451 and Build 441 authority markers remain durable compatibility requirements of the shared workbench; Build 461 enriches them rather than replacing them.

## Next bounded release
Build 462 — Staff & Mobile Friction Remediation Priorities begins only after Build 461 is independently GREEN on protected `main`.
