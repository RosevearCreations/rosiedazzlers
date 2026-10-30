# Rosie Dazzlers Build 713 — Staff Workload & Audit Exception Command

## Owner walkthrough

1. Sign in as an **Admin** or **Senior Detailer**. In the protected Management dashboard choose **Follow-Up Workload Command** (or use the new Follow-Ups command rail tab).
2. Select **Refresh workload evidence**. Read four real-source metrics: active saved quotes, overdue tasks, 3+-day critical tasks, and queue-triaged exceptions. The staff table and comparison bars are based on the same bounded source readback. Unassigned/stale owners are grouped together. These are recorded assignment markers, not verification that an employee remains active or available today.
3. Select a flagged quote. The **live** drilldown separately loads the linked booking, current customer profile, current assignment, consent recheck, staff outcomes, resolution and escalation history. A queue flag is never interpreted as permission to contact someone.
4. Select the still-current exception and enter an actual 12–300 character manager note, excluding names of customers, contact details or phone numbers. Review the confirmation and click **Record manager exception review**. This records an append-only internal `booking_events` assessment. It does **not** close the task, change the booking, send a text/email or grant consent.
5. Choose **Open quote for staff action** to resolve the actual assignment, consent recheck, overdue escalation or internal consent audit using the earlier Build 711/712 flows. Refresh the workload and live exception view after changes.

## Security and accuracy

- GET/POST are authenticated through `manage_bookings`. Team-wide workload reads and exception assessment writes require an **admin or senior_detailer** role. No anonymous access, and detailer-only users cannot see the team-wide workload.
- The overview samples at most **150 active saved quotes** and **800 recent matching staff audit events**, ordered by newest first. Reaching either limit produces an explicit incomplete-history warning. It is operational triage, not a complete accounting of all follow-ups.
- Selected-case reads examine up to **250** booking events and fail closed for writing when that limit is reached. Closure and consent are recomputed from live quote, booking and customer profile evidence, not from queue counts.
- A review POST checks a fresh quote/booking/profile marker, last outcome, resolution, staff assignment, consent recheck, escalation event, and last exception-review event before appending its own event. Stale writes reject with HTTP 409. Re-reviewing the same current exception is idempotent at the application level. Concurrent writes are not claimed to be transactionally serialized.
- No schema migration, new table, provider messaging, outreach, automated GET polling, artificial metrics or gateway activation.
- The visual design builds on the charcoal/navy Rosie command theme, gold/cyan indicators, automotive hero photography, accessible labels and focus states. Desktop cards collapse into readable mobile sections; long staff/exception lists scroll independently.

## Verification

- `node scripts/build713_workload_visual_acceptance_test.mjs` (API authorization, stale recheck, queue math, consent drift, idempotency, no PII, protected UI and responsive source-code contract)
- `bash scripts/current_booking_wizard_regression.sh` (all retained booking and staff regressions through Build 713)
- Existing route-copy, release hygiene, source gate, Cloudflare and exact-SHA Production authority checks.

## Known business acceptance boundary

Automated checks can verify HTML/CSS structure and data behavior but cannot prove an authenticated human has reviewed the appearance on their actual devices. Record an owner acceptance on desktop and mobile after Production deployment. A manager exception assessment is **not** a customer communication or final consent audit closure.
