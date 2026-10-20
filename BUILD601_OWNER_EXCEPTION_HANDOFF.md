# Build 601 — Independent Recipient Acknowledgement Exception Review & Owner Follow-Up Receipt Handoff

Read-only owner exception review continuation of Build 600. The verifier **replays the full upstream Build 600/599 signed chain and off-repository pins** before validating an Ed25519 owner-signed exception review handoff and a separately controlled SHA-256 receipt pin.

Allowed owner review dispositions are REVIEW_EXCEPTION_EVIDENCE, REQUEST_RECIPIENT_CLARIFICATION, ESCALATE_INDEPENDENT_REVIEW, and DEFER_OWNER_HANDOFF. All decisions are metadata only; no customer data or raw signatures are exposed in the result.

Removed/forged receipts, wrong signer, invalid independent pins, timestamp rollback, altered claims and unsafe closure dispositions fail closed with HOLD. No external delivery, customer notifications, production audit release, bookings, payments or new Admin route are activated. Genuine owner custody and off-repository pinning remain operational prerequisites.

Test: `node scripts/release_incident_owner_exception_handoff_test.mjs`.
Production GREEN additionally requires full source gate, all mandatory checks, exact-main Cloudflare Production deployment and business acceptance.
Next proposed: Build 602 — Independent Owner Handoff Receipt Exception Reconciliation & Manual Review Continuity.
