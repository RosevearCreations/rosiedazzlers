# Rosie Dazzlers Build 791 — original Windows activation assistance and first live TEST handshake

## Starting point: source code GREEN is not a live connection

Comms Hub **QL-358** was merged to its `main` at reviewed commit `88ceba4fdcf0115b48d3f510159682c8d530d6e8`. Its verified original-device/production readback on November 6, 2026 Eastern showed the original Ree/Jack computers and local key candidates, but **no independently authenticated issuer/witness, no signed owner enrollment, no protected PostgreSQL device enrollment, no dedicated DPAPI credential, no TEST receipt, and no approved six-app source grant**. Ree's LAN listener was present; the original private gateway and loopback receiver were OFF. Jack's local master candidate was present. **Do not say the first handshake succeeded unless we see genuine source-level receipt evidence.**

Original [Comms QL-358 field instructions](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-358_ORIGINAL_AUTHORITY_CREDENTIAL_AND_FIRST_LIVE_TEST.md).

## A. Check the original computers first (no changes)

**Ree — only on original `DESKTOP-AE894KC` as `Ree`:**

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -Status
```

**Jack — only on independent `TEMPLAR` as `jfros`:**

```powershell
cd C:\Users\jfros\rosevear-comms-hub-ql340
git status -sb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -Status
```

If on the exact reviewed QL-358 checkout and Rosie Build 791 source is present locally, the equivalent sanitized Rosie wrapper for **either computer** is:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-791.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
```

Run that last command from the **Rosie repo**, not the Comms repo. Jack changes only the Comms path to `C:\Users\jfros\...`. The Rosie wrapper pins exact QL-358 commit `88ceba4...` and rejects changed QL-358/357/356/340C scripts; it will report HOLD even when the reviewed files are present. Do not run a stale or locally modified checker. On a clean checkout you can independently review and then update with `git pull --ff-only origin main`; stop if any local changes or divergence appear. No `reset --hard`, forced checkout, unrelated service restart or manual firewall change.

## B. Solve the first real blocker: original external issuer and witness

1. We need the **previously independently approved** public Ed25519 fingerprints of the original issuer and a *different* field witness. Each independent custodian must authenticate provenance, custody and revocation before signing the current exact one-device TEST request digest. A new self-issued key or copied public JSON cannot substitute.
2. Ree identifies her original four nonsecret *file paths* (actual Windows process/startup, original TLS certificate/chain, Tailnet ACL, and rollback evidence), stored in a local access-restricted JSON file with `windows`, `privateTls`, `tailnetAcl`, `rollback`. Never share the private file contents, TLS keys or signing passphrases in chat.
3. After both external authorities are ready, Ree prepares a **fresh 20-minute unsigned request** using QL-356 `-PrepareUnsigned`. The command and filenames are in [QL-358 steps 2–3](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-358_ORIGINAL_AUTHORITY_CREDENTIAL_AND_FIRST_LIVE_TEST.md). Ree reviews the resulting request with QL-358 `-ReviewRequest -RequestPath ... -EvidencePathsFile ...`; only the **public unsigned request** goes to Jack.
4. Jack independently checks his local master public key and the **same** request SHA/expiry on TEMPLAR using QL-358 `-ReviewRequest -RequestPath ...` with **no** Ree evidence manifest. Both stop if any byte, fingerprint or validity window differs.
5. After the genuine external custody attestations, Ree and Jack each deliberately sign the scoped one-device `TEST` decision using their existing original QL-354 `--sign source` and `--sign master` commands on separate computers. Ree verifies original `--assemble` and QL-358 `-ReviewSigned`. No automated/CI signatures are permitted.

Rosie 791's Windows wrapper supports those same reviewed operations only by explicit owner command-line parameters: `-ReviewRequest -RequestPath ... -EvidencePathsFile ...` (Ree); `-ReviewRequest -RequestPath ...` (Jack); and `-ReviewSigned -SignedRequestPath ... -SignedEvidencePathsFile ...` (Ree only). It captures potentially sensitive original output, emits sanitized HOLD status and **does not sign or enroll**.

## C. Genuine protected device enrollment and credential

