# Rosie Dazzlers Build 795 — QL-362 original one-GET receipt closure and six-app isolation

## What was actually verified

Comms Hub QL-362 **source code** is promoted on `main` at original reviewed commit
`f23c2ddc6b1159efd95f67b6ae7f47ff672b006a`. Its actual original-host
observations still showed **no original issuer/witness authentication, zero
approved device enrollment, zero signed TEST receipts and six disconnected
sources**. A software GREEN release is **not** an original Ree/Jack authorization
or connected broker. No keys, original private approval, customer data or
source role are created by Rosie Build 795.

QL-362's exact contract is **one health-only `TEST GET`**, with a 90-second
expiry, a durable unique operation claim, a signed source response and an
immutable independent witness. **A successful one-GET TEST does not create
`source_test_authorized=true` for any application.** All six database peers
must still have `source_test_authorized=false`, `connection_state='HOLD'`,
and `customer_data_allowed=false` after the TEST. Build 795 checks this
specific original-source contract and adds a separately signed, redacted,
owner-controlled receipt export.

Authoritative instructions: [Comms Hub QL-362 original one-source owner
signature runbook](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-362_SOURCE_OWNER_OFFLINE_AUTHORIZATION_AND_FIRST_GET_GATE.md).

## Original Windows: exact steps for Ree and Jack

1. On Ree's original `DESKTOP-AE894KC`, signed in as **Ree**, and Jack's
   separate `TEMPLAR`, signed in as **jfros**, update their own clean Comms
   checkout to the reviewed QL-362 `main` SHA. The Rosie helper refuses any
   other checkout revision or modified QL-362 trust dependencies. Do not reset
   or overwrite an original checkout, and do not copy credentials between hosts.
2. On **each** original machine, from the Rosie Dazzlers checkout, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql362-795.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
   ```

   On Jack's machine substitute his **actual** existing Comms checkout path;
   `C:\Users\ree\...` is the example for Ree's account only. The response is
   deliberately redacted, reports `DISCONNECTED / HOLD`, and never grants a source.
3. Only **Ree**, after genuine earlier QL-359/360/361 original TEST, shutdown,
   private archive and independently audited six-candidate handoff exist, can
   inspect **one known real** handoff ID for Rosie:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql362-795.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -CandidateReadback -HandoffId 'ql361-<actual-original-UUID>.json'
   ```

   Replace the bracketed example with the exact original QL-361 filename.
   The wrapper passes `-SourceId rosiedazzlers` to the original private
   operator. Jack cannot inspect Ree's owner-only handoff or file checksum.
4. Authenticate the original external issuer and independent witness with
   *pre-existing* public pins, and finish separate Ree/Jack original device
   enrollment, the one genuine private device TEST, receiver STOP and
   independent archive/redaction audit. Merely having candidate files, local
   key material, listening ports, or passing CI does not complete this step.
5. In the **original private** QL-362 adapter, resolve Rosie's independently
   signed source manifest, its exact 40-character commit and pinned HTTPS
   origin. Generate exactly **one** fresh `sourceId='rosiedazzlers'`,
   `repository='rosiedazzlers'`, `TEST GET /api/integration/v1/shell/health`
   proposal, 90-second expiry, no customer/device/connection rights. Have
   the original Ree/source owner and Jack/master owner sign the **same
   SHA-256 request digest offline** with two different, previously enrolled
   Ed25519 keys. An original independent redaction-auditor key must be a third.
6. Have the authenticated original server execute **at most one**
   `createQl362FirstSourceGetGate(...).runFirst(...)`. The original QL-362
   code independently verifies source and owner pins, nonrevocation, original
   Windows operator session, restricted PostgreSQL receiver role, receiver
   STOP, one immutable device receipt, six held peers, a durable unique
   operation claim, pinned HTTPS health response, source signature and an
   immutable witness. Any denial or ambiguous outcome is a spent operation:
   **no automatic retry**.
7. Only after genuine success, let a *separate* original protected operator
   independently read the one-use claim and signed witness receipt, requery
   the original six-peer database, and sign one **redacted** closure evidence
   export with a fourth, independently pinned `receipt_witness` Ed25519 key.
   The Rosie verifier cryptographically checks that export, and returns only
   source/operation IDs, SHA-256 digests and HOLD flags. Do not publish the
   original signed approvals, private certificate, source bearer credential,
   PostgreSQL records, DPAPI keys or customer records.

## Implementation contract

`scripts/ql795_original_source_get_receipt_closure.mjs` exposes
`createQl795OriginalReceiptClosure({originalOperator,now})`. The supplied
*original-only* adapter must implement these functions:

- `readOriginalQl361Handoff` — Ree-only exact digest, six unapproved peers and
  original immutable audit attestation readback.
- `resolveOriginalPinnedAuthority`, `verifyIndependentOriginalCustody` —
  authentic, nonrevoked original pins for `redaction_auditor`, `source_owner`,
  `master_owner` and **separate** `receipt_witness`.
- `runOneOriginalQl362PrivateSourceGet` — the **actual QL-362** authenticated,
  bounded, one-use original operation, not a public surrogate or local fixture.
- `readOriginalImmutableQl362WitnessAndClaim` — separate original restricted
  PostgreSQL readback proving exactly one claim and one signed receipt.
- `readIndependentSixSourceDatabaseSnapshot` — all six exact source rows with
  `connection_state='HOLD'`, no ongoing TEST grants or customer access.
- `readOriginalSignedRedactedEvidenceExport` — owner-controlled original
  redacted digest receipt independently signed by an already enrolled fourth
  witness, which Rosie verifies against the protected original pin.

This build does **not** install that original private adapter or provision its
required source credentials. The callback contracts remain HOLD until all
original approvals and signed, source-specific evidence actually exist. The
standalone script supports only `--status`; it has no `--run` or network path.

## Safe regression

```bash
node scripts/ql795_original_source_get_receipt_closure.mjs --status
node scripts/build795_original_source_get_receipt_closure_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

Tests generate disposable **synthetic** Ed25519 keys and fake protected
readbacks. They cannot prove Ree's or Jack's identity, original enrollments,
private GET execution, source grant, production connection or live handshake.

## Next proposed build

**Build 796 — Independent Original-Device QL-362 Signature Preflight,
Source-Signed GET Receipt Retention & Protected Connection Candidate Review.**
