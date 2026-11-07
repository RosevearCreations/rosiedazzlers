# Rosie Dazzlers Build 787 — owner-supervised original source GET

## What Build 787 actually adds

`scripts/ql787_supervised_source_get.mjs` is a **private-operator-only, one-attempt first Rosie source GET procedure**. It can call a private, fixed-route GET dispatcher **only after** all independently authenticated prerequisites pass. This is a substantive execution path, not a frontend simulation or a signed receipt invented by a test fixture.

**No original private operator has been connected to this module in our development environment. No live GET has been executed.** The original Comms connection remains **DISCONNECTED / HOLD**. The module exposes no public API route, browser activation control, private credential, key generator, arbitrary URL, POST command, `--run` CLI or automatic retry. CI's synthetic injected callbacks test ordering and rejection only; they do not provide original human, issuer, database or broker trust.

References: [Comms QL-355 original issuer/device private TEST](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-355_INDEPENDENT_ISSUER_DUAL_OWNER_AND_FIRST_PRIVATE_TEST.md), [Rosie Build 786 original readback](build786_original_enrollment_owner_ceremony_acceptance.md), [Rosie Build 784 signed GET scope](build784_source_signed_get_broker_owner_renewal.md).

## What Ree and Jack must actually do

1. **Ree, original Windows computer `DESKTOP-AE894KC`:** inspect `C:\Users\ree\rosevear-comms-hub-ql340` without discarding local edits. Use QL-354/QL-356's original `-Status` and QL-353 original readback commands. Check exact issuer, original field witness, current source signer custody, receiver-OFF and independent original-DB/device receipt state. The last observed owner preflight still reported **issuer not independently authenticated**, **owner approval false**, **database enrollment false**, **signed TEST receipt false** and **receiver off**. Do not treat a later software build as completion of these steps.
2. **Jack, independent `Templar` laptop:** independently authenticate the same issuer, witness, original device enrollment SHA and distinct source/broker pins through a trusted separate channel. Jack's master private key stays on his own machine. He reviews the exact new Rosie TEST payload and independently signs only if approved. Ree's own source decision is separately signed from the trusted original host. A QL-345 review ACK is **not** a genuine enrollment signature.
3. **Independent issuer and field witness:** both distinct original external authorities attest the *same* original QL-340B device enrollment digest and current custody/revocation state. No new or untrusted signing key can substitute for the issuer/witness. If either is absent, STOP.
4. **Original private database operator:** only after distinct owner consent and verified issuer/witness, follow the QL-355/356 one-shot original-device enrollment ceremony. Obtain exactly **one** genuine original device-signed 90-second TEST receipt with verified Tailnet/private transport, then stop the receiver. Never copy the administrator or `service_role` password to Ree's receiver; the limited receiver role must be separately enrolled by the approved private operator.
5. **Separately enroll Rosie:** the original operator must independently verify `source=rosiedazzlers`, `tenant=rosie-dazzlers`, `environment=TEST`, a current original source Ed25519 key pin, no revocation, and a link to the **same original device enrollment payload digest**. An original **device** receipt is not Rosie **source** enrollment. If this source record does not exist in the private control plane, STOP.
6. **Fresh Rosie-only TEST authority:** Ree and Jack approve the exact Rosie source GET authorization digest independently with separate original signer roles and nonexpired, matching TEST-only windows. It allows only `/api/integration/v1/shell/health` or `/api/integration/v1/shell/capabilities`, one signed 90-second GET within a 15-minute owner period, no customer bytes and no external commands.
7. **First private GET:** the approved original operator installs independently trusted callbacks into `performSupervisedRosieGet787`: original issuer/witness custody checks; QL-355 exact-one device receipt; Rosie original source enrollment; Ree and Jack original decisions; source signature; original operator and TLS transport; atomic **original private replay ledger**; a fixed-route **GET-only** dispatcher; independently signed broker receipt verifier. The module rejects missing or invalid evidence before any dispatch. The nonce claim happens before exactly one request, with no automatic retry even on failure.
8. **After the GET:** a successful private operator receipt is a single source TEST observation only. The module still returns `connected:false` and authorizes **no** customer communications, device actions, booking/payment mutations or six-app connection grant. The independent original control plane separately reviews the seven required denial cases and makes an explicit connection decision.

### Read-only local status

```bash
node scripts/ql787_supervised_source_get.mjs --status
```

Expected without original private operator integration: `HOLD_NO_ORIGINAL_PRIVATE_OPERATOR_INSTALLED_FOR_CLI`, `accepted:false`, `connected:false`. A CLI attempt to `--run` is rejected. The module has no built-in remote URL or key to bypass the original owner ceremony.

### Developer/private-operator API boundary

`performSupervisedRosieGet787({packet,privateDependencies,now})` accepts the source's signed Ed25519 request packet and twelve **injected, original trusted** functions. These are not web or JSON callbacks, cannot be supplied from untrusted browser data and must resolve their identity/pins/authority in an independently administered private original system:

`verifyOriginalIssuer`, `verifyIndependentWitness`, `verifyOriginalDeviceReceipt`, `verifyOriginalSourceEnrollment`, `verifySourceOwnerDecision`, `verifyMasterOwnerDecision`, `verifySourceSignature`, `verifyPrivateOperator`, `verifyPrivateTransport`, `claimNonceOnce`, `performPrivateGet`, `verifyOriginalBrokerReceipt`.

The issuer and witness must each confirm the same **original device enrollment digest**, separate from the new Rosie authorization digest. The source enrollment must bind to that original device digest. The original source/master key pins must be distinct from each other and from original external authorities. The replay claim must be atomic/persistent in the *private original system*, not an in-memory set in the Rosie app.

Only when all 12 independently trusted functions return correct original evidence will `performPrivateGet` be called **once**, with a fixed allowlisted path and signed packet. The original broker receipt must match the exact request/nonce/authorization digests, source, child, path, zero customer bytes and expiry. Any failure leaves `DISCONNECTED / HOLD` and does not silently retry. The accepted state never changes production connection or application entitlements.

## Local verification

```bash
node scripts/build787_supervised_source_get_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
bash scripts/current_optional_authority_triggers.sh
```

This tests all denial/ordering invariants using **synthetic mocked private callbacks** and confirms no dispatch on missing authority. It **does not** run an original signed GET. Preserve the separate original-system source-of-truth evidence and ask the owner to perform the QL-356 field ceremony rather than importing credentials or fabricating trust.
