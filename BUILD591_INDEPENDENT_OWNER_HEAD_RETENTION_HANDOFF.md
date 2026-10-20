# Build 591 — Independent Owner Review Head Retention & Manual Audit Exception Handoff

## Delivered
Build 591 builds on the signed owner-review continuity of Build 590 and the optional versioned Amazon S3 Object Lock COMPLIANCE adapter from Builds 582–583. It adds an **owner-approved, manual-only retention contract** and a read-only, cryptographically verified manual audit-exception handoff.

1. `verifiedReviewHeadEnvelope(...)` replays the entire signed, independently pinned owner-review receipt history and the underlying external exception register. It creates a canonical SHA-256 digest linking exact issue, exception-register digest, review-head digest and count, original owner signer fingerprint, independent review-head reference, and canonical issuance time.
2. `retainOwnerReviewHead(...)` refuses a write unless manually dispatched by `RosevearCreations` with explicit confirmation, an approval reference and pinned expected envelope/head/signing-key digests. It requires a versioned, independently controlled WORM adapter with conditional `createOnce`, `readVersioned`, and `retentionEvidence`; the exact version must be S3 Object Lock **COMPLIANCE**-locked for at least the approved 30–3650-day period and the retained JSON must match on read-back. Duplicate keys, missing versions, stale locks, unsupported providers and mismatch are HOLD.
3. A successful irreversible retention write reports **`WORM_RETAINED_EXTERNAL_PIN_PENDING`**, not independently verified evidence. The owner must separately record the returned **exact object key, VersionId, record SHA-256 digest, review-head digest and external owner reference** outside GitHub under independent custody.
4. `verifyRetainedOwnerReviewHead(...)` rereads the exact COMPLIANCE-locked object version, replays the Build 590 cryptographic history and checks the independently retained object pin. Only then can it report `INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED`.
5. `manualExceptionHandoffClaims(...)` supports only `REQUEST_MANUAL_REVIEW`, `ACKNOWLEDGE_OPEN_HOLD`, and `DEFER_HANDOFF`. `verifyManualExceptionHandoff(...)` **rereads the object and revalidates independent pins itself** (never trusts a caller-supplied VERIFIED flag), verifies a complete sequential Ed25519 owner-signed handoff history against the pinned owner key, and requires a separately maintained signed-handoff head digest/count/object digest. No exception can be closed automatically.
6. Every result explicitly forbids automated audit closure, escalation, retention changes or business actions.

## Activation and cost safeguards
**The build ships as a provider-neutral library with deterministic in-memory tests only. It does not configure an AWS account, deploy a WORM adapter, supply real keys, create a live owner signature, schedule irreversible writes, change GitHub issue comments or enable any paid retention operations.**

External owner approval, independently pinned signing keys, outside-of-repository evidence registers, an explicit manual invocation and real S3 Object Lock COMPLIANCE configuration are required for a live write. A claimed independent pin supplied from the same mutable GitHub source is not independently trusted. The operator is responsible for confirming that the S3 account and IAM role are independently controlled and the approved minimum retention period matches the real provider configuration. The adapter's interface and returned lock metadata are a validation contract, not proof of independent custody by themselves.

No custom production UI or new public endpoint is exposed.

## Test and release acceptance
- `node scripts/release_incident_owner_head_retention_handoff_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (imports Build 591 and all previous tests)
- Protected `main` source gate, exact Cloudflare Pages production SHA, and final business acceptance remain separately mandatory.

**Next proposed: Build 592 — Independent Review Receipt Head Rotation Register & Explicit Owner Exception Closeout Rules.**
