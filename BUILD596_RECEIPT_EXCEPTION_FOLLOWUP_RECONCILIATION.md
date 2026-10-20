# Build 596 — Owner Receipt Exception Follow-Up Evidence Register & Manual Reconciliation Decisions

## Delivered
- Independent, cryptographically signed **receipt-exception follow-up evidence** tied to the exact Build 595 recipient receipt, export digest, signed owner handoff review register head, repository/issue/incident, investigator reference, outside evidence reference, finding, and canonical observation time.
- Each verification **replays the entire Build 595 cryptographic chain**, including Build 594 redacted owner-approved export, distinct recipient Ed25519 signature, the SHA-256 linked manual owner review register, its external head pin, and earlier independent WORM/auditor/owner attestations. A caller-supplied `status: VERIFIED` flag or a mutable GitHub comment is never accepted as independent evidence.
- The investigator must have a **separately pinned Ed25519 signing key distinct from both the owner and recipient signers**. Investigations cannot be backdated before the latest owner review, be post-dated into the future, or be declared with unapproved finding values. Allowed findings are `RECEIPT_VERIFICATION_PENDING`, `DISCREPANCY_OBSERVED`, and `INDEPENDENT_RECHECK_RECORDED`.
- Owner reconciliation is **manual-only** and uses a complete Ed25519-signed SHA-256 predecessor chain of review receipts. Every revision binds the exact evidence digest, export, recipient receipt, current handoff register head, repository/issue/incident, owner decision reference, timestamp, sequence and prior decision digest. The independent owner follow-up register-head pin must match digest, count, evidence receipt, export, source review head and external custody reference.
- Permitted owner decisions: `ACKNOWLEDGE_EVIDENCE`, `REQUEST_ADDITIONAL_RECHECK`, `DEFER_FOLLOWUP_REVIEW`, `ESCALATE_FOR_MANUAL_REVIEW`. **No close/clear/override decision is available.**
- A read-only `receiptExceptionFollowUpWorkbench` presents the verified finding, owner decision history, latest action and next manual review step. It never creates signatures, transmits packages, modifies production exception statuses, closes audit holds or performs external writes.

## Activation limits
This is a provider-neutral **read-only verification contract and workbench data model**, not a live admin screen or automated external recipient integration. Tests use synthetic evidence and ephemeral keys. No real outside investigator, recipient, register custodian, paid archive, customer contact information, pricing, booking, payment, production route or owner approval is created or modified. Operational use requires independent signer custody and separately controlled signed evidence/register-head pins. No automatic delivery or reconciliation approval should be inferred from these tests.

Rosie Dazzlers' quote-first guided booking wizard remains **optional**, alongside the existing standard/direct booking path. No wizard/intake activation or payment handling is changed.

## Required release gates
- `node scripts/release_incident_receipt_exception_followup_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (cumulative source checks, includes Build 596).
- Protected GitHub `dev` → `main`, exact-main Cloudflare Pages Production deployment and final Business Acceptance, including runtime verification. Source GREEN alone does not establish Production GREEN.

**Next proposed Build 597 — Independent Follow-Up Register Head Retention & Manual Owner Reconciliation Handoff.**
