# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and archived release artifacts remain the historical implementation record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Last fully accepted application release: **Build 327 — Vehicle-Aware Maintenance & Fleet Rules**.
- Exact accepted application SHA: `673d39a7d3a53a4965a0e41c455f824cdaa1b395`.
- A content-neutral cleanup checkpoint now has `dev == main` at `cd92d3fa5276b8db12a1da11de467222b079293b`; GitHub comparison shows zero file changes versus the accepted Build 327 tree.
- Active work: **Build 328 — Fleet Maintenance Workbench & Staff Planning**.
- Active branch: `build328-fleet-maintenance-workbench`.
- The active scope uses existing `customer_vehicles` columns and introduces no database migration.

## Why this scope is active

Build 327 made maintenance eligibility, cadence, reminder history and rebooking vehicle-aware. The next operational gap is that staff-owned vehicle planning fields already exist in `customer_vehicles`, but there is no focused staff workbench for safely managing those values.

Build 328 exposes those existing vehicle-level controls without enabling automatic enrollment, recurring billing, or appointment creation.

## Active operating contract

- Staff planning is anchored to the stable saved `customer_vehicles.id`; ambiguous completed-service history is never guessed onto a saved vehicle.
- The only writable fields are `service_interval_days`, `next_cleaning_due_at`, and `next_service_mileage_km`.
- Service intervals must be whole numbers from 14–84 days or cleared to null.
- Next cleaning due dates must use `YYYY-MM-DD` or be cleared to null; past dates are valid so overdue vehicles can remain visible.
- Next service mileage must be a whole number from 0–2,000,000 km or null and cannot be below the stored current vehicle mileage.
- `auto_schedule_opt_in` is read-only/informational in this scope and cannot be changed by the workbench.
- Saving a vehicle plan does not create a booking, reserve calendar capacity, enroll a membership, authorize recurring billing, or change customer/contact data.
- The workbench merges saved vehicles with Build 327 reminder evidence when a stable `customer_vehicle_id` is available.
- Completed-service histories that cannot be mapped reliably to one saved vehicle appear in a separate review queue and remain reminder-ineligible.
- The staff surface is `/admin-fleet-maintenance.html`; it uses the existing authenticated admin shell and Operations/customer route authority.
- Customer-facing vehicle APIs remain unchanged and continue blocking staff-owned planning fields.

## Current release procedure

A RosieDazzlers release is not GREEN merely because its feature code exists.

1. Start the feature branch from the exact synchronized accepted checkpoint.
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
- `scripts/maintenance_retention_check.py` and `scripts/vehicle_maintenance_rules_test.mjs` — vehicle-aware reminder/retention authority.
- `scripts/fleet_maintenance_planning_check.py` and `scripts/fleet_maintenance_planning_test.mjs` — Build 328 staff planning/write-boundary authority.
- `scripts/booking_funnel_device_check.py` — aggregate funnel/device/privacy authority.
- `scripts/booking_wizard_responsive_ux_check.py` — responsive/touch/focus/route-parity authority.
- `scripts/booking_completion_retention_check.py` — payment-completion boundary, provider verification, privacy and rebooking authority.
- `scripts/production_readiness_check.py` — I.T. Production-readiness authority.
- `scripts/release_rollback_recovery_check.py` — rollback/recovery safety authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.

## Public SEO contract

Every URL listed in `sitemap.xml` must resolve to a local public source page with exactly one meaningful H1, one non-empty title, one non-empty meta description and one canonical URL matching the sitemap route. Sitemap pages must not be `noindex`. Authenticated admin utility pages remain outside the sitemap and use `noindex`.

## Help and responsive contracts

Authenticated work screens must include useful operating/contextual Help and must never expose server secrets. Public and active application shells retain a device-width viewport and usable narrow-screen layouts. New interaction workflows must have usable touch targets, loading/error/empty states, and fail-safe recovery. Static checks are the regression floor; exact Cloudflare deployment evidence remains part of release acceptance.

## Restart point

If interrupted during Build 328, verify the current head of `build328-fleet-maintenance-workbench`, then inspect the first failing Current Source Gate authority. Do not redo the accepted Build 327 vehicle-reminder rules. `dev` and `main` must not receive the Build 328 feature SHA until the exact feature SHA passes source and Cloudflare evidence.

After Build 328 is fully synchronized GREEN, select the next unfinished roadmap slice from current repository evidence. Continue through remaining fleet/maintenance operating depth before deeper payment/Production-readiness work unless a higher-priority defect is discovered.
