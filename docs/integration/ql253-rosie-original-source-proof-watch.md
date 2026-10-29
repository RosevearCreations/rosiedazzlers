# Rosie Dazzlers — QL-253 immutable proof/CI continuity (HELD)

**Application:** `Rosie Dazzlers` · **GitHub:** `RosevearCreations/rosiedazzlers` · **connection_state:** `DISCONNECTED`.

The 28 October 2026 QL-253 public-only Comms Hub observation recorded `main` at `65c3654309426c0e654262e7a9d46a113d1ed6a4` and the exact `docs/integration/ql246-source-proof.json` path as **HTTP 404**. Build 698's exact-head source `Current Source Gate` run was [40804594590](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40804594590) with `head_sha` equal to that source commit. That run verifies source CI **only**, not signer custody, original proof or authorized connectivity.

Build 699 offers an explicit, owner-only `POST /api/admin/integration_v1_ql253_public_ci_continuity` action `recheck_public_main_ci_proof`. It reads only allowlisted public GitHub `main`, the GitHub Actions `Current Source Gate` success for its exact head SHA, and the original proof path via the existing QL-252 public read. It fails closed on main movement, inconsistent source CI, untrusted candidate, missing proof, malformed response or network error. GET readiness is network-free. It never sends an integration health/capabilities GET, signing key, customer record or any gateway credential.

The public CI check is not the signed-proof publication. Before anyone can state proof exists, a real independently authenticated signer must create source **A** and genuine signed, expiry-bound JSON; a *different* proof commit **B** must add the exact path after A. Confirm immutable B raw HTTP 200, exact SHA-256 bytes, valid Ed25519 signature, A→B ancestry, green CI with `head_sha=A`, approved nonproduction business/tenant and seven negative-test scenario **metadata**. Do not claim those tests ran without original durable receipts.

Independently verify signer-custodian and *different* witness private attestations, public SPKI fingerprint in a separate pin registry, registry snapshot hash and opaque receipt IDs, fresh five-minute challenge bound to A/B/system/business/tenant and response digest. GitHub, PRs, chat and self-signed envelopes do not authenticate this private custody. Nothing in Build 699 provisions the private registry or makes a human custody claim.

Owner TEST-only consent remains **NOT_GIVEN**. No owner has authenticated a future ≤30-minute UTC window limited to nonproduction business `rosiedazzlers`, tenant `null`, method `GET`, paths `/api/integration/v1/health` and `/api/integration/v1/capabilities`. Do not schedule/execute the trial, pilot, home-server relay, gift resend/contact, booking mutation or payment until independent authorization and its distinct later release gates.

## Current nonsecret return (refresh only after actual exact-SHA recheck)

```yaml
application_name: Rosie Dazzlers
repository: RosevearCreations/rosiedazzlers
source_sha_A: 65c3654309426c0e654262e7a9d46a113d1ed6a4
source_ci_run_url: https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40804594590
proof_commit_sha_B: NOT_AVAILABLE
immutable_public_proof_url: HTTP 404
exact_proof_bytes_sha256: NOT_AVAILABLE
public_spki_sha256: NOT_AVAILABLE
out_of_band_registry_snapshot_sha256: NOT_AVAILABLE
out_of_band_registry_receipt_id: NOT_AVAILABLE
out_of_band_custody_receipt_id: NOT_AVAILABLE
distinct_independent_witness_receipt_id: NOT_AVAILABLE
owner_test_decision: NOT_GIVEN
owner_test_receipt_id: NOT_AVAILABLE
real_health_and_capabilities_get_receipts: NOT_RUN
original_seven_negative_denial_receipts: NOT_VERIFIED
connection_state: DISCONNECTED
```

This is a historical QL-253 source snapshot, **not** newly published proof. After Build 699 promotion, supply its real `main` SHA and exact-head CI run in a revised nonsecret return if verified. Do not replace 404 or missing private provenance with synthetic fixtures.
