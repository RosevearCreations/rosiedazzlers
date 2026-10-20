# Build 587 — Independent Receipt-Head Pinning & External Rotation Register Reconciliation

## Delivered
The independent rotation-register verifier verifies an **Ed25519-signed external register** of the complete Build 586 handoff receipt history, a separately retained SHA-256 register digest and head digest, a separately pinned public-key fingerprint, exact ordered comment IDs and immutable object-version identities, and signed source evidence packages for **every** receipt.

Mandatory checks:
- Register JSON schema and bounded chronological receipt list (1–250), correct owner repository and issue, and exact final head digest
- Canonical Ed25519 signature verified against an independent pinned key; owner-controlled separate register/head digest and register sequence pin must agree
- Optional predecessor pinned register digest, with a strictly consecutive sequence, to detect rollback/replay and missing register revisions
- Exact GitHub owner-comment chain and equality of comment IDs, receipt digests, signed source evidence digests, audit version IDs, approval references, and successor links
- Each handoff reverified against detached signed archive/owner evidence with separately pinned archive and owner signing-key fingerprints
- Missing/edited/deleted comments, forged signatures, unexpected or truncated register revisions, unauthorized handoff-looking comments, absent external head/fingerprint, and any GitHub-only proof: **HOLD**

## Manual read-only operation (not activated in production)
A provider-neutral HTTPS external-register reader and manual CLI are available:
- `scripts/release_incident_external_rotation_register.mjs`
- `scripts/release_incident_external_rotation_register_test.mjs`
- `scripts/release_incident_external_register_review_cli.mjs`
- `scripts/release_incident_external_register_review_cli_test.mjs`

Run with `GITHUB_REPOSITORY=RosevearCreations/rosiedazzlers`, `GITHUB_REF=refs/heads/main`, `GITHUB_EVENT_NAME=workflow_dispatch`, `RD_EXTERNAL_REGISTER_REVIEW_ENABLED=true`, `RD_EXTERNAL_TRUST_BUNDLE_PATH` (an independently protected JSON path), `RD_EXTERNAL_REGISTER_URL` (external HTTPS endpoint), and an **issues:read-only** `GITHUB_TOKEN`.

An independently controlled trust file must contain:
`issueNumber`, `externalPublicKeyPem`, `externalSigningFingerprint`, `externalPin` with `registerDigest`, `headDigest`, `sequence`, and `externalReference`; optionally `previousPin`; and `signedEvidencePackages` each with `receiptDigest`, detached `evidence` (as defined by Build 585), and `trustedFingerprints` (`owner`, `prior`, `successor`). The verifier **does not create this file**, register, receipt, keys, or signatures.

**Caution:** A signature and matching SHA-256 are tamper-evident, not evidence of an independently administered append-only register. The register's storage, signer private key, public-key fingerprint, pins and signed packages must be operated under separately controlled owner trust/custody, preferably WORM. Files saved inside GitHub or fetched from the same external endpoint do not establish this independence. Signed register metadata and source comments are not publicly exposed by this release.

No AWS object, Cloudflare R2 object, production variable, webhook, scheduled job, owner signature, automatic rotation, retention extension, paid provider, payment, booking or customer data is changed by Build 587. Reconciliation is **read-only**, and production operation remains disabled until separately configured.

## Acceptance and release
`node scripts/release_incident_external_rotation_register_test.mjs`
`node scripts/release_incident_external_register_review_cli_test.mjs`
`node scripts/release_health_monitor_test.mjs` (both new tests imported in the required Current Source Gate).

After protected GitHub `main` merge, separately confirm exact-SHA Cloudflare Production Pages deployment and business acceptance. A green GitHub source gate alone does not prove runtime success.

**Next proposed Build 588 — External Register Continuity Review & Operator Exception Decision History.**
