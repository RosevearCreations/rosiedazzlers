# Rosie Dazzlers Build 815 — Worksite Follow-Up Aging, Supervisor Escalation & Customer Response Clarity

## Behaviour

- Staff response queue now displays advisory age bands: **under 24h**, **24–48h attention**, and **48h+ supervisor review suggested**. These are review cues, not contracted response deadlines. Time is based on saved `requested_at`, never an invented historical action or background schedule.
- Signed-in operations staff with `operations.customer.manage` can read the queue and private supervisor history. Only signed-in `operations_manager` or `admin` actors with `operations.assignment.manage` can manually flag, acknowledge, and clear a review. Every action is revision-checked and appended by a database trigger to an immutable audit table.
- Customer My Account shows a simplified `flagged` / `acknowledged` / `cleared` supervisor status and honest next-step guidance. Customer queries are restricted to follow-ups associated with their authenticated profile; staff identity, private reason, audit events and notes never leave the staff endpoint.
- No automatic escalation, SMS, email, Comms Hub activity, appointment, dispatch, payment or refund modification. Supervisor progress failure is displayed as unavailable; never misrepresented as no escalation.

## Authority and data

- Hosted source: Supabase project `cwxhhvwpilmrfwxirixx`. Confirmed migration history version: `20261108165832_build815_followup_aging_supervisor_escalation.sql`.
- New private tables: `customer_worksite_followup_escalations_v815`, `customer_worksite_followup_escalation_events_v815`.
- Tables have RLS enabled and direct `anon`/`authenticated` grants revoked. `service_role` alone can read/write authorized columns through verified server endpoints. Event rows are append-only with ordered transitions and source-associated actor IDs.
- An already-answered follow-up cannot be newly escalated. A pre-existing escalation is independent of the customer response state and retains its history.

## Verification

1. `node scripts/build815_worksite_followup_aging_escalation_test.mjs`
2. `bash scripts/current_booking_wizard_regression.sh`
3. `python3 scripts/release_check.py`
4. `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
5. Hosted DB checks: migration history, both tables' RLS and revoked direct grants, named audit triggers and latest security advisers.
6. Require protected GitHub `dev` and `main` PR checks to complete GREEN, then verify post-merge `main` SHA and its production workflow checks. No bypass of review gates.

## Next proposed build

**Build 816 — Supervisor Follow-Up Priority Inbox, Overdue Ownership & Customer Update Accessibility.**
