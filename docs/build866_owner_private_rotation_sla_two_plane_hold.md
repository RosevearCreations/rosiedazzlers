# Rosie Dazzlers 866 — Original Owner Private Snapshot Custody Rotation, Independent SLA Escalation Receipt Correlation & Signed Two-Plane HOLD Exception Recheck

**Contract:** `rosie.ai-data.comms.private-owner-custody-sla-receipt-two-plane-hold.v866`

**Hard boundary:** This release only records original-owner-controlled, immutable, private local reference custody. "Rotation" changes the chained custody review reference, **not** a cryptographic signing/encryption key. Existing 863 "signed" rows are prior **offline references**, not live independently accepted receiver receipts. Even a matching signed-reference hash is **not** an external Master delivery, receiver ACK, CONNECTED transition, recovered consent, or incident closure. All operational states remain HOLD.

## Original owner API

`GET /api/admin/jobday_rotation_866` takes the same five exact `booking_id`, `post_id`, `owner_case_reference`, `incident_reference` and `transaction_reference` as 865; requires **current authenticated original Rosie owner** session and `manage_staff` capability. Legacy admin fallback disabled. It first delegates to the protected 865 readback, which independently checks original 864/863/862/861/855 conditions, revoked consent, open incident, 24h critical reference ages and existing private chain tips. It then checks newest exact original v864/v865 and per-plane v863 stored sources; no truncated history accepted.

The GET is read-only and returns a private 864 snapshot hash, three v866 immutable histories (bounded to fewer than 25 records each), current offline SLA receipt correlation and signed two-plane exception recheck. The snapshot must be provided separately by the owner to verify; the GET never recreates or leaks the private bundle.

`POST /api/admin/jobday_rotation_866` takes those identifiers plus a fresh 20–100-character `review_nonce`, `owner_action` (`maintain_hold`, `request_independent_sla_receipt`, or `escalate_independent_two_plane_exception`), `confirm_original_incident_still_open:true`, and `acknowledge_no_external_master_ack_or_closure:true`.

- **`rotate_private_owner_snapshot_custody`:** additionally `confirm_private_reference_rotation_only:true`, `confirm_original_owner_supplied_bundle:true`, exact owner-held `bundle` previously exported via v864. The SHA-256 is recomputed using the v865 protected verification function and must equal both latest immutable v864 export and latest independent v865 owner snapshot readback. Only the hash, source pointers, and per-kind prior v866 digest are retained; raw bundle and private key material are never stored. Result: `PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD`.
- **`correlate_sla_offline_receipt_references`:** additionally `confirm_offline_receipts_are_not_ack:true`. Correlates latest original v865 critical freshness and escalation reviews with two per-plane immutable original v863 signed offline reference rows, checks missing/stale (24h) and owner review disagreement. Results are `OFFLINE_SLA_REFERENCE_CORRELATED_HOLD`, `MISSING_OWNER_ESCALATION_RECEIPT_HOLD`, `MISSING_OFFLINE_SLA_REFERENCE_HOLD`, `STALE_OFFLINE_SLA_REFERENCE_HOLD` or `SLA_ESCALATION_REFERENCE_MISMATCH_HOLD`. No outbound receiver call is made.
- **`recheck_signed_two_plane_hold_exceptions`:** additionally `confirm_both_master_incidents_remain_hold:true`. Rechecks original v864 drift and latest v865 dispute escalation against independently retained v863 offline AI Data Platform and Rosevear Comms Hub signed-reference rows, with per-plane reference hash, identity, age and known source pointer checks. Results are `SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD`, `MISSING_SIGNED_TWO_PLANE_REFERENCE_HOLD`, `STALE_SIGNED_TWO_PLANE_REFERENCE_HOLD`, or `INCONSISTENT_TWO_PLANE_HOLD`. Existing disputes remain open.

## Atomic original RosieDazzlers Supabase custody

Apply **only** in the original RosieDazzlers Supabase project after v865: `supabase/migrations/20261112235500_build866_owner_rotation_sla_receipt_two_plane_hold.sql`.

Private `rosie_owner_rotation_v866` has RLS enabled with `anon`, `authenticated`, and `PUBLIC` privileges revoked; service-role-only SELECT/INSERT and invoker append RPC `rosie866_append_owner_rotation_hold`. The immutable trigger refuses update/delete. RPC locks original transaction scope, checks revoked consent and open 856 conflict, re-reads newest 864/865 owner predecessors, newest per-plane original 863 receipts, checks private snapshot lineage/24-hour ages/source hashes independently, requires exact prior per-kind hash chain and unique nonce, then appends atomically. Replay, missing original evidence, mismatched scoped source, concurrent predecessor drift and unauthorized writes fail closed. No secrets, raw snapshot, service key or external receipt payload are written to the table.

## Acceptance and release

`node scripts/build866_owner_rotation_receipt_exception_test.mjs` covers valid private rotation, changed SHA, wrong transaction, spoofed transport, bad previous chain, missing/stale or altered offline receipts, mismatched owner SLA and contradictory per-plane refs, plus digest/action rejection. Run `bash scripts/current_jobday_custody_regression.sh` for retained Builds 850–866 including syntax checks.

**Production GREEN requires** feature preview/source gates; merged protected `dev`; protected `main`; exact immutable Production Cloudflare commit; all four business acceptance jobs; combined business acceptance; exact-SHA deployment verification; and release health PASS. Independently verify main SHA and results — merge alone is not GREEN. **Master/incident HOLD remains even when software Production is GREEN.**

**Next proposed Build 867:** Original Owner Signed Custody Renewal Aging, Independent Plane Receipt Exception Routing & Protected HOLD History Retention Audit.
