# Build 753 — Owner Economic Exception Disposition, Source Correction Retest & Approval Receipt Review

Protected admin route: `/admin-economic-retest-v753.html` (and slash-index mirror), linked from Build 752 and the consumables job-cost screen.

## Review flow

1. A signed-in manager with the Build 751 `manage_staff` capability selects a completed-job month and captures a fresh baseline. The GET-only Build 753 endpoint invokes the source-qualified Build 752 reader and provides a server-generated read ID, timestamp and current SHA-256 source snapshot identity.
2. The manager separately clicks **Retest live sources**. The client independently refetches the private endpoint with `no-store`, compares the identical period and different read identities, and identifies unchanged evidence, newly appeared problems, disappeared problems, booking membership changes and source-field/catalog drift.
3. A disappeared exception is **not** corrected or closed. It remains HOLD until the owning source record, dated correction audit, actor and immutable financial/stock/travel evidence are independently verified. A changed fingerprint is a change observation, not a signed source receipt. No test-only source data is injected into production.
4. An owner receipt reference can be checked for structural match against the booking and **both** source hashes, proposed outcome, issuer reference and issue date. Even a perfect match produces `metadata_matches_authentication_missing`: it is not independently authenticated, not an owner approval, and never closes an exception.
5. The owner may download a local unsigned review packet, explicitly marked `UNVERIFIED_NOT_APPROVED` and `owner_approval_verified:false`. No receipt or review note is written to the server, browser storage, finance, payroll, stock or booking database.

## Release and business safety

- The endpoint accepts GET and OPTIONS only. Every mutation method returns 405. Build 752 -> Build 751 session/capability protection is reused before private data is read; no new database roles or tables are created.
- Original unit-cost ledger, completed job time, pricing guide vs actual revenue, package-size identity, and winter calendar restrictions are only compared; no approved discount, real net-margin result, source correction, or winter service availability is inferred.
- Owner-retained Basic Detail **Starting at** CAD 229/269/309 and existing HOLD boundaries remain unchanged.
- Build completion and successful deployment certify software readiness, **not** any unprovided external approval receipt. Actual closure requires owner authorization and independent source-authenticated proof through the owning workflow.

## Checks

`node scripts/build753_economic_retest_test.mjs` includes changed/unchanged snapshots, stale/duplicate read rejection, source drift, disappearing and newly appearing exceptions, receipt mismatch and metadata-only outcomes, unauthenticated read denial, mutation 405, navigation and route parity. Also run the current booking wizard regression, release validation and protected `dev`/`main` release gates with exact Cloudflare production commit and health proof.

Next Build 754 should be selected from genuine dated owner acceptance findings; no automatic Build 754 authorization exists.
