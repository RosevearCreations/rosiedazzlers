# Build 582 — Trusted WORM Provider Configuration & Scheduled Evidence Retention Operations

## What is implemented
- Native Node.js adapter for **Amazon S3 Object Lock in COMPLIANCE mode** using the AWS CLI and short-lived GitHub OIDC credentials.
- Strict account verification via AWS STS; bucket Object Lock and versioning read-only preflight.
- Conditional PutObject (`If-None-Match: *`) with explicit COMPLIANCE retention, stored VersionId, object-retention verification, and exact read-back comparison.
- Weekly Monday 14:23 UTC **read-only** receipt collection and provider readiness checks, when enabled.
- Owner-only manual dispatch with two explicit approval fields and an approval evidence reference for permanent snapshots.
- Fails CLOSED when configuration, GitHub issue history, IAM access, Object Lock, retention, or readback evidence are unavailable. No rollback, merge, production mutation, or incident closure is inferred.
- Fixes Build 581 approval evidence reference validation (previously rejected documented references such as `approval:581`) and adds deterministic CI regression coverage.

## Before enabling (owner action, may incur costs)
1. Provision an independently controlled **AWS account** and an S3 bucket with **Versioning and Object Lock enabled**. Choose COMPLIANCE lock deliberately: protected versions cannot be removed during retention, even by account administrators; charges may apply. Do not use ordinary Cloudflare R2 lifecycle retention as a WORM substitute.
2. Set up a narrowly scoped GitHub OIDC IAM role with a trust policy restricted to **this repository, main branch and/or the dedicated GitHub environment**. Use minimum required STS, Object Lock and S3 read/write permissions only for the audit prefix; do not grant deletion or retention-bypass permissions.
3. Add repository Actions variables: `RD_WORM_ENABLED` = `true` only after setup, `RD_WORM_ROLE_ARN`, `RD_WORM_ACCOUNT_ID` (12 digits), `RD_WORM_BUCKET`, `RD_WORM_REGION` (for example `ca-central-1`), `RD_WORM_RETENTION_DAYS` (30–3650; default 90), and `RD_WORM_ISSUE_NUMBER` (the private release-incident GitHub issue).
4. The scheduled workflow runs read-only. To WRITE a WORM snapshot, manually dispatch **Build 582 — Trusted WORM Evidence Operations** from the main branch as the `RosevearCreations` account, check `write_snapshot` and `owner_approved`, and provide a documented `owner_approval_ref` such as `issue:123`. Those toggles are operator attestations, **not cryptographic proof of an independently signed approval**.
5. Review retained digest and version evidence. If provider evidence is unavailable, the workflow reports HOLD rather than claiming success. Subsequent writes of the same snapshot on the same date are rejected instead of silently replacing a locked object version.

## Security and limitations
The workflow is installed but will be **skipped** until `RD_WORM_ENABLED=true` and OIDC/storage configuration exists. No S3 account, bucket, role or spend is created by this build. Scheduled scans never write. Existing snapshots from Builds 580–581 are tamper-evident only; this adapter provides genuine Object Lock once provisioned. GitHub issue comments can still be edited/deleted, so future source divergence must be assessed against the archived digest.

No GitHub Actions job, test, or source merge proves Cloudflare Production GREEN. Require exact SHA Cloudflare deployment, runtime and business acceptance separately.

## Tests
- `node scripts/release_incident_trusted_retention_test.mjs`
- `node scripts/release_incident_s3_worm_adapter_test.mjs`
- `node scripts/release_incident_worm_operations_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (also the required current source gate)

**Next proposed Build 583 — Verified Audit Retrieval, Retention Expiry Review & Independent Owner Evidence Reconciliation.**
