# Build 641 — Optional Authority Trigger De-duplication: Cohort I

## Scope

Following Builds 633–640, narrow seven historical optional backup/recovery evidence, reliability/security/cost reassessment, provider-HOLD review and support-exception workflows. The exact file set is enforced in `scripts/build641_optional_authority_cohort_i_test.mjs`.

Only the broad `build*` selector under `on.push.branches` is removed. Protected `dev` and `main` push and pull-request events, `workflow_dispatch`, job bodies, permissions, tests, runners and timeouts remain intact.

## Safety and release contract

- No required status check, owner approval, provider HOLD, recovery decision, exception handling or audit authority is bypassed.
- Existing queued runs are not cancelled by this change.
- No customer site, auth, booking, pricing, payment, database, media, provider or Cloudflare setting changes.
- The fail-closed `scripts/current_optional_authority_triggers.sh` runs cohorts 633–641 under the protected source gate.
- Merge scoped current-base PRs to `dev` and `main` only after source suites A–D plus aggregate pass; verify exact Cloudflare deployment SHA and live site health before GREEN.
