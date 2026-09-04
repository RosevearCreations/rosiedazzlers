# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 326 — Booking Completion + Retention/Rebooking Lifecycle** is GREEN and closed at exact SHA `3f3cf6a6c109b99a82bfb8bf38ebd62856908b4f`.

At the current-work start boundary, both `dev` and `main` were exactly that SHA. A release is closed only after the accepted SHA is proven through feature, Development and Production gates and `dev == main` again.

## Active — Build 327

Branch: `build327-vehicle-aware-maintenance-fleet`

Scope: **Vehicle-Aware Maintenance & Fleet Rules**.

The existing maintenance system correctly keeps membership capture interest-only and blocks automatic enrollment, recurring billing and appointment creation. The active defect is that reminder eligibility/cadence/history were customer-wide, allowing multiple household/fleet vehicles to influence one another.

### Acceptance checklist

- Keep maintenance interest/waitlist state customer-level.
- Group completed-service history by reliable vehicle identity before calculating Complete Detail eligibility, service cadence or reminder due state.
- Prefer an unambiguous saved `customer_vehicles` match using normalized year/make/model/size.
- When no saved vehicle match exists, permit a normalized plate to identify the vehicle internally but never expose raw plate text in reminder keys/payloads.
- When neither reliable path exists, isolate the booking and fail reminder eligibility closed with `vehicle_identity_required`; never blend uncertain histories by customer or generic vehicle spec.
- Keep Complete Detail eligibility vehicle-specific.
- Infer cadence only within one vehicle history.
- Honor staff-owned `service_interval_days` before profile/plan fallback cadence.
- Honor staff-owned `next_cleaning_due_at` as the vehicle-level due-date override.
- Keep customer writes blocked from `next_cleaning_due_at`, `next_service_mileage_km`, `service_interval_days` and `auto_schedule_opt_in`.
- Key new reminder history by an opaque vehicle key so one vehicle cannot suppress another vehicle's reminder.
- Keep `auto_schedule_opt_in` non-operative in this scope; no automatic appointment creation.
- Preserve the interest-only, no-recurring-billing contracts.
- `scripts/vehicle_maintenance_rules_test.mjs` must prove multi-vehicle separation, saved-vehicle stability and ambiguous-history fail-closed behavior.
- `scripts/maintenance_retention_check.py` must execute the vehicle rule test and remain GREEN in the cumulative Current Source Gate.
- No database migration is introduced by this active scope.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature deployment evidence.
- Only then fast-forward `dev` to the identical SHA and require Current Source Gate plus Cloudflare Development Acceptance.
- Only after Development is GREEN may `main` fast-forward to the identical accepted SHA.
- Require exact-SHA `main` Current Source Gate plus Cloudflare Production deployment before calling the release GREEN.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

Do not assign the next release number until the active work is fully GREEN and synchronized. Then select the next unfinished roadmap slice from current repository evidence. Continue through remaining fleet/maintenance operating depth before deeper payment/Production-readiness work unless a higher-priority defect is discovered.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. First verify current `dev` and `main`, the prior exact accepted SHA, source gates and Cloudflare deployment evidence. Database work is never implied by a source promotion; schema changes require their own explicit migration/acceptance boundary.
