# Build 568 — Trusted Provider Staging Integration Readiness & Private Ledger Acceptance

## Scope and truth boundary

Read-only staging **plan** and regression-gated acceptance matrix following Build 567. This build never calls a worker/consent provider, retrieves credentials, creates provider accounts, executes database migrations, sends a worker job, writes customer data, or publishes media. Its executable function cannot return a live staging/production acceptance verdict. The public media/export HOLD is preserved.

Predecessors must independently be Production GREEN in order: Build 562 PR #354, Build 563 PR #355, Build 564 PR #356, Build 565 PR #357, Build 566 PR #360 and Build 567 PR #361. All checks and verified exact Cloudflare production deployments are required before deploying Build 568 code to `dev`/`main`.

## Ordered staging integration runbook

1. **Provider selection and capability review.** Owner names an actual worker identity/signature authority and an actual consent provider, reviews contract formats, account terms, price/free tiers, signing-key rotation, revocation, retention and privacy handling. No provider is inferred.
2. **Credential and separation design.** Confirm independent staging and production environments, service token scopes, Cloudflare Pages scoped secrets, staging-only operator accounts and a no-real-customer-media dataset. Record credential *names only*. Never record token values.
3. **SQL dependency and recovery review.** Inventory Build 562 `sql/2026-10-15_build562_private_acceptance_ledger.sql` and Build 564 `sql/2026-10-15_build564_atomic_private_acceptance_rpc.sql`. Name exact target Supabase project, staging backup, rollback/recovery, RLS/service-role constraints and append-only restrictions. **No automatic SQL execution.**
4. **Authenticated provider validation plan.** Define independent registered-signature and keyed worker verification; consent document validity, derivative-specific scope, expiry, revocation and replay controls. Require identifiable operator-attested test evidence. A mock API or submitted flag is not proof.
5. **Negative-path and ledger tests.** On a separately authorized staging environment, require forged, expired, revoked and cross-scope rejection, unique replay acceptance only on matching scope and digest, conflict rejection, no update/delete, and evidence tracing. Plan tests here, do not run them.
6. **Exact deployment and operator sign-off.** Distinguish source CI/feature preview/dev/production exact-SHA status from real provider capability. Record owner/operator decision, costs, credential scope, security posture, and go/no-go. If any operational evidence is absent, retain HOLD.

## Code deliverable

`assets/daip-staging-integration-readiness-568.js` renders a fixed, non-secret, ordered staging exercise plan. It may record the identifiers of stages whose **paperwork is documented**, but never accepts evidence values or converts that into an externally verified claim. Even all stages being documented cannot set staging or Production acceptance to GREEN.

Regression: `node scripts/daip_staging_integration_readiness_568_test.mjs`. Dedicated workflow `.github/workflows/provider-staging-readiness.yml` validates this contract on the isolated feature branch and its dependent PR.

## Owner approvals required for future live integration

Owner must select both providers, accept fee/permissions/privacy terms, approve staging credentials and a separate operational migration plan with recovery. Any testing that contacts providers, changes secrets, applies SQL or operates on media requires a separate, explicit decision. Until then, **operational readiness = HOLD**, even after code Production GREEN.

See tracking [Issue #363](https://github.com/RosevearCreations/rosiedazzlers/issues/363). The separate hybrid pricing/quote-first redesign remains [planning Issue #364](https://github.com/RosevearCreations/rosiedazzlers/issues/364), with no code or pricing changes.
