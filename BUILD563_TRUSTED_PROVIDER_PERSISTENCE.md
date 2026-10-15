# Build 563 — Trusted Provider Adapters & Idempotent Private Acceptance Persistence
Adds a server-only orchestration contract for independently authenticated worker and consent adapters and an atomic ledger adapter. Rejects absent adapters, invalid scope, revoked consent, failed verification, DB failures, and conflicting existing evidence. A duplicate is accepted only when both scope identity and evidence digest match.

**Not a live integration:** Actual worker identity service, consent provider credentials, and database adapter are not configured or connected. The SQL migration from Build 562 must be approved and applied before a concrete persistence adapter can operate. The new module does not expose a browser endpoint or write a production database; tests use explicit injected mocks.

Public release is always HOLD. No media publication is performed.

Validation: `node scripts/daip_trusted_provider_persistence_563_test.mjs`.
Next proposed: Build 564 — Real Provider Credential Provisioning, Atomic Ledger Adapter & Runtime Acceptance.
