# Build 636 — Optional Authority Trigger Queue Relief, Cohort D

## Intent
Continue the targeted, non-destructive GitHub Actions efficiency work begun in Builds 632–635. Before this build, GitHub's queued Actions count had dropped to one run, and Build 635 exact-main Cloudflare Production GREEN was verified. The objective is to prevent a recurrence of redundant broad feature-branch runs while keeping all meaningful compliance, booking, provider and security checks.

## Changes
Twelve older evidence/readiness/decision authority workflows now omit only the broad `build*` selector from `on.push.branches`. Those exact workflow filenames are enumerated in `scripts/build636_optional_authority_cohort_d_test.mjs`. All workflows retain `dev` and `main` push runs, pull-request checks into `dev` and `main`, manual `workflow_dispatch`, and any pre-existing `release*` selector. Their job definitions, permissions, test commands, timeouts and concurrency behavior remain byte-for-byte unchanged.

The stable, fail-closed `scripts/current_optional_authority_triggers.sh` now runs all **four** cohort regression scripts from Builds 633, 634, 635 and 636. The existing required Current Source Gate already invokes this wrapper, and **its workflow YAML is not modified by Build 636**. All four suites A–D and the `source checks` aggregate remain required.

All Build 636 changes are created in a single Git commit to avoid generating an additional Actions run on every edited workflow file. No runtime files for `rosiedazzlers.ca` are changed.

## Release and privacy boundaries
- No removal or bypass of a required or optional job. Only a redundant `build*` push event is removed from twelve non-required historical workflows.
- Preserve Production Cloudflare Pages and exact-commit verification; no changes to security, payments, prices, booking slots, provider identities, deployment configurations, database migrations, customer details, themes or quote approval.
- This does not retroactively cancel queued workflows or change GitHub's runner or billing quota. The expected benefit is **up to twelve fewer redundant optional workflow triggers per broad feature-branch push**, once this code is merged into protected `main`.
- Review the existing feature-branch accepted diff: exactly twelve event-header-only workflow changes, one source wrapper, one new regression script, and this document.

## Acceptance
1. Run `bash scripts/current_optional_authority_triggers.sh` or the four corresponding Node tests, including `node scripts/build636_optional_authority_cohort_d_test.mjs`. Verify all 12 retained triggers and the full job bodies.
2. Confirm unchanged Current Source Gate suites A–D and fail-closed `source checks` aggregate on the exact PR commit.
3. Merge to `dev` with ordinary PR review. As dev/main are historically divergent, use a focused main-from-main release with no unrelated dev tree changes.
4. Await protected `source checks` GREEN and auto-merge without bypassing protections.
5. Independently verify GitHub Production Business Acceptance and Cloudflare Pages project `rosiedazzlers` successful **exact resulting main SHA** Production deployment, Functions metadata, immutable-deployment smoke and `https://rosiedazzlers.ca` canonical runtime/contextual smoke.
6. Do not call Build 636 Production GREEN from GitHub merge or HTTP success alone.

## Next work
The GitHub Actions backlog has recovered. Prioritize customer-visible application function and live booking/browser acceptance in later builds rather than indiscriminately narrowing any workflow that is a real required security, financial or operational gate.
