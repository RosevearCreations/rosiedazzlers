# Rosie Dazzlers 864 — Critical SLA Recovery Revalidation, Signed Two-Plane HOLD Readback Drift, Owner Incident Continuity Export

**Safety and authority:** original Rosie booking/post, revoked social consent, exact original owner 855→863 incident and signed-in owner session, not a new Master delivery channel. All statuses remain **HOLD** for external delivery, receiver ACK, discrepancy resolution, original incident closure and CONNECTED. A stored "signed" v863 readback has signature admission lineage from Build 863; the 864 monitor independently rechecks immutable storage references and freshness, **not** a new signature or live Master ACK.

## Private original-owner API

`GET /api/admin/jobday_continuity_864?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` passes the exact identifiers and authenticated original-owner session through the v863→v862→v861 source validation. Reads original v862 SLA, original private v862 export, signed v863 per-plane HOLD reference rows and latest v863 critical follow-up/reconciliation, then returns:

- `critical_recovery_evidence_revalidation` with original 860 exception age, critical age over 48h, latest 862 SLA and latest v863 owner critical follow-up age, plus missing/stale follow-up issues. Never makes a recovery claim.
- `signed_two_plane_hold_readback_drift` with per-plane claimed v863 SHA, the latest original v862 private export snapshot SHA, correct owner reconciliation and critical follow-up pointers, and a 24-hour reference staleness test. `BOTH_PLANES_HASH_MATCH_HOLD` means **only that both protected offline references match**; no network delivery or verified runtime consumer.
- Immutable 864 recovery, drift and private original owner continuity export histories, limited to complete bounded windows; incomplete windows fail closed.

`POST /api/admin/jobday_continuity_864` must carry the same five original incident identifiers, a fresh unique 20–100-character `review_nonce`, current original Rosie owner `manage_staff` session and one of these actions:

1. `record_critical_recovery_evidence_recheck` with `owner_action` one of `maintain_hold`, `request_fresh_independent_master_references`, `escalate_owner_critical_sla_breach`, plus `acknowledge_critical_owner_incident_still_open:true`, `confirm_no_operational_recovery_or_master_ack:true`. Requires original owner critical 862 SLA evidence at least 48h old from first open exception and verified source lineage. Appends cryptographically bound non-closing review.
2. `record_two_plane_signed_hold_drift` with `acknowledge_signed_readbacks_are_offline_references_only:true`, `confirm_drift_is_not_master_receiver_ack:true`. Appends immutable latest export/reconciliation/critical-source-bound drift classification even if one or both planes are missing, stale or divergent.
3. `export_original_owner_incident_continuity` with `confirm_private_owner_hold_snapshot_only:true`, `acknowledge_no_cross_master_delivery_or_closure:true`. Requires latest 864 recovery and drift rechecks plus original v862/v863 evidence, and complete bounded owner history. Generates sanitized private owner continuity bundle, SHA-256 snapshot digest, latest review IDs/SHA and chained previous export SHA. The snapshot is returned only to the authenticated original owner; **it is never delivered to an external Master by this endpoint**.

## Durable SQL and security

Migration: `supabase/migrations/20261112234000_build864_critical_sla_two_plane_continuity.sql`. Apply to the verified **original RosieDazzlers** Supabase project, after 863 exists. New `rosie_owner_continuity_v864` table enables RLS; only service-role SELECT/INSERT and service-role-only security-invoker `rosie864_append_owner_continuity` RPC. No browser role access, no UPDATE/DELETE (explicit immutable trigger), unique nonces and export snapshot SHA replay protection. Atomic advisory lock and original PostgreSQL source rechecks validate revoked consent, open conflict, latest owner exception/escalation/SLA tips, exact 24h/48h SLA status, original per-plane signed 863 reference hash/owner chain drift, previous immutable 864 owner review SHA, prior export SHA and latest recovery/drift review IDs. Database does not accept non-HOLD operational state changes.

The new endpoint enforces private original-owner authorization *before* using the service role. Ed25519 public keys for original 863 admission remain configured separately; no new signing keys or external receiver runtime are fabricated.

## QA and deployment

`node scripts/build864_critical_recovery_drift_continuity_test.mjs`, `node --check` on both v864 modules, and `bash scripts/current_jobday_custody_regression.sh` (current 850–864 regression suite). Promote feature→dev→protected main; exact production **Cloudflare Pages**, four production business-acceptance suites, combined business gate, exact deployed-SHA verification and release health all must pass before **main Production = GREEN**. A GREEN code deploy does not change the original incident HOLD status.

**Next proposed Build 865:** Independent Owner Continuity Snapshot Readback, Protected Critical SLA Follow-Up Freshness & Two-Plane HOLD Discrepancy Escalation History.
