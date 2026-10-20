# Build 588 — External Register Continuity Review & Operator Exception Decision History

## Delivered
- Pure, **read-only** verification of an independently signed and pinned sequence of external rotation-register revisions. Each revision must have a canonical Ed25519 signature, separately pinned key fingerprint, separately pinned SHA-256 register/head digests, exact incrementing sequence and predecessor register digest.
- Historical register entries must remain an unchanged prefix of later revisions. Changed/deleted receipts, register-head regression, timestamp rollback, missing revisions or truncated histories produce **HOLD**.
- The newest register must independently reconcile with complete GitHub handoff comments, detached signed archive/owner evidence packages, and their separately pinned signing-key fingerprints. A signed register by itself is insufficient.
- Distinct, externally pinned owner Ed25519 signature for manual exception decision receipts. Allowed decisions: `OPEN_REVIEW`, `ACKNOWLEDGE_HOLD`, and `DEFER_FOLLOWUP`. None authorizes release, evidence deletion, retention changes, WORM write, or closure of a failed audit.
- Signed owner decisions form a digest-linked chronological history bound to the exact current register sequence and digest. Changed/replayed/unsigned receipts, key confusion, future or out-of-order decisions, or missing continuity proof produce **HOLD**.
- Returns `READ_ONLY_OWNER_REVIEW_COMPLETE` only after continuity, all signed evidence and exception history verify. Output includes `externalWritePerformed:false` and `anyAutomaticExceptionClosure:false`.

## Safeguards and limitations
These are source-level reconciliation contracts and deterministic tests using **ephemeral keys only**. No actual independently hosted register, trusted signing keys, independent pin store, live issue comments or operator exception decisions have been provisioned by this build. Do not derive "independent" trust pins from the same GitHub repository or from the register being verified.

An operator exception is a **signed note**, not an override: failure of immutable evidence or register continuity must stay HOLD even when an owner acknowledges it. The only available action is to request manual investigation, not to silently recover or delete records. No AWS S3, R2, Cloudflare, payment, booking, or customer data mutation is performed.

Tests:
- `node scripts/release_incident_external_register_continuity_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (the required source gate imports the Build 588 test)

After GitHub protected main merge, verify the exact SHA Cloudflare Pages Production deployment, exact deployment verification and Production Business Acceptance source contract independently.

**Next proposed: Build 589 — Independently Anchored Operator Exception Register & Review Escalation Ledger.**
