# Rosie Dazzlers — QL-246 source-proof PENDING (not a signed acceptance record)

**Source system:** `rosiedazzlers`  
**Repository:** `RosevearCreations/rosiedazzlers`  
**Business:** `rosiedazzlers`  
**Tenant:** `null`  
**Environment:** `nonproduction`  
**Owner authorization:** `NOT_GIVEN`  
**Connection state:** `DISCONNECTED`

This document is the **required exception report**, not `ql246-source-proof.json`. It does not assert a real operator challenge, Ed25519 signer or gateway test. No signed source proof may be published until every requirement below is independently verified.

**Build 697 / QL-252 blocker recheck:** public GitHub at Build 696's exact `main` SHA
`901b01e9c01cbbeac190ae9793b0b5aa29a7c4dd` returned **HTTP 404** for
`docs/integration/ql246-source-proof.json`. The QL-252 six-app action sheet confirms
that ordinary GREEN source CI and deployment do not publish this immutable file.
The Build 697 owner-only API can explicitly recheck public GitHub `main` and this
fixed path (and public source CI/head metadata only if a candidate appears).
No signer identity, QL-250 private 5-minute nonce custody response, QL-251 distinct
witness signature, out-of-band receipt, approved private owner TEST-only window,
seven genuine gateway denials or original gateway receipt exists in this source.
Do not turn a candidate receipt ID into verified custody, or `negative_tests: true`
into a claim that seven original gateway denial cases ran. The strict QL-246
`negative_tests` contract lists seven required scenario flags; those flags are
configuration metadata only, **not** observed test outcomes or gateway receipts.
No original denial outcome may be inferred from them. A real independently held signer and truthful source data
must be supplied by an authenticated custodian before publishing the exact file.
Until then, the source/proof return is **404 / NOT_AVAILABLE**, connection is
**DISCONNECTED / HELD** and owner test approval remains **NOT_GIVEN**.

**Build 698 / authentic-proof preflight:** the read-only CLI
`scripts/ql252_rosie_authentic_proof_preflight.mjs` accepts a *custodian-supplied*
public JSON file plus independently authenticated source SHA, exact source CI,
raw digest, public SPKI pin and fresh challenge metadata. It validates the
canonical Ed25519 signature without generating any key, writing a proof commit
or making network/gateway calls. Even success only proves a local digest/signature
match, not real custodian origin, distinct witness, public immutable B ancestry,
seven actual gateway denials, owner approval or a connection. No genuine proof
file is available to run this check against, so the publication blocker remains.

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

**Build 695 / QL-249 local object retest readiness:** a trusted operator can use the
read-only `scripts/ql249_rosie_local_git_proof_review.mjs` helper *after* a genuine
proof-bearing commit exists. It checks two distinct local Git commit objects, source
ancestry, a proof-file-only diff, exact raw bytes SHA-256 and the independently pinned
Ed25519 source signature. A local Git match cannot attest independently authenticated
GitHub origin or CI, AI Data Platform consumer acceptance, or any original gateway
denial/audit receipt. The source proof still does **not** exist in this repo; the
readiness test uses only synthetic short-lived test fixtures. This does not authorize
GitHub/gateway network tests, key creation or read-only pilot access.

**Build 696 / QL-249 public GitHub metadata intake:** the new signed-owner-only
`integration_v1_ql249_github_origin_intake` preflight can make at most three public,
read-only, tightly allowlisted GitHub API GETs **only after** separately authenticated
source/proof SHAs, exact public JSON digest, public SPKI, matching source CI URL and
fresh nonproduction challenge are configured. It compares the proof commit's immediate
source parent, a one-file proof-only diff, Git blob identity and pinned QL-246 Ed25519
signature. No such real proof or pins are available now, so no GitHub request should
be triggered by normal production use. A possible future positive result remains
**PUBLIC_GITHUB_API_AND_PINNED_SIGNATURE_MATCH_ONLY**: it is not independent out-of-band
operator attestation, AI Data Platform consumer agreement, original gateway receipts,
seven nonproduction denial observations, durable audit or pilot owner authorization.
No signing keys, HMAC credentials, customer details or source proof file are added.

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
