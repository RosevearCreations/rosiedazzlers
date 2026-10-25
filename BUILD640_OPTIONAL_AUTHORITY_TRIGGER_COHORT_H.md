# Build 640 — Optional Authority Trigger De-duplication: Cohort H

## Scope

Continue Builds 633–639 with seven historical recovery artifact, drill, authenticated-device closure, evidence freshness and manual-outcome authority workflows. Remove only the broad `build*` feature-branch selector under `on.push.branches` in the files enumerated in `scripts/build640_optional_authority_cohort_h_test.mjs`.

The `recovery-authenticated-device-closure-review-authority.yml` workflow also has a `release*` push selector, which remains intact. All workflows preserve protected `dev`/`main` pushes and pull requests, manual dispatch, complete jobs, permissions, test steps and timeouts.

## Constraints

- No existing queued run is cancelled or deleted by this release.
- No required source check or approval hold is bypassed.
- No recovery operation is initiated or closure decision inferred.
- No customer website, account, database, booking, payment, media or Cloudflare settings are modified.

## Acceptance

1. `bash scripts/current_optional_authority_triggers.sh` passes cohorts 633–640 in fail-closed mode.
2. Required current source-gate A–D and aggregate `source checks` pass on exact protected PR heads.
3. Review and merge focused `dev` and current-`main` PRs without bypassing branch protections.
4. Confirm Cloudflare Pages `rosiedazzlers` Production SUCCESS for final main SHA, immutable deployment URL and public website smoke before reporting GREEN.
