# Rosie Dazzlers — QL-252 authentic source-proof publication evidence handoff (HELD)

**Repository:** `RosevearCreations/rosiedazzlers` · **Business:** `rosiedazzlers` · **Nonproduction tenant:** `null` · **Allowed methods:** `GET` only · **Allowed paths:** `/api/integration/v1/health`, `/api/integration/v1/capabilities`.

## Public source observation (not signer trust)

At the independent Build 697 promotion check, `main` commit `62e4c4cf8faa6e2856e6a3e9e14d54385bb38020` had a successful exact-head SHA source CI run: [GitHub Current Source Gate #40800885136](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40800885136). The immutable proof path `docs/integration/ql246-source-proof.json` at that same source SHA returned **HTTP 404**. Build 698's newly promoted `main` SHA/CI must be rechecked at promotion and may be chosen as future source A. **No proof B is currently published.**

## Authentic proof intake (no keys or private receipts in GitHub)

1. Independently authenticate a real signing-key custodian and a different witness **outside GitHub**. The custodian securely holds the Ed25519 private key; only the signed JSON, public key and independently pinned public fingerprint may appear in the public proof.
2. Have the trusted custodian select a source-CI-GREEN commit A with a matching full 40-character `head_sha`, create a genuine `np-` nonproduction challenge lasting at most one hour, and sign the exact QL-248 canonical `rosevear.integration.v1` payload with the **source A SHA**. The seven `negative_tests` flags name required scenarios; they are **not** evidence that any genuine denial occurred. Do not invent gateway receipts, owner identity checks or successful gateway calls.
3. On a trusted machine, independently compare the public proof file's raw SHA-256, source SHA, exact source CI, public SPKI pin and challenge against independently obtained metadata. The read-only CLI below checks local public-key cryptography only (not who held the private key). Do **not** place the signing key in shell arguments, the repository or this handoff.
4. Only after actual out-of-band custodian/witness provenance is established, create distinct proof commit B adding **exactly** `docs/integration/ql246-source-proof.json` and referring to A, then promote B through `dev` and protected `main`. Verify the immutable raw B URL HTTP 200, exact raw SHA-256, source-CI head and A→B ancestry. Keep source A and proof B separate; never sign B into its own payload.
5. Require separate fresh **5-minute QL-250 nonce** and a distinct QL-251 witness signature bound to exact A/B, business/tenant and response hash. The claimed QL-252 receipt channel/ID is only a candidate until human origin authentication. Do not publish private original attestations.
6. Owner test decision remains **NOT_GIVEN**. A real separately authenticated owner must explicitly approve a named nonproduction business, future ≤30-minute UTC GET-only window and only the two health/capabilities routes. No live gateway GET, seven-denial trial, gift payment/delivery, customer contact, booking write or pilot release before independent authorization. Later original audit, tenant isolation, revocation/rollback and owner pilot release are separate gates.

### Read-only local CLI usage once genuine public evidence exists

```bash
node scripts/ql252_rosie_authentic_proof_preflight.mjs \
  --proof-file /trusted/local/path/real-public-proof.json \
  --source-sha <independently_verified_40_hex_A> \
  --ci-url https://github.com/RosevearCreations/rosiedazzlers/actions/runs/<exact_green_run_id> \
  --proof-sha256 <independently_verified_64_hex_raw_digest> \
  --public-spki-sha256 <independently_verified_64_hex_public_key_pin> \
  --challenge-id np-<genuine_nonce_id> \
  --challenge-sha256 <independently_verified_64_hex_challenge_digest>
```

The CLI is read-only, offline and accepts **public metadata only**. A matching result is labeled `LOCAL_PUBLIC_PROOF_DIGEST_AND_PINNED_SIGNATURE_MATCH_ONLY` and still reports `origin_attested=false`, `independent_custodian_verified=false`, `distinct_witness_verified=false`, `owner_test_decision=NOT_GIVEN`, `actual_gateway_test=NOT_RUN`, `connection_state=DISCONNECTED`. Synthetic fixtures are strictly for regression tests, never publication.

## Current truthful nonsecret QL-252 return

```yaml
application_name: Rosie Dazzlers
repository: RosevearCreations/rosiedazzlers
source_sha_A: 62e4c4cf8faa6e2856e6a3e9e14d54385bb38020
source_ci_run_url: https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40800885136
proof_commit_sha_B: NOT_AVAILABLE
immutable_public_proof_url: NOT_AVAILABLE (HTTP 404 at exact source SHA)
exact_proof_bytes_sha256: NOT_AVAILABLE
public_spki_sha256: NOT_AVAILABLE
out_of_band_custody_receipt_id: NOT_AVAILABLE
distinct_witness_receipt_id: NOT_AVAILABLE
owner_test_decision: NOT_GIVEN
owner_test_receipt_id: NOT_AVAILABLE
actual_gateway_test: NOT_RUN
connection_state: DISCONNECTED
```

This packet is a timestamped blocker report, not a successful six-app connection. Update source SHA/CI only after verifying the new exact source commit; never invent B or replace a 404 with a sample.
