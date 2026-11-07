# Rosie Dazzlers 797 — Original QL-363 Receipt Custody Import, Witness Reverification and Owner-Governed Connection Decision Audit

## Release contract

**Software deployment GREEN does not authorize a live connection.** Original Ree and Jack signed authority, actual Rosie source GET, immutable receipt custody, independent witness, database readback and owner decisions remain external proof requirements. These have **not** been completed by the public source repository or synthetic tests. All six apps remain **DISCONNECTED / HOLD** and source TEST permission stays false.

Build 797 follows [Rosie Build 796's original-device QL-362 signatures and signed QL-363 receipt verification](build796_original_ql363_signature_preflight_receipt_retention.md). The authoritative [Comms Hub QL-363 signed health/closure contract](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-363_SIX_SOURCE_HEALTH_SIGNED_RECEIPTS_AND_INDEPENDENT_TEST_CLOSURE.md) is pinned to `badda29755bf6a287257e778cd178de221eae237`, source `rosiedazzlers`, TEST `GET /api/integration/v1/shell/health`, private owner-only evidence, no redirects/customers/device actions/persistent connection.

## Original Windows read-only guidance

1. On Ree's original Windows server, computer `DESKTOP-AE894KC`, Windows user `Ree`, use a reviewed local Rosie checkout and QL-363 Comms checkout. Do not transfer encrypted private keys, owner permissions or receipt bodies into this website.
2. From the local Rosie checkout, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql363-797.ps1 -CommsCheckout C:\Path\To\rosevear-comms-hub
   ```

   Replace `C:\Path\To\rosevear-comms-hub` with the actual path. This uses the existing pinned Build 796/QL-363 **read-only status** helper. It does not create a receipt, start a receiver, sign an approval, import an archive, change a database row or send a health GET.
3. On Jack's **separate** original laptop, computer `TEMPLAR`, user `jfros`, run the same read-only check from his own reviewed checkout. Jack's approval must be distinct and independently verified. Do not sign or approve on his behalf.
4. A `HOLD` is a correct result unless independently authenticated original authority and evidence exist. If the exact QL-363 checkout or original QL-362 status cannot be verified, stop at the reported HOLD. Do not fabricate a receipt, force `CONNECTED` or disable required branch/production checks.

## What the protected original-only audit adapter requires

`scripts/ql797_original_receipt_custody_decision_audit.mjs` exports `createQl797OriginalReceiptCustodyAudit({originalOperator, now})`. It only reads independently authenticated **original private operator** records. No browser endpoint, public importer, key generator, actual HTTP transport, database writer, real owner signing service or hidden connection switch is bundled. The external operator must supply every source in a separately protected environment:

1. **Original QL-796 first-receipt proof**: both separate QL-362 Ed25519 owner signatures and immutable one-use claim, original QL-363 signed source health/contract and TLS pins, independently signed durable receipt retention, and all six peer rows HELD. Any failure prevents a Build 797 import review.
2. **Receipt custody import**: exactly one owner-only immutable original object named for the verified receipt SHA, source commit and QL-796 signed-retention digest, fresh import date, independently maintained retention date more than 24 hours ahead, and zero customer bytes/actions/repository writes. Imported HTML/JSON without an independent original record is not proof.
3. **Independent custody witness**: new distinct nonrevoked Ed25519 signer `custody_witness` must sign the exact operation/request/receipt/import digest and original custody purpose, with independent trust-pin and signer-custody readback. It must not share an original issuer, auditor, owner, source or retention witness key.
4. **Immutable archive and independent anchor**: unbroken previous SHA, monotonic positive sequence and canonical content-addressed head verified against a *separate* archive readback; no mutable/missing/out-of-order archive accepted.
5. **Two separate owner decisions**: Ree/source-owner and Jack/master-owner independently sign the exact same receipt/archive decision, with their original pinned Ed25519 keys and independent custody. Only `ACKNOWLEDGE_HOLD`, `REQUEST_MORE_EVIDENCE`, or `REJECT_CONNECTION` are accepted. A signature to activate a source, permit customer data or approve persistent connectivity is **not** accepted by this audit.
6. **Independent decision-audit witness**: an additional distinct Ed25519 `audit_witness` signs an append-only decision row bound to both owners' signatures, import/witness/archive SHA, HOLD flags and independent audit head. A separately read back original decision anchor must match sequence/previous/current SHA.
7. **Six-app post-decision isolation**: independently read all six private peers (`rosiedazzlers`, `devilndove`, `icamp`, `yw`, `ai-data-platform`, `rosevear-ai-hub`) with `connection_state='HOLD'`, `source_test_authorized=false`, `customer_data_allowed=false`, zero connections. No cross-tenant state transition or automatic retry.

The adapter is one attempt per instance and always returns `connected:false`, `sourceTestAuthorized:false`, `connectedCount:0`, `DISCONNECTED / HOLD`, even when a genuine held decision is independently audited. It never executes or accepts a standing connection grant. Audit disagreement, expiration, stale/altered receipt, signer substitution, retained PII or an active peer is denied.

## Read-only local verification

```bash
node scripts/ql797_original_receipt_custody_decision_audit.mjs --status
node scripts/build797_original_receipt_custody_decision_audit_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

`--status` reports HOLD. There is **no** `--run`, `--import`, `--connect` or `--approve` public action. The regression suite uses **ephemeral SYNTHETIC keys and fixtures** and cannot certify the real original owner ceremony.

## Definition of done

- Protected PR into `dev`, protected PR into `main`, all required checks and post-merge exact-production deployment checks GREEN, matching release tree.
- Functional reviewer fail-closed on original custody, role isolation, witness, two-owner decision, archive history, source receipt and all six peer boundaries. No customer sends, device actions, database writes or source repo writes.
- **Operational connection remains HOLD** until separate original authorities and any future specifically owner-approved connection activation are independently established. Code promotion alone never supplies these facts.

## Next build

**Rosie Dazzlers 798 — Cross-Custodian Receipt Provenance Renewal, Owner Decision Conflict Resolution & Expiring Connection Eligibility Dashboard.** Provide independently read-only custody freshness and owner-only decision remediation while keeping all six source permissions HOLD until real proof and new owner authority.