An independently authenticated original private administrator now uses QL-357's one-use signed enrollment transaction after verifying the issuer/witness, original four evidence bytes and *both* different owner signatures. The administrator must see exactly one original device enrollment, zero revocations, zero receipts and **six peers HELD**. We cannot do this with a browser flag, a fake DB row or a review-only signature.

Only after the legitimate protected enrollment and separate original administrator approval may the admin provision the limited `ql340c_private_receiver` PostgreSQL role. The dedicated URL must be entered **privately on Ree's original Windows account**, using the existing `ql340c-windows-operator.ps1 -StoreCredential` hidden prompt with Windows current-user DPAPI. Do not send this URL to chat, CI or GitHub. Rosie 791's explicit `-CredentialHandoff` and `-ReceiverReadback` only delegate to the approved QL-358 read-only steps; they neither enable a login nor start anything.

**The actual first signed *device* TEST** (not Rosie yet) must be supervised using QL-358/340C/352, the original AI Hub device key, private Jack → Ree Tailnet 8443 and original restricted receiver with direct 8788 denied. Stop only the exact TEST listener afterward; preserve the LAN Caddy and AI Hub startup/recovery process. QL-358 `-VerifyReceipt` accepts exactly one genuine Ed25519 device receipt from the original protected PostgreSQL ledger, with independently authenticated session and transport.

## D. Separately enroll Rosie as an application source; then one live GET

QL-358's first device receipt **does not enroll Rosie**. The original private administrator must separately verify and persist the already reviewed **`rosiedazzlers`** source signer and **`rosie-dazzlers`** child scope, link the original device enrollment digest, authenticate the source signer public pin, and verify fresh distinct Ree/source and Jack/master TEST decisions. There is no new public endpoint or blanket six-app privilege. This Rosie build does not invent a source DB schema or bypass the original protected owner-controlled transaction.

Only the trusted original Windows sidecar may supply the four callbacks to `createQl791OriginalLiveRosieHandoff` in [`ql791_original_ql358_live_rosie_handoff.mjs`](../scripts/ql791_original_ql358_live_rosie_handoff.mjs):

1. `verifyQl358FirstLiveDeviceReceipt()` calls the real QL-358 `reconcileQl358FirstLiveTest` with its original in-memory single-use receiver ticket and signed packet, authenticated PostgreSQL, original private operator and Tailnet transport. It must return **one** first device receipt, correct restricted credential, issuer/witness and both owners, and zero connected peers.
2. `verifyRosieOriginalSourceEnrollment(...)` performs protected **original DB + signature readback** of exactly one `rosiedazzlers` source and `rosie-dazzlers` child enrollment, original device link, distinct owner decisions and source signer pin, without granting source TEST or customer-data privileges. A copied JSON response or browser flag cannot implement this callback.
3. `runOneOriginalRosie790(sourceSignedPacket)` delegates to the genuine one-use Build 790 → 789 → 788/787 → Comms QL-350 private operator. It allows exactly one fresh `TEST GET /api/integration/v1/shell/health`, no credential/endpoint selection and no retry. The original independent Ed25519 field witness must sign the exact request, broker receipt and operation.
4. `readOriginalRosieCrossAppHandshake(...)` independently reads the *first* persistent original source GET entry, linked to the source enrollment hash and signed witness digest, with zero customer bytes, no connected peer and no extra GETs. A single successful HTTP 200 without the original signed matching receipt **fails**.

Result `FIRST_AUTHENTICATED_ROSIE_CROSS_APP_TEST_VERIFIED_STILL_HELD` means **one scoped nonproduction GET only**; all six apps remain `DISCONNECTED / HOLD` until a separately authorized connection/grant decision. Any failure consumes that attempt; use a newly approved fresh request and separate original owner review to try again. The adapter is server-only; `--status` is fail-closed and public `--run` is denied.

## Software verification versus original hardware proof

```bash
node scripts/ql791_original_ql358_live_rosie_handoff.mjs --status
node scripts/build791_original_live_rosie_handoff_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

The regression uses **synthetic collaborators** to verify denials and exact single-use semantics; it is not a genuine signed receipt. We cannot perform the original physical Ree/Jack signing ceremony, the independent issuer/witness authentication, a DB role grant or the private receiver startup from this repository. If assistance is needed, share only the **sanitized `-Status` JSON** from both original Windows accounts. Never share passwords, private `.pem`, `.dpapi`, original signed packets or customers' information.
