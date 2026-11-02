# Build 745 — Detailer Mobile Job Board & Safe Offline Continuity

## Delivered scope

- `/app/detailer/` groups authorized assignments by local service day and scheduled slot, with Today, Next 7 days, and All assigned filters. This is **schedule order, not driving-route optimization**.
- The Build 745 API scope requires a signed-in, active staff session and uses exact staff ID, email, or canonical crew membership. Name-only matches and legacy header-only bridge credentials cannot open this mobile view.
- Detailers see the minimum assigned-job fields needed for day planning, private staff instructions and stage workflow. Customer email, assignment identity fields, and trusted/device coordinates are not returned in the mobile board response.
- The existing Build 383 before/after-media and field checklist gates, Build 400 touch conveniences, and Build 432 next-action shortcuts remain authoritative. The timer and last viewed job are tab-memory-only on Build 745.
- The browser keeps the last successfully loaded job view **only in memory** when offline or after an ambiguous write. Job changes and live field tools are disabled until connection returns and a staff member manually refreshes and reviews current assignments, stage and notes. No persisted offline snapshot, write queue, background sync, or automatic replay is introduced.
- Build 745 job actions require a same-origin request, current staff session, exact assignment check, expected workflow stage, and `updated_at` optimistic compare-and-swap. Stale, unassigned, concurrent or unauthorized transitions fail before event/alert creation. Legacy integration clients retain their existing endpoint mode.

## Verification and boundaries

Run:

```sh
node scripts/build745_detailer_mobile_offline_continuity_test.mjs
python3 scripts/mobile_detailer_field_workflow_check.py
python3 scripts/build400_detailer_mobile_qol_retention_check.py
python3 scripts/detailer_staff_workflow_refinement_check.py
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
python3 scripts/sync_route_copies.py --check
```

The Build 745 test proves date/slot grouping, session-only and canonical assignment scope, response data minimization, cross-origin refusal, stale-stage/revision refusal, compare-and-swap conflict without duplicate events, an authorized action, and absence of browser-persisted job data or background replay.

### Explicit limits

- This is **not** an offline-editable app. Offline copies are for read-only in-tab orientation, not source truth or completion evidence.
- A manual refresh is required after every ambiguous network result; it may reveal a changed assignment or stage. The UI must not silently resubmit a request.
- A device may still have old browser session-storage keys created by historical Build 400/432 sessions. Build 745 does not read or write those job-scoped keys and keeps new convenience state volatile.
- No routing engine, dispatch capacity amendment, payment or payroll mutation, customer notification queue on reconnect, new schema, or device-location tracking is authorized by this build.
