# Build 644 — Optional Authority Trigger De-duplication: Cohort L

## Scope

Continue Builds 633–643 with seven historical booking quote/vehicle, release documentation convergence, payment month-end, performance, photo-studio reliability and repository cleanup authority workflows. Remove only the broad `build*` feature push selector under `on.push.branches`. Exact workflow identities and trigger invariants are checked by `scripts/build644_optional_authority_cohort_l_test.mjs`.

Protected `dev`/`main` pushes, PR validation, manual dispatch, jobs, runners, permissions, and existing path filters are preserved.

## Safeguards

- No required source gate, release guard, booking/payment authorization or service policy is bypassed.
- Existing queued jobs are not cancelled. Only redundant future feature-branch push triggers are narrowed; PR validation remains.
- No customer-facing UI, pricing, booking, payment state, database, provider, R2, Cloudflare configuration or other runtime behavior changes.
- `scripts/current_optional_authority_triggers.sh` includes cohorts 633–644 and is called by the protected source gate.
- Require required source suites A–D and aggregate success at both protected PRs, followed by exact-SHA Cloudflare Production deployment and live health verification before declaring GREEN.
