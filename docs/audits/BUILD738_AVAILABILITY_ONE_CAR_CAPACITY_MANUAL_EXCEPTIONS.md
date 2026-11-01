# Build 738 — Availability, One-Car Capacity & Manual Scheduling Exceptions

Date: 2026-11-01 | Rosie Dazzlers | Requested promotion path: `dev` → `main` → Production

## Capacity contract and limits

- There is **one mobile detailing vehicle** per service date. A two-slot booking consumes both AM and PM; one-slot AM and PM bookings may coexist. A second AM, second PM, or any overlap with a full-day appointment is refused.
- `pending` and `confirmed` rows hold capacity until explicitly cancelled, failed, refunded, or marked with a cancelled job status. The old checkout-only age threshold silently released pending holds after 30 minutes while the public calendar still displayed them as taken; Build 738 removes that contradiction. **Abandoned pending payments require a deliberate staff reconciliation/release workflow**; their presence is not evidence of a verified payment or a confirmed service.
- Public `GET /api/availability`, customer `POST /api/checkout`, admin booking availability, admin daily schedule, and staff booking/reschedule saves now share duration-aware occupancy checks. Checkout checks live data immediately before writing. All booking inserts and schedule/status edits have a PostgreSQL `BEFORE` trigger with a per-date transaction advisory lock to serialize competing attempts. A race loser receives a conflict; no calendar display alone reserves or confirms service.
- Editable holiday/business-hours closures, explicit date/slot blocks and optional catalog `booking_rules.minimum_lead_days` are honored. Dates use `America/Toronto` for local lead-day boundaries. **No new numeric lead time was invented**: when the owner has not configured one, zero is used. Verified staffing windows are supported in the deterministic capacity evaluator, but the live service has no authoritative verified roster integration; an open slot must not be represented as a confirmed crew assignment.
- The owner's manual exception action **only removes an explicit date/slot block**, after a session-authenticated admin supplies a 20–2000 character reason. A service-role-only database RPC deletes the block and writes `rosie_schedule_exception_audit_738` in the same transaction. The table has RLS and no public execution or direct data grant. Manual release does **not** skip the one-car booking trigger, and it does **not** override business-hours closures or a pre-existing booking hold. Rescheduling through admin booking save also checks the target slot, excluding only the booking being edited.

## Rollout and verification

Migration: `supabase/migrations/20261101190000_build738_one_car_capacity_and_owner_exceptions.sql`.

- Preflight of live Rosie Dazzlers Supabase (`cwxhhvwpilmrfwxirixx`): **0 future active bookings, 0 future overlapping pairs**, and no prior Build 738 trigger; existing booking schema and status checks inspected before DDL.
- Migration applied successfully using the Supabase migration interface. Subsequent read-only verification: **1 active capacity trigger**, exception audit **RLS enabled**, `anon`/`authenticated` RPC execution **false**, `service_role` execution **true**.
- `node scripts/build738_availability_capacity_manual_exceptions_test.mjs` checks full-day and half-day combinations, stale pending holds, explicit releases, closed dates, slot blocks, lead days, Toronto DST, verified/unverified staffing, reschedule self-exclusion, and mandatory source/database safeguards. Included in the living customer booking regression wrapper.
- Regression set: `scripts/current_booking_wizard_regression.sh`, `scripts/current_source_gate_contracts.sh`, `scripts/release_check.py`, `scripts/release_hygiene_check.py`, `scripts/service_commercial_accuracy_test.mjs`, `scripts/admin_ui_audit.py` (pass at local test time).

## Explicit owner follow-ups (not silently assumed complete)

1. Approve and publish a genuine minimum booking lead-time policy if desired; configuration may set `booking_rules.minimum_lead_days` without code changes.
2. Supply an approved, current staffing-window source/roster and travel buffers before automatically publishing crew availability claims. Owner still confirms staffing and travel before dispatch.
3. Define a safe, explicit abandoned-payment hold reconciliation process (provider verification before any cancellation), rather than using a timer to reopen capacity.
4. Inspect the schedule exception audit after owner manual releases and ensure customer communications distinguish booking requests, pending payments and fully confirmed appointments.

No payment provider charges, customer bookings, existing block records, or marketing messages were created by the verification work. The migration adds controls only.
