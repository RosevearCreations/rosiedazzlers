# Build 580 — Privileged Receipt Collection & Audit Snapshot Integration

The source module `scripts/release_incident_audit_snapshot.mjs` provides an authenticated, read-only GitHub issue-comment collector with bounded pagination, explicit failures on denied access, and SHA-256 chained snapshots of receipt digests and derived decision states.

Snapshots exclude raw comment bodies and tokens. They record GitHub comment IDs, authors, update timestamps, body hashes, sanitized decision summary, rejected records and hash-chain predecessor.

**Important security boundary:** A hash chain is tamper-evident only when its head digest is kept in a separately trusted store. GitHub issue comments and workflow artifacts can be changed or deleted. This build does not provide immutable/WORM storage or claim real-world approved recovery, production incident closure, or live provider access. Persisting snapshot digests to externally enforced append-only storage requires separately configured retention and permission controls.

Run `node scripts/release_incident_audit_snapshot_test.mjs`. Cumulative `scripts/release_health_monitor_test.mjs` imports it within the required source gate.

Next proposed: Build 581 — Trusted Snapshot Retention & Owner Audit Evidence Operations.
