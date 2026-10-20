# Build 604 — Owner Manual Reconciliation Follow-Up Head Rotation & Independent Review Retention

Build 604 re-verifies the signed Build 603 owner manual decision and every upstream independent signature/pin before checking an owner-signed Ed25519 head rotation receipt. The previous head must be the exact verified owner decision receipt digest; a new distinct SHA-256 head and separate independent rotation and retention pins must bind the identical issue, review history and rotation receipt.

This is a provider-neutral read-only verification contract, **not** an active immutable store, signer, route, delivery service or audit-hold release. Rotation does not authorize exception closure, external writes or payment/booking changes.

Tests: `node scripts/release_incident_owner_manual_rotation_retention_test.mjs`, `node scripts/release_health_monitor_test.mjs`; production GREEN requires successful protected source gate, merge to main, exact-SHA Cloudflare deployment and business acceptance.

Next proposed Build 605 — Independent Rotated Head Receipt Review & Manual Owner Retention Acceptance.
