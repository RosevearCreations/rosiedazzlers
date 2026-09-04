# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 331 — Durable Booking Vehicle Identity**.
- Exact accepted SHA: `491b79da69f1f23a0b733cf9e6a34159811715de`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 332 — Durable Maintenance Vehicle Identity Preference**.
- Active branch: `build332-durable-maintenance-vehicle-identity`.
- No database migration is introduced. This release consumes the already-accepted nullable `bookings.customer_vehicle_id` authority.

## Why this scope is active

The booking schema and staff workbench now provide a durable booking→saved-vehicle link, but the maintenance/reminder reader still reconstructs every completed booking from snapshots first. That leaves the strongest identity authority unused and can allow a later year/make/model or plate heuristic to compete with an explicit staff-confirmed link.

## Active operating contract

- Completed-booking reads must include `customer_vehicle_id`.
- When `customer_vehicle_id` is present, maintenance identity must resolve that saved vehicle first and may not substitute a snapshot/plate heuristic.
- The linked saved vehicle must be found inside the booking customer's own saved-vehicle set. A missing/mismatched durable link fails closed as `booking_vehicle_link_invalid`.
- A valid durable link is reliable authority with source `booking_vehicle_link`.
- Durable and legacy-unlinked evidence for the same saved vehicle share the same internal saved-vehicle key and converge into one maintenance history.
- If any grouped history contains valid durable evidence, its reported identity source is upgraded to durable authority and is never downgraded by later heuristic rows.
- Unlinked legacy bookings retain the accepted fallback order: unique saved-vehicle snapshot match, then opaque plate identity, then isolated/unreliable history.
- Invalid or ambiguous identity remains ineligible for maintenance reminders through the existing `vehicle_identity_required` fail-closed path.
- No booking, quote, schedule, payment, membership or recurring-billing state is changed by this release.
- No historical rows are automatically linked or mutated.

## Release procedure

1. Feature exact SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
2. No schema application is required for this release; verify the accepted booking vehicle column remains present before promotion if database evidence is needed.
3. Fast-forward `dev` with `force=false`; require source authorities plus Cloudflare Development Acceptance on the identical SHA.
4. Only after Development is GREEN, fast-forward `main` with `force=false`.
5. Require source authorities plus Cloudflare Production deployment on that exact SHA.
6. Verify `dev == main`; only then call the release GREEN/closed.

## Durable authorities

- `.github/workflows/development-source-gate.yml` — cumulative source authority; runs the vehicle-aware maintenance behavior suite.
- `scripts/maintenance_retention_check.py` and `scripts/vehicle_maintenance_rules_test.mjs` — durable maintenance identity, cadence and fail-closed contracts.
- `.github/workflows/booking-vehicle-identity-authority.yml` — accepted booking/saved-vehicle schema and staff-linkage boundary.
- `.github/workflows/maintenance-retention-followup-authority.yml` — accepted retention follow-up authority.
- `scripts/fleet_maintenance_planning_check.py` — saved-vehicle planning authority.
- `.github/workflows/fleet-account-pipeline-authority.yml` — fleet intake/pipeline authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- Existing payment, Production-readiness, rollback/recovery, booking funnel, responsive UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted during active work, verify `build332-durable-maintenance-vehicle-identity`, inspect the first failing source/identity/Cloudflare authority, and continue there. Do not auto-link historical bookings. Prospective saved-vehicle persistence at checkout remains a separate future slice and must prove authenticated ownership server-side before any browser-supplied vehicle UUID can be trusted.
