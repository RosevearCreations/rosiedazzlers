# Build 561 — Signed Worker Evidence, Verified Consent and Supervised Private Acceptance
Adds a **pure fail-closed verification module**, not a connected public release endpoint. It validates a source-scoped worker receipt with ECDSA P-256 / SHA-256 using a public key injected by a trusted server, expects a separately verified fresh non-revoked customer consent assertion from a trusted consent service, and requires human private-media acceptance evidence.
The caller must first establish Build 560 scope and authenticated evidence. A direct browser-supplied public key or unsigned consent assertion is **not authoritative**. There is no configured trusted worker public key or consent-service adapter in this build and no real receipt claims are made. Even a successful isolated signature test only establishes cryptographic algorithm behaviour; it does not establish that any production worker rendered media.
All public publishing, exporting, storage mutation, and canonical public release remain HOLD.
Test: `node scripts/daip_signed_release_561_test.mjs`.
Next proposed: Build 562 — Trusted Worker Identity and Consent Provider Integration, Persisted Acceptance Ledger.
