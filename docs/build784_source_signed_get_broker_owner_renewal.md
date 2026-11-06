# Rosie Dazzlers Build 784 — Source-owned TEST GET, broker receipt and owner renewal

## Actual connection state — DISCONNECTED / HOLD

Build 784 prepares the **Rosie-owned, TEST-only** source contract. It does not activate a receiver, enroll an original signer, obtain original issuer approval, produce a real private broker receipt, send a GET or change a database. Rosie `/api/integration/v1/shell/health` and `/api/integration/v1/shell/capabilities` must continue returning fail-closed **503 HOLD**. A green deployed website is not evidence of Comms Hub connectivity.

Comms Hub QL-354 currently distinguishes a *single original Windows device enrollment/test receipt* from later *separately authorized application-scoped* GETs. A device-level QL-353/354 receipt **cannot** serve as a Rosie source-level signed GET or broker receipt. See [Comms Hub QL-354 original device ceremony](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md).

## Proposed source-owned verification contract

- Exactly two possible TEST **GET** paths: `/api/integration/v1/shell/health` and `/api/integration/v1/shell/capabilities`. Source `rosiedazzlers`, child tenant `rosie-dazzlers`, audience `rosevear-comms-hub:nonproduction`.
- Separate Ed25519 source GET signer, independent private broker signer, Ree **source-owner** signer and Jack **master-owner** signer; four distinct, externally verified public SPKI SHA-256 pins. Self-declared packet keys or an entered fingerprint alone are not original custody proof.
- Owner TEST decision: both owners sign `APPROVE_TEST_ONLY` for the *same* exact authorization digest in a fresh, bounded **15-minute** window. Changed scope, role conflict, stale/replayed/expired decision, a QL-345 `REVIEW_ONLY` signature or an owner rejection all deny.
- Signed request: exact source/tenant/audience, `GET`, allowlisted path, bounded unpredictable nonce, digest of fresh owner authorization and **90-second maximum** expiry entirely inside the owner window.
- Independent private broker receipt: signed response envelope must link the exact signed request digest, authorization digest and nonce digest, path, tenant, audience, TEST-only environment, 200 status, zero customer bytes and nonexpired observation.
- A complete future controlled trial also requires **seven independent denial observations**: missing authentication, bad credential, expired credential, wrong tenant, wrong audience, replayed nonce, untrusted source signer pin. The single-receipt offline verifier does **not** claim all nine live trial receipts were collected.
- Any live signed GET, private operator access or database enrollment remains **separately prohibited** until the original issuer/device custody, distinct owner signatures, pinned trust and per-source broker authorization are independently established on the real equipment.

## What can we verify today?

1. Open Rosie Admin → **I.T. Connections** → **Build 784**. The status must remain `DISCONNECTED / HOLD`, with an unsigned renewal template option. Never upload private keys, heartbeat nonces, broker URLs, real receipts, cookies, or customer records to the page.
2. Run the offline local contract tests in the Rosie checkout:

   ```bash
   node scripts/build784_source_get_broker_renewal_test.mjs
   bash scripts/current_booking_wizard_regression.sh
   ```

3. A trusted original operator can use `inspectSourceGetTest784` from `scripts/ql784_source_get_test_offline.mjs` against a *locally held* candidate source packet plus **four independently obtained** public SPKI digests. The function checks exact source request, source and broker Ed25519 signatures, scope, expiry, owners and provenance binding. It produces only digests and nonsecret result flags; it does not access the network or authorize the broker.
4. `ok: true` means **offline cryptographic mechanics only**. The result deliberately retains `originalSignerCustodyVerified:false`, `independentOwnerAuthorityVerified:false`, `originalBrokerReceiptIndependentlyVerified:false`, `sourceTestAuthorized:false`, `connected:false`. Those require separate *original-system* verification and cannot be inferred from a local file or synthetic fixture.
5. Record the genuine source and master owner decisions, renewal dates, independent issuer verification and separate private broker exact nine-receipt trial in an access-controlled original evidence system. Reviewers must explicitly distinguish pre-existing QL-354 **device** evidence from future Rosie **source** evidence before authorizing any change.

### Operator safety notes

The validator is library-only and has no command that creates signatures, enrolls a signer, starts a receiver or sends private traffic. Synthetic Ed25519 keys used in tests are ephemeral, confined to a local process and never stored in the repository. A valid fixture or locally presented signature **does not prove** who controlled the original device or that either owner actually approved live TEST traffic. No automatic promotion from HOLD to CONNECTED is provided.

Source references: [Build 781 handoff](build781_comms_signed_test_evidence_owner_handoff.md), [Build 782 original-owner review](build782_original_signer_owner_test_authority_broker_receipts.md), [Build 783 issuer and custody](build783_independent_issuer_owner_continuity_receipts.md), [Comms Hub QL-345 separate-owner preflight](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-345_ORIGINAL_ISSUER_AND_SEPARATE_OWNER_TEST_PREFLIGHT.md).
