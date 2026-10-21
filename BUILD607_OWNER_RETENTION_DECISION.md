# Build 607 — Manual Owner Retention Follow-Up Decision Receipt Review

Verifies the complete signed Build 606 retention follow-up chain and the upstream Build 605–599 external pins. Accepts only an Ed25519 owner-signed manual decision receipt binding the verified retained head, exact independent follow-up receipt, prior owner acceptance, issue and incident, with separately controlled SHA-256 receipt pin.

Allowed dispositions: acknowledge for manual review, request owner evidence recheck, defer follow-up or escalate to independent review. Any tampering, stale timestamps, wrong signer, missing upstream pins or unsafe close action fails with HOLD.

Read-only verification only. Does not activate real signer custody, external WORM storage, an Admin route, delivery, automatic exception closure, audit release, bookings or payments.

Required: `node scripts/release_incident_owner_retention_decision_test.mjs` and full `node scripts/release_health_monitor_test.mjs`; protected source checks, exact-main Cloudflare deployment and business acceptance before GREEN.
