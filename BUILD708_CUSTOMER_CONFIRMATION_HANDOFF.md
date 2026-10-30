# Rosie Dazzlers Build 708 — Customer Confirmation Handoff, Consent Verification & Booking Change Follow-Up

30 October 2026 (Eastern). Functional software promotion is separate from six-app QL integration (DISCONNECTED / HOLD).

## What's new

- An authenticated, non-sending `GET /api/admin/quote_customer_handoff?quote_id=...` checks the saved quote, confirmed booking, current staff confirmation, the booking's **linked customer profile**, and that profile's current explicit notification opt-in and email/SMS channel. No guest or staff-supplied guessed consent is accepted.
- If the booking or quote has changed after a recorded staff confirmation, the UI shows that the confirmation is stale and offers **Record changed-booking follow-up**. This writes a staff-only history event after an actual review acknowledgement but does not contact the customer or fix the booking.
- After a verified live quote/booking match, current staff confirmation and explicit customer permission, staff may choose **Prepare staff handoff (no send)**. This records a bounded audit event in existing `booking_events`, with no recipient email/phone in the event payload. Repeat current actions do not duplicate history.
- **Copy verified customer draft** now requires a current prepared handoff and re-fetches live booking, reconciliation and consent records immediately before copying. A changed/withdrawn permission or stale quote blocks copy.
- The admin screen displays the current blocked/ready disposition and actual handoff/follow-up history. It never claims that a notification has been delivered.

## Operator walkthrough

1. In **Admin → Quotes**, select the saved accepted quote and verify its actual booking. Confirm customer identity and booking status using **Admin → Bookings**.
2. Record the actual Build 707 staff confirmation, then **Check current customer permission** in Build 708.
3. If no linked customer profile or explicit email/SMS permission exists, use the existing customer profile and booking management workflow to obtain real customer authorization. Do **not** assume the quote itself authorizes contact.
4. If the booking changed since staff confirmation, review it and select **Record changed-booking follow-up**. Reconcile and record a fresh actual staff confirmation before proceeding.
5. When the live consent check and staff confirmation both pass, choose **Prepare staff handoff (no send)**. Then verify the booking again and, if all current gates pass, copy the customer preview for a separately approved contact method.

## Verification and boundaries

- The server uses existing `quote_pipeline_items`, `bookings`, `customer_profiles` and `booking_events`, with staff `manage_bookings` authorization and server-only Supabase access. It reuses the current `customer-communication-consent.js` policy. No new table, migration, grants, RLS, secret, variable or binding is required.
- Neither GET nor POST writes to the `notification_events` queue. Neither sends email, SMS, push, triggers payment, alters a customer profile, changes an appointment, dispatches staff, or activates cross-application integration.
- Staff confirmation and a prepared handoff are not evidence of successful customer delivery. The existing send-time consent gate remains authoritative for any future enabled sending.
- Run `node scripts/build708_customer_handoff_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/fleet_account_pipeline_check.py`, `python3 scripts/release_hygiene_check.py`, `python3 scripts/release_check.py`, and `python3 scripts/sync_route_copies.py --check`.
