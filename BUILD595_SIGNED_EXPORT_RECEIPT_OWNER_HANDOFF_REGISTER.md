# Build 595 — Independently Signed Evidence Export Receipt Reconciliation & Owner Handoff Review Register

## Delivered
- Read-only, independently signed **recipient receipt acknowledgement**, anchored to the full Build 594 redacted evidence export and owner-approved manual handoff.
- The source verifies the **complete cryptographic ancestry** on each invocation: Builds 591–594 (independent WORM exact-version proof, owner-review rotation and external pins, independent auditor, explicit owner closeout review, signed owner decision register and metadata-only export).
- The recipient receipt is Ed25519 signed using a separately pinned recipient signing-key fingerprint **different from the owner signing key**. Its canonical claims bind exact export SHA-256 digest, owner handoff receipt SHA-256 digest, issue/incident, intended recipient reference, receipt reference, disposition and reception time. A receipt cannot predate the owner's approved handoff, exceed the signed expiry window or be dated in the future.
- Recipient dispositions: `RECEIVED_FOR_REVIEW` and `RECEIPT_EXCEPTION_REPORTED` only. These are attestations by the separately operated recipient; they **do not prove actual delivery** unless the recipient controls that key and independently confirms receipt. No real recipient credentials or live provider integration are configured.
- The **owner handoff review register** is a complete, sequential Ed25519 owner-signed receipt chain. Every revision binds exact independent recipient receipt digest, owner handoff digest, evidence export digest, issue and incident, owner review reference, timestamp, sequence and prior owner-register receipt digest. A separately stored independent register-head pin must match digest, count, recipient, source receipt and export.
- Owner review decisions are restricted to `ACKNOWLEDGE_RECEIPT`, `REQUEST_MANUAL_RECHECK`, and `DEFER_HANDOFF_REVIEW`. No release, audit-exception close, customer status, price, booking, payment or storage mutation is possible.
- `ownerHandoffReviewRegisterWorkbench` is a **read-only data-model summary**, not an admin UI route. It reports the latest owner review action, recipient disposition, exact evidence digests and manual follow-up. It always returns `liveExceptionStatus: UNCHANGED`, `auditHoldCleared: false`, `automaticDelivery: false`, `automaticClosure: false` and `externalWritePerformed: false`.

## Safety and activation
This build contains no live signer, external owner/recipient key, storage endpoint, automated email, independent register provisioning, upload, private data export or real customer request. Regression tests use ephemeral Ed25519 keys and synthetic records only. To operate the feature, an owner must independently establish custody of recipient/owner keys and register-head digest pins, and arrange the actual **manual** transfer and review, with any customer/privacy review separately approved.

The existing **quote-first booking wizard remains optional** alongside the standard/manual booking route. No booking wizard activation, intake flag, checkout or Stripe integration is changed.

## Required checks
`node scripts/release_incident_export_receipt_reconciliation_test.mjs` and cumulative `node scripts/release_health_monitor_test.mjs`.

Protected promotion through `dev` and `main`, exact-SHA successful Cloudflare Pages Production deployment, exact-source and Production Business Acceptance with runtime verification remain release requirements. Passing GitHub source checks alone is not Production GREEN.

**Next proposed: Build 596 — Owner Receipt Exception Follow-Up Evidence Register & Manual Reconciliation Decisions.**
