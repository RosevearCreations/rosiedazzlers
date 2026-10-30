# Rosie Dazzlers Build 712 — Escalation, Audit Closure and Command Surfaces

## Follow-up review

In **Admin → Quotes**, choose a saved quote linked to a real booking. Use the Build 711 panel to assign an active booking-authorized staff member and record a fresh live consent recheck. Use Build 712 to escalate the overdue task, enter an actual staff-review note, and record it. An **admin or senior detailer** can then review ownership, close the *internal consent audit*, or reopen it. A reopened audit requires another management ownership review.

Audit actions are append-only `booking_events` records, scoped to the live linked booking and requiring quote, booking, outcome, resolution, assignment, consent and latest escalation markers. A missing or changed source rejects a stale write. No user contact or consent grant occurs. Existing automatic communication and Comms Hub activation remain paused.

## Visual command workspaces

The reference-inspired Rosie visual treatment is scoped to five real-source staff views:

- **Management:** `/admin.html` (current dashboard figures and shortcuts)
- **Daily operations:** `/admin-operations.html` (actual appointment readiness)
- **Statistics:** `/admin-analytics.html` (existing analytics and exports)
- **I.T.:** `/admin-runtime-health.html` (local runtime evidence)
- **Status:** `/admin-system-health.html` (real diagnostic family states)

The style uses charcoal/navy cards, gold and cyan accents, existing Rosie auto-detailing photography, mobile navigation and preserved source-backed data. It does not create synthetic health numbers, auto-refresh polling, database changes, public I.T. routes or new integrations. Page templates and their slash-route copies share identical content.

## Verification

Run `node scripts/build712_escalation_command_test.mjs` and the canonical booking regression wrapper. A signed-in owner should test each protected command workspace on desktop and mobile and record one non-sending staff escalation workflow before treating the business action as owner-accepted.
