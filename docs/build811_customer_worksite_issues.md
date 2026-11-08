# Rosie Dazzlers Build 811 — Customer worksite issue reporting and staff review

## What customers can do

- Open **My Account → Report an appointment worksite concern** after signing in.
- Select an upcoming, account-owned appointment and describe parking, driveway, building rules, unusual utility restrictions, weather, vehicle condition or arrival concerns.
- Submit one unresolved report per appointment and refresh the saved status: **Awaiting staff review → Rosie is reviewing → Resolved / Closed with explanation**.
- See only their own reports and customer-visible explanations. A report never changes the booking, staff assignment, confirmed arrival, payment or permission to contact.

Rosie brings standard detailing water and power. Customers may still need to flag access, site safety or water-use restrictions. Urgent safety and access changes should be raised directly with Rosie.

## What authorized operations staff can do

- Open **Admin → Today Operations Cockpit → Customer worksite concern review**.
- View recent reports after a verified, active staff session plus `manage_bookings` and `operations.customer.manage` permission. A legacy password or `x-staff-user-id` header is not sufficient for this queue.
- Manually mark a concern as `reviewing`, `resolved`, or `closed_no_action`. Final states require a customer-visible explanation; separate internal notes are never returned to customers.
- Refresh to handle an optimistic concurrency conflict. A stale reviewer cannot overwrite a newer status.

No automatic email, SMS, booking change, payment/refund, schedule or dispatch actions occur.

## Database and access

Migration: `supabase/migrations/20261108141300_build811_customer_worksite_issue_review.sql` (matches the hosted Rosie Supabase migration-history version).

- New table `public.customer_worksite_issues_v811`, scoped to canonical customer profile and booking foreign keys.
- Unique `(customer_profile_id, client_request_id)` makes network retries safe; a partial unique index allows only one open issue (`pending_review`/`reviewing`) per booking.
- RLS enabled, `PUBLIC`/`anon`/`authenticated` grants revoked; only `service_role` may read/write via verified server routes.
- `GET/POST /api/client/worksite_issues_v811` checks exact customer session, email and profile ownership, content, source origin and appointment eligibility. No customer-facing projection includes `staff_private_note` or staff identity.
- `GET/POST /api/admin/worksite_issue_review_v811` requires exact staff session and operations customer-management authorization; updates are conditional on current status.

## Verification

Run `node scripts/build811_customer_worksite_issues_test.mjs`, `bash scripts/current_booking_wizard_regression.sh`, and `python3 scripts/release_check.py`.

Tests cover authorization, cross-account booking rejection, closed appointments, origin restriction, max description length, retry idempotency, no private note leaks, staff action permission, header-bridge denial, competing review decisions, mobile route parity and non-mutation of booking/payment/outbound communications.

An inherited Build 413 CI assertion formerly treated any SQL filename containing the digits `413` as a Build 413 migration. The hosted Build 811 migration-history timestamp `20261108141300` collided with those digits. The assertion now checks an explicit `build413` filename token, continuing to reject genuine Build 413 migrations without incorrectly rejecting newer timestamped files.

Hosted migration `build811_customer_worksite_issue_review` was applied to the RosieDazzlers project (`cwxhhvwpilmrfwxirixx`), then independently read back: RLS enabled; `anon` and `authenticated` have no `SELECT` grant; `service_role` has `SELECT`, `INSERT`, and `UPDATE`; indexes present. GitHub CI and hosted schema verification remain separate evidence.

## Next proposed build

**Rosie Dazzlers 812 — Staff Worksite Issue Assignment, Customer Acknowledgement Clarity & Arrival-Day Escalation**: explicit owner assignment and due-time visibility without automatic outbound messages or schedule changes.
