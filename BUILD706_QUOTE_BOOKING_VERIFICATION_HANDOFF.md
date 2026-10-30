# Rosie Dazzlers Build 706 — Quote-to-Booking Verification and Follow-Up Completion

29 October 2026 (Eastern) · Staff operations · Gift tests remain paused.

## What changed

- Added a staff-authorized, read-only `GET /api/admin/quote_booking_verify?quote_id=...&booking_id=...` that reads the **real saved quote** and **real existing booking** with a restricted service-role request. It rejects missing records, mismatched customers, cancelled/incomplete bookings, and bookings already linked to another quote.
- Added the same real-source gate to **new booking ID links at quote save**. An API client cannot bypass the readback solely by typing a syntactically valid UUID. Existing unchanged linked quotes remain editable.
- Added a clearly marked customer confirmation **preview**. Copy is available only when a confirmed booking has been verified, explicitly saved on the quote, and verified again. No email, SMS, appointment, payment, Gift operation or cross-application action is initiated by the preview.
- Added **Mark completed follow-up (unsaved)**. It clears the next follow-up date and selects `staff_follow_up_completed`, but requires the operator to press **Save quote**. Completed follow-ups are counted and filterable without being treated as unscheduled.
- No new database tables, grants, RLS policies, credentials, build variables, secrets or bindings were introduced.

## Staff walkthrough

1. Open **Admin → Quotes**, select and save an accepted quote with an actual customer name and positive accepted amount.
2. Review the Build 705 service, vehicle, seasonal capacity, site and terms checks before opening the booking dashboard.
3. In **Admin → Bookings**, create/review the **real** booking under existing booking and availability rules. Do not treat the quote as a reservation.
4. Return to the quote, enter that actual booking UUID, and click **Verify existing booking (read-only)**. Resolve any customer mismatch or duplicate link before proceeding.
5. Click **Save quote**. Reopen the saved quote and verify the booking again. If the booking is confirmed in the booking system, the **Copy verified customer draft** button becomes available for separately reviewed staff communication.
6. After completing a real customer follow-up, click **Mark completed follow-up (unsaved)** and **Save quote**. The completed queue remains searchable and visible.

## Boundaries and verification

- The existing Supabase `quote_pipeline_items` and `bookings` records remain authoritative. All verification queries are server-side and scoped by staff `manage_bookings` authorization; no server key reaches the browser.
- No automatic quote-to-booking conversion or notification dispatch. Existing deposit/payment, waiver, winter availability, and public service eligibility rules are unchanged.
- Cross-application QL-261/262 remains `DISCONNECTED / HOLD`, independently of this product-functionality release. No signer proof or mini-server authorization is implied.
- Run `node scripts/build706_quote_booking_verification_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/fleet_account_pipeline_check.py`, `python3 scripts/release_hygiene_check.py`, `python3 scripts/release_check.py`, and `python3 scripts/sync_route_copies.py --check`.
