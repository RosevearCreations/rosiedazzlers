# Build 599 — Independent Owner Handoff Exception Decision Receipt Export & Manual Review Follow-Up

## Delivered
- `scripts/release_incident_owner_handoff_decision_export.mjs` prepares a **bounded 64 KiB, metadata-only** export of the exact Build 598 independently verified owner handoff decision receipts, with repository, issue, incident, signed decision digest chain and exact cryptographic upstream evidence heads. No customer records, contact details, raw signatures, credentials, WORM payloads or private information are exported.
- Every preparation **re-runs the complete Build 598 Ed25519 verification**, including all source signatures and independent owner/reviewer/recipient trust pins and the exact COMPLIANCE-locked Object Lock VersionId readback. A caller-supplied `status: VERIFIED` never substitutes for original signed evidence.
- An external owner must independently **sign a manual export handoff** authorizing only a named recipient, exact SHA-256 export content and governance head, original independent reviewer receipt digest, approval reference, canonical signature time and expiry of no more than **7 days**. This package is a deterministic claim template; no application-generated owner signature, upload or delivery occurs.
- A separately controlled recipient reviewer key, distinct from the owner and prior independent reviewer key, must sign an **independent acknowledgement** binding the exact owner handoff receipt digest, export digest, governance head, destination, review reference, disposition and timestamp. Only `RECEIVED_FOR_MANUAL_REVIEW` or `ADDITIONAL_EVIDENCE_NEEDED` may be acknowledged; neither proves actual transmission or authorizes operational exception closure.
- The full prepared export, signed owner approval, and independent recipient acknowledgement are reconciled against an **off-repository digest pin** that binds export SHA-256, owner-signed handoff receipt SHA-256, recipient receipt SHA-256, original governance head, named recipient, and independently controlled reference. Missing, forged, expired, backdated, misrouted or tampered evidence fails closed with HOLD.
- `ownerExportFollowUpWorkbench` is a **read-only presentation model**, not a deployed Admin route. It shows the last owner decision, named review recipient, acknowledgement disposition and manual next step. It never sets a closed exception status, changes customer bookings, payments, pricing or triggers evidence transmission.

## Activation boundary
Tests use synthetic inputs and ephemeral Ed25519 test keys only. No live independent custodian or external archive, no paid WORM provider, no real owner/recipient signature and no delivery/approval was created. Actual independent custody must be supplied and managed outside this repository before any operational review. No automatic closure, override, dispatch, actual audit hold clearance or business mutation is possible.

The quote-first booking wizard remains **optional** alongside standard/direct booking. This security source-contract build does not change intake gating, active booking flows, deposits or Stripe.

## Required acceptance
- `node scripts/release_incident_owner_handoff_decision_export_test.mjs`
- `node scripts/release_health_monitor_test.mjs` (cumulative Current Source Gate; imports Build 599 tests)
- Protected `dev` → `main` gate, exact-SHA Cloudflare Pages Production check, exact production deployment verification, final Production Business Acceptance A–D suites and aggregate. Do not claim Production GREEN based on GitHub merge or source checks alone.

**Next proposed Build 600 — Independent Owner Export Recipient Acknowledgement Ledger & Manual Follow-Up Review Continuity.**
