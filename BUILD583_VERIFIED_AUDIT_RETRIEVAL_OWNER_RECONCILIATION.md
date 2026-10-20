# Build 583 — Verified Audit Retrieval, Retention Expiry Review & Independent Owner Evidence Reconciliation

## Scope
Builds 580–582 provide owner decision receipts, tamper-evident snapshots and optional AWS S3 Object Lock COMPLIANCE mode retention. Build 583 adds **read-only** exact-version retrieval and evidence reconciliation. It cannot unlock, shorten/extend retention, delete/archive objects, change production bookings, or infer release GREEN.

- Requires an **independently recorded owner manifest** with repository, issue number, exact S3 object key, VersionId, expected SHA-256 digest, predecessor digest (or null), original approval evidence reference and separate owner evidence reference.
- Retrieves exactly the supplied S3 VersionId, verifies Object Lock COMPLIANCE evidence and date, compares stored owner approval, exact SHA-256 snapshot and chain predecessor to the independently supplied manifest.
- Re-reads the complete bounded GitHub issue comment history. Changed/deleted historical comments produce **HOLD**; additional comments produce **REVIEW** for separate owner reconciliation; unchanged evidence remains eligible for VERIFIED.
- Expired COMPLIANCE retention is **HOLD** even if the object still exists. Retention within the configured warning window (default 30 days) is **REVIEW**. Active immutable evidence plus unaltered source becomes **VERIFIED**.
- Does **not** manufacture proof of independence. A GitHub repository variable or action input can be changed by an authorized actor. The manifest and digest MUST also be retained/checked outside this repository under independently controlled owner access.

## Optional weekly review
Workflow: `.github/workflows/trusted-worm-owner-audit-review.yml`. It is disabled unless `RD_WORM_AUDIT_ENABLED=true`. Uses short-lived AWS OIDC with a **separate read-only** IAM role (`RD_WORM_AUDIT_ROLE_ARN`) and runs Mondays at 14:41 UTC or manually. No S3 PutObject, DeleteObject, bypass, or retention-update operations.

Owner must first provision and configure the WORM account and S3 evidence from Build 582; costs may apply. Configure these repository Actions variables **only after** securely recording an independently maintained manifest:
- `RD_WORM_AUDIT_ENABLED`, `RD_WORM_OWNER_ANCHOR_CONFIRMED`, `RD_WORM_AUDIT_ROLE_ARN`
- `RD_WORM_AUDIT_KEY`, `RD_WORM_AUDIT_VERSION_ID`, `RD_WORM_AUDIT_DIGEST`, `RD_WORM_AUDIT_PREVIOUS_HASH` (optional)
- `RD_WORM_AUDIT_APPROVAL_REF`, `RD_WORM_AUDIT_INDEPENDENT_REF`, `RD_WORM_ISSUE_NUMBER`, `RD_WORM_EXPIRY_WARNING_DAYS` (1–365; default 30)
- Existing `RD_WORM_BUCKET`, `RD_WORM_REGION`, `RD_WORM_ACCOUNT_ID`, `RD_WORM_RETENTION_DAYS` from Build 582

`RD_WORM_OWNER_ANCHOR_CONFIRMED=true` is an operator assertion, not an independent cryptographic verification. Provisioning, IAM role scopes, expiry renewal decisions and real-world owner approvals remain manual.

## Tests
`node scripts/release_incident_audit_retrieval_review_test.mjs`
`node scripts/release_incident_audit_review_operations_test.mjs`
`node scripts/release_incident_s3_worm_adapter_test.mjs`
`node scripts/release_health_monitor_test.mjs`

All Build 583 tests are included in the protected Current Source Gate. Separate exact-main Cloudflare deployment, runtime and production business acceptance are still mandatory.

**Next proposed: Build 584 — Independent Audit Anchor Provenance & Evidence Rotation Decision Workbench.**
