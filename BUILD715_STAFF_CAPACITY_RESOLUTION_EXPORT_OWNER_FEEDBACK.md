# Rosie Dazzlers — Build 715

**Staff Capacity Guardrails, Resolution Evidence Export & Owner Visual Feedback Closure**

## Shipped management workflow

The authenticated **Admin → Follow-Up Workload Command** now uses an actual protected
staff roster and bounded follow-up quote/event sources to project the queue effect of
assigning a saved quote to another staff member. Eligible roles stay restricted to
active staff authorized for bookings; reassignment writes remain limited to admins
and senior detailers.

1. Open a real saved quote in the protected Follow-Up Workload Command.
2. Select an active booking-authorized staff owner. The screen shows the projected
   count of assigned, overdue and critical follow-ups against advisory limits of
   6 / 3 / 2 respectively.
3. If a threshold is exceeded, review the staff member's actual shift schedule,
   document why the exception is justified with at least 20 characters, and select
   the explicit manager override checkbox. The server rechecks the same conditions
   and saves the projected numbers and override flag in the existing internal
   assignment event.
4. If the quote or event source reaches its 150 / 800 record limit, reassignment
   is **blocked even with an override** pending an independent full review.
5. A reassignment invalidates any earlier internal consent recheck. It never
   dispatches an email, SMS or other external customer notification.

These limits are conservative **queue-size thresholds**, not a measurement of
working hours, available shifts, skill suitability or safe physical workload.
No live staff schedule integration or hard labour-hour calculation is claimed.

## Real internal resolution evidence export

For a selected quote, a manager can choose **Export protected resolution evidence**.
This invokes a fresh authenticated, manager-only server readback, then downloads
JSON containing source marker references, current exception resolution readiness,
and bounded internal evidence event history. It excludes stored customer email and
telephone data, declares that it is not cryptographically signed, and is sent with
private no-store headers. If source history is incomplete, export is refused.

The export does **not** close a consent or escalation audit, prove delivery, grant
contact permission or constitute an independent proof-of-origin signature.

## Owner visual feedback closure (local receipt only)

The owner must actually test the live screen on the relevant device(s). They can
mark **Accepted** only after checking all five visual/permission/evidence items,
or choose **Issues found** to export an unresolved feedback record with observations.
The browser creates a dated JSON receipt locally. Neither outcome writes a server
acceptance, and the unresolved outcome remains open until fixes are verified.

Suggested walkthrough:

- Confirm cards and text remain readable in desktop and mobile views.
- Confirm the roster is current; attempt a normal reassignment, a flagged capacity
  override and a deliberately incomplete source in a safe nonproduction trial.
- Review whether the evidence download contains the selected quote's real events.
- Confirm another consent recheck is required after a manager changes ownership.
- Record the exact browser, device and any issues in the local feedback JSON.

## Boundaries and verification

- No new Supabase tables, public role escalation or outbound messaging.
- Protected writes continue to require manager identity, fresh exact source markers
  and audit-event confirmation.
- Tests: `node scripts/build714_rebalance_resolution_owner_acceptance_test.mjs`;
  `node scripts/build715_capacity_export_feedback_test.mjs`;
  `bash scripts/current_booking_wizard_regression.sh`.
- Owner visual acceptance is still **pending** until a real owner completes the
  walkthrough and retains their local receipt. No simulated approval is recorded.

## Next planned Build 716

**Staff Availability Source Integration, Signed Export Receipt Options & Owner Feedback Remediation** —
connect an explicitly verified scheduling source, consider independent export
attestation where a signer and custody are actually provisioned, and close only
issues confirmed by a subsequent real owner test.
