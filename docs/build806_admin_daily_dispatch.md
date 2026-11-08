# Rosie Dazzlers Build 806 — Admin Daily Dispatch Board

## Operator outcome

The existing **Daily Command Centre** (`/admin-operations.html`) now allows an authorized administrator to move between dates, search and filter active/completed bookings, view AM/PM/full-day occupancy, see workload grouped by verified staff identity, and focus on actionable dispatch exceptions.

- A selected date is read from the authenticated `POST /api/day_schedule` endpoint using `{ "service_date": "YYYY-MM-DD" }`.
- Current booking details and crew assignments are read from the existing authenticated `POST /api/admin/bookings` list path **with exactly `{}`**. The same endpoint has a mutation path if given a booking ID; this board never supplies one to that request.
- Individual payment summaries are obtained by the existing GET-only `/api/admin/booking_finance?booking_id=...` authority. Finance failures display **Unknown** without blocking unrelated schedule inspection.
- The board reconciles details with same-day booking IDs, counts only valid canonical staff UUIDs, and does not treat a name/email alone as an assignment.
- The exception queue flags unassigned work, unverifiable crew identity, blocked dates/slots, conflicting slot occupancy, overlapping staff assignments, missing package information, and missing matched booking details.
- Links lead to existing authorized booking, assignment, schedule blocks, job-site, payment and incident screens. This board does not write bookings, send messages, authorize customer actions, or create a new operational ledger.

## Safety and failure behavior

The admin shell requires `app-operations` access; API reads additionally require their established `manage_bookings` capability. The stronger `manage_staff` staff-directory/payroll endpoint is **not called**. The board has no background polling, browser storage or offline copy of customer records. Changing the date during a fetch schedules a fresh read afterward. Invalid/missing day-slot occupancy, schedule date/ID mismatches, unavailable detail list or authorization errors clear any stale projection. Unknown clock times are **not** inferred as booking slots. A clear exception queue does not certify QC, arrival, photos, finance or customer approval.

## Verification

```sh
node --check assets/admin-operations.js
node scripts/build806_admin_dispatch_test.mjs
python3 scripts/operations_daily_command_centre_check.py
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
```

Use an authorized Admin or Senior Detailer session to verify a previous date, the current date and next date; compare the occupancy counts, assignment links and blocked-slot decisions with their source screens. Confirm that a missing staff UUID stays unassigned and that the exception category filters never change a booking.
