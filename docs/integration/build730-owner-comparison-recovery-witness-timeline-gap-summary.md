# Build 730 — Owner Comparison Recovery Presets, Witness Exception Follow-Up Timeline & Nonproduction Evidence Gap Summary

## Operator flow

The owner admin opens `/admin-followup-workload/` and uses the single Build 730
recovery workbench rather than reconstructing another deeply nested sequence.
Choose **owner**, **witness**, or **nonproduction**, and provide the original
Ed25519-signed Build 729 comparison, both chronological Build 728 review
snapshots, and the original shared Build 727 source. Enter a new 20–300-character
independent local review note and affirm the local-only/HELD disclaimer.

**Download local recovery bundle** saves a JSON file only to the operator's
device. Its 24-hour import window begins at creation; imports older than that
are rejected. The file is not encrypted and remains on the operator's device
until they delete it. No app database, browser storage, background scheduler,
or server-side recovery cache is created. Refreshing or clearing removes the
in-memory bundle; it cannot revoke a downloaded copy.

**Verify originals & sign HELD summary** uses the authenticated admin API.
The current signer custody audit verifies all four Ed25519 envelopes, current
server key, kind, build, age and SHA-256 digest. The server requires unchanged
729 → 728-before/after → shared 727 pointers; recomputes the original
comparison's stable claims; checks chronology and independently pinned review
roles; then signs only a new Build 730 review receipt. Failed verification is
HTTP 409 / HELD. The UI displays the resulting source/review/decision timeline
only from the verified response and downloads the signed summary locally.

The owner view shows previous/current local queue age, review window and
decision trail. The witness view shows local priority and whether a review
decision changed. The nonproduction view lists all five still-unresolved gaps:

1. `authentic_external_source_origin`
2. `verified_original_artifact`
3. `independent_custodian_approval`
4. `disposable_environment_and_rls_grants`
5. `retention_backup_observation`

## Authority boundary

The software's deployment can be GREEN while all real-world external evidence
and Proof-B gates remain **HELD**. A signature proves only integrity relative
to the currently pinned local review signer; it cannot prove external witness
identity, delivery, independent approval or original document provenance.
No external message, SQL, database mutation, original-document upload,
backup inspection, live record purge or ledger activation occurs.

The existing Build 727–729 panels and signed receipts remain readable; Build
730 is an additional consolidated recovery entry point, not a retroactive
rewrite of older evidence.
