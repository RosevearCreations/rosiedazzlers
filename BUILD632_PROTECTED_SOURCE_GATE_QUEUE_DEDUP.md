# Rosie Dazzlers — Build 632: Protected Source-Gate Queue De-duplication

## Problem observed
The public repository uses more than 200 GitHub Actions workflows. An API inspection on 2026-10-24 reported 795 queued runs and 37 in-progress runs, many initiated for `build*` feature-branch pushes. The required `Current Source Gate` workflow also ran four source-check suites for feature-branch push **and** for the corresponding pull request, creating redundant checks for every incremental edit. GitHub still rightfully refuses to merge to protected `main` without the exact head commit's passing aggregate `source checks`.

## Safe change
- Remove the **redundant feature-branch push** trigger from `.github/workflows/development-source-gate.yml`. Preserve pushes to `dev` and `main`, PRs targeting either protected branch, and manual `workflow_dispatch`. This suppresses four runner jobs for each feature-branch edit, while the required source gate executes on its reviewed PR and protected targets.
- For `pull_request` source-gate events, group concurrency by **PR number**, not each commit SHA; cancel superseded queued/in-progress runs only for old versions of that same PR. The latest PR commit receives its own required fresh checks. Push events to `main` and `dev` are explicitly **not cancelled**.
- Keep all four `source checks suite A–D` jobs and the `source checks` aggregate. The aggregate depends on all four and runs even if any fails; it may report success only when **all** four passed. Never weaken it to a no-op.
- Add a self-test `scripts/build632_source_gate_dedup_test.mjs` to source suite A. It guards the critical branches, trigger conditions, concurrency policy, suite names and aggregate dependencies. It also requires the Build 631 review tests and repaired Build 339 and Build 404 legacy gates.

## What this does not do
- It does **not** delete user-approved HOLDs, ignore a failing safety or payment test, remove protected `main` rules, or force a merge.
- It does **not** retroactively cancel hundreds of already queued optional workflows. Other workflow definitions may continue to run for feature branches; subsequent batches can be triaged by workflow owner and path filters, retaining meaningful acceptance evidence.
- It cannot change GitHub-hosted runner capacity or repository billing limits. The queue can persist until GitHub schedules jobs, even after this change.
- It does **not** modify prices, Stripe/PayPal, booking availability, deposits, customer data, Supabase or Cloudflare configuration.

## Required verification
- Run `node scripts/build632_source_gate_dedup_test.mjs`.
- Review the candidate's `Current Source Gate`: source suites A, B, C, D and aggregate must all **succeed** for the **latest PR head SHA**.
- Verify `dev` and `main` push workflows still execute; a newer PR commit may cancel older PR runs by design, but must not cancel default-branch pushes.
- Promote via protected PR/auto-merge. If `dev`/ `main` ancestry is divergent, reconcile only the approved Builds 631–632 changes in a focused release branch from current `main`.
- Confirm exact resulting `main` SHA against authenticated Cloudflare Pages Production deployment ID and build-success state, project `rosiedazzlers`, production branch `main`, Functions enabled, immutable preview and canonical `https://rosiedazzlers.ca` static/contextual smoke. A GitHub merge alone is never GREEN.

## Remaining operations
Classify older independent workflow events by current business importance and artifact paths; where a review is non-required and redundant, prefer narrow `paths` triggers or manual dispatch over all-feature-branch execution. Never remove an actual required status or block meaningful release validation. Confirm scheduling/runner capacity from GitHub Actions administration if a queue remains idle.
