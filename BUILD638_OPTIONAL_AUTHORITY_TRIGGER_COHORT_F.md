# Build 638 — Optional Authority Trigger De-duplication: Cohort F

## Intent

Continue the limited CI queue-relief program from Builds 633–637. Seven historical, non-required authority workflows covering maintenance/fleet planning, booking/quote experiments, service-economics review and production learning retain all their jobs and tests but cease reacting to every `build*` branch push.

## Boundaries

- Only the `build*` branch selector under `on.push.branches` is removed from seven workflows listed in `scripts/build638_optional_authority_cohort_f_test.mjs`.
- Protected `dev` and `main` pushes, pull requests to those branches and manual dispatch stay enabled.
- Existing test commands, concurrency, permissions, timeouts, job bodies and workflow path filters (if present) stay untouched.
- No customer-facing page, bookings, pricing, payments, database, secrets, Cloudflare settings or production gates change.
- No queued workflow runs are cancelled. Do not interpret fewer optional feature-push runs as authorization to skip required status checks.

## Acceptance

1. `bash scripts/current_optional_authority_triggers.sh` passes all six cohorts under fail-closed shell mode.
2. The current protected source-gate suite A–D and aggregate `source checks` run and pass on the exact PR head.
3. Merge feature work through a protected PR to `dev`; promote only the approved files via a separate current-main-based protected PR if branches diverge.
4. Confirm Cloudflare Pages `rosiedazzlers` Production `SUCCESS` for the final `main` SHA with Functions enabled and smoke-test `https://rosiedazzlers.ca`. A passing GitHub merge alone is not Production GREEN.
