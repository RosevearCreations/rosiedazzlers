# Rosie Dazzlers 824 — Supervisor Review Handoff Continuity, Private Note Authorization & Accessible Freshness Recovery

## Source and data authority
The Build 824 handoff record uses the existing authenticated follow-up in customer_worksite_followups_v814, signed staff sessions and existing operations.assignment.manage authorization. Only admin or operations_manager with that action may GET or POST private notes.

The new private table customer_worksite_supervisor_notes_v824 is append-only through the app: INSERT/SELECT only for the server service_role, RLS enabled, all direct public/anon/authenticated privileges revoked. Every source-authenticated note stores actor_staff_user_id supplied by the server, followup revision, exception category, request_id for idempotent replay, and a timestamp. No customer endpoint reads this table. No social, email, SMS, booking, payment or dispatch action is taken.

## User journey
- An authorized supervisor loads the existing bounded queue and selects an actual currently visible follow-up. Without a verified owner/source or when the source is older than 15 minutes, source-backed Save and History buttons remain disabled.
- Private handoff notes of 12–500 characters are submitted using same-origin, cookie-authenticated POST, signed staff role+permission checks, validated revision and server-set actor. Duplicate requests can replay without another insert.
- Save is not confirmed in the UI until the exact returned note ID is found in the separately read-back private history, capped to 20 latest events.
- The last 20 source-backed notes are shown as inert textContent in the supervisor-only view. They are deliberately not copied into aggregate reports, customer views or browser storage.
- Build 823's unsent draft is held in page memory while refreshing, only if the same supervisor remains authorized. Changed/failed identity or access clears the local draft. Accessible source status and focus guidance tell the reviewer when to refresh and verify.
- Source timestamp remains advisory, not a real-time stream; no saved report can be trusted after expiration.

## Migration
Source: supabase/migrations/20261109002900_build824_supervisor_private_handoff_notes.sql.
Before treating private-note persistence as operationally accepted, verify the migration is present in the connected RosieDazzlers Supabase project and run independent authenticated supervisor/negative-role tests. A green Cloudflare deployment is not by itself a database or business-event proof.

## Acceptance
- node scripts/build824_supervisor_private_handoff_test.mjs
- bash scripts/current_booking_wizard_regression.sh (retained Builds 816–824 and earlier)
- python3 scripts/release_check.py
- python3 scripts/build413_workflow_efficiency_accessibility_check.py
- node --check assets/admin-worksite-followups-v814.mjs
- Protected PR to dev; separate protected dev→main PR; exact-SHA Cloudflare production and live-site smoke.

## Scope exclusion
No fake operational notes are inserted into production. Customer identity, authorization, source state, retention and real-device accessibility must be observed independently to claim complete operational acceptance. The module completion audit is tracked separately at docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md.
