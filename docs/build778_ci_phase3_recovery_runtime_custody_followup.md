# Build 778 — CI Phase III, Recovery Runtime and Custody Renewal Exception Follow-Up

## Release boundary

Build 777's signed original-source custody expiry review remains intact. Build 778 adds
**a separate read-only follow-up** at `/admin-economic-owner-followthrough-v776.html#custody-renewal-followup778`.
After the owner provides ten original signed JSON envelopes, the owner-session-only
`POST /api/admin/economic_retention_renewal_followup_v778` re-fetches the entire
Build 776 original issuer chain and derives a new Build 777 expiry assessment at server
time. The Build 778 helper classifies the independently derived report:

| Classification | Required follow-up |
| --- | --- |
| `CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING` | Separate original owner/custodian decision is still required |
| `MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS` | Manually inspect the original signed expiry, without extending it |
| `HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED` | Obtain independent new signed custody proof and owner review |
| `HOLD_SIGNED_SOURCE_OBSERVATION_STALE` | Obtain fresh original-source signed observation |
| `HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT` | Resolve original signer/digest/chain conflict; do not infer readiness |

The returned digest is an **unsigned local review packet**. It cannot approve
original owner closure, renew/extend original custodian expiry, close independent
disputes, send messages, write a database or append audit records, or modify or
delete retained-source history. GET reports only HOLD and the owner's session
must be valid. POST rejects cross-origin and oversized envelopes.

## CI backlog runtime optimisation

Phase I path-scoped 21 optional legacy authority workflows; Phase II scoped 20
more. Phase III scopes another **20 optional recovery, authenticated-device and
staff-mobile domain authority workflows** on their original `push` and
`pull_request` branches. All original jobs and `workflow_dispatch` remain
available, including manual reruns when evidence requires them. Each watched
workflow file, common staff-auth/middleware, source release check, CI source
cache and theme source remain trigger paths. The workflow-file edits themselves
intentionally trigger all 20 during this release.

The protected `Current Source Gate` suite A-D + aggregate `source checks`
continues to run unconditionally on every `dev` and `main` push and PR.
The old Build 520 standalone recovery workflow was repeatedly invoking
its own older recovery/device source tests in a nested subprocess tree.
Its job now opts into the existing CI-only exact-SHA success memoization
(`ROSIE_CI_DEDUP_SUBCHECKS=1`); every distinct check still executes, failures
are never cached, and manual dispatch retains the full test coverage.
The required suite B-D recovery tests remain unchanged, together with
Production Business Acceptance, Cloudflare Development Acceptance,
Release Health and exact-Production verification. This reduces duplicated
**optional** runner time on unrelated changes; it does not skip, shorten or
claim to accelerate a required recovery assertion. Verify measured Actions
run counts and elapsed durations after a subsequent unrelated PR/merge.

The phase III contract checks check this boundary with
`node scripts/build778_ci_recovery_runtime_test.mjs`, and the owner follow-up
with `node scripts/build778_renewal_followup_test.mjs`. Both are included in
the cumulative booking/source regression entry point. Any newly required
branch-protection check must be reassessed before filtering its trigger.

## Production acceptance

Release code is GREEN only after approved PRs reach `dev` then `main`, the exact
`main` SHA passes `source checks`, business acceptance, Cloudflare deployment
and exact-SHA/health checks. This status does **not** certify external custodian
renewal or original-owner approval. Real issuer evidence missing, stale or
conflicting is still **HOLD**.
