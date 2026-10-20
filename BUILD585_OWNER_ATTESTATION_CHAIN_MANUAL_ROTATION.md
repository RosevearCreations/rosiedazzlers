# Build 585 — Owner Attestation Chain Reconciliation & Manual Rotation Acceptance Safeguards

## Delivered
- Pure, read-only verification of **both** independently attested prior/successor snapshot manifests, each bound to its exact S3 immutable VersionId, digest and approval references.
- The successor SHA-256 predecessor link must equal the preceding snapshot digest; both live audit reviews must report VERIFIED with exact expected digest/version and ACTIVE retention.
- Explicit owner acceptance is a **separately signed Ed25519 receipt**, with an independently pinned owner signing key distinct from archive attester keys. The signed receipt binds owner, repository, issue, prior/successor VersionIds, keys, digests, owner evidence reference and approval timestamp.
- Invalid signature, mismatched trust root, replay or forged proof, expiry, duplicate object version, discontinuous hash chain and a premature/future owner approval produce HOLD.
- Missing owner receipt yields OWNER_SIGNED_APPROVAL_REQUIRED; valid independent receipt yields MANUAL_ACCEPTANCE_READY. This is NOT a storage-write, deployment, automatic acceptance, retention change, or claim that an owner actually signed any real data.

## Manual owner handoff
Independent key custody, fingerprint distribution, signed real-world approval and S3 Object Lock evidence must be provisioned and verified outside the GitHub repository. The module consumes these records; it creates none. The deterministic test keys are ephemeral and exist only in tests.

Owner should review the signed source and successor evidence independently before any operational record change. Never change retained COMPLIANCE-mode objects, reduce their lock, or infer closure from a decision receipt. Live provider integration remains disabled by default.

Regression: `node scripts/release_incident_manual_rotation_acceptance_test.mjs` and cumulative `node scripts/release_health_monitor_test.mjs`.

**Next proposed: Build 586 — Rotation Handoff Receipt Persistence & Cross-Anchor Verification History.**
