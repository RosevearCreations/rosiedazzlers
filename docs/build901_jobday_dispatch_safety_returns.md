# Rosie Dazzlers Build 901 — Job-Day Dispatch, Safety Escalations & Equipment Returns

Build 901 extends original Build 900 workforce signoffs, original Build 899 equipment service plans and original Rosie booking + staff assignment authority.

## New operational modules
- Private Admin screen at /admin-jobday-dispatch.html. Signed staff see only assigned jobs; Admin / Operations Manager can review all original work orders.
- Same-origin private API at /api/admin/jobday_dispatch_v901. Append-only original PostgreSQL table rosie_jobday_events_v901 for escalation, supervisor resolution, dispatch authorization/HOLD, staff equipment return and supervisor reconciliation. All events are idempotent and linked to original booking/staff/item/safety signoff IDs.
- Signed assigned crew may raise safety concerns, and only the assigned tool holder may record the equipment return. Only Admin or Operations Manager with operations.assignment.manage can resolve escalations, decide dispatch, and reconcile returns. A reporter cannot resolve their own escalation.
- Every open escalation holds dispatch. A resolved escalation still requires a NEW Build 900 supervisor-ready signoff, followed by a new 901 dispatch decision. Any newer safety, prep, tool return or signoff event invalidates an older authorization.
- Return reconciliation requires a GOOD staff-reported return of every originally assigned tool plus no unresolved safety escalation. Supervisor reconciliation is internal evidence, NOT an independently verified physical inspection or stock movement.
- The existing real Detailer job_action dispatch/start/resume path now checks the new private ledger. Legacy jobs without any 901 events remain on their established workflow. Enrolled jobs require signed same-origin staff and current 901 dispatch authorization, with fail-closed on source errors. Canonical lifecycle, consent, quality and payment gates remain authoritative.
- This feature is not a physical lockout. Concurrent field changes still require real operator safety judgment, and no external certification is inferred.

## Privacy, database and applications
Migration: supabase/migrations/20261117010000_build901_jobday_dispatch_safety_return.sql. Row-level security and no direct anon/authenticated grants; server service-role SELECT/INSERT; immutable UPDATE/DELETE/TRUNCATE rejection triggers using the existing Build 899 guard. No customer details, payment, payroll, purchase, inventory quantity/GL, or Master event mutations. Cross-application protocol 1.1/1.0 remains compatible; no other application needs promotion.

## Release requirements
Run strict Build 901 source tests and retained 900/899 tests, verify private migration and triggers, pass exact dev Cloudflare and protected source checks, protected dev → main PR, production Cloudflare Pages/Functions + immutable and canonical HTTPS smoke, and release-health GREEN with queue WITHIN_BUDGET. Original physical and owner safety acceptance remains BUSINESS HOLD until observed and signed.

Next proposed Build 902 — Job-Day Exceptions, Supervisor SLA Timers & Verified Crew Handoff.
