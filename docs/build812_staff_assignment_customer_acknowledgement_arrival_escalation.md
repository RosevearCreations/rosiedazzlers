# Rosie Dazzlers Build 812 — Worksite Issue Assignment & Arrival-Day Follow-Up

## Purpose

Extend Build 811's customer-owned worksite issue reports into an actionable, manual operations queue. Keep the customer's **report received**, **staff acknowledged**, and **issue resolved** states distinct. No booking, dispatch, payment, or outbound communications are modified.

## Customer — My Account

- A report is recorded only after verified customer session and ownership of its open booking. Saving the report **does not mean a staff member has read it**.
- Until an authorized staff member clicks **Record my acknowledgement**, the account says that no staff acknowledgement has been recorded.
- After that action, the account displays the actual acknowledgement date, without suggesting that arrival time, site readiness, or an appointment change is confirmed.
- When staff manually flag an arrival-day concern, the customer can see that staff follow-up is flagged, but **not** a promise of a message or schedule change. Refresh My Account to see the latest status; urgent safety concerns should be phoned to Rosie.
- Assignment IDs, reviewer personal information, internal notes and write tokens never appear in the customer API.

## Staff — Admin Today

- Requires real signed-in staff session, booking-management capability and `operations.customer.manage`; bridge headers and legacy ADMIN_PASSWORD cannot open this queue.
- Assignment further requires `operations.assignment.manage`. Only active staff members also eligible for customer issue review are assignable. The dropdown reveals display names, not personal email addresses.
- Queued issues show service date and Toronto-local arrival priority, as determined **server-side**. Filters show arrival-day/overdue, unassigned, open and closed issues.
- Acknowledgement is explicitly recorded with staff ID and timestamp. Repeated acknowledgement is rejected.
- An unresolved report can be manually flagged for arrival-day escalation **on or after** its booking date; cancelled, completed or inactive appointments are not eligible. The flag can later be marked addressed without implicitly closing the issue.
- Final issue disposition still goes through the Build 811 staff review API and requires a customer-readable explanation when closing.
- Every change is checked against the record's `workflow_revision`. A stale or simultaneous update fails with HTTP 409, requiring refresh. No silent overwrite of staff decisions.

## Storage and permissions

Migration: `supabase/migrations/20261108144648_build812_staff_worksite_assignment_acknowledgement_arrival_escalation.sql`.

Adds assignment, acknowledgement, escalation and monotonic revision columns to `public.customer_worksite_issues_v811`, preserving existing rows. The public table continues to have RLS enabled; `anon` and `authenticated` grants remain revoked, and only the server-side service-role path is allowed. Foreign keys for staff identities are restricted to `staff_users` IDs.

## Acceptance

Run:

```sh
node scripts/build811_customer_worksite_issues_test.mjs
node scripts/build812_staff_worksite_assignment_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
```

These verify unauthorized customer/staff access denial, assignee validation, real acknowledgement, Toronto date boundary, invalid early escalation, safe state conflict, HTML route parity and absence of payment or messaging side effects. The hosted database migration and role-grant readback must be verified separately before production GREEN is claimed.

## Operations note

This build intentionally **does not** send alerts, emails or texts. It creates a visible staff queue and an explicit manual workflow. If an issue is urgent, contact the customer through existing approved channels and record any actual communication in its authoritative system; do not interpret an acknowledgement timestamp as delivery evidence.
