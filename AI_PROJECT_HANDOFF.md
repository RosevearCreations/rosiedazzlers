# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived gate/deployment evidence remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 332 — Durable Maintenance Vehicle Identity Preference**.
- Exact accepted SHA: `53efa5d2b616ab0694a5ea9e3165119856b15953`.
- At active-work start, `dev == main` on that exact SHA.
- Active work: **Build 333 — Authenticated Booking Vehicle Persistence**.
- Active branch: `build333-authenticated-booking-vehicle-persistence`.
- No database migration is introduced. This release consumes the already-live nullable booking customer/profile and saved-vehicle identity authorities.

## Why this scope is active

The booking wizard already lets a signed-in customer choose a saved garage vehicle, but checkout discards that identity and stores only the vehicle snapshot. The customer session is HttpOnly and server-resolved, and saved-vehicle APIs are already profile-scoped, so checkout can now persist durable identity prospectively without trusting a browser-supplied profile ID.

## Active operating contract

- Guest checkout remains valid with `customer_profile_id = null` and `customer_vehicle_id = null`.
- When a valid customer session exists, checkout derives `customer_profile_id` from that server-resolved session. A browser-supplied profile ID is rejected.
- The existing garage picker emits only an untrusted saved-vehicle selector. The selector grants no ownership authority by itself.
- A selected saved vehicle may be persisted only after the server reloads `customer_vehicles` using both the selected vehicle UUID and the authenticated profile UUID.
- Anonymous saved-vehicle selection, cross-profile selection and conflicting selectors fail closed.
- If an authenticated customer books without choosing a saved vehicle, the trusted profile may still be persisted while `customer_vehicle_id` remains null.
- The booking-only selector bridge clears stale state on page entry and clears selection when year/make/model/size is manually changed.
- No historical booking is backfilled or mutated.
- No customer vehicle is automatically created or edited during checkout.
- Pricing, package/add-on authority, booking status, slot capacity, payment settlement, membership and recurring scheduling remain unchanged.

## Release procedure

1. Feature exact SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
2. No schema application is required for this release.
3. Fast-forward `dev` with `force=false`; require source authorities plus Cloudflare Development Acceptance on the identical SHA.
4. Only after Development is GREEN, fast-forward `main` with `force=false`.
5. Require source authorities plus Cloudflare Production deployment on that exact SHA.
6. Verify `dev == main`; only then call the release GREEN/closed.

## Durable authorities

- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/booking-vehicle-identity-authority.yml` — durable booking/saved-vehicle identity boundary, now including authenticated checkout ownership proof.
- `scripts/booking_vehicle_identity_check.py` — schema, staff-linkage, checkout ownership and selector safety source authority.
- `scripts/checkout_customer_vehicle_identity_test.mjs` — executable guest/authenticated/cross-profile injection behavior proof.
- `scripts/maintenance_retention_check.py` and `scripts/vehicle_maintenance_rules_test.mjs` — durable maintenance identity consumption.
- `.github/workflows/maintenance-retention-followup-authority.yml` — accepted retention follow-up authority.
- `.github/workflows/fleet-account-pipeline-authority.yml` — fleet intake/pipeline authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- Existing payment, Production-readiness, rollback/recovery, booking funnel, responsive UX and SEO authorities remain cumulative.

## Public/SEO and help contracts

Every sitemap public page retains one meaningful H1, valid metadata/canonical/robots/structured data, and responsive behavior. Authenticated admin pages remain `noindex`. Admin work screens must include useful operating help, safe loading/error/empty states and must never expose server secrets.

## Restart point

If interrupted during active work, verify `build333-authenticated-booking-vehicle-persistence`, inspect the first failing source/identity/Cloudflare authority, and continue there. Do not weaken the server-session ownership boundary to make a selector pass, and do not add a schema migration unless read-only evidence proves one is actually required.
