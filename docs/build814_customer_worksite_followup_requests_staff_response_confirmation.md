# Rosie Dazzlers Build 814 — Customer Worksite Follow-Ups

## Customer experience

My Account now provides a separate follow-up area beneath each account's worksite issue history. A signed-in customer may select one of their saved worksite reports, request clarification or provide new information, and see Rosie’s response after refreshing. The customer may explicitly confirm that the response resolved the concern or explain what still needs attention (12–500 characters). Confirming records feedback about the follow-up; it does not change the original issue disposition, booking, payment, arrival time, or staff assignment.

The customer can submit another follow-up after a completed confirmation or recorded request for more help. One outstanding follow-up (awaiting staff or waiting for confirmation) per issue prevents parallel, conflicting threads. Retries use a client-generated UUID and matching content to return the original saved request safely.

## Staff experience

Admin Today has a new operations-only follow-up queue with the latest 150 items and filters for awaiting a response, waiting for customer confirmation, more help needed, resolved, or all. Authorized staff can record a 12–1000-character customer-visible answer. The response carries the server-verified staff identity and an optimistic revision. Staff can review the database-owned chronology; customer views exclude staff identity and private audit metadata.

## Authority and failure modes

- Customer reads and writes are scoped to an active verified customer session. Every new follow-up checks the related issue's `customer_profile_id` on the server; the database also checks it during insertion. Cross-customer issue IDs cannot be used to request or confirm a follow-up.
- Staff reads and replies require an authenticated staff **session**, `manage_bookings`, and `operations.customer.manage`. Untrusted staff-ID headers and customer-provided actor IDs are ignored.
- Both writes require same-origin JSON, strict lengths and enums, and no-store replies. Conflicting revisions or a simultaneous second open request fail closed. UI warns customers to refresh history after network uncertainty.
- `public.customer_worksite_followups_v814` and `public.customer_worksite_followup_events_v814` enable RLS and revoke all grants for browser roles. Only `service_role` has the minimum SELECT/INSERT/UPDATE required for requests; event rows permit only SELECT/INSERT and block UPDATE/DELETE with a trigger.
- Database SECURITY INVOKER triggers enforce ordered, legal transitions and atomically insert append-only event records. No synthetic historical records or outbound messages are claimed.
- A saved reply becomes visible in My Account upon refresh. **No email, SMS, Comms Hub push, booking, dispatch, refund or payment mutation is performed.** For urgent safety or arrival problems customers should still contact Rosie directly.

## Verification

- `node scripts/build814_customer_worksite_followup_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`
- `python3 scripts/release_check.py`
- `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
- Hosted migration, RLS and privileges verified separately before protected `dev` and `main` promotion; never equate green CI with a live browser/payment test.
