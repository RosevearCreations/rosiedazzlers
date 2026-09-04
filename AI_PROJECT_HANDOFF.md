# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 330 — Maintenance Retention Review & Follow-up**.
- Exact accepted SHA: `89aeab07d9e8f88fa020e3713649e21aa4a4a875`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 331 — Durable Booking Vehicle Identity**.
- Active branch: `build331-durable-booking-vehicle-identity`.
- This release introduces one additive nullable booking schema field plus its foreign key/index; database migration and acceptance are controlled separately from source promotion.

## Why this scope is active

Maintenance and retention can now operate staff follow-up safely, but completed booking history still reconstructs vehicle identity from year/make/model/size or plate evidence. The durable authority should be the saved `customer_vehicles.id` when staff can prove which saved vehicle belongs to the booking customer profile.

The live database currently contains one booking, one saved vehicle and zero completed bookings, so there is no historical Production data that should be auto-linked during migration.

## Active operating contract

- `bookings.customer_vehicle_id` is nullable so guest and unresolved legacy bookings remain valid.
- The column references `customer_vehicles(id)` and uses `ON DELETE SET NULL`.
- A booking cannot carry a saved-vehicle link without an existing `customer_profile_id`.
- No migration-time historical auto-backfill is allowed.
- Staff linkage requires `manage_bookings` authority and an explicit booking UUID plus saved-vehicle UUID.
- Before linking, the server must load both records and verify `customer_vehicles.customer_profile_id == bookings.customer_profile_id`.
- Staff may clear an incorrect link without changing customer/profile ownership.
- The identity workflow must not change booking status, job status, service date/slot, price, quote state, payment state, membership state or recurring scheduling.
- Anonymous public checkout must not trust a browser-supplied saved-vehicle UUID. Automatic prospective linkage is deferred until authenticated ownership can be proved server-side.
- The staff surface is `/admin-booking-vehicle-identity.html`.
- The dedicated Booking Vehicle Identity Authority must remain release-number-independent and GREEN on feature, `dev`, and `main`.

## Release procedure

1. Feature exact SHA must pass Current Source Gate, Booking Vehicle Identity Authority and Cloudflare feature deployment.
2. Apply the additive database migration only as a separate deliberate schema step, then verify column, FK, check constraint and index with read-only SQL.
3. Fast-forward `dev` with `force=false`; require source authorities plus Cloudflare Development Acceptance on the identical SHA.
4. Only after Development is GREEN, fast-forward `main` with `force=false`.
5. Require source authorities plus Cloudflare Production deployment on that exact SHA.
6. Verify `dev == main`; only then call the release GREEN/closed.

## Durable authorities

- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/booking-vehicle-identity-authority.yml` — durable booking/saved-vehicle identity boundary.
- `scripts/booking_vehicle_identity_check.py` — schema/API/admin safety contract.
- `.github/workflows/maintenance-retention-followup-authority.yml` — accepted retention follow-up authority.
- `scripts/maintenance_retention_check.py` — vehicle-aware reminder authority.
- `scripts/fleet_maintenance_planning_check.py` — saved-vehicle planning authority.
- `.github/workflows/fleet-account-pipeline-authority.yml` — fleet intake/pipeline authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- Existing payment, Production-readiness, rollback/recovery, booking funnel, responsive UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted during active work, verify `build331-durable-booking-vehicle-identity`, inspect the first failing source/identity/Cloudflare authority, and continue there. Do not auto-link historical bookings, and do not treat source promotion as database migration authorization.
