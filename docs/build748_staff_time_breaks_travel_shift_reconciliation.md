# Build 748 — Staff Time, Breaks, Travel & Shift Reconciliation

Build 748 extends the canonical `job_time_entries`, assigned Detailer App,
`booking_events` and Admin Crew Time & Payroll views. It adds **no new table**,
no wage or billing mutation, no GPS tracking, and no background timers.

## Assigned staff flow

1. Sign in to the Detailer App, select an authorized job and confirm the
   refreshed assignment. Clock-in is permitted for accepted/dispatched/on-site
   work, so travel can be recorded before Arrived.
2. Punch **Clock in**, **Travel start/stop**, **Service start/stop**, **Break
   start/end**, then **Clock out**. Server timestamps are authoritative; staff
   cannot silently backdate a punch. A second attempt with the same operation
   UUID returns the original row instead of inserting a duplicate.
3. Server-side state transitions flag missing punches, overlapping/duplicate
   phases, reversed timestamps and overlong shifts. The summary separates
   total shift minutes, service minutes, travel minutes and break minutes.
   Work+travel minutes are **candidates**, not paid hours. Idle/unclassified
   time is shown in total shift but never silently classified as work.
4. Submit only a fully closed, conflict-free shift. Submission is a
   deterministic booking-scoped audit receipt referring to the exact time-row
   revision. It never creates a payroll run or pays travel automatically.
5. Offline, assignment drift and uncertain write outcomes disable new actions.
   Staff explicitly reloads and reconciles. The same operation UUID survives
   an in-tab refresh for a deliberate manual retry; no punch is replayed
   automatically and no sensitive note is persisted in browser storage.

## Independent Operations review

- Crew Time & Payroll now has an operator-triggered list of recent shift
  submissions. A booking manager inspects the exact staff timeline, source
  totals, submission revision and exceptions.
- **Accept source** requires a complete matching revision and a written reason.
  **Return for correction** can record source drift and the actual issues.
- The submitting staff member cannot approve their own record. One
  deterministic review receipt per submission prevents repeated or
  contradictory decisions. After any source change, an earlier approval is
  visibly stale relative to current time entries.
- Review receipts are distinct from payroll posting and accounting. Existing
  manual minutes, work-state payroll summaries and posted payroll runs retain
  their existing ownership; new Build 748 zero-minute clock event types are
  deliberately ignored by the legacy payroll event-minute calculator, avoiding
  automatic double counting. An owner/accountant must separately decide
  compensable travel, break policy, statutory entitlements, overtime and any
  payroll adjustment under applicable Ontario law and approved business rules.

## Verification and honest limits

```sh
node scripts/build748_shift_time_reconciliation_test.mjs
node scripts/build747_photo_r2_consent_test.mjs
node scripts/build746_onsite_setup_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/mobile_detailer_field_workflow_check.py
python3 scripts/release_check.py
```

Software GREEN is not a real employee timesheet, a witnessed clock/shift
reconciliation, a wage-law decision, or an approved pay run. If simultaneous
distinct-device punches race, the reloaded event-state validation flags
conflicting transitions for independent correction; no background repair or
payroll mutation is attempted.

**Next queued:** Build 749 — Detail Quality Control, Customer Sign-Off & Exception Recovery.
