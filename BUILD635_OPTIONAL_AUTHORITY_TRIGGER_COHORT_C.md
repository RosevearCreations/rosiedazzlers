# Build 635 — Optional Authority Trigger Queue Relief (Cohort C)

## Purpose
Continue Build 633 and Build 634 GitHub Actions backlog mitigation with 12 additional *non-required* historical evidence/continuity authority workflows. Remove redundant broad `build*` push triggers only. The same checks still execute on pull requests into `dev` and `main`, pushes to `dev` and `main`, and manual workflow dispatch. Keep any more specific branch selector such as `release*` untouched.

## Implemented
- Twelve read-only historical authority workflow definitions across service-economics evidence, staff-mobile remediation evidence, seasonal/public-claim review, reliability-cost evidence, and provider-evidence review now omit `build*` on `on.push.branches` only. No job body, script, assertion, permissions, concurrency, timeout, payment/deployment check, environment, or branch protection change.
- Existing fail-closed `scripts/current_optional_authority_triggers.sh` now runs all three cohort tests from Builds **633**, **634**, and **635**. The protected Current Source Gate suite A already invokes this stable wrapper; it is left unchanged to satisfy repository release hygiene. Suites A–D and aggregate `source checks` remain mandatory.
- New `scripts/build635_optional_authority_cohort_c_test.mjs` checks all twelve workflow headers, protected PR/push/manual triggers, existence of test jobs, and continued Build 633/634/635 regression coverage.
- All changes are packaged into one atomic commit on the Build 635 feature branch to avoid triggering multiple additional rounds of GitHub Actions.

## Release safety
- **No required or non-required workflow is deleted or disabled.** Its redundant feature-branch push event alone is narrowed. PR and protected branch verification remain.
- This does not cancel existing pending workflows, change GitHub billing capacity or guarantee queues drain. It reduces *future* optional runs by up to twelve per broad `build*` push.
- No mobile auto detailing site, price, deposit, booking, availability, Stripe/PayPal, customer information, Supabase, Cloudflare, asset, policy or theme changes.
- Keep Build 634 and 635 together in the existing protected main release if Build 634 has not yet merged; avoid competing main PRs while branches have diverged.

## Acceptance
1. Run `node scripts/build633_optional_authority_triggers_test.mjs`, `node scripts/build634_optional_authority_cohort_b_test.mjs` and `node scripts/build635_optional_authority_cohort_c_test.mjs` through `bash scripts/current_optional_authority_triggers.sh`.
2. Verify all twelve reviewed diffs are confined to the removed `build*` selector; the remaining workflow bodies are identical.
3. Pass exact-head protected GitHub `source checks` suites A–D and the aggregate; never bypass or force protected `main`.
4. After merge, independently confirm Cloudflare Pages project `rosiedazzlers` has **Production SUCCESS for the exact new main SHA**, production branch `main`, Functions enabled, immutable deployment/static/contextual and `https://rosiedazzlers.ca` canonical runtime smoke. HTTP 200 or GitHub merge alone is not GREEN.

## Remaining work
Audit the next optional workflow cohorts only when evidence shows duplicate broad triggers; keep authentication, security, payments, production, provider acceptance, customer consent and operational incident checks untouched.
