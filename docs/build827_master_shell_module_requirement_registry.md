# Rosie Dazzlers Build 827 — Master Shell module requirements registry (draft)

**Scope:** Source-owned, review-only registry proposed for later AI Data Platform denominator approval. **Not** a shared or accepted contract, an automatic score, a verified field survey, a signed Comms connection, or an approved product requirement baseline.

## Delivered

- Inventory of all **45** modules in the 2026-11-08 baseline with permanent module IDs, deterministic `rd-scope-v1-*` scope IDs and `rd-req-v1-*` requirement IDs. No array-index identifiers; no silent rename of previous module IDs.
- **39 distinct requirement criterion drafts** because customer, detailer and admin each have a common criterion across three **separately testable** desktop/phone/tablet scopes (45 total scopes, six repeated requirement IDs). A shared criterion does **not** mean one device's evidence proves another device.
- Every scope declares a proposed acceptance criterion, proposed functional owner role (not a named approver), role/device variant when defined, source hint, audit context link and explicitly **UNKNOWN** approved owner, scope, weight, evidence URI, numerator, denominator, and freshness. The existing 45 approximate built/proven percentages remain unchanged.
- Existing signed-supervisor, permission-controlled Build 826 `GET /api/admin/worksite_field_evidence_v826` adds a `requirement_registry_draft` field. If any of the latest 100 local source `module_review` events has a matching stable module ID, its event ID, short safe reference, recording time and decision state are attached as **operator-reported context only**. This is not original evidence, independent review, or Master Shell verification; bounded history is not a complete audit.
- Accessible search/filter table inside the existing `/admin-handoff-acceptance.html` and mirrored `/admin-handoff-acceptance/` route, with a manual private refresh. Source unavailability displays UNKNOWN; it never becomes zero or success.
- Dedicated negative/role, stable-ID, device deduplication, no-scoring, mirrored-route, and no-outbound tests incorporated into the cumulative booking regression. No new database migrations, provider calls, customer messages, stored browser data or business writes.

## Owner approval still required (no substitute from code)

For each requirement and applicable device/role scope, the product owner must explicitly settle:

1. **Acceptance wording** and whether the scope is in or out; new requirements must receive a stable ID, not be counted by changing a screen count.
2. **Assigned responsible approver**, approved weight and effective version/date. Unscoped/unknown is neither 0% nor 100%, and an out-of-scope requirement needs an explicit reason.
3. **Real evidence** with source ID, immutable or independently verifiable reference, collection time, origin/observer, verifier, review/expiry policy and any access restrictions. Do not put customer or staff personal data into a shared registry.
4. **Review decisions** including missing/contradictory evidence, device coverage, negative permissions, provider/accountant/customer/worker acceptance, rollback/recovery and reopen conditions.
5. **AI Data Platform acceptance** of the shared registry schema, version, authorized readers, denominators, weight math, freshness and audit policy. Rosie provides only source-owned evidence; AI Data owns suite-wide scoring.

Until those actions occur, `approvedNumerator`, `approvedDenominator`, `approvedWeightSum` and `completionPercent` stay `null`; `scoringAuthorized`, `evidenceVerified` and `masterOwnerApproved` stay false. A signed Rosie supervisor event by itself is not an original QL-365D trust receipt, a verified business process, or an independent device test.

## Source and integration boundaries

- Exact source `rosiedazzlers`, repository `RosevearCreations/rosiedazzlers`, owned-business **shell**; customer/booking records are not child sources.
- QL-364 handler and original `.well-known/rosevear-integration-manifest.json` remain unchanged. QL-365D original source owner/signer/witness/receipt proof is still **DISCONNECTED / HOLD**.
- `dataSentToAIPlatform=false`, `dataSentToCommsHub=false`; no event envelope, source signer, tenant grant, Comms route, canonical blocker, payment, finance, payroll, scheduling, customer or equipment status is modified.
- Software release acceptance (protected dev/main and exact production SHA) is independent of field/provider/owner/Suite proof. Even when the release is GREEN, requirement scoring remains UNKNOWN until approved.

## Verification

- `node scripts/build827_module_requirements_registry_test.mjs`
- `node scripts/build826_guided_field_evidence_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`
- `python3 scripts/release_check.py`
- `git diff --check`

Next proposed slice: **Build 828 — Evidence Provenance, Reviewer Decision Trace & Readiness Source Freshness**. It must not upgrade the draft references without actual independent source and approval evidence.

References: [45-module source audit](ROSIE_MODULE_COMPLETION_AUDIT_20261108.md), [Build 826 architecture gap](build826_guided_field_evidence_and_master_shell_gap_review.md), [approved forward queue](ROSIE_MASTER_SHELL_FORWARD_QUEUE_827_840.md), [QL-365D external handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).
