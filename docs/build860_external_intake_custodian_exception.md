# Rosie Dazzlers 860 — External Escalation Intake, Custodian Freshness and Owner Exception Review

Build 860 extends the revoked-consent incident lineage **855 → 857 → 858 → 859** with private original-owner review of independently signed external *intake observations*. A signed claim is not independently verified transport/delivery, a live receiver ACK, provider recall completion, incident closure, or Master CONNECTED. All operational flags are explicitly HOLD.

## Signed external intake correlation (no live transport)

The original signed-in Rosie owner calls `POST /api/admin/jobday_intake_860` with the original `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, and `transaction_reference`; `action:"record_independent_external_intake"`, `plane:"ai-data-platform"` or `"rosevear-comms-hub"`, a new unique `review_nonce`, the v860 `receipt` plus detached `signature`, `confirm_external_ed25519_correlation:true` and `acknowledge_signed_intake_is_not_runtime_delivery:true`.

The signed contract is `CONTRACT_860`, with the exact canonical fields in `functions/api/_lib/jobday-intake-860.js`. Each envelope binds the original 855 transaction, 858 handoff UUID and digest, one 859 independent return UUID and receipt digest, the exact original 859 owner decision and latest checkpoint UUID/digest, and the **current** deployed Rosie source revision. Its disposition is strictly `independent_review_hold_only`, not CONNECTED. Receipt times must be current within five minutes and unexpired. No unverifiable claims, future timestamps, stale receipts, signer substitution, replay, cross-source scope, or tampering are admitted.

The two custodian planes must each enroll an **independent public-only** Ed25519 verification key on the protected server:
- `ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860`
- `ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860`

Keys must be distinct from each other and any prior enrolled 856/859 witness pins. External private keys and full signed receipt payloads are never checked in or saved in the new ledger. This source-only API does not send requests to either external Master, mutate providers or claim any real transport verification.

## Independent freshness and continuity exceptions

`GET /api/admin/jobday_intake_860?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` loads bounded original source/consent/incident records, 859 independent signed returns and original owner decision, latest 859 continuity checkpoint, and 860 append-only custodian intake observations. It classifies two separate histories:
1. The two signed 859 custodian return records: **CURRENT** if within 24 hours, otherwise **STALE/MISSING**.
2. The two 860 independently signed current-source intake observations: **FRESH** if within five minutes with distinct receiver signers and hashes, otherwise **STALE/MISSING**.

Even if both are fresh, the original 856 conflict remains OPEN. Other explicit exception codes are `MISSING_INDEPENDENT_INTAKE`, `STALE_INTAKE_CORRELATION`, `STALE_OR_MISSING_859_RETURN`, `MISSING_CONTINUITY_CHECKPOINT`, `CONTINUITY_GAP_OVER_48H`, and `UNRESOLVED_ORIGINAL_CONFLICT`. Missing a real 859 checkpoint blocks new signed intake admission, but the owner may record a fail-closed exception review.

The original signed-in owner can `POST` `action:"record_original_owner_continuity_exception"`, new `review_nonce`, `owner_action:"maintain_external_hold"` (or `"request_new_independent_receipts"` / `"escalate_incident_continuity"`), with all three acknowledgements:
`acknowledge_independent_receipt_freshness_state:true`,
`confirm_original_incident_remains_open:true`, and
`acknowledge_master_receiver_still_unverified:true`.

The private service-role SQL function independently verifies exact 855→858→859 source/owner lineage, original revoked consent, open 856 conflicts, and current latest 859 checkpoint. It records at most one immutable exception review **per UTC date** with a SHA-256-bound predecessor ID/hash. Failure or changing evidence is HOLD, not silent recovery. `action:"export_original_owner_exception_review"` with `confirm_private_export_and_no_external_transport:true` returns a privacy-minimized SHA-256-hashed snapshot with the latest 25 recorded exception reviews, clearly marking the window as possibly incomplete.

## Database, release and security

Apply `supabase/migrations/20261112180000_build860_external_intake_custodian_exception.sql` only in the confirmed original RosieDazzlers project. It adds `rosie_external_intake_custody_v860`, RLS enabled, append-only trigger, receipt and daily owner exception uniqueness, service-role-only SELECT/INSERT, and invoker RPC `rosie860_append_intake_exception` with an advisory transaction lock; browser roles cannot call the RPC. SQL validates source lineage/consent and unique daily predecessor, while only the protected server checks Ed25519 signatures.

Run `node scripts/build860_intake_custodian_exception_test.mjs`, syntax checks for the protected library/route, and `bash scripts/current_jobday_custody_regression.sh` (retained Builds 850–860). Promote feature→dev only after protected source gate passes, dev→protected main only after full checks, and verify exact main SHA Cloudflare Pages Production, all six Business Acceptance jobs and release health. Software deployment **GREEN** is separate from external Masters/receivers/owner incident closure, all of which remain HOLD until real independently verified operational evidence.

## Next proposed build

**Rosie Dazzlers 861 — Independent Intake Exception Aging, External Custodian Discrepancy Evidence & Owner HOLD Escalation History.**
