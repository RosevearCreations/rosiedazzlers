# Build 584 — Independent Audit Anchor Provenance & Evidence Rotation Decision Workbench

## Delivered
- A pure, read-only Ed25519 signature verification contract for the exact archived manifest from Build 583.
- The verifier requires a separately established, pinned SHA-256 fingerprint of the independent public key. Supplying a new key and matching fingerprint from the same mutable GitHub source is NOT independent provenance.
- Signed claims bind repository, issue number, S3 key/VersionId, snapshot digest, predecessor digest, owner approval and independent record references, signer and signing time.
- Owner rotation decision states: HOLD, OWNER_REVIEW_REQUIRED, DEFERRED, ROTATION_PROPOSED. These are advisory states, never external storage mutations.
- The proposed successor must link to the previous digest, and needs its own independently signed provenance and COMPLIANCE Object Lock evidence before activation.

## Security boundary
This source release supplies deterministic tests with ephemeral signing keys, NOT a production signing key, signature, independent evidence archive, immutable object or retention extension. A GitHub variable or owner name alone is not an independent signature. The trusted fingerprint must be pinned and checked outside the repository. No WORM costs or live customer changes are authorized.

Tests: node scripts/release_incident_anchor_provenance_test.mjs and node scripts/release_health_monitor_test.mjs.

Next proposed: Build 585 — Owner Attestation Chain Reconciliation & Manual Rotation Acceptance Safeguards.
