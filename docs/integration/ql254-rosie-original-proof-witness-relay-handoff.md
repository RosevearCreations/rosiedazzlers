# Rosie Dazzlers — QL-254 original public proof and private witness HOLD

**Repository:** `RosevearCreations/rosiedazzlers`. **Business:** `rosiedazzlers`, **nonproduction tenant:** `null`. **Integration:** `DISCONNECTED / HOLD`.

Comms Hub's public-only QL-254 observation on 28 October 2026 at 11:42 p.m. Eastern found `main` commit `056de275482a3b4a00e17610f634b1b79f3490c0` and returned **HTTP 404** for its exact immutable raw `docs/integration/ql246-source-proof.json`. Build 699 source `Current Source Gate` run [40811652474](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40811652474) passed with `head_sha` equal to that source SHA. A passing ordinary CI does **not** authenticate signer custody or publish an original proof.

## Build 700 safe code behavior

1. The owner-only `GET /api/admin/integration_v1_ql254_original_proof_watch` is strictly readiness status without external calls. An explicitly requested same-origin JSON `POST` action `recheck_immutable_public_proof` performs fixed-host public GitHub GET requests only. No runtime-supplied host, gateway URL, tenant, secret or payment action is accepted.
2. Check immutable raw public QL-246 path at the observed 40-character `main` SHA. If HTTP 404, return actual 404 with no proof B and an exact-head public source CI run if available. Recheck `main` to fail closed on drift.
3. If raw JSON appears, it is an **untrusted public candidate**. Require bounded UTF-8 JSON, QL-246 original scope/expiry/negative-*scenario* metadata, the exact raw SHA-256, a distinct proof-only descendant B of source A, original B bytes equal to the main bytes, public GitHub A CI run with `head_sha=A`, and unchanged main. A public shape/metadata match is **not** independently verified Ed25519 custody or original denial receipts. A malicious self-signed or altered JSON cannot release any integration.
4. A real signer must securely create a genuine canonical QL-248 Ed25519 proof referencing tested source A. Independently authenticated public SPKI custody, a different private registry witness, fresh five-minute nonce tied to A/B/business/tenant and separate opaque receipt IDs must be checked **outside GitHub**. No original private registry data or private keys belong in this repository or CI.
5. The real owner has **NOT_GIVEN** TEST-only approval. If later requested, the separate private authenticated decision must name `rosiedazzlers`, tenant `null`, future ≤30-minute UTC window, method `GET` and only `/api/integration/v1/health` and `/api/integration/v1/capabilities`. Even after actual test approval, separate original seven denial receipts, durable audit and distinct pilot release are needed.

## Private 24/7 relay candidate — not installed

The Windows Rosevear AI Hub could later run a separate outbound-only or owner-managed Tailscale connector with a restricted service identity and isolated per-app credentials. Before installation: obtain separate owner authority, confirm patching/uptime, secure Windows service account, no public inbound ports, explicit health/kill-switch/revocation/restore plan and nonproduction rollback simulation. Do **not** expose household cameras, MQTT, Home Assistant, vault, remote shell, customer data or any master secrets. Build 700 only records the design constraint; it does not configure the home PC.

## Nonsecret QL-254 return (QL-254 observed source snapshot, refresh at new immutable main after promotion)

```yaml
application_name: Rosie Dazzlers
repository: RosevearCreations/rosiedazzlers
observed_main_sha: 056de275482a3b4a00e17610f634b1b79f3490c0
source_sha_A: 056de275482a3b4a00e17610f634b1b79f3490c0
matching_source_green_ci_run_url: https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40811652474
proof_commit_sha_B: NOT_AVAILABLE
immutable_proof_url: HTTP 404
proof_http_status_at_B: NOT_AVAILABLE
exact_raw_proof_sha256: NOT_AVAILABLE
public_signer_spki_sha256: NOT_AVAILABLE
private_registry_snapshot_sha256: NOT_AVAILABLE
independent_registry_custody_receipt_id: NOT_AVAILABLE
separate_witness_receipt_id: NOT_AVAILABLE
independent_witness_real_world_identity_verified: NOT_VERIFIED
owner_test_decision: NOT_GIVEN
actual_nonproduction_gateway_gets: NOT_RUN
real_original_seven_denial_cases: NOT_VERIFIED
connection_state: DISCONNECTED
```

This is a public source-proof blocker report and never a true live gateway test, signed proof publication or private identity attestation. Replace source SHA and CI only after the actual Build 700 `main` exact-SHA recheck.
