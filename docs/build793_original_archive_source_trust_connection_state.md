# Rosie Dazzlers 793 — original QL-360 receipt archive, source-trust reconciliation and connection state

## What this build actually verifies

Rosie 793 introduces an **original-private receipt-import verifier**. It accepts a QL-360 original owner-ACL evidence archive **only by an authenticated original private operator**, rehashes the archived source allowlist, checks one signed original device TEST and independently reconciles the original first Rosie source GET plus a fresh six-peer PostgreSQL readback. A browser file, copied JSON status, screenshot or synthetic CI fixture is not an authorized original operator.

As of the QL-360 original field record, issuer and witness pins were **not independently authenticated**; Ree/Jack's distinct signed owner decisions, original device enrollment, protected receiver credential, actual device TEST and signed original receipt were absent; six peers were **HOLD**. The release of Build 793 does **not** change those facts or invent a source grant. Its verified transition is **`UNVERIFIED / HOLD` → `VERIFIED TEST / HOLD`** only after the real private evidence is available. `connectionState` stays `DISCONNECTED / HOLD`; no customer messages, device actions or application source grants become possible.

Upstream originals: [Comms QL-360 owner instructions](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-360_ORIGINAL_PRIVATE_TRUST_ARCHIVE_SHUTDOWN_AND_SIX_APP_EXPORT.md) and [Rosie 792 source GET evidence instructions](./build792_ql359_original_supervised_first_rosie_get.md). The QL-360 reviewed commit is `da204096d362bf1b3f17c5dc243440fb7800f7e1`.

## Ree and Jack: original Windows read-only checks

**Ree** uses her original `DESKTOP-AE894KC` account `Ree`; **Jack** separately uses `TEMPLAR` account `jfros`. From each local Rosie checkout, and with the **reviewed, unchanged** QL-360 Comms checkout on the same computer:

```powershell
git status -sb
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql360-793.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
```

On Jack's machine use `C:\Users\jfros\rosevear-comms-hub-ql340` (or Jack's actual local Comms path). If the wrapper reports a different commit or modified operator file, review the checkout with the original owner; do not overwrite it or bypass signature checks. It emits only sanitized HOLD/readiness fields and has **no** automatic Git pull, key import, credential grant, database write or service restart. Share only sanitized `-Status` JSON, never key files, private packet evidence, credentials or customers' records.

## Original TEST and protected receipt archive steps

1. **Authenticate independently before proceeding.** The original external issuer and a distinct witness validate the existing public-pin custody; Ree and Jack independently sign the *same* current narrowly scoped TEST digest on separate devices. An original protected administrator validates and enrolls exactly one device and a limited receiver credential. Without these facts, stop at HOLD.
2. **Run the original one-device TEST.** Ree supervises the genuine QL-359 signed device request and original append-only PostgreSQL receipt. The independent witness signs the exact closeout transcript. No public listener, customer data, mass synchronization or other peer activation.
3. **Actually stop the TEST receiver.** Only the existing authenticated original QL-340C `-Stop` performs an approved stop. It produces the original `ql340c-stopped-*.json` receipt. `RECEIVER_ALREADY_OFF` is *not* a valid witnessed stop. The supervised stop must not disturb working LAN Caddy or AI Hub recovery services.
4. **Ree only:** within **90 seconds**, with original QL-360 Comms checkout selected, run `-ShutdownReadback -StopReceiptPath '<original-stop-receipt>'`. This verifies the authentic private Evidence folder, positive stopped PID, zero local 8788 and zero private Tailnet 8443 listeners; it remains observation only. The read-only Rosie wrapper accepts the same option, but it **never** stops a process.
5. **Ree only:** after genuine QL-359 receipt and fresh stop evidence, run the QL-360 **original Comms operator** `-ExportPostTest -ExportStopReceiptPath '<original-stop-receipt>' -OriginalPacketPath '<original-signed-packet>' -OwnerReviewPath '<original-owner-review>'`. This writes only an owner-ACL-protected, redacted local evidence snapshot. Follow the upstream QL-360 runbook, not copied chat commands, for the exact original files. Its separate private runtime `archiveQl360OriginalPostTestEvidence` consumes the actual one-use closeout, verifies the restricted DB role, exactly one receipt, zero revocations and six peers HELD, then atomically archives and hashes the redacted evidence under Ree's original owner-only Windows storage. Presence of an archive file alone is not proof.
6. **Separate Rosie authorization:** an independently authenticated original Rosie source operator verifies `rosiedazzlers` source signer, `rosie-dazzlers` child, distinct source/master signed decisions and original DB enrollment. Only after that authority may the operator perform the *single* QL-792 protected `TEST GET /api/integration/v1/shell/health` and independently verify the source's first signed broker receipt. This source GET is not the QL-360 device TEST.

## Build 793 private import and reconciliation contract

[`createQl793OriginalTrustReconciliation`](../scripts/ql793_original_field_receipt_source_transition.mjs) has **no file-upload or public `--import` method**. Its four callbacks are provided only by separately authenticated, original private code:

- `verifyOriginalQl360Archive()` consumes genuine in-process QL-360 archive proof, not an unverified JSON status.
- `readOriginalQl360Archive({archiveId,expectedSha256})` reads the exact owner-only original Windows archive via QL-360 storage and checks its SHA-256 against canonical JSON; only the reviewed fields and six HELD peers are allowed.
- `verifyOriginalRosieFirstSourceReceipt(...)` cryptographically verifies original source/child signer enrollment, distinct source/master owner decisions, the independent witness pin, the exact QL-359 session and signed transcript and exactly one original QL-792 broker GET receipt. No self-issued authority or missing receipt can substitute.
- `readOriginalSixAppPeerSnapshot(...)` performs a fresh authenticated QL-341 limited-role PostgreSQL readback of all six exact peer identities, one device receipt, no source grants, no customer bytes and zero connected peers.

Only when all four agree does the returned result set `testEvidenceTransitionVerified:true`, `testEvidenceState:'VERIFIED TEST / HOLD'` and `accepted:true`. **It still sets `connectionTransitionVerified:false`, `connected:false`, `connectionState:'DISCONNECTED / HOLD'`, `sourceGrants:0`.** Any original snapshot claiming CONNECTED or a source grant is rejected by this Build; such a transition requires a separately authorized future Comms source-grant contract, independently signed owner consent, fresh signed TEST probe and protected DB readback. Build 793 never grants that permission by implication.

## Safe local verification

```bash
node scripts/ql793_original_field_receipt_source_transition.mjs --status
node scripts/build793_original_field_receipt_transition_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

The CI test creates **synthetic collaborators**, verifies both success-contract structure and failure conditions, and does not import original private files or contact Comms. GREEN production checks prove that Build 793 software is deployed; only genuine independently verified original field evidence can prove a future live connection.
