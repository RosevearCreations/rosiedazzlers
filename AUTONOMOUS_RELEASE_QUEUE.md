# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 327 — Vehicle-Aware Maintenance & Fleet Rules** is GREEN and closed at exact application SHA `673d39a7d3a53a4965a0e41c455f824cdaa1b395`.

A content-neutral cleanup checkpoint has `dev == main` at `cd92d3fa5276b8db12a1da11de467222b079293b`; its tree is identical to the accepted Build 327 tree.

## Active — Build 328

Branch: `build328-fleet-maintenance-workbench`

Scope: **Fleet Maintenance Workbench & Staff Planning**.

Build 327 fixed vehicle-specific reminder/eligibility rules. Build 328 makes the existing staff-owned `customer_vehicles` planning fields operational without turning on automatic scheduling, recurring billing, or enrollment.

### Acceptance checklist

- Add a focused authenticated `/admin-fleet-maintenance.html` staff workbench.
- List all saved customer vehicles, even when no completed-service history exists.
- Merge Build 327 reminder evidence when a stable `customer_vehicle_id` exists.
- Show ambiguous/unmatched completed-service histories separately and keep them fail-closed.
- Anchor all writes to a valid saved `customer_vehicles.id`.
- Permit writes only to `service_interval_days`, `next_cleaning_due_at`, and `next_service_mileage_km`.
- Require service intervals of 14–84 whole days or null.
- Require due dates in `YYYY-MM-DD` format or null.
- Require mileage targets to be whole numbers from 0–2,000,000 km, never below stored current mileage, or null.
- Reject attempts to write customer/profile/contact fields or `auto_schedule_opt_in`.
- Keep automatic appointment creation, recurring billing, membership enrollment and payment actions disabled.
- Keep customer-facing vehicle APIs unchanged.
- `scripts/fleet_maintenance_planning_test.mjs` must exercise safe writes, invalid values, automatic-scheduling rejection and deterministic due state.
- `scripts/fleet_maintenance_planning_check.py` must remain GREEN in the cumulative Current Source Gate.
- No database migration is introduced by this scope.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature deployment evidence.
- Only then fast-forward `dev` to the identical SHA and require Current Source Gate plus Cloudflare Development Acceptance.
- Only after Development is GREEN may `main` fast-forward to the identical accepted SHA.
- Require exact-SHA `main` Current Source Gate plus Cloudflare Production deployment before calling the release GREEN.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

Do not assign the next release number until Build 328 is fully GREEN and synchronized. Continue through the next unfinished fleet/maintenance operating gap from current repository evidence before deeper payment/Production-readiness work unless a higher-priority defect is discovered.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. First verify current `dev` and `main`, the prior exact accepted SHA, source gates and Cloudflare deployment evidence. Database work is never implied by a source promotion; schema changes require their own explicit migration/acceptance boundary.
