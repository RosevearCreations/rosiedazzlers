# Rosie Dazzlers 858 — Cross-Plane Fresh Receipt Recheck, Conflict Handoff & Owner Recovery Export

Build 858 adds a source-local, **non-authorizing** recovery evidence trail to the original revoked-consent / incident-review workflow. It builds on the original signed transaction (855), independently signed external HOLD witness format (856), and original owner's historical signed-witness custody/readback (857).

## Cross-plane **fresh** signed observations

Original signed-in Rosie owner submits `POST /api/admin/jobday_recovery_858` with exact `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, `transaction_reference`, a new `review_nonce`, `action:"recheck_fresh_signed_plane_receipt"`, `plane`, the full **new** exact v856-format `receipt` and detached `signature`, plus `confirm_independent_fresh_ed25519_check:true` and `acknowledge_signed_observation_not_delivery:true`.

The route authenticates a real original owner session (no bridge/legacy fallback), rechecks source consent revocation, owner incident route/priority, current deployment revision, original transaction scope, complete bounded post/attempt/audit and evidence history, original Build 857 owner HOLD readback, distinct independent enrolled Ed25519 public signers, and v856 non-authorizing signed observation constraints. Each signature must bind the **current exact deployed Rosie SHA**, the original 855 per-plane signed source transaction, original booking/project/post/case/incident, a unique nonce and an observation no older than five minutes. Stale 857 historical receipts are **not** passed off as fresh. No private keys, bearer tokens or full external receipts are stored in the database; only immutable receipt/review digests and timestamps.

Each independent plane may record multiple genuinely new signed rechecks, but duplicate plane/receipt hashes, reuse of a review nonce and old timestamps are rejected. A two-plane assessment requires a fresh separately recorded AI Data Platform and Comms Hub row with distinct digests, each within five minutes. The assessment is **signed observation review only**, never proof of delivery, receiver ACK, or CONNECTED.

## Durable conflict escalation handoff

With both current plane receipts present, a recorded original 857 owner HOLD readback, a still-open original 856 replay conflict, and a new unique nonce, the original owner may `POST` `action:"record_conflict_escalation_handoff"`, `owner_action:"request_independent_master_recheck"` (or `"escalate_unresolved_conflicts"`), `confirm_independent_rechecks_current:true`, and `acknowledge_no_external_handoff_sent:true`.

This creates **one** source-local immutable escalation *request* digest, scoped to that exact transaction. It does **not** send to either Master or claim remote handoff/acceptance. The original Build 853 incident priority determines unchanged 857 conflict review-age bands: CRITICAL 4h, HIGH 12h, ELEVATED 24h, MONITOR 72h. Every original 856 conflict remains unresolved until independently proven otherwise; handoff does not resolve it.

## Original owner recovery acceptance export

With a prior immutable handoff, both fresh signed plane rechecks still current, and the two explicit owner acknowledgements, `POST` with `action:"export_owner_recovery_acceptance"`, `owner_action:"maintain_external_hold"` (or other listed non-authorizing follow-up), `confirm_original_owner_recovery_review:true`, `acknowledge_master_incident_hold:true`, and new `review_nonce` returns a sanitized owner export bundle plus SHA-256. The database records one durable `owner_recovery_acceptance_export` digest, preventing export replay. No customer media, raw receipts, or private signing materials are returned.

`GET /api/admin/jobday_recovery_858?booking_id=<UUID>&post_id=<UUID>&owner_case_reference=<ref>&incident_reference=<ref>&transaction_reference=<ref>` gives scoped source freshness, unresolved original conflict aging, and prior handoff/export digests. GET and POST always report `master_connection:"HOLD"` and unverified operational acceptance.

## Security and release

Apply `supabase/migrations/20261112160000_build858_fresh_recheck_recovery_custody.sql` only to the confirmed original Rosie project. Verify immutable table `rosie_recovery_custody_v858`, four indexes, RLS enabled, service-role-only SELECT/INSERT, explicit browser-role EXECUTE revocation on `rosie858_append_recovery_custody`, and automatic conflict-count / freshness / original 857 readback constraints. The SQL verifies row lineage and recent two-plane custody; the protected endpoint alone performs Ed25519 cryptographic verification. **Do not** directly insert source evidence or use mock receipts in production.

Run `node scripts/build858_fresh_handoff_export_test.mjs` and `bash scripts/current_jobday_custody_regression.sh` through the permanent protected Source Gate. Merge feature PR to dev only after required checks, then dev to protected main after all required checks, and verify the **exact main SHA** Cloudflare Pages Production six-job run, release health and production business acceptance.

**Boundary:** software production GREEN must not be conflated with original device, provider revocation, independent live Master transport/receiver durability, Master runtime connection, SLA resolution or owner incident closure. These remain HOLD pending actual independent evidence and separate owner authority.

## Next proposed build

**Rosie Dazzlers 859 — Independent Cross-Plane Escalation Receipt Return, Original-Owner Recovery Decision Review & Long-Lived Incident Continuity.**
