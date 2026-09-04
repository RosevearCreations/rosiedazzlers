# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 333 — Authenticated Booking Vehicle Persistence**.
- Exact accepted SHA: `c87c66786be8d24a1883109f6f84efa4ed3f6a84`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 334 — Durable Completed-Service Vehicle History Sync**.
- Active branch: `build334-durable-vehicle-service-history-sync`.
- No database migration is introduced; the live `customer_vehicles` history fields already exist.

## Why this scope is active

Authenticated checkout can now establish a durable booking→saved-vehicle identity, and maintenance readers prefer that identity. The remaining lifecycle gap is post-service: authoritative staff completion marks the booking complete but does not copy verified service facts back to the owned garage vehicle.

## Active operating contract

- Synchronization runs only after the authoritative detailer completion transition has successfully stored `job_status = completed`.
- The booking must carry both `customer_profile_id` and `customer_vehicle_id`.
- The saved vehicle is reloaded using both IDs; missing or mismatched ownership fails closed and leaves the garage vehicle unchanged.
- No year/make/model/plate heuristic may substitute for the durable link.
- Completion may update only factual service history: `last_package_code`, normalized `last_addons`, and non-regressing `mileage_km`.
- `last_wash_at` advances only for `premium_wash`, `complete_detail`, or `exterior_detail`, which are the current packages containing an exterior hand wash.
- A lower/invalid booking mileage never overwrites a higher saved-vehicle mileage.
- Completion may not write `service_interval_days`, `next_cleaning_due_at`, `next_service_mileage_km`, or `auto_schedule_opt_in`.
- No saved vehicle is created, no historical booking is backfilled, and no payment, price, membership, schedule, or appointment state is changed.
- The completion event records the vehicle-history sync outcome so ancillary sync failure is visible without reversing legitimate completed work.

## Release procedure

1. Feature exact SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
2. No schema application is required.
3. Fast-forward `dev` with `force=false`; require exact-SHA source authorities plus Cloudflare Development Acceptance.
4. Only after Development is GREEN, fast-forward `main` with `force=false`.
5. Require source authorities plus Cloudflare Production deployment on that exact SHA.
6. Verify `dev == main`; only then call the release GREEN/closed.

## Durable authorities

- `.github/workflows/development-source-gate.yml` — cumulative source authority, including booking completion/retention checks.
- `.github/workflows/booking-vehicle-identity-authority.yml` — durable identity authority through checkout and completed-service vehicle synchronization.
- `scripts/booking_vehicle_identity_check.py` — schema, staff linkage, authenticated checkout, durable completion ownership and no-migration guard.
- `scripts/customer_vehicle_service_history_test.mjs` — executable completion/history behavior proof.
- `scripts/booking_completion_retention_check.py` — payment-return/signoff separation plus authoritative completion sync contract.
- Existing maintenance, fleet, payment, Production-readiness, rollback/recovery, booking UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted during active work, verify `build334-durable-vehicle-service-history-sync` and inspect the first failing completion/identity/source/Cloudflare authority. Never make completion history synchronization depend on snapshot identity heuristics, and never write staff-owned scheduling fields from job completion.
