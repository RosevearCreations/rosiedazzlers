# Rosie Dazzlers 792 — original QL-359 closeout and first signed Rosie GET

## Actual state and trust boundary

Source-code promotion to `dev` and `main` **cannot prove a connection**. Comms Hub QL-359 is on its reviewed `main` commit `46a3465365d2136466aa8f3d3b3297bcb467f773`; its original Windows status still needs independent issuer/witness authentication, two distinct owner signatures, approved original database enrollment and a restricted local receiver credential. No protected first device TEST, independent receiver-stop witness or first Rosie source GET has been evidenced in this build. **Six source peers remain `DISCONNECTED / HOLD`.** A newly minted self-signed key or synthetic CI receipt does not satisfy the external original-custody requirement.

The authoritative [Comms QL-359 original owner runbook](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-359_ORIGINAL_AUTHORITY_SUPERVISED_PRIVATE_TEST.md) and [Rosie 791 source enrollment runbook](./build791_original_ql358_windows_source_enrollment_live_handshake.md) are prerequisites; verify both before any action.

## 1. Ree and Jack: read-only original Windows status

On original **Ree** server `DESKTOP-AE894KC`, sign in as `Ree`. On **Jack** independent `TEMPLAR`, sign in as `jfros`. Each must use their own existing local Comms checkout and the distinct original key candidates. From the *Rosie Dazzlers* repo directory, with the existing Comms checkout at the exact reviewed QL-359 commit (stop if dirty/diverged):

```powershell
git status -sb
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql359-792.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
```

Jack changes only `-CommsCheckout` to his actual `C:\Users\jfros\rosevear-comms-hub-ql340`. Do **not** copy Ree's key, restricted credential, private evidence, or receiver configuration onto Jack's laptop. The wrapper refuses unreviewed Comms commits or modified operator dependencies, and emits only sanitized HOLD fields. It does not modify Git, credentials, processes, firewall rules or the database.

If the locally installed Comms commit differs, review your working tree before any update. An authenticated operator may use `git pull --ff-only origin main` after confirming there are no local edits. This build **does not** automatically pull, overwrite local changes or restart the working AI Hub.

## 2. Independent original issuer, owner and receiver enrollment

1. Original external issuer and **different** field witness independently authenticate their existing Ed25519 public-pin provenance and revocation. Do not generate a replacement key just to remove HOLD.
2. Ree reviews the fresh **public**, 20-minute `TEST` request using QL-359 `-OwnerReview -RequestPath <public-request.json> -EvidencePathsFile <original-four-paths.json>`. Jack independently runs `-OwnerReview -RequestPath <same-public-request.json>` on `TEMPLAR`, without Ree's private four-path manifest. The exact public request digest/expiry must match.
3. Ree/source and Jack/master sign **separate, original** narrowly scoped owner consent decisions after independent custody checks. Only a trusted original private administrator validates/commits the exact authorized device enrollment and one restricted receiver credential. Ree can then run `-CredentialReadback` (read-only), which is not enrollment or an approval.
4. Supervise only the specifically approved **one** original device TEST on the private Tailnet and approved loopback receiver. Do not expose port `8788`, open a public gateway, trigger customer messages, or touch production data. The existing LAN Caddy, Windows launcher, AI Hub recovery and other services must remain intact.
5. An independently authorized Windows operator actually stops the dedicated **TEST** listener, verifies the original receiver's zero-listener state, and obtains the separate external closeout witness signature against the exact transcript. Ree's `-StopWitness` is only a **read-only observation** after the supervised stop; it never stops a process. QL-359's genuine original one-use reconciliation must verify the Ed25519 device receipt from protected PostgreSQL, the independent STOP and witness, exactly one receipt, and six HELD peers. `-ReceiptReview -OriginalPacketPath <packet> -OwnerReviewPath <review>` only checks the input; it cannot create the receipt.

The corresponding read-only Rosie wrapper options are `-OwnerReview`, `-CredentialReadback` (Ree), `-StopWitness` (Ree) and `-ReceiptReview` (Ree). A sanitized `-Status` result with original host identity and HOLD flags is safe to share. **Do not paste original source-signing keys, complete signed packets, credentials, private network addresses, owner secrets or customer data into chat/CI.**

## 3. Separate Rosie source enrollment and exactly one original GET

The QL-359 **device** closeout never grants Rosie access. An original independently authenticated private operator must verify the `rosiedazzlers` source signer, `rosie-dazzlers` child, separate source/master owner decisions, current scope and original protected DB readback. Nothing in Build 792 can enroll the source or grant permissions.

Only this protected server-side operator supplies four functions to [`createQl792OriginalFirstRosieGet`](../scripts/ql792_ql359_supervised_first_rosie_get.mjs):

- `verifyQl359IndependentDeviceCloseout()` invokes the actual QL-359 private ticket-consuming verification and checks the genuine separate signed STOP/closeout, one device TEST, no connected peers.
- `verifyRosieOriginalSourceEnrollment(...)` checks exactly one *separately authorized* original Rosie source+child DB and signing readback, preserving all source permissions on HOLD.
- `runOneOriginalRosie790(signedPacket)` sends just one fresh, signed `TEST GET /api/integration/v1/shell/health` through the already existing protected Rosie QL-790 → QL-350 original broker path. There is **no public `--run`**, no retries or browser action.
- `readFirstSourceGetAfterQl359(...)` independently reconciles the immutable source entry against the exact QL-359 session/transcript, Rosie source enrollment hash, operation, signed request, private broker receipt and distinct field witness. It accepts **one** source receipt, **zero customer bytes** and **six HELD** peers only.

If *all* original external checks succeed, the narrow result `ONE_ORIGINAL_SIGNED_ROSIE_GET_VERIFIED_INDEPENDENTLY_SIX_APPS_STILL_HELD` attests **one nonproduction GET**, **not** a customer communication channel, connected shell or production source grant. All retries require a fresh owner-approved ceremony.

## What CI proves and what still needs people

```bash
node scripts/ql792_ql359_supervised_first_rosie_get.mjs --status
node scripts/build792_original_supervised_first_get_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

CI checks synthetic positive/negative contracts only; no genuine authority, private Windows device, credential or live broker handshake is available to CI. Original evidence must be independently verified on Ree/Jack devices before a real first GET can be reported as accepted. **Production GREEN for Build 792 means code passed protected deployment checks; connection stays `DISCONNECTED / HOLD` until actual signed field evidence exists.**
