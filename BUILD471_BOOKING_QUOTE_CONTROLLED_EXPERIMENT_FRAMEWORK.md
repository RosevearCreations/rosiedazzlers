# Build 471 — Booking & Quote Controlled Experiment Framework

## Purpose
Turn retained Build 461 booking/quote hypotheses into explicit bounded controlled-experiment definitions without creating a second booking, quote, pricing, analytics or experiment system.

Build 471 reuses:
- Build 441 Booking, Quote & Retention Production Learning;
- Build 451 Booking Funnel, Quote & Pricing Learning;
- Build 461 Booking & Quote Experiment Readiness;
- the existing GET-only `/api/admin/booking_funnel_quote_pricing_learning` endpoint; and
- the existing `/admin-booking-quote-retention-learning.html` workbench.

## Framework definition
Each retained hypothesis is translated into a controlled-experiment definition containing:
1. evidence eligibility;
2. an owner-review hypothesis and retained evidence basis;
3. the existing primary measure and baseline rule;
4. owner-defined success-threshold placeholders that remain null until separately approved;
5. explicit stop conditions;
6. explicit duration/allocation placeholders that remain null until separately approved;
7. owner approval state; and
8. non-started result/winner state.

An experiment with sufficient retained evidence becomes `owner_approval_required`, not active. Missing/small-sample evidence remains `needs_more_evidence` or `unavailable`.

## Owner approval boundary
Build 471 never infers approval. Every definition exposes:
- `owner_approval_required: true`;
- `approval_status: not_recorded`;
- `approved: false`;
- null approver/timestamp;
- `activation_authorized: false`; and
- `experiment_started: false`.

Any future activation requires a separate explicit owner decision with bounded duration/allocation and pre-declared success/stop rules.

## Success-measure boundary
Build 471 retains the existing aggregate metric identified by Build 461, but does not invent a target or winner rule. Success threshold, target direction and winner rule remain explicit owner decisions.

Observed booking-stage drops, quote-band resolution and accepted-value deltas remain descriptive evidence. They do not establish price sensitivity, customer motive, discount need, completed work or causation.

## Stop conditions
Every framework definition fails closed if:
- retained evidence becomes unavailable, restricted or materially truncated;
- the retained minimum evidence threshold is no longer met;
- like-for-like comparison windows materially diverge;
- a proposed test would require price, discount, availability, booking-rule, outreach or provider mutation;
- the owner withdraws approval; or
- a material confounder makes the bounded comparison non-comparable.

## Mutation and privacy boundary
Build 471 is read-only. It introduces no:
- automatic experiment activation;
- automatic winner selection;
- price or discount mutation;
- booking-rule, availability or catalogue mutation;
- outreach/follow-up;
- quote acceptance or booking creation;
- payment/refund/provider mutation;
- customer/session/quote identity join;
- schema/storage mutation; or
- permanent polling.

Customer names, emails, raw quote IDs and raw session IDs remain excluded from the framework response.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains authoritative. Source/runtime GREEN means the framework truthfully exposes readiness and owner-decision boundaries; it does not prove an experiment ran or succeeded.

## Acceptance
The exact candidate must pass:
1. Build 471 Booking & Quote Controlled Experiment Framework authority;
2. retained Build 461 experiment-readiness authority;
3. retained Build 451 booking-funnel/quote/pricing-learning authority;
4. retained Build 441 booking/quote/retention-production-learning authority;
5. Current Source Gate;
6. exact feature-preview acceptance;
7. exact accepted-`dev` Development deployment/runtime acceptance;
8. protected-`main` promotion; and
9. independent exact resulting-`main` Production deployment/runtime/business acceptance.

## Next bounded release
**Build 472 — Staff & Mobile Remediation Verification** begins only after Build 471 is independently GREEN on protected `main`.
