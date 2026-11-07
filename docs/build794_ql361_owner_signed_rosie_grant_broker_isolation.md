# Rosie Dazzlers Build 794 — independent owner-signed source grant readiness and one private TEST

## Actual original state

Comms Hub **QL-361** was promoted with reviewed commit `669a9f49351258e514b7730c290b159ef5b66c52`. It produces **six owner-private, offline source-review candidates** from an independently signed, redaction-audited original device TEST archive. **A QL-361 candidate is not authorization.** The original Ree/Jack field and restricted database readbacks still reported no independently authenticated issuer/witness, no signed owner enrollment, no approved device TEST receipt, no authorized source grants and six peers `DISCONNECTED / HOLD`.

This build adds a **conditional** protected Rosie source-only grant verifier. It neither creates a grant nor starts a receiver. No private GET occurs until a separately authenticated, original single-TEST source grant is read back. The `main` software may be GREEN while no original handshake exists.

Authoritative [Comms QL-361 original archived-chain and six-candidate handoff instructions](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-361_ARCHIVED_ORIGINAL_TEST_CHAIN_REDACTION_AUDIT_AND_SIX_APP_HANDOFF.md), [Rosie 793 original archive instructions](./build793_original_archive_source_trust_connection_state.md).

## Original Ree and Jack Windows preparation

From the Rosie Dazzlers local checkout, after separately reviewing a **clean**, pinned QL-361 Comms checkout on each original machine:

**Ree:** original `DESKTOP-AE894KC` signed in as `Ree`.

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql361-794.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
```

**Jack:** independent `TEMPLAR` signed in as `jfros`; use his *own* existing Comms checkout path:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql361-794.ps1 -CommsCheckout 'C:\Users\jfros\rosevear-comms-hub-ql340' -Status
```

If the reviewed QL-361 SHA is missing or any operator dependency is modified, stop and inspect the original checkout. No reset, credential copy, process restart or automatic Git pull occurs.

Ree may *after a real QL-360 archive exists* use `-ArchiveDigest -ArchiveId 'ql360-...json'` on the Rosie wrapper or the original Comms QL-361 script. This only reads local checksums for external independent review. **Jack cannot read Ree's private archive.** Neither status nor checksum independently authenticates an issuer or authorizes a source.

## Complete the genuine, distinct trust chain first

1. An existing independently approved **original external issuer** and separate **original field witness** authenticate the previously pinned Ed25519 custody and revocation status. Ree and Jack separately approve and sign the same fresh original device TEST, and an authenticated private administrator verifies actual original device enrollment and restricted receiver credential.
2. Ree supervises exactly one original signed QL-359 device TEST and immutable PostgreSQL receipt, the actual QL-340C TEST receiver STOP, independent field closeout witness and QL-360 owner-only archive. No public port, customer messaging or other application activation.
3. QL-361 original private runtime consumes the QL-360 success capability; an independently pinned **different** redaction auditor signs the exact redacted evidence report. The original private PostgreSQL/receiver state is rechecked, and the owner-only `Ql361Handoff` directory receives an atomically written, rehashed six-source candidate record. It is still all HOLD.
4. From this verified owner-only handoff, Ree/source and Jack/master each independently sign the **same** exact fresh `rosiedazzlers` + `rosie-dazzlers` `TEST GET /api/integration/v1/shell/health` decision digest. No wildcard, customer access, service write, device control or grant for the other five sources. Both signatures must be genuine **Ed25519** signatures verified against separately pinned original custody and checked for revocation. A self-generated replacement key or synthetic CI key does not count.
5. Only a separately authorized original protected grant workflow may create a **single scoped Rosie TEST-only grant**; the Rosie verifier only reads it back. The current QL-361 candidate does **not** implement that grant. Without an original DB-approved, nonrevoked grant: **stop at HOLD**, do not send the GET.
6. A genuine original private QL-350/790 Rosie broker operator then handles **one** signed, fresh, nonproduction health GET. An independent source receipt and original six-app database snapshot must agree on the source-grant ID, operation ID, request digest, signed broker receipt and independent witness. **Exactly Rosie may have TEST-only authorization**; all other five remain HELD, with customer access denied for all six.

## Build 794 private server contract

[`createQl794OriginalSourceGrantSafety`](../scripts/ql794_scoped_original_source_grant_private_broker.mjs) has no public `--run`, no automatic retry and no database or connection mutation. Its protected operator supplies:

- `verifyOriginalQl361Handoff()` — genuine one-use in-process QL-361 independent signed audit proof.
- `readOriginalQl361Handoff(...)` — original Ree-only ACL and canonical digest readback of six exact unapproved candidates.
- `resolveIndependentlyPinnedOriginalOwner(role)` and `verifyIndependentOriginalOwnerCustody(...)` — existing, separately approved original source/master signing pins, including a nonrevocation check.
- `readOriginalRosieSourceGrant(...)` — original protected database verification of one **separately approved** source-only TEST grant, never derived from the offline candidate.
- `runOneAuthenticatedPrivateRosieGet(...)` — only the original authenticated private broker with its signed request and existing source credential.
- `readIndependentBrokerReceiptAndSixPeerIsolation(...)` — independently signed immutable receipt and a protected original DB check: Rosie TEST authorization only, other five HELD, no connected peer or customer bytes.

The verifier itself cryptographically checks both Ed25519 owner signatures over one exact canonical decision. A successful **authentic original** result attests **one read-only nonproduction broker GET** and five-peer isolation only. Even then it reports `connected:false`, `connectionState:'DISCONNECTED / HOLD'`; there is no production customer channel, device action or blanket source connection.

## Safe software-only regression

```bash
node scripts/ql794_scoped_original_source_grant_private_broker.mjs --status
node scripts/build794_source_grant_private_broker_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

The regression generates **synthetic, temporary Ed25519 test keypairs** and fake private callbacks to test failure behavior. It proves **software constraints**, not Ree or Jack's original ownership, a live connection or real source approval. Never paste private keys, DPAPI receiver credentials, original signed packets, customer data or complete original source ledger into chat, GitHub or CI.
