# Build 643 — Optional Authority Trigger De-duplication: Cohort K

## Scope

Continue Builds 633–642 with seven historical winter booking, quote rule, evidence freshness/integrity and weather-safe controlled-environment routing authority workflows. Remove only the broad `build*` feature push selector under `on.push.branches`; the exact list is tested in `scripts/build643_optional_authority_cohort_k_test.mjs`.

Protected `dev`/`main` push events and pull-request checks, manual workflow dispatch, jobs, runners, permissions, timeouts and all business-rule checks remain unchanged.

## Safeguards

- Winter booking eligibility, quote rules, customer transparency, weather limits, provider and owner HOLDs remain authoritative.
- This does not activate a seasonal service, change a customer booking, authorize a quote or initiate a recovery action.
- No existing queued workflow runs are cancelled; only future redundant feature-branch push triggers are narrowed.
- No customer-facing UI, booking, payment, schema, provider or Cloudflare settings change.
- The fail-closed `scripts/current_optional_authority_triggers.sh` runs cohorts 633–643.
- Protected source gates A–D and aggregate must pass on exact PR head before dev/main merge; verify exact Cloudflare Production commit and site health before GREEN.
