# Rosie Dazzlers Build 789 — original Windows field and signed first Rosie GET witness

## Actual state and what this software can do

Build 789 adds a **read-only original Windows field observation tool** and a **cryptographically checked first source GET witness closure** to the Rosie Build 788 → Comms QL-350 protected operator path. It neither signs/enrolls on behalf of Ree/Jack nor installs the Comms private bridge. There are no credentials, arbitrary remote URLs, browser TEST controls, database writes or automatic retries. The source app stays `DISCONNECTED / HOLD` even after one valid TEST witness; no customer or six-app grants are created.

As of the currently reviewed original [Comms QL-356 field guidance](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-356_ORIGINAL_ISSUER_PIN_CUSTODY_FIELD_EXECUTION.md), **the original independent issuer and field witness have not been authenticated, Ree/Jack independent TEST approvals are missing, original database enrollment is unverified, and no first original device or Rosie GET signed receipt has been observed**. QL-356's read-only `-Status` *always reports those authority booleans false*; a good owner-device status is **not** proof that the ceremony completed. A future separately reviewed QL-357 receipt path may advance these gates; do not claim that QL-357 is installed on the original hosts merely because its build was proposed.

## One read-only command on each original Windows account

**Ree — original `DESKTOP-AE894KC`, account `Ree`:** On the original computer, open PowerShell in the Rosie checkout if present, and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-789.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340'
```

**Jack — separate `Templar`, account `jfros`:** From Jack's own Rosie checkout, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-789.ps1 -CommsCheckout 'C:\Users\jfros\rosevear-comms-hub-ql340'
```

If Rosie is not checked out on that machine, the trusted **Comms-only** equivalent is:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -Status
```

Jack changes only the checkout directory in this example; he does not use Ree's Windows account. **Do not run `git pull` over uncommitted changes.** The Rosie wrapper will inspect only the reviewed Comms commit `29d8a29e3cac8c969a83027498e3b73d0acbe58e` and refuse locally modified field scripts or any other commit; its pin must be deliberately reviewed and updated when a newer Comms release is promoted. It runs only the original QL-356 read-only `-Status`. It never reads private key contents, turns on listeners, rotates credentials, grants database access or transmits any data. Its sanitized JSON should remain `DISCONNECTED / HOLD`.

If a status identifies an unrecognized original machine, changed code, missing LAN identity, unavailable public signer candidate or a contradictory connection field, **STOP**. We need the original machine's real status, not another synthetic fixture. Please share only the redacted resulting status JSON, never keys, `.dpapi` files, private TLS files, exact signed enrollment packets, password values, or customer records.

## Genuine original enrollment and first witness sequence

1. **Independent issuer and field witness:** separately authenticate their previously approved **original** signing pins and attest the same fresh QL-356 request SHA (including all four real original Windows/TLS/Tailnet/rollback witness hashes). This is a real external review; a browser `approved:true`, generated root or CI test does not count.
2. **Ree and Jack:** review the exact fresh public 20-minute request on their own original accounts and separately sign only when consciously approving the scoped nonproduction TEST. The Comms QL-354/356 ceremony remains the source of truth. Do not copy or reuse a prior REVIEW acknowledgement or stale owner consent.
3. **Private administrator:** verify both original owner signatures, original witness signatures, original device/source pin custody and append-only enrollment on the protected original database. Verify **exactly one** original QL-355 device receipt before any Rosie source TEST. Keep the Caddy/Tailnet/receiver firewall/rollback gates as specified in QL-356; do not open the public receiver.
4. **Rosie source TEST:** separately verify original `rosiedazzlers` signer enrollment, `rosie-dazzlers` child scope, fresh distinct source/master owner decisions, current private TLS operator session and the original persistent nonce/operation ledger. Install [QL-350 private control](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/runtimes/hub-relay/ql350-private-control-bridge.mjs) only in the authorized original Windows private sidecar. The original operator invokes Rosie Build 788 `runOne` for **one** signed GET of `/api/integration/v1/shell/health`. Any failed attempt remains spent; no silent retry.
5. **Independent signed post-GET witness:** the same protected original operator retrieves a *new, actual* append-only witness from the original ledger for the **exact** operation UUID, signed request SHA, original broker receipt SHA, original device/source enrollment hashes, two distinct original owner decisions, `TEST` audience, zero customer bytes and 90-second expiry. The distinct original field-witness Ed25519 key signs that exact witness envelope, and its SPKI pin is resolved through an **independent trusted channel outside the request/repository**.
6. **One TEST-only closure:** only then may `createOriginalWindowsGetWitness789({bridge,originalOperator,now}).runOne(sourceSignedPacket)` return `ONE_GENUINE_ROSIE_ORIGINAL_GET_WITNESS_CLOSED_STILL_HELD`. The code verifies the real Ed25519 signature with Node crypto against the externally pinned original witness and cross-checks exact source/owner/device/request/receipt/operation identifiers and time. All customer communications, device actions, six-app grants and persistent connections remain **OFF** until a separately authorized production connection decision.

## Private field implementation contract

The `bridge` must be the genuine authenticated Build 788 QL-350 original private operator instance, never a mock installed from HTTP JSON. Build 789's `originalOperator` must provide **private-only** `readOriginalField()`, `readAppendOnlyWitness({sourceId,operationId,requestSha256,receiptSha256})`, and `resolvePinnedFieldWitness()` using independent original DB, signer and issuer evidence. The original field readback includes distinct signed `sourceOwnerDecisionSha256` and `masterOwnerDecisionSha256` and five disjoint signer pins. The independent witness public key pin must be distinct from all five and must have been approved before this request. The original signed witness has schema `rosie.comms.ql789.original-signed-test-get-witness.v1`; the adapter accepts only an authentic Ed25519 signature over the canonical envelope and an exact original post-GET readback. The trust callback provider itself **cannot be created by Rosie CI**; it must run under the protected original owner/control-plane identity.

## CI versus reality

```bash
node scripts/ql789_original_windows_get_witness.mjs --status
node scripts/build789_original_windows_get_witness_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
bash scripts/current_optional_authority_triggers.sh
```

CI generates ephemeral **TEST-ONLY** Ed25519 keys to exercise the real verifier algorithm, 21 negative/scope cases and the absent-operator HOLD boundary. That proves software mechanics, **not** original issuer custody, genuine owner approval, original private database enrollment, a running receiver or a first authenticated GET. We cannot close the real field witness from a cloud checkout without the original on-device owner ceremony and private operator receipt.
