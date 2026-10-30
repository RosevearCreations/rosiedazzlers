# Rosie Dazzlers Build 710 — Follow-Up Resolution & Consent Audit

## Staff workflow

1. In **Admin → Quotes**, select and save an actual linked quote.
2. Use the Build 709 panel to review staff-reported communication outcomes. Then select **Refresh follow-up and consent audit** in Build 710.
3. Compare current customer permission with retained staff snapshots. A profile update, preferred-channel switch, revised booking/quote, or changed staff outcome may make an earlier closure stale. Historical opt-in cannot be reconstructed from a timestamp alone.
4. Select a truthful closure reason: **no contact required**, **current contact not permitted**, or **actual response reviewed**. The response option is available only for a current, unverified staff-reported customer reply.
5. Enter a meaningful 12–300 character internal rationale without customer contact details, confirm the actual review, and record the closure. Use **Reopen for staff review** if a current closure needs new work.

## Safety, privacy and limitations

- Staff-only, authenticated `manage_bookings` events are appended to the existing `booking_events` table. No schema changes, client-side secrets or provider integrations.
- The server compares fresh quote, booking, profile, latest outcome and latest closure markers before every write. New changes make older closures non-current automatically. Duplicate current closures do not append another event.
- Historical consent snapshots show **changes in markers**, not a complete legal consent audit or proof of earlier opt-in. Readback is limited to the most recent 100 outcome/closure events and the existing 708 handoff window.
- A staff decision is **not** third-party delivery proof. No email, SMS, queues, dispatch, payment or booking modification occurs. Customer contact remains governed by current live permission and separately authorized channels.
- Cross-app Rosevear Comms Hub connectivity remains independently `DISCONNECTED / HOLD` and gift delivery remains paused.

## Verification

Run `node scripts/build710_followup_resolution_test.mjs` or the retained `bash scripts/current_booking_wizard_regression.sh` suite. The test includes unauthorized access, consent revocation, stale-write rejection, reason eligibility, duplicate suppression, reopening, safe no-contact storage and changed-booking invalidation.
