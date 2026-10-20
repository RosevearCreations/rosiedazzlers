# Build 594 — Manual Closeout Review Evidence Export & Owner Decision History Handoff

## Delivered
- Read-only, metadata-only evidence export that **re-verifies the entire Build 593 cryptographic closeout decision ledger** for every request. The underlying source replays Build 592 pinned rotation and manual owner handoff, Build 591 exact Object Lock COMPLIANCE versions, independent auditor evidence, owner closeout receipt, and chained Build 593 Ed25519 owner decisions.
- A bounded 64 KiB canonical JSON-ready export with exact repository, issue, incident, creation time, SHA-256 source evidence digests and ordered owner decision metadata (action, owner reference, signing time, signed receipt digest). **No raw signed evidence, customer contact, address, pricing, booking information, private keys, bearer tokens, personal information or automatic download** is included.
- The export is explicitly **review evidence, not proof that a live exception was closed**, and preserves `liveExceptionStatus: UNCHANGED`, `auditHoldCleared: false`, and `automaticClosure: false`.
- `manualEvidenceHandoffClaims` creates a deterministic canonical **claim template**, not a real approval. An independently held owner Ed25519 private key must sign the claims outside this application. Claims bind the exact export SHA-256, full decision-head SHA-256, source owner closeout receipt digest, issue, incident, named recipient reference, owner approval reference, issue time and expiry (maximum seven days).
- `verifyManualCloseoutEvidenceHandoff` recomputes the entire verified export and requires the **same separately pinned owner signing-key fingerprint** used by Build 593, a valid Ed25519 owner signature, a live non-expired consent window and a **separately controlled export/handoff head pin** (exportDigest, ownerHandoffDigest, decisionHeadDigest, recipientRef and independent external reference). Missing source, altered recipient, tampered signature, stale consent, wrong independent pin or unsigned data result in HOLD.
- `ownerEvidenceHandoffSummary` presents an advisory owner review view with the latest action and manual transfer next step. It never writes to GitHub, S3, Cloudflare, customer databases, Stripe, booking queues or operational exception records.

## Important trust and workflow boundaries
This build **does not activate an external archival provider, create an owner signature, independently custody a signing key, configure a live evidence recipient, transmit a package, clear an audit HOLD or close an exception**. In-memory tests use synthetic proofs and ephemeral keys. A successful test establishes that the implementation respects these contracts, not that actual independent evidence is provisioned.

The **quote-first booking wizard remains an optional guided route**, in addition to existing direct/manual booking. Build 594 does not change booking paths, enable the separate quote-first intake, or alter customer terms/pricing/payments.

## Regression tests and release
- `node scripts/release_incident_manual_closeout_evidence_export_test.mjs`
- `node scripts/release_health_monitor_test.mjs`, which imports all previous safety tests and Build 594.
- Protected GitHub `main` promotion, exact-SHA Cloudflare Pages Production deployment and production business acceptance are separately required before marking GREEN.

**Next proposed: Build 595 — Independently Signed Evidence Export Receipt Reconciliation & Owner Handoff Review Register.**
