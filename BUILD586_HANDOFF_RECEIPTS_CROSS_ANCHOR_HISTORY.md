# Build 586 — Rotation Handoff Receipt Persistence & Cross-Anchor Verification History

## Shipped
- Durable, **mutable** GitHub issue-comment handoff receipt format `RD-ROTATION-HANDOFF-V1`. Each receipt records the exact prior/successor S3 keys, immutable VersionIds, audit digests, signed owner approval reference, independently retained evidence references, and SHA-256 digest of the detached signed evidence package. No raw signed package or private signing key is posted.
- Persistence requires an authenticated GitHub owner token with `issues:write`, an explicitly confirmed **manual** owner invocation, separate trust-key fingerprint pins, and Build 585's valid Ed25519 owner approval plus both independently attested audit versions. Failed verification is HOLD, never a write.
- Conditional pre-write reconciliation with existing issue comments; chained receipt digests must link without gaps to the immediately preceding successor digest and VersionId. A new comment is verified by authenticated owner and exact-body readback.
- Read-only history checker rejects edited or invalid owner receipts, chain breaks, inconsistent issue identity and missing external head anchors; unauthorized commenter impersonations are excluded and flagged.
- Separate `reconcileCrossAnchorProofHistory` verifies **every** persisted receipt against an externally supplied signed evidence package, independently pinned owner and archive-key fingerprints, and the out-of-repository receipt-head digest. Without those independent values, status remains OWNER_REVIEW_REQUIRED, not verified.
- Tests cover unsigned/forged consent, wrong signing-key pins, edited comment, hash tampering, missing evidence, divergent history, invalid actor and failed GitHub API write.
- No automatic/scheduled handoff writes, cloud/provider retention changes, owner signature creation, payment or booking changes.

## Operator workflow
Source scripts:
- `scripts/release_incident_rotation_handoff_receipts.mjs`
- `scripts/release_incident_rotation_handoff_cli.mjs`
- `scripts/release_incident_rotation_handoff_receipts_test.mjs`
- `scripts/release_incident_rotation_handoff_cli_test.mjs`

The CLI is **read-only by default**. It requires `GITHUB_REPOSITORY=RosevearCreations/rosiedazzlers`, `GITHUB_REF=refs/heads/main`, `RD_ROTATION_ISSUE_NUMBER` and a narrowly-scoped `GITHUB_TOKEN`. For an authorized manual write, the owner must deliberately supply `RD_ROTATION_MANUAL_COMMIT=true`, `GITHUB_EVENT_NAME=workflow_dispatch`, `GITHUB_ACTOR=RosevearCreations`, `RD_ROTATION_OWNER_CONFIRMED=true`, `RD_ROTATION_OWNER_APPROVAL_REF`, `RD_ROTATION_SIGNED_PACKAGE_PATH`, and **three separately verified** signing-key fingerprints `RD_ROTATION_OWNER_FINGERPRINT`, `RD_ROTATION_PRIOR_FINGERPRINT`, `RD_ROTATION_SUCCESSOR_FINGERPRINT`. These environment controls are operator assertions; the real cryptographic authorization comes from detached signatures verified against independently pinned keys.

The independent head digest must be recorded in a trusted external owner register **after** writing, then supplied for later verification. GitHub comments can be edited or deleted and are NOT independent WORM evidence. A successful GitHub comment write does not prove S3 retention or authorize a real rotation.

## Release gates
`node scripts/release_incident_rotation_handoff_receipts_test.mjs`, `node scripts/release_incident_rotation_handoff_cli_test.mjs`, and cumulative `node scripts/release_health_monitor_test.mjs`.

**Next proposed Build 587 — Independent Receipt-Head Pinning & External Rotation Register Reconciliation.**
