# Rosie Dazzlers Build 813 — Worksite Issue Resolution Timeline & Staff Handoff Audit

## Customer outcome

Within **My Account → Worksite help**, customers can expand **Recorded issue activity** for each report. The timeline distinguishes staff assignment changes, acknowledged reports, arrival-day escalation, review progress and resolution updates. It displays genuine database timestamps and customer-safe messages.

After staff close a report, a prominent next-step explanation tells customers to read Rosie's recorded resolution and use the existing **Contact Rosie** page if they need clarification or disagree. An on-screen update **does not send** a customer email or SMS, change an appointment or promise a particular arrival time.

## Staff outcome

Within **Admin Today → Worksite issue review**, authorized operations reviewers can expand **Recorded staff handoffs and review history**. Each event shows its database-recorded revision, time, change in assignment or status, and the staff actor recorded by the verified server-side action. If an actor is no longer listed as active, the audit does not invent a name.

## Database controls

`supabase/migrations/20261108150601_build813_worksite_issue_append_only_timeline.sql` creates a separate `public.customer_worksite_issue_events_v813` event table and a narrowly-scoped, `SECURITY INVOKER` database trigger. The trigger records changes to Build 812's issue assignment, staff acknowledgement, arrival-day escalation and final review status only after the change is accepted by the database.

`supabase/migrations/20261108150728_build813_event_immutability_guard.sql` explicitly revokes Supabase's inherited `service_role` table permissions and regrants only `SELECT` and `INSERT`. A second database trigger prevents even an otherwise privileged application UPDATE/DELETE from rewriting event records. The live permission readback confirmed no `service_role` UPDATE or DELETE grants.

- The event table is RLS-enabled; `anon` and `authenticated` privileges are revoked.
- Server-side `service_role` receives only `SELECT` and `INSERT` on events. It has no `UPDATE` or `DELETE` privilege, and the immutability trigger blocks those row operations as defense in depth. Database owners can still change schema/privileges through explicit migrations.
- The event's source issue cannot be deleted while audit events reference it; actor IDs are retained for staff audit and withheld from customer responses.
- The trigger requires the next monotonic `workflow_revision`; a rejected or stale update leaves no audit entry.
- Existing Build 811/812 issues are preserved, **without generating fake events for historical actions**. Customers and staff are explicitly told that the new timeline begins at activation.
- No staff private notes or payment information is written to event snapshots. Only optional customer-visible resolution text is retained as part of review evidence.

## Endpoints and failure behavior

- Customer `GET /api/client/worksite_timeline_v813` derives the customer's issue IDs from their verified account session. Caller-provided issue IDs are ignored. It returns a customer-safe projection without reviewer IDs, private notes or other customers' events.
- Staff `GET /api/admin/worksite_assignment_v812` retains the verified staff session and action permission checks before returning internal audit events with the issue queue.
- A timeline read error is shown as unavailable; the current issue status remains accessible. No synthetic timeline events are produced to fill a gap.

## Acceptance checks

```sh
node scripts/build811_customer_worksite_issues_test.mjs
node scripts/build812_staff_worksite_assignment_test.mjs
node scripts/build813_worksite_issue_timeline_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
```

Also verify the hosted migration history, trigger ownership and status, row-level security, and `anon`/`authenticated`/`service_role` privileges before promoting `main` to GREEN. The tests use synthetic identities and never claim a real customer has received an external message.
