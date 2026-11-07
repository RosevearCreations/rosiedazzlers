# Rosie Dazzlers Build 788 — original QL-350 broker operator bridge and receipt readback

## Release outcome versus original-world outcome

Build 788 connects the **software contract** from Rosie Build 787's one-shot source-signed TEST GET to the existing Rosevear Comms Hub QL-350 **private** `runOne` source operation (`sourceId=rosiedazzlers`). It provides one concrete, fail-closed original private operator adapter in `scripts/ql788_original_ql350_rosie_bridge.mjs`. That operator resolves the **actual** independent original issuer and field witness, QL-355 original device acceptance, separately enrolled Rosie source, independent Ree/Jack owner decisions, private session and Tailnet TLS, an original atomic nonce ledger, a durable QL-350 operation reservation, and signed source/broker receipt readback. No arbitrary destination URL, public API or automated retry is provided.

**The original operator is not installed or authenticated in this source repository. This release does not sign, enroll, activate, make a real GET, or create a genuine signed receipt.** The only currently verified field observation (Comms QL-356, Nov 6) reports original issuer and independent witness NOT authenticated, owner authorization absent, private database enrollment unverified and receiver OFF. Until genuine original evidence exists, **DISCONNECTED / HOLD** remains the truthful state. GitHub/Vercel GREEN is software deployment health, not live Comms connectivity.

Source references: [Comms QL-356 original field handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-356_ORIGINAL_ISSUER_PIN_CUSTODY_FIELD_EXECUTION.md), [Comms QL-350 original private control bridge](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/runtimes/hub-relay/ql350-private-control-bridge.mjs), [Rosie Build 787 private source GET](build787_supervised_original_source_get_acceptance.md).

## Step-by-step original field sequence

1. **Ree — original Windows `DESKTOP-AE894KC`:** From a trusted PowerShell window in `C:\Users\ree\rosevear-comms-hub-ql340`, check `git status -sb` and only `git pull --ff-only origin main` if local changes are safe. Then run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -Status
   ```

   Stop on issuer/witness `false`, unsigned original enrollment, unverified DB, original signed receipt absent, receiver OFF or conflicting field pins. Do not alter Windows tasks, listener ports, DPAPI keys, ACLs, database roles or receiver state.

2. **Jack — separate `Templar` laptop:** Use the same `ql356-windows-field-handoff.ps1 -Status` from Jack's own Comms checkout. Follow QL-356's public-only `-ReviewRequest` step for the *same* unexpired original digest. Do not send private keys, witness files or database credentials to Jack's computer or chat. A REVIEW result is not an owner's signed `APPROVE_TEST_ONLY` decision.

3. **Independent original issuer and distinct witness:** Each must authenticate its own **previously approved** root through a separate trusted channel and sign the same current original device enrollment payload and four genuine field-witness hashes. These original roots must be pinned **outside** the request and repository. No software release can act as the issuer/witness.

4. **Ree and Jack:** Separately sign an exact live 20-minute original QL-356 TEST request only after steps 1–3 succeed. Use Comms Hub QL-354's original private owner ceremony; see QL-356 instructions. The original authorized private database administrator alone evaluates signed append-only enrollment, dedicated limited receiver credential, one first genuine QL-355 device TEST challenge, and one independently verified original signed device receipt. Keep the other six app grants OFF.

5. **Rosie source enrollment (separate from original device):** A trusted private administrator verifies a current original Rosie source signer key pin, `source=rosiedazzlers`, `tenant=rosie-dazzlers`, `environment=TEST`, a non-revoked enrollment linked to that **same** device-enrollment SHA. Ree and Jack separately authorize a fresh **Rosie-only** source GET digest. No new key is generated merely because Build 788 was deployed.

6. **Install the original QL-350 private operator on Ree's host:** Only the already approved operator initializes Comms `createQl350PrivateControl` with original authenticated `authenticate`, protected DB `readSnapshot`, immutable `resolvePinnedSource`, signed owner/source `authorizeSource`, real original private `sendSignedGet`, cryptographic `verifySourceReceipt` and append-only `appendIndependentWitness`. Do not run this bridge from public Vercel or expose port 8788. The existing QL-350 private sidecar uses loopback and verified same-origin Caddy/Tailnet TLS with session and CSRF checks; this project does **not** deploy that sidecar.

7. **Connect Rosie's single-use private adapter:** In that already authenticated operator process only, call `createOriginalQl350RosieBridge788({ql350,operatorSession,originalTrust,now})`. The `originalTrust` methods must resolve approved original DB and Ed25519 verification, never browser JSON fields. `runOne(sourceSignedPacket)` requires a signed Rosie health GET, checks the original QL-350 device readback, and calls the Build 787 gate. Only after its atomic persistent nonce claim will it reserve a durable UUID bound to the request and call **one** QL-350 `runOne` with `sourceId=rosiedazzlers`. Any denial consumes this adapter's attempt and stays HOLD.

8. **Independently reconcile a genuine receipt:** QL-350 must report `ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD`, with an authenticated source TEST, exact operation UUID and append-only original witness receipt SHA. Only the original operator's `readOriginalSignedGet` may supply the signed receipt and exact request/nonce digests. The separate `verifyOriginalBrokerReceipt` must cryptographically verify that *same* receipt SHA, source, child, GET path, owner authorization, expiry, zero customer bytes and original pin. A QL-350 success flag without original signed receipt readback is **DENIED**.

9. **After genuine observation:** The result may be `ONE_SUPERVISED_ROSIE_TEST_GET_ACCEPTED_SOURCE_STILL_HELD`, **never CONNECTED**. A separate independent, tenant-scoped and owner-signed production grant is needed for any later live customer exchange. Preserve the no-retry failure record and run the seven independent denial observations separately before wider rollout.

## Developer/private operator contract

The private `ql350` object must be the genuine QL-350 control instance already installed on the original Windows control plane and support `inspect(operatorSession)` and `runOne(operatorSession,{sourceId,operationId})`. The `originalTrust` provider must expose:

`verifyOriginalIssuer`, `verifyIndependentWitness`, `verifyOriginalDeviceReceipt`, `verifyOriginalSourceEnrollment`, `verifySourceOwnerDecision`, `verifyMasterOwnerDecision`, `verifySourceSignature`, `verifyPrivateOperator`, `verifyPrivateTransport`, `claimNonceOnce`, `reserveQl350Operation`, `readOriginalSignedGet`, `verifyOriginalBrokerReceipt`.

The two replay/operation reservations must be **original-source-owned, durable, atomic and independent of HTTP/browser input**. The readback must be from the original append-only storage and independently verified cryptographically; it cannot be a synthesized `approved:true` object or a test fixture. The adapter is source scoped to the QL-350 fixed route `/api/integration/v1/shell/health` only (capabilities requires separate QL-350 approval). It is single-use, no automatic retries, no new database grant, no Vercel secrets, no public `--run` CLI and no source/child identity fallback.

## Safe local checks

```bash
node scripts/ql788_original_ql350_rosie_bridge.mjs --status
node scripts/build788_original_ql350_bridge_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
bash scripts/current_optional_authority_triggers.sh
```

CI uses **synthetic in-memory private callbacks** to test rejection, exact QL-350 source selection, nonce/operation ordering and receipt comparison. It does not have Ree's private operator, Jack's original authority, issuer/witness custody, private database credentials or first signed receipt. Do not mark a real TEST accepted from synthetic output or claim `main` GREEN implies live connectivity.
