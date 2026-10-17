# Build 567 — Provider Owner Decision Gate and Private Acceptance Evidence Crosswalk

## Purpose
Provide a **read-only, fail-closed owner decision packet** on top of Build 566. This is a bounded release of source documentation and review utilities, **not** a provider integration or operational approval. User requested deployment through dev/main; the code release is gated behind Build 566's independently verified Production GREEN.

## Explicit owner decisions still required
1. Select a trustworthy worker identity/signing provider. Document capabilities, pricing, signature/key rotation and data retention through an owner-reviewed process.
2. Select a consent authority with scoped, signed, expiring, revocable evidence. Approve retention/privacy handling.
3. Identify the approved staging and Production Supabase projects, responsible operator, backup/export, recovery, RLS/grants and rollback approach.
4. Explicitly authorize any staged application of Build 562 and 564 SQL, in dependency order, only after independent backup/recovery and staging verification.
5. Independently witness valid/invalid signatures, revoked/expired consent, atomic replay/conflict, source-bound digest and private operator review. Nothing in this build submits these tests to live services.
6. Verify the exact Git SHA, Cloudflare Development and Production deployments and business/runtime checks. Those code checks never substitute for provider, privacy or migration approval.

## Source-reviewed crosswalk
`assets/daip-owner-decision-567.js` exposes an immutable checklist of owner decision topics. Input is **only an array of known checklist identifiers**, never credentials, URLs, provider tokens, media, personal data or assertions of external success. Submission is merely marked *review noted*, not *verified*. No combination of submitted items clears operational HOLD.

## Migration and publishing safety
Build 562 `sql/2026-10-15_build562_private_acceptance_ledger.sql` and Build 564 `sql/2026-10-15_build564_atomic_private_acceptance_rpc.sql` remain unapplied unless separately reviewed and expressly authorized. No worker dispatch, storage writes, public media export/posting, booking, pricing, payment, or consent-state changes are permitted.

## Release sequence
Build 562 PR #354 → Build 563 PR #355 → Build 564 PR #356 → Build 565 PR #357 → Build 566 PR #360 → **Build 567**. Each predecessor must pass feature, `dev`, protected `main`, exact-commit Cloudflare production and runtime/business checks before the successor advances. Public publishing and operational provider activation remain HOLD after code GREEN unless separately approved and observed.

## Verification
Run `node scripts/daip_owner_decision_567_test.mjs`. The dedicated provider-owner-decision CI gate runs tests on the feature branch/PR. This build's acceptance is a truthful review packet, not proof that an external provider exists.
