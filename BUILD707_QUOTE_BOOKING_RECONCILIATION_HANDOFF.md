# Rosie Dazzlers Build 707 — Booking-to-Quote Reconciliation and Staff Confirmation History

30 October 2026 (Eastern). This application build is independent of six-app QL integration, which remains DISCONNECTED / HOLD.

## Functional changes

- A staff-protected, read-only `GET /api/admin/quote_booking_reconcile?quote_id=...` loads the actual saved quote, its linked booking, any competing quote links, and confirmation events from the existing `booking_events` table.
- The reconciliation rejects an absent quote/booking link, incorrect customer, missing date/slot, duplicate quote link, cancelled/inactive booking, or booking not actually confirmed. It also detects when the accepted amount, quote update timestamp, booking date, status, vehicle, service package, or booking update timestamp changed after a staff confirmation.
- A staff-authorized `POST` records an explicit, genuine staff confirmation in `booking_events` **only after** the original saved quote and live confirmed booking match. This is an append-only staff review event; repeat submissions of an already-current review do not add duplicate events. No separate table or migration is introduced.
- The admin interface displays the real confirmation history and current/stale state. Customer draft copying now additionally requires current staff confirmation **and** a fresh read-only booking verification. Notification readiness authorizes no sending, scheduling or payment.

## Staff walkthrough

1. In **Admin → Quotes**, select the saved accepted quote. Make sure its actual booking ID has been verified and saved.
2. Confirm the booking details in **Admin → Bookings** under existing booking, service eligibility, deposit, cancellation, waiver and weather rules.
3. In **Build 707 reconciliation**, select **Check live booking and history**. Fix any mismatches or duplicate links in the source records.
4. Once reconciliation is ready, choose **Record completed staff confirmation** and acknowledge that the review was actually performed. The server rechecks the live records before saving the staff history event.
5. Recheck the history and select **Verify existing booking** in the Build 706 panel. Only then can a verified, confirmed customer preview be copied for separate, staff-approved communication.
6. If quote or booking details later change, reconciliation marks the confirmation stale. Repeat the actual review and record a fresh event; older history is preserved.

## Safety and testing

- `GET` and `POST` both require the existing `manage_bookings` staff authorization; service-role credentials remain server-only. An authorized staff POST writes only a confirmation audit event, never to `bookings`, payments or the communications queue.
- Existing `booking_events` is used instead of creating a new database table. No new secrets, bindings or RLS changes.
- There is no automatic email, SMS, dispatch, charge, gift operation, cross-application connection, or confirmed customer receipt. QL integration remains on HOLD.
- Verify with `node scripts/build707_quote_reconciliation_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/fleet_account_pipeline_check.py`, `python3 scripts/release_hygiene_check.py`, `python3 scripts/release_check.py`, and `python3 scripts/sync_route_copies.py --check`.
