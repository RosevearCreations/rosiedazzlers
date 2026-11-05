# Build 779 — Legacy Recovery Dependency Optimization, CI Phase IV and Independent Custody Exception Decision Register

## Original-source custody decision register (read-only)

The owner navigation links to
`/admin-economic-owner-followthrough-v776.html#custody-decision-register779`.
Only an authenticated owner-session `POST /api/admin/economic_custody_exception_register_v779`
may request a fresh register. Ten original signed owner envelopes are reverified
through the full original Build 776 chain, then current Build 777 expiry and
Build 778 renewal exception reports are both computed by the server at one
server clock instant. Client-provided readiness, expiry, owner consent and
precomputed reports are never trusted.

The unsigned read-only response contains three distinct external decision rows:

1. Original owner — a separate authentic signed owner decision remains pending.
2. Independent custodian — current review, renewal due or an expired/stale/conflicting source HOLD.
3. Independent exception issuer — signed source exceptions must remain reconciled; a zero-open-exception claim is not an external dispute closure.

It verifies the predecessor packet digests, retained-source digest and original
custody register/receipt links. A mismatch, missing issuer, reopened exception,
stale observation, expired witness or invalid owner chain preserves HOLD.
The downloaded packet is an **unsigned local review summary**, not an issuer
signature or a persistent register. No SQL, append-only audit, source-retention
change, custodian renewal, owner consent, email/SMS dispatch, business closure,
schema migration or automatic external workflow is executed.

## Legacy recovery dependency runtime

The Build 778 follow-up identified the exponential re-running of nested older
recovery/device source checkers. Build 779 opts **ten more optional legacy
recovery/device authority jobs** into the existing GitHub-runner exact-SHA,
success-only source-test memoization. It uses `GITHUB_ACTIONS`, `GITHUB_SHA`
and a runner-local temp directory. Every distinct test still runs; failures,
missing cache entries, environment overrides and unsupported subprocesses
fall back to actual execution. Nothing is reused between commit SHAs, CI jobs,
developer machines or different workflow runs. Required suite A-D, aggregate
source gate and Production Business Acceptance remain unconditional and unchanged.

The existing Build 520 standalone authority was measured locally at around
11 seconds with the same CI-only cache. The Build 779 recovery cohort requires
new CI timings to measure savings; timing alone is not evidence of accepted
original-source recovery or business sign-off.

## Phase IV queue reduction

Build 779 adds domain-specific `push`/`pull_request` path filters to **20 further
optional** booking/recovery, staff/mobile, reliability and service-economics
authority workflows. Phases I–IV now cover 81 optional legacy workflows
(21 + 20 + 20 + 20). Each retains original branch selectors, jobs, permissions,
`workflow_dispatch` and triggers for its own YAML, shared auth/middleware,
source release contract, source-test cache and common style source. Editing
the workflow YAMLs necessarily causes this first promotion to run many of
the changed workflows; real run-count reduction must be measured on a future
unrelated promotion. No required security/recovery/business/Cloudflare/
Production exact-SHA check is path-suppressed.

Regression contracts:

- `node scripts/build779_custody_decision_register_test.mjs`
- `node scripts/build779_ci_queue_optimization_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`

The release can be declared Production GREEN only when the final exact `main`
commit passes required source A-D/aggregate, Production business acceptance,
Cloudflare deployment, exact-SHA Production checks and release health.
Independent signed custody renewal and original-owner decisions remain
external HOLDs even when deployment is GREEN.
