# Rosie Dazzlers Build 887 — Independent Scheduler Recurrence Closure Validation, Matured Evidence Coverage Certification & Owner Renewal Stability Governance

Build 887 provides a **fail-closed independent certification contract**, not a declaration that external original evidence has arrived.

## Certification prerequisites
- Obtain the complete, bounded original GitHub 885 audit and owner renewal issue inventories, with full pagination, count checks and bot authorship; never substitute samples or a mocked fixture.
- Verify **every** signed audit and original owner renewal against the original separately pinned Ed25519 key. Verify the renewals' exact hash links in order from genesis.
- Require source chain status `INDEPENDENT_RETENTION_CHAIN_VERIFIED` (normalized to the 886 `VERIFIED` state only after cryptographic verification), all 4h/24h/7d/30d source SLA horizons actually mature and VERIFIED, no stale audit, and a renewal linked to the exact latest signed audit body hash and checkpoint.
- Independent caller must verify original scheduler run inventory from original GitHub workflows, including completed outcomes and replay/duplicate detection, and independently verify the original owner closure ceremony. Set these flags to true **only** after actual readback; user-supplied booleans or fixture data are not proof.
- Any missing, immature, superseded, tampered, unlinked or unverified original evidence returns HOLD; no automatic original owner sign-off or external provider/source receipt is created.
- Run `node --test tests/build887_independent_closure.test.mjs`. CI software release GREEN requires protected checks, exact-main Cloudflare Pages Functions-aware production smoke, Release Health GREEN, and within-budget queue acceptance. **Original operational HOLD remains separate.**

Security boundary: `certifyOriginalClosure887` is a pure, read-only helper for a trusted server-side verifier after source readback. Never expose it as a client-authoritative endpoint and never feed raw unsigned comments, arbitrarily asserted `sourceInventoryComplete` or `originalClosureApproved` from browser input. GitHub comments are not WORM storage.
