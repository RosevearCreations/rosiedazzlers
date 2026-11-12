# Rosie Dazzlers 865 — Independent Owner Continuity Snapshot Readback, Critical SLA Freshness, Two-Plane HOLD Escalation

**Contract:** `rosie.ai-data.comms.owner-snapshot-freshness-two-plane-hold.v865`. This remains **original-owner-only non-authorizing** custody. Signed hashes, local snapshot readbacks, and source validation do **not** prove external receiver delivery, independent ACK, Master CONNECTED, recovered incident or consent restoration.

## Original owner endpoint

`GET /api/admin/jobday_readback_865` requires the original `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, `transaction_reference` and original-owner session. This invokes the original Build 864 GET, which validates original 863→862→861→855 booking/post/revoked-consent/incident/owner source; then reads exact latest 864 owner recovery, drift, private export, 863 per-plane signed offline reference records, critical owner follow-up, original disputed 861 planes and immutable new 865 history.

GET returns source-bound `original_critical_owner_sla_freshness`, `signed_two_plane_discrepancy_escalation`, latest private owner 864 snapshot SHA and three private immutable review histories. A `BOTH_PLANES_HASH_MATCH_HOLD` upstream status merely proves two already-admitted signed reference rows match the private hash anchors; it is **not** proof of new signatures, live Master delivery or ACK.

`POST /api/admin/jobday_readback_865` accepts the same five original identifiers, a fresh 20–100-character `review_nonce`, and original-owner capability `manage_staff` from an authenticated session (no legacy fallback). Three actions:

- `record_private_continuity_snapshot_readback`: pass exact `bundle` returned previously by owner Build 864 private export, plus `confirm_owner_supplied_original_bundle:true` and `acknowledge_no_external_delivery_or_ack:true`. Server recomputes `SHA256("ROSIE-864-PRIVATE-ORIGINAL-OWNER-CONTINUITY-HOLD-V1\\n"+JSON.stringify(bundle))` and checks against stored immutable v864 export `snapshot_sha256`. Validates original transaction and incident, source revision, latest 862 private snapshot, exact 863 owner reconciliation/critical IDs, 864 recovery/drift IDs and prior export chain. No raw bundle is stored in 865, only the protected digest and owner source chain. Does **not** authenticate future ACKs or reconstruct an external receiver.
- `record_protected_critical_followup_freshness`: original owner `confirm_original_critical_incident_open:true`, `acknowledge_no_operational_recovery:true`, and `owner_action` from `maintain_hold`, `request_fresh_original_owner_sla`, `escalate_to_independent_custodians`. Rechecks 48h+ original 860 exception age, latest 862 SLA, 863 critical owner follow-up and 864 owner recovery record age against 24h freshness. Missing, stale and fresh-*reference-only* states remain HOLD.
- `record_two_plane_hold_discrepancy_escalation`: `confirm_discrepancies_still_open:true`, `acknowledge_offline_readback_not_master_ack:true`, same allowed `owner_action`. Compares original 861 disputed-plane records to latest per-plane 863 offline signed references and 864 drift status, then retains an immutable non-closing escalation with missing, stale, hash drift or two-plane reference-only HOLD classification. No outbound Master requests.

Every response includes `master_connected:false`, `external_master_receiver_ack_verified:false`, `owner_incident_closed:false` and unchanged HOLD semantics. A failed private source review or revoked-consent change fails closed.

## Supabase original RosieDazzlers

Install after Build 864: `supabase/migrations/20261112235000_build865_owner_readback_sla_two_plane_history.sql` into the **original RosieDazzlers** project. Table `rosie_owner_readback_v865`: RLS enabled, no `anon` or `authenticated` SELECT/INSERT, service_role SELECT/INSERT only. Immutable BEFORE UPDATE/DELETE trigger, unique review nonce and per-kind per-transaction chained prior review digest. Only service_role may EXECUTE invoker RPC `rosie865_append_owner_hold`.

The atomic SQL RPC locks exact transaction, rechecks original revoked consent and open 856 conflict, latest 860/861 owner tips, latest critical 862 SLA, 864 recovery tip, 864 drift and latest export pointers; independently recalculates original critical exception age, 24h SLA/follow-up freshness or per-plane 861/863 signed claim/reference status before append. A private bundle digest is only saved when it exactly matches the latest immutable 864 private continuity export and all original owner pointers. It stores no private bundle and never asserts operational receipt/ACK.

## Regression and release

Run `node scripts/build865_owner_snapshot_freshness_escalation_test.mjs`, syntax-check both v865 JS modules and `bash scripts/current_jobday_custody_regression.sh` for retained 850–865 source authority. For GREEN: feature preview and source gates, dev exact deployment, protected main production merged, Cloudflare exact-SHA production, four business-acceptance suites and combined gate, exact-SHA production verification, and release-health PASS. Operational external receiver and original incident stay HOLD.

**Next proposed Build 866:** Original Owner Private Snapshot Custody Rotation, Independent SLA Escalation Receipt Correlation & Signed Two-Plane HOLD Exception Recheck.
