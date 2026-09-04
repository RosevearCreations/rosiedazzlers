# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived release artifacts remain the historical implementation record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted/synchronized release: **Build 326 — Booking Completion + Retention/Rebooking Lifecycle**.
- Exact accepted SHA: `3f3cf6a6c109b99a82bfb8bf38ebd62856908b4f`.
- At the active-work start boundary, both `dev` and `main` were exactly that SHA.
- Active work: **Build 327 — Vehicle-Aware Maintenance & Fleet Rules**.
- Active branch: `build327-vehicle-aware-maintenance-fleet`.
- The active scope is application/business-rule work and introduces no database migration.

## Why this scope is active

The maintenance reminder engine already supports interest capture, reminder candidates and staff readiness while correctly blocking automatic enrollment, recurring billing and appointment creation. Review of the current reminder helper found one material fleet/household defect: completed-service history was grouped by customer profile/email rather than by vehicle.

That allowed multiple vehicles owned by one customer to share inferred cadence and Complete Detail eligibility, and customer-wide reminder history could suppress a different vehicle. The active work makes those authorities vehicle-specific without enabling automatic scheduling or billing.

## Active operating contract

- Maintenance interest/waitlist state remains customer-level.
- Completed-service history is grouped by a reliable vehicle identity before eligibility or cadence is calculated.
- A unique normalized year/make/model/size match to `customer_vehicles` uses that saved vehicle UUID as the stable authority.
- When no unique saved vehicle can be resolved, a normalized booking plate may identify the vehicle internally; raw plate text is never returned in reminder keys or notification payloads.
- If neither a unique saved vehicle nor a usable plate exists, that booking history is isolated and reminder eligibility fails closed with `vehicle_identity_required` rather than blending uncertain vehicles.
- Complete Detail eligibility is vehicle-specific.
- Inferred cleaning cadence is vehicle-specific. A staff-owned `customer_vehicles.service_interval_days` override takes precedence; the customer profile/plan cadence is fallback only.
- A staff-owned `customer_vehicles.next_cleaning_due_at` value is the vehicle-level due-date override.
- Customer writes remain blocked from `next_cleaning_due_at`, `next_service_mileage_km`, `service_interval_days` and `auto_schedule_opt_in`.
- Reminder history is keyed by an opaque vehicle key. New Vehicle A reminders do not suppress Vehicle B.
- Legacy reminder events without a vehicle key are treated only as compatibility evidence until a vehicle-specific reminder exists.
- Rebooking continues to carry only safe package/vehicle-size/service choices already supported by the booking flow; it does not carry payment secrets or expose plate data.
- `auto_schedule_opt_in` remains informational only in this scope: no automatic appointment creation is introduced.

## Current release procedure

A RosieDazzlers release is not GREEN merely because its feature code exists.

1. Start the feature branch from the exact prior synchronized GREEN SHA.
2. Require exact-SHA Current Source Gate success on the feature branch.
3. Require Cloudflare feature deployment/runtime evidence on that same SHA.
4. Fast-forward `dev` to that identical SHA; never force or synthesize history.
5. Require exact-SHA Current Source Gate plus Cloudflare Development Acceptance on `dev`.
6. Only after Development is GREEN, fast-forward `main` to the identical SHA.
7. Require exact-SHA Current Source Gate plus Cloudflare Production deployment on `main`.
8. Verify `dev == main`; only then call the release GREEN/closed and select the next scope.
9. Source promotion never authorizes a database migration. Schema work has its own migration/acceptance boundary.

## Durable release authorities

- `.github/workflows/development-source-gate.yml` — cumulative current-source authority.
- `scripts/maintenance_retention_check.py` — maintenance interest-only boundary plus vehicle/fleet reminder authority.
- `scripts/vehicle_maintenance_rules_test.mjs` — executable household/fleet separation and fail-closed identity evidence.
- `scripts/booking_funnel_device_check.py` — aggregate funnel/device/privacy authority.
- `scripts/booking_wizard_responsive_ux_check.py` — responsive/touch/focus/route-parity authority.
- `scripts/booking_completion_retention_check.py` — payment-completion boundary, provider verification, privacy and rebooking authority.
- `scripts/production_readiness_check.py` — I.T. Production-readiness authority.
- `scripts/release_rollback_recovery_check.py` — rollback/recovery safety authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. JSON-LD blocks, where present, must be valid JSON. `robots.txt` must advertise the canonical sitemap. Payment/confirmation utility pages deliberately excluded from the sitemap may use `noindex`.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and usable narrow-screen layouts. New interaction workflows must have usable touch targets, loading/error/empty states, and fail-safe recovery. Static checks are the regression floor; exact Cloudflare deployment evidence remains part of release acceptance.

## Restart point

If interrupted during the active work, verify the current head of `build327-vehicle-aware-maintenance-fleet`, inspect the first failing Current Source Gate authority, and continue there. Do not redo the accepted payment-completion/rebooking work. `dev` and `main` must remain on the accepted baseline until the feature SHA passes feature source and Cloudflare evidence.

After the active scope is fully synchronized GREEN, choose the next unfinished roadmap slice from current repository evidence rather than stale release notes. The broader agreed sequence continues through deeper fleet/maintenance operations and then payment/Production-readiness depth unless a higher-priority defect is discovered.
