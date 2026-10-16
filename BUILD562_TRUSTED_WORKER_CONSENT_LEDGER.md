# Build 562 — Trusted Worker Identity, Consent Provider and Private Acceptance Ledger
Adds a **fail-closed contract** for trusted server verified worker identities and signed receipt digests, consent-provider verified derivative-scoped customer permission (revocation and expiry checked), and supervised Build 561 private acceptance. The provided schema defines an append-only RLS-enabled ledger with idempotency uniqueness by derivative and evidence digest.

**Truth boundary:** These are server-contract gates, not actual integrated provider checks. The contract must only receive assertions from separately authenticated, configured server adapters. This build does not connect a worker identity registry, consent provider or production database, and does not execute its SQL migration. No browser-supplied booleans may be treated as authentication. The evaluator never writes anything. Provider connection, migrations, persistence and live acceptance require a separately reviewed operational step.

All public release remains HOLD; a private ledger candidate is not permission to publish.

Test: `node scripts/daip_trusted_consent_ledger_562_test.mjs`.
Next proposed: Build 563 — Live Trusted Provider Adapters & Idempotent Acceptance Persistence.
