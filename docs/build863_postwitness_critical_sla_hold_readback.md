# Rosie Dazzlers 863 — Independent Post-Witness Evidence Reconciliation, Critical Owner SLA and Protected Cross-Master HOLD Reference

**Fail-closed contract:** `rosie.ai-data.comms.post-witness-critical-sla-hold-readback.v863`. New records document a review of independently signed claims, a critical original-owner escalation, and a private per-Master **hash-reference witness**. They do **not** prove external ingestion, Master receiver ACK, a successful recall, operational discrepancy resolution, CONNECTED, or incident closure. An owner of the original Rosie incident must remain authenticated and consent remains revoked.

## Protected original-owner API

`GET /api/admin/jobday_postwitness_863` requires original `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, and `transaction_reference`. It invokes the original Build 862 GET (which revalidates 861/860/859/858/855, original revoked consent, incident route/priority, and original owner session), then reconciles the two independently signed v862 review witnesses to original v861 discrepancy claims. A two-plane witness **review** is still HOLD, never a resolved external discrepancy.

`POST /api/admin/jobday_postwitness_863` requires the same five original identifiers, a unique `review_nonce`, a current original-owner `manage_staff` session (legacy bridge denied), and one explicit action:

- `record_post_witness_reconciliation`: `confirm_witnesses_only_review_claims:true`, `acknowledge_no_master_ack_or_incident_closure:true`. Writes a fully source-linked immutable reconciliation with classification `NO_SIGNED_WITNESS_HOLD`, `PARTIAL_WITNESS_REVIEW_HOLD`, `BOTH_PLANES_WITNESS_REVIEW_HOLD` or `WITNESS_CONFLICT_HOLD`. Missing and conflicting evidence never becomes a positive result.
- `record_critical_owner_sla_follow_up`: only if latest original v862 SLA is **CRITICAL_HOLD** and oldest original 860 exception age is at least 48 hours. Requires `confirm_original_incident_still_open:true`, `confirm_critical_breach_owner_hold:true` and `owner_action`: `maintain_hold`, `escalate_critical_sla_to_original_owner`, or `request_fresh_external_custodian_evidence`. The critical incident remains unresolved and a stale 862 SLA recheck is identified after 24 hours.
- `record_protected_cross_master_hold_readback`: `plane` (`ai-data-platform` or `rosevear-comms-hub`), `witness_862_id`, exact canonical v863 signed `receipt`, detached Ed25519 `signature`, and explicit `confirm_independent_signed_hash_reference:true`, `acknowledge_no_external_delivery_or_receiver_ack:true`, `acknowledge_original_owner_incident_open:true`. Requires current **two-plane** 862 review coverage, an owner v863 reconciliation, a critical owner v863 follow-up and latest private v862 export. Each signed receipt binds the current original Rosie source revision, original incident, correct per-plane 862 witness/digest, latest SLA, latest private export digest **and export snapshot SHA**, latest reconciliation SHA, and latest critical follow-up SHA. Receipts are fresh (five minutes) and exact; any external-delivery or ACK disposition is rejected.

## Independent public verifier enrollment

- `ROSIE_AIDATA_HOLD_READBACK_ED25519_PUBLIC_KEY_863`
- `ROSIE_COMMS_HOLD_READBACK_ED25519_PUBLIC_KEY_863`

Both pins must be distinct and must not reuse 860–862 signer keys. **No private signer keys or customer data** belong in repository, browser or exported readback responses. A successful signed claim has disposition `offline_reference_only_no_transport_or_ack`.

## Database

Apply `supabase/migrations/20261112223000_build863_postwitness_critical_sla_hold_readback.sql` to the **original RosieDazzlers** Supabase project, after confirming v862 is installed. Creates `rosie_postwitness_hold_v863` with enabled RLS, service-role-only SELECT/INSERT and service-role-only `rosie863_append_hold_review` invoker RPC. Update/delete is prohibited by trigger. SQL validates original revoked consent, existing open 856 conflict, source-specific original 855→862 owner lineage, latest original owner exception, escalation and SLA tips, 48h critical evidence, independent two-plane witness reconciliation, immutable prior owner review SHA chains, one critical review per UTC day, and unique signed per-export/per-plane readback SHA. Exports never move to a Master from this route.

**Build 862 repair included:** passing `previousExport` into the v862 persistence helper prevents its prior export SHA from being referenced as an undefined variable.

## Verification and release

Run `node scripts/build863_postwitness_critical_sla_readback_test.mjs`, both v863 JS syntax checks, and `bash scripts/current_jobday_custody_regression.sh` (retained 850–863 tests). All source checks, Cloudflare dev/prod deployments, exact production SHA checks, business acceptance and release-health must pass for software **main Production = GREEN**. Independent runtime delivery, Comms receiver ACK, full Master acceptance and owner incident closure remain separately **HOLD**.

**Next proposed Build 864:** Independent Critical SLA Recovery Evidence Revalidation, Signed Two-Plane HOLD Readback Drift Monitoring & Original Owner Incident Continuity Export.
