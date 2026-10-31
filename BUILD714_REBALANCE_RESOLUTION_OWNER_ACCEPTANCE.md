# Rosie Dazzlers Build 714 — Staff Workload Rebalancing, Resolution Evidence & Owner Acceptance

## Owner walkthrough on Production

1. Sign in to the Rosie Dazzlers management area as **Admin** or **Senior Detailer**. Open **Follow-Ups** from the command navigation and refresh the workload evidence.
2. Read **Staff workload distribution**. Counts are a sample of at most 150 active saved quotes and 800 events; they do not prove an employee is on shift or available. Select a flagged saved quote and verify the live booking/consent readback.
3. In **Rebalance Staff Ownership**, choose an active booking-authorized employee. The displayed load is advisory; verify their real work schedule separately. Enter a 12–300-character factual, customer-PII-free reason and confirm. A real `booking_events` assignment is saved using the established Build 711 event contract. The old consent recheck becomes stale; follow up in the quote pipeline and record a new internal consent recheck before any outbound customer communication.
4. In **Exception Resolution Evidence**, select a formerly reviewed exception only when a *later, genuine* assignment, consent recheck, or escalation audit source event demonstrates the remedy. Read the proof kind, write a factual note and confirm. The receipt is append-only and never closes an escalation audit or grants permission. Verify and close the separate audit in its existing workspace where actually eligible.
5. In **Dashboard Owner Acceptance**, inspect this screen on desktop and phone, confirm the five observations, enter the real reviewer name/device note, and download the local JSON checklist. No owner visual signoff is presumed by automated tests; this receipt is not uploaded or stored in the database. Retain it for the release trial and report any layout issues.

## Security and consistency

- Manager roster, detail and all Build 714 writes require `manage_bookings` plus `admin` or `senior_detailer`; detailers are forbidden from team-level review and rebalancing, even when authorized for ordinary quote assignments.
- The roster is fetched from active `staff_users` and validated *again* before reassignment. Neither roster counts nor owner suggestions imply live staff shift availability or maximum safe workload.
- Every write re-reads the live saved quote, booking, customer profile, prior assignment, consent recheck, outcome, resolution, escalation, exception review and resolution-evidence marker; conflicting snapshots reject HTTP 409. Truncated histories block writing.
- This remains append-only to the existing `booking_events` table. There are no new exposed tables, schema migrations, outbound SMS/email, inferred consent grants, or silent audit closures. The application-level recheck is not a database transaction lock: simultaneous independent writes can require further reconciliation.
- Exception evidence is accepted only if a post-review source event actually demonstrates the relevant remedy. A due-date shift or a newly stale audit alone cannot be reported as remediation. Evidence automatically loses its **current** label after relevant source history changes.

## Acceptance evidence

Automated checks cover source-based staff load, anonymous/detailer denial, active roster eligibility, manager-only writes, stale markers, no customer contact information in audit notes, assignment invalidation of consent rechecks, actual event linkage, idempotency, and responsive source-code contracts. They do **not** replace a real owner visual trial or prove a customer has been contacted.

Source tests:

```sh
node scripts/build714_rebalance_resolution_owner_acceptance_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
python3 scripts/admin_ui_audit.py
python3 scripts/release_hygiene_check.py
python3 scripts/sync_route_copies.py --check
```
