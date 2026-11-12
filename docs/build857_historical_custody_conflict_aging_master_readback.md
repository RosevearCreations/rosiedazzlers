# Rosie Dazzlers 857 — Historical Custody Revalidation, Conflict Aging & Owner Master HOLD Readback

Build 857 revalidates the independent **historical** signed delivery-witness evidence created in Build 856, adds bounded incident conflict-escalation age evidence, and lets the original signed-in Rosie owner record a durable readback that explicitly **does not** close the incident or connect any Master.

## Historical witness revalidation

`POST /api/admin/jobday_custody_857` with `action:"revalidate_independent_historical_witness"`, original booking/post/case/incident/transaction refs, `witness_856_id`, independent plane, the **original detached 856 signature and exact scalar receipt**, a unique `review_nonce` and both `confirm_historical_ed25519_signature_check:true` and `acknowledge_no_fresh_live_delivery_grant:true`.

The verifier finds the previously accepted immutable Build 856 original-source row, recomputes the canonical signed 856 SHA-256 with that row's **original source revision and original admission time**, verifies Ed25519 against its separate enrolled original-plane public key, and rejects mismatched source, nonce, receipt reference, prior Build 855 Master transaction, timestamps, signer identity, or digest. This deliberately does **not** reset timestamps to today or claim a fresh receiver ACK. Original independent signer keys must still be enrolled; missing/rotated keys fail closed. Never commit private signing keys, copies of raw signed external receipts, bearer tokens or customer records.

One revalidation per Build 855 transaction and plane; attempts to replay or substitute an old signature or tamper with the receipt fail. Table `public.rosie_custody_readback_v857`, its service-role-only `rosie857_append_custody_readback` RPC and immutable rewrite trigger store an owner-reviewed digest and source witness ID only.

## Escalation aging

Original incident priority/route must match Build 853 owner audit and current source route, with original Build 843 explicit consent revocation, complete expected-platform manifest, at most 20 posts, fewer than 200 attempts per post, and bounded 250-row original audit, 100-row master transaction, 100-row 856 ledger, and 100-row 857 review windows.

`conflictAging857` counts **all** original Build 856 replay conflict review events for that exact transaction as unresolved; an earlier owner action to request recheck is not treated as resolution. Review targets use existing original incident priorities (CRITICAL 4h, HIGH 12h, ELEVATED 24h, MONITOR 72h). From the oldest conflict timestamp, report `NO_CONFLICTS_RECORDED`, `OPEN_WITHIN_TARGET`, or `OPEN_ESCALATION_DUE`. No alerts are claimed delivered, no auto retry/recovery/remote transition is executed, and an overdue target does not mean the Master accepted an SLA breach.

## Independent owner Master readback

`GET /api/admin/jobday_custody_857?booking_id=<UUID>&mode=readback&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` returns a sanitized summary of historical independent plane revalidations, source conflict aging and any owner readback. It always reports Master `HOLD`.

`POST /api/admin/jobday_custody_857` with `action:"record_master_owner_acceptance_readback"` requires both independent historical plane reviews already durably present, the same exact original source transaction, a new `review_nonce`, `confirm_both_historical_master_witnesses:true`, `acknowledge_operational_master_and_incident_hold:true`, and one **non-authorizing** action: `maintain_external_hold`, `request_independent_master_recheck`, or `escalate_unresolved_conflicts` (only if original conflicts exist).

Database constraints prevent an owner readback without both previous independent historical revalidation rows, enforce the real Build 856 conflict count, and reject duplicate transaction readbacks/nonces. The result is `OWNER_MASTER_ACCEPTANCE_READBACK_HOLD_ONLY` with explicit `master_connection:HOLD`, `verified_fresh_live_receiver_ack:false`, `verified_remote_delivery:false`, `owner_operational_incident_closed:false`.

## Production acceptance

1. Apply migration `20261112150000_build857_custody_aging_owner_readback.sql` to the correct Rosie Supabase project; verify RLS, unique indexes, immutable trigger, service-only RPC, browser-role EXECUTE denied.
2. Run `node scripts/build857_custody_aging_readback_test.mjs` through the protected Current Source Gate along with Builds 850–856. Keep CI test receipts and generated signers synthetic only; never insert synthetic customer/source delivery data into production.
3. Merge feature to `dev` and protected `dev` to `main`, verify all required checks and exact deployed Cloudflare Production SHA plus release-health.
4. Operational owner incident closure, independent Master delivery/receiver proof, actual SLA delivery and three-Master CONNECTED remain **HOLD** pending actual external operator evidence and separate authenticated decision.

## Next queued build

**Rosie Dazzlers 858 — Cross-Plane Fresh Receipt Recheck, Durable Conflict Escalation Handoff & Owner Recovery Acceptance Export.**
