# Build 592 — Independent Review Receipt Head Rotation Register & Explicit Owner Exception Closeout Rules

## Delivered
- Read-only, manually requested **review-head rotation register** that revalidates both the predecessor and successor independently pinned S3 Object Lock COMPLIANCE records with their exact immutable S3 VersionIds and SHA-256 content digests.
- Every rotation requires an explicitly signed Ed25519 owner receipt binding the exact previous/successor object keys, VersionIds, record/head digests, issue, owner approval reference and preceding rotation-receipt digest. Rotations must be ordered, distinct and contiguous. A separately retained external owner register pin must match the entire chain's last receipt digest, count and successor record digest.
- Separate **independent auditor** Ed25519 resolution evidence is required for any exception closeout review. Its independently pinned signing key must differ from the owner key. The auditor attests only to reviewed resolution *evidence*, not to a live database status.
- The owner must issue a **second explicit Ed25519 signed** `REQUEST_MANUAL_CLOSEOUT_REVIEW` record after the independent auditor attestation. Both signatures bind the same issue, incident, archived rotation digest and manual handoff digest.
- A closeout request fails closed for wrong issue, mismatched object/version, altered SHA-256 records, unanchored or missing rotation history, replayed/future signed receipts, stale/expired retention, mismatched independent signer identity and missing independently pinned handoff head. The verifier reads the immutable object and validates underlying Build 590–591 source signatures on every call.
- Passing all checks returns `OWNER_CLOSEOUT_REVIEW_CANDIDATE`, **not CLOSED**. Its flags are `explicitHumanDecisionRequired:true`, `auditHoldCleared:false`, `automaticClosure:false`, `externalWritePerformed:false`. The operator must independently establish real resolution before any separate operational closeout; this build makes no closure API or mutation available.

## Manual mode and customer wizard preference
The build is a provider-neutral source contract and deterministic tests using ephemeral keys/synthetic evidence only. No paid independent register or WORM account is configured, no actual owner/auditor signatures are generated, and no irreversible retention or customer data actions occur. No public or administrator wizard is forcibly enabled.

**Rosie Dazzlers booking wizard remains an optional guided process rather than a mandatory replacement** for the existing standard booking and administrative screens. This build does not alter the customer-facing booking workflow; future wizard UI implementation must preserve a standard/manual route and explicitly selectable wizard route. A genuine live wizard implementation is not claimed by this audit-only build.

## Verification
- `node scripts/release_incident_review_head_rotation_closeout_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (mandatory cumulative Current Source Gate).
- Protected `dev` → `main` checks; exact Cloudflare Pages production SHA and final Production Business Acceptance. GitHub merge alone does not establish Production GREEN.

**Next proposed: Build 593 — Independent Signed Closeout Decision Ledger & Owner Review Workbench Integration.**
