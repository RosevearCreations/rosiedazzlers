# Build 581 — Trusted Snapshot Retention & Owner Audit Evidence Operations

Adds an explicit fail-closed retention contract. A trusted external adapter must attest conditional immutable creation, storage retention lock and an independently managed trust root. An owner-approved snapshot is written once and read back byte-for-byte; mismatch, duplicate creation or absent capabilities raises HOLD. Owner audit lookup verifies the independent expected digest.

This is an integration contract and executable adapter acceptance suite, not a configured cloud WORM provider. A local in-memory mock is used **only for deterministic tests**. No production data is written; neither a snapshot nor stored audit proof is claimed until an independently trusted storage adapter and credentials are configured.

Tests: `node scripts/release_incident_trusted_retention_test.mjs` (also imported by the mandatory release-health source gate).

Next proposed: Build 582 — Trusted WORM Provider Configuration & Scheduled Evidence Retention Operations.
