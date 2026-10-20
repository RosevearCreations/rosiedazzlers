# Build 590 — Owner Escalation Receipt Provenance & Exception Review Continuity Governance

## Delivered
- A read-only Ed25519 **owner escalation review receipt** verification contract. Allowed signed review actions: `ACKNOWLEDGE_REVIEW`, `REQUEST_FOLLOWUP`, `DEFER_FOLLOWUP`. No action can close an audit HOLD, execute a production release, rotate archive versions or bypass immutable retention.
- Every receipt is cryptographically signed by the separately pinned owner key, binds repository/issue, **exact independently signed external exception-register digest and sequence**, the exact previously verified exception decision digest, owner review/evidence references, canonical review time and preceding signed-review receipt digest.
- Complete ordered history must pass Ed25519 signatures and SHA-256 predecessor chaining, with no replay, out-of-order review, stale unrecognized decision, future date or missing record.
- An **independently maintained off-repository review-head pin** (`headDigest`, `receiptCount`, `exceptionRegisterDigest`, `externalReference`) must match the fully verified receipt history. A hash head saved only in GitHub is not independently trusted.
- The owner review public key fingerprint must match the separately pinned owner signer from Build 589 and differ from the independent exception-register and rotation-register signers.
- Verification calls `verifyExceptionRegisterHistory` internally using its **full cryptographic evidence**: no caller-provided `status: VERIFIED` substitute or unsourced audit closure is accepted.
- Optional advisory `reviewContinuityGovernance` rechecks the signed history and produces per-incident latest-review status, review-due flags and a bound register digest. Owner acknowledgement/defer records **never** set `auditHoldCleared` or authorize automatic closure/escalation.

## Trust boundaries
This is a source-level, provider-neutral verification and governance contract. Deterministic tests use ephemeral Ed25519 keys and synthetic records. **No actual owner signature, audit head pin, independently administered register, storage provider, external notification, scheduled job, customer record, price or payment has been created or modified.** Before operational use, an owner must independently custody the pinned key and review-head digest, authorize the review, and secure the signed receipt chain outside GitHub. A GitHub variable or fetched signature alone cannot establish the needed independent trust.

Read-only source:
- `scripts/release_incident_owner_escalation_review.mjs`
- `scripts/release_incident_owner_escalation_review_test.mjs`

Tests:
- `node scripts/release_incident_owner_escalation_review_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (includes this Build 590 acceptance test in the required source gate).

Protected `main` promotion and exact-SHA Cloudflare Pages, Production Business Acceptance and runtime verification remain necessary for an honest release GREEN designation. Owner review receipts are not automatically generated or persisted by this build.

**Next proposed: Build 591 — Independent Owner Review Head Retention & Manual Audit Exception Handoff.**
