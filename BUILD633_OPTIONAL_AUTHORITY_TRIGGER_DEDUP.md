# Build 633 — Optional Authority Workflow Trigger De-duplication

## Why this build
After Build 632 removed duplicate *Current Source Gate* feature-branch runs, GitHub Actions still had a large backlog of optional historical authority workflows. The repository contains 203 workflow definitions. Build 633 scopes **21 non-required, read-only evidence/decision/continuity workflows** whose broad `build*` push triggers run the same checks a second time when those commits are already submitted to a PR.

## Exact change
For each of the 21 reviewed files in `scripts/build633_optional_authority_triggers_test.mjs`, remove the **broad `build*` branch selector from `on.push.branches` only**. Preserve:
- `dev` and `main` push runs; any `release*` selectors already present;
- `pull_request` checks targeting `dev` and `main`;
- manual `workflow_dispatch`;
- all existing jobs, scripts, test assertions, timeouts, concurrency groups, environment and permissions.

This change is designed to avoid about **21 unnecessary optional workflow runs per broad feature-branch push** once it is on the default branch. It does not cancel or delete jobs already in GitHub's queue and does not change GitHub billing or runner capacity.

## Boundary and safety
1. No required `source checks` suite A/B/C/D or aggregate is disabled, bypassed or downgraded. `Current Source Gate` remains a required PR and protected branch check.
2. No Stripe, Cloudflare, deployment, security, payment, privacy, provider acceptance, backup or recovery workflow is modified by this build.
3. A historic authority workflow still executes when an appropriate PR is opened or updated, on `dev`/`main` pushes and when manually dispatched.
4. No public site, customer booking, pricing, deposit, payment, Supabase, theme or Cloudflare configuration is changed.
5. The 21-workflow regression script is registered in required source-gate suite A to prevent trigger drift.
6. The workflow contents after the event header are byte-identical to their previous versions; only an obsolete redundant event selector is removed.
7. The branch contains one atomic commit to prevent 21 extra waves of queued CI work while making the change.

## Verification
- `node scripts/build633_optional_authority_triggers_test.mjs`
- Compare all 21 updated workflow headers and ensure PR/dev/main/manual and every job body remain intact.
- Verify source-gate suites A–D and aggregate all succeed for exact release head SHA; check actual failures rather than treating queue delay as a test failure.
- Merge feature branch to `dev`, then promote a focused main-from-main release if histories diverge; do not force or bypass protected `main`.
- Verify resulting `main` SHA has Cloudflare Pages Production SUCCESS in project `rosiedazzlers`, matching immutable deployment metadata plus canonical site smoke. A GitHub merge or HTTP 200 alone is insufficient for GREEN.

## Remaining queue work
Review other optional historical workflows in small evidence-backed batches using their ownership, trigger duplication, required-check status, and appropriate path filters. Do not deactivate a real compliance, safety, security, payment, or provider acceptance requirement just to reduce GitHub minutes.
