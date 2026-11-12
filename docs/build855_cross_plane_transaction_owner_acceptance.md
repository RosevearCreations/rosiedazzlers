# Rosie Dazzlers 855 — Independent Master Transaction Replay Pilot, Cross-Plane SLA Resolution Proof & Owner Incident Acceptance

## Purpose and acceptance boundary

Build 855 adds a **non-authorizing** owner-only review for the AI Data Platform and Rosevear Comms Hub acting as separately signed evidence planes. Two receipt signatures and one atomic **Rosie source database** owner-decision row are not proof of an atomic cross-database transaction, external receiver delivery, a resolved escalation SLA, global social-platform removal, or verified Master CONNECTED.

## New owner endpoint

Private `GET /api/admin/jobday_transaction_855?booking_id=<original UUID>` returns bounded original booking/project receipt context, previous Build 854 Master HOLD response count, and sanitized cross-plane review history. It reports whether each public signer pin is configured, never a secret. It retains explicit `master_connection:HOLD`.

Private `POST /api/admin/jobday_transaction_855` requires a real signed-in original Rosie owner session (not browser bridge or legacy password), exact original booking, one linked creative project, one scoped post, original Build 843 consent revocation, complete expected-platform manifest, <=20 posts, <200 attempts per post and untruncated 250-row audit/100-row ledger windows.

Body parameters:
- `action: "record_cross_plane_transaction_review"`
- `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, `transaction_reference`, `prior_854_response_id`
- `ai_data_receipt`, `ai_data_signature`, `comms_receipt`, `comms_signature`
- `owner_review_decision: "accept_cross_plane_review_only"` or `"maintain_external_hold"`
- `confirm_independent_ai_data_and_comms_signatures: true`
- `acknowledge_no_remote_transaction_or_incident_closure: true`

Both receipts have the same immutable source, booking, project, post, case, incident, transaction, owner-audit UUID, previous 854 atomic response ID/digest, deployment SHA, and source SLA deadline. The `plane`, independent Ed25519 `nonce`, `signer_id`, and detached signatures differ. Both must have disposition `cross_plane_hold_observation`, permissions `review_only_no_runtime_grant`, fresh observed/issued/expiry timestamps and exact canonical signed schemas. Public signer pins:
- `ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855`
- `ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855`

Pins must differ from each other and from previous enrolled original and consumer identities. **Never** commit keys that can sign, bearer tokens, customer details or raw signed receipts. Missing keys and unverified receipts fail closed.

## Local transaction replay guard and SLA comparison

Migration `supabase/migrations/20261112081000_build855_cross_plane_transaction_review.sql` adds the RLS-protected, service-role-only `rosie_master_transaction_review_v855` append-only table, uniqueness indexes for transaction reference, incident, AI nonce, Comms nonce, and a rewrite-denial trigger. One PostgREST service-only `rosie855_record_transaction_review` RPC inserts both independently verified receipt digests and the exact owner HOLD review in **one local PostgreSQL transaction** via `ON CONFLICT DO NOTHING`. Existing Build 854 source Master receipt and original Build 853 owner audit are bound using foreign keys and server-side scope validation.

SLAs are calculated from original owner incident `created_at`, preserved source target 4h CRITICAL / 12h HIGH / 24h ELEVATED / 72h MONITOR. The two independently signed observation times are compared to the original source deadline and reported as `SIGNED_OBSERVATIONS_WITHIN_TARGET` or `SIGNED_OBSERVATION_AFTER_TARGET`. Neither classification implies actually delivered alerts, successful remote transaction replay, supervisor acknowledgment, or SLA resolution. Drift, stale timestamps, missing original custody, duplicate nonces, missing signatures and prior Master HOLD lineage all fail closed.

## Operational stages and evidence gates

1. Apply and verify migration in the correct **Rosie Dazzlers** Supabase project. Confirm restricted RPC, RLS, unique constraints, append-only trigger and sample duplicate rejection in a fully isolated transaction. Do not create artificial customer records in production.
2. Obtain separately issued **real** AI Data and Comms signed transaction HOLD observations with exact current Rosie SHA, matching prior Build 854 atomic source incident response and original Build 853 incident audit. This requires real controller integrations; this code does not generate those external receipts.
3. The original owner reviews both and chooses a non-authorizing decision, recorded once. Independently validate remote receiver durability, two-master retry/atomicity, delivery SLA resolution, consumer authority and owner final closeout before any operational state changes elsewhere. This build **cannot** assert those.
4. Run `node scripts/build855_transaction_replay_test.mjs`, `bash scripts/current_jobday_custody_regression.sh` and the protected Current Source Gate. Merge feature -> `dev` and separately `dev` -> protected `main` only with required checks GREEN; verify exact-SHA Cloudflare Pages Production and all six production acceptance jobs.

## Next proposed build

Rosie Dazzlers 856 — External Master Delivery Witness Admission, Cross-Plane Replay Conflict Recovery & Owner Incident Closure Evidence Export.
