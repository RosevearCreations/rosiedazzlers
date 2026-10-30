# Rosie Dazzlers Build 711 — Follow-Up Aging, Staff Assignment & Consent Recheck Queue

## Staff use

Open **Admin → Quotes → Build 711**. Refresh the staff queue to see overdue/due-soon/unscheduled follow-ups, aging days and current recorded owners. Select a saved quote with a linked booking, allow the live readback, choose an active staff member allowed to manage bookings, and record the assignment. Staff may explicitly unassign work or record a new live consent recheck.

The overview is a bounded **historical queue**, not live consent authority. Its readback covers up to 150 open saved quotes (oldest due dates first) and the latest 500 assignment/recheck events, with an explicit truncation warning. Selection triggers fresh quote, booking, customer profile, handoff, outcome, resolution and assignment reads. Old snapshots become stale on changes; an assignee must be reconfirmed before a new live recheck after consent drift.

## Safety

- Staff-only `manage_bookings` operations; assignee verified against active `staff_users` with booking authority.
- Append-only events in the existing `booking_events` table. No migration or table changes.
- A consent recheck logs current permission; an opt-out remains a denial, not an override.
- No automatic messages, contact, payments, booking assignments, dispatch, provider receipts or cross-application activation.
- Rosevear Comms Hub remains `DISCONNECTED / HOLD`, and gift delivery remains paused.

## Tests

`node scripts/build711_followup_queue_test.mjs` checks authenticated readback, bounded aging, inactive-staff rejection, fresh assignment, idempotence, opt-out drift, stale writes, internal consent-recheck history and unassignment. The canonical booking regression wrapper includes this test.
