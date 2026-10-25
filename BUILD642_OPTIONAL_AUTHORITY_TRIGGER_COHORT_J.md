# Build 642 — Optional Authority Trigger De-duplication: Cohort J

## Scope

Continue Builds 633–641 with seven non-required historical service commercial accuracy, add-on allocation, maintenance/fleet pilot, seasonal capability, cold-weather and controlled-environment operational authority workflows. Remove only the broad `build*` feature push selector from `on.push.branches`; exact files are enforced by `scripts/build642_optional_authority_cohort_j_test.mjs`.

Protected `dev`/`main` push events and pull-request checks, `workflow_dispatch`, jobs, runners, permissions, timeouts and existing path filters remain intact. The commercial-accuracy path filter is explicitly regression checked.

## Safeguards

- No required source check, customer safety gate, winter eligibility rule, owner decision, payment or production release authority is weakened.
- No queued jobs are cancelled by this change; only future redundant feature-branch push triggers are narrowed.
- No customer-facing page, booking, pricing, schema, provider setting, Cloudflare configuration or database is changed.
- The fail-closed `scripts/current_optional_authority_triggers.sh` runs cohorts 633–642.
- Merge protected `dev` and `main` PRs only after required source A–D and aggregate success; verify the exact Cloudflare production commit and live health before GREEN.
