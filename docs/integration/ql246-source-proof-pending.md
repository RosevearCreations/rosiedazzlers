# Rosie Dazzlers — QL-246 source-proof PENDING (not a signed acceptance record)

**Source system:** `rosiedazzlers`  
**Repository:** `RosevearCreations/rosiedazzlers`  
**Business:** `rosiedazzlers`  
**Tenant:** `null`  
**Environment:** `nonproduction`  
**Owner authorization:** `NOT_GIVEN`  
**Connection state:** `DISCONNECTED`

This document is the **required exception report**, not `ql246-source-proof.json`. It does not assert a real operator challenge, Ed25519 signer or gateway test. No signed source proof may be published until every requirement below is independently verified.

**Build 693 readiness:** the admin-only public-envelope checker can verify Ed25519 canonical bytes
against separately configured SPKI SHA-256, immutable commit/CI and challenge expectations.
No pin, key, challenge, original witness or external test has been provisioned by this build.
Cryptographic verification of a synthetic fixture is never a source-of-truth receipt and does
not advance any row below from PENDING.

**Build 694 / QL-248 proposed proof-commit amendment:** The earlier audited/tested Git
`source_revision` in a signed payload **must not** be conflated with the later Git
`proofCommitSha` of the commit containing that signed proof file. A commit cannot contain
its own immutable SHA without creating a self-reference. The precise raw public JSON file
bytes fetched from the later proof-bearing Git commit must have a separately pinned
`proofSha256`, and its public signing key must have an independently authenticated DER
SPKI fingerprint. The CI URL identifies the **earlier audited source revision**. Both SHAs,
the raw digest, SPKI pin, source CI and fresh challenge must be separately authenticated.
This clarification is **PROPOSED** until the AI Data Platform consumer explicitly agrees.

Build 694 adds an owner-only, offline two-SHA checker scoped to Rosie public metadata. A
cryptographic match confirms neither immutable GitHub origin nor real denial receipts,
durable audit, revocation, authenticated owner identity, or consumer adoption. The six-app
Comms Hub bundle and independently acquired operator pin registry remain a separate
six-source review. This source repo has not published a `ql246-source-proof.json`; all
original nonproduction evidence, signer pins and authority remain **PENDING / HOLD**.

| Required item | Current state | Action outside this source build |
| --- | --- | --- |
| Immutable Git SHA | Source repository revision available after the release; not a signed proof | Operator pins exact immutable commit and its green GitHub CI run |
| Separate proof-bearing Git SHA and raw public JSON SHA-256 | PENDING; QL-248 clarification proposed | AI Data Platform consumer agrees to source/proof SHA separation; operator independently pins proof commit, raw file hash and confirms source-to-proof diff |
| App-specific Ed25519 key | PENDING | Trusted local app operator generates and privately stores a new key; no cross-app key sharing |
| Independent SPKI SHA-256 pin | PENDING | Operator sends DER-SPKI hash through a distinct authenticated route |
| Fresh `np-...` challenge and nonce SHA-256 | PENDING | Independent operator issues challenge securely, signs canonical 24 fields within one hour |
| Original `/api/integration/v1/health` GET | PENDING | Explicitly authorized **nonproduction** source/gateway request with original receipt and audit ID |
| Original `/api/integration/v1/capabilities` GET | PENDING | Same, no extra scopes or customer data |
| Original gateway audit + registered key IDs | PENDING | Independently retrieve nonsecret `np-...` references only after actual test |
| Seven original denial traces | PENDING | Witness nonce replay, stale request, cross-business, cross-tenant, revoked key, write and dispatch denials independently. All seven remain false/unverified. |
| Durable audit proof after restart | PENDING | Independently read original audit receipt after source restart |
| Signed metadata + independently authenticated fingerprint | PENDING | Verify exact immutable JSON bytes, canonical Ed25519 signature, one-hour expiration and out-of-band trust pin |
| Separate future owner approval | `NOT_GIVEN` | No pilot or live connection from this handoff |

Only source routes are `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities`. Both are nonproduction, HMAC-guarded and fail closed. No gift, customer, payment, SMS, booking, dispatch or operational write scopes.

For **all six apps**, QL-246 expects each repository's own immutable commit, independently authenticated Ed25519 SPKI pin and verified source-specific proof. Rosie cannot claim completion for AI Data Platform, Devil n Dove, Yard Workers, iCamp or Rosevear AI Hub. Their respective operator-controlled evidence and trust pins are external prerequisites.

This file is safe to share as an evidence-gap list. **Never submit it as a signed proof or as permission to connect.**
