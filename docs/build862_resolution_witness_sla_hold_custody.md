# Rosie Dazzlers 862 — Independent Resolution Witness, SLA Recheck and Durable HOLD Custody

Build 862 extends the source-scoped revoked-consent incident history **855 → 856 → 857 → 858 → 859 → 860 → 861 → 862** without granting any new provider, Master, or external receiver authority. An independently signed witness records that an *unresolved discrepancy was reviewed*; it does not prove transport, delivery, receiver ACK, provider recall, discrepancy resolution, incident closure, or Master CONNECTED. Operational state remains HOLD even after all receipts exist.

## Original-owner private endpoint

`GET /api/admin/jobday_witness_862?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` reuses Build 861's original-owner authorization, revoked-consent audit, original route/priority and original source/incident validations, then reads bound 862 history. The request must carry the current authenticated original Rosie owner session. All new writes likewise require `manage_staff` and disallow legacy admin fallback.

Supported `POST /api/admin/jobday_witness_862` actions share the five exact original IDs/references and unique `review_nonce`:

* `record_independent_resolution_witness`: `plane`, exact `discrepancy_861_id`, detached Ed25519 `signature`, canonical v862 `receipt`, `confirm_independent_signature_review:true`, `acknowledge_no_operational_resolution:true`. The receipt binds original 855 transaction, 858 handoff, 859 owner decision, latest 860 owner exception/digest, latest 861 owner escalation/digest, disputed 861 record/digest/plane, and currently deployed Rosie SHA. Only the signed-claim hash and minimal signer/evidence IDs enter the immutable ledger.
* `record_owner_aging_sla_recheck`: `owner_action` one of `maintain_hold`, `request_fresh_independent_witness`, or `escalate_to_external_custodians`, plus `confirm_original_incident_open:true`, `acknowledge_sla_recheck_is_hold_only:true`. The owner rechecks the first 860 exception's age and latest 861 escalation's time. The immutable SLA review is chained to the previous recorded SLA review and limited to one per UTC date.
* `create_durable_master_hold_custody_export`: `confirm_private_durable_export_no_master_delivery:true`, only after a private 862 SLA recheck exists. Produces a private, sanitized, bounded evidence snapshot and cryptographic `bundle_sha256`; the SQL ledger stores a SHA-256-backed manifest with current SLA and prior export custody pointers. It never transmits to either Master. A history truncation flag is retained rather than falsely claiming a full historical export. Missing a complete original owner history blocks export.

## SLA classification

Oldest original owner exception age **under 24h** is `OPEN_HOLD`; **24–47h** is `ESCALATION_DUE_HOLD`; **48h or older** is `CRITICAL_HOLD`. The latest 861 owner escalation older than 24 hours also triggers `OWNER_ESCALATION_RECHECK_OVER_24H`. Missing signed 862 witnesses is a review deficiency, not permission to close the underlying open conflict. Database RPC independently checks the first original 860 exception's age against the server-computed age (one-hour tolerance for clock boundaries), original open 856 conflict and the latest original owner 861 tip.

## Independent public signing pins

- `ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862`
- `ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862`

These two public keys must be distinct from each other and previously enrolled 856/859/860/861 custodian keys. Never store private keys, bearer tokens, detached signatures, full receipts, or customer media in source. The canonical fields, five-minute freshness bound, exact SHA matching and replay-safe digest code live in `functions/api/_lib/jobday-witness-862.js`.

## Database and promotion

Apply `supabase/migrations/20261112203000_build862_resolution_witness_sla_hold_custody.sql` to the **original** RosieDazzlers Supabase project after verifying 861 is present. It creates `rosie_discrepancy_review_v862` with RLS on, service-role SELECT/INSERT only, an immutable update/delete trigger, unique witness receipt hashes, unique daily owner SLA records, and private append RPC with advisory lock and prior-review/export hash-chain checks. Browser roles may not call its RPC.

Run `node scripts/build862_resolution_witness_sla_hold_test.mjs`, syntax checks on both v862 functions, and `bash scripts/current_jobday_custody_regression.sh` (retained Builds 850–862). Promote feature→dev→protected main only after required checks. Exact production **Cloudflare Pages**, six Business Acceptance jobs, exact-SHA runtime proof and release health must independently succeed before software deployment status is GREEN. Operational receiver or owner-accepted closure may still be HOLD.

## Next proposed build

**Rosie Dazzlers 863 — Independent Post-Witness Evidence Reconciliation, Critical Owner SLA Breach Follow-Up & Protected Cross-Master HOLD Export Readback.**
