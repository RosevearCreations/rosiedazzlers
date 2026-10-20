# Build 602 — Independent Owner Handoff Receipt Exception Reconciliation & Manual Review Continuity

Build 602 verifies the complete Build 601/600/599 signing and independently pinned evidence lineage before accepting a separately signed Ed25519 independent review receipt. The reviewed receipt binds exact incident, issue, export, recipient ledger, owner follow-up head, owner handoff digest, action and canonical issue time. An independently controlled receipt pin must match every material head and review reference.

Allowed metadata-only outcomes: ACKNOWLEDGE_EXCEPTION_HANDOFF, REQUEST_MANUAL_RECHECK, DISPUTE_HANDOFF_EVIDENCE and DEFER_MANUAL_REVIEW. Invalid signatures, substituted heads, signer overlap with the owner, replay timestamps and missing off-repository pins fail closed. This is a verification contract, not a customer/Admin route or activated signer. No delivery, audit release, exception closure, booking/payment changes or external write is performed.

Run `node scripts/release_incident_owner_handoff_reconciliation_test.mjs` and the full `node scripts/release_health_monitor_test.mjs`. Protected branch checks plus exact `main` Cloudflare Production SHA and business acceptance are mandatory before GREEN.

**Next proposed: Build 603 — Independently Pinned Reconciliation Review History & Owner Manual Decision Continuity.**
