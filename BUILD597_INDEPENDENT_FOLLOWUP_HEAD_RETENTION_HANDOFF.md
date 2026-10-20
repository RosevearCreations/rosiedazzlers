# Build 597 — Independent Follow-Up Register Head Retention & Manual Owner Reconciliation Handoff

## Delivered
- A read-only, canonical `prepareFollowUpRetentionEnvelope` that **re-verifies Build 596's entire Ed25519 signed owner reconciliation**, including Build 595 recipient receipt and owner register, Build 594 bounded evidence export and owner handoff, previous independently retained exact S3 Object Lock versions and offsite pinned signer/ledger digests.
- The envelope contains **metadata and SHA-256 digests only**, never customer data or raw private evidence: repository, exact issue and incident, exported evidence digest, independently signed investigator follow-up receipt digest, final signed owner decision-head digest, decision count, independent register reference, independently pinned owner signing-key fingerprint and canonical issue timestamp. The envelope is internally content-digested.
- `retainManualFollowUpHead` can write an exact version only through an operator-supplied *independently managed* Object Lock **COMPLIANCE** adapter, conditional `createOnce`, explicit owner `workflow_dispatch` authorization, exact content/head/key pins, 30–3650 days of approved retention and mandatory immutable exact-`VersionId` lock and content readback. Duplicate/unversioned/expired/non-COMPLIANCE objects are HOLD.
- A created object is **not independently verified**: success returns `WORM_FOLLOWUP_HEAD_EXTERNAL_PIN_PENDING` until the owner securely records its immutable key, VersionId, record/content digest, follow-up head, investigator evidence digest, export digest, and off-repository reference.
- `verifyIndependentlyRetainedFollowUpHead` re-verifies all original signed source and re-reads exact COMPLIANCE-locked object version and independently retained pin. Failed content, lock, version, identity, head or offsite trust is HOLD.
- `verifyManualFollowUpHandoff` **re-verifies immutable retention itself** and accepts only a complete time-ordered, predecessor-linked Ed25519 owner-signed handoff history. Allowed handoff actions: `REQUEST_MANUAL_RECONCILIATION`, `ACKNOWLEDGE_OPEN_EXCEPTION`, `DEFER_MANUAL_REVIEW`. Independent owner handoff head must bind the exact object digest, follow-up head digest, issue and complete receipt count.
- Every result retains `liveExceptionStatus: UNCHANGED`, `auditHoldCleared: false`, `automaticClosure: false`, `automaticDelivery: false` and `externalWritePerformed: false` for *read-only* verification.

## Operational safety
These are provider-neutral **contracts and synthetic tests only**. No live paid Object Lock provider was configured, no irreversible external retention occurred, no real owner/recipient/investigator keys or signatures were generated, no evidence was transmitted, no exception was closed, and no bookings/customers/prices/payments were altered. No new admin page or worker/route is exposed. To activate, the owner must independently provide authenticated owner authorization, qualified WORM provider configuration and identity, sign outside this application, and separately custody the off-repository immutable object and handoff digest pins. This build does not imply those independent systems currently exist or are trustworthy.

The quote-first booking wizard remains **optional** beside existing direct/manual booking. There is no customer intake activation or wizard-route change.

## Acceptance
- `node scripts/release_incident_followup_head_retention_handoff_test.mjs`
- `node scripts/release_health_monitor_test.mjs`, with Build 597 imported and cumulative safety regression.
- Protected GitHub source checks and aggregate, exact-`main` Cloudflare Pages Production deployment, exact Production deployment checks and Production Business Acceptance before release GREEN.

**Next proposed: Build 598 — Independently Signed Follow-Up Handoff Receipt Review & Manual Exception Handoff Governance.**
