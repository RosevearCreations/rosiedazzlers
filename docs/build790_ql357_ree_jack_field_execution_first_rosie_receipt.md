# Rosie Dazzlers Build 790 — original QL-357 field resolution and genuine first Rosie GET

## What is actually known

Rosie Build 789 is on `main`, and Comms Hub **QL-357** reached its `main` at reviewed commit `67759492e56443f9c70f4ed25e506a6253e2b237`. QL-357's original production database readback (2026-11-06 Eastern) reported **zero approved original device enrollments, zero durable relay TEST receipts and the limited receiver PostgreSQL role `NOLOGIN`**, with all six peer apps HELD. Original Ree/Jack independent issuer/witness and dual-owner signatures were **not authenticated**. A QL-357 software release does *not* constitute on-device completion. This Rosie release likewise remains `DISCONNECTED / HOLD` until original evidence is available.

Source: [Comms Hub QL-357 original owner field guide](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-357_ORIGINAL_OWNER_ENROLLMENT_PRIVATE_RECEIVER_AND_FIRST_CROSS_DEVICE_TEST.md).

## Step 1 — original machines, separate read-only status

On **Ree's `DESKTOP-AE894KC`** account `Ree`, in a reviewed Rosie checkout, use:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-790.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -Status
```

On **Jack's separate `Templar`** account `jfros`, in Jack's reviewed Rosie checkout:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-790.ps1 -CommsCheckout 'C:\Users\jfros\rosevear-comms-hub-ql340' -Status
```

If Rosie is not installed on either Windows account, open its existing *Comms* checkout instead and execute only QL-357's original `-Status`:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -Status
```

Jack uses the corresponding `C:\Users\jfros\...` checkout. **Stop if there are uncommitted edits or an unrecognized host.** To install the reviewed QL-357 release, first separately review changes and use `git pull --ff-only origin main` only on a clean checkout. The Rosie wrapper itself never updates anything. It pins exact QL-357 `main` commit `6775949...` and refuses an unexpected version or locally edited QL-357/QL-354/QL-340C scripts. A later QL-358 or newer Comms commit will require a fresh review and a deliberate pin update.

The `-Status` result is sanitized and intentionally reports the issuer, signed owner approval, original enrollment, device receipt and Rosie broker GET **false**. File presence does *not* become an authorization. A listener unexpectedly active on `8788` yields STOP.

## Step 2 — missing human and original private-system proof

1. Ree independently checks the original process/startup, TLS certificate/chain, Tailnet ACL and rollback evidence *on her computer*; Jack reviews the exact fresh 20-minute request digest on **his own computer**, without Ree's private files.
2. An **independently authenticated original issuer and distinct field witness** (with preapproved Ed25519 pins and verified revocation/custody) attest the exact original TEST request. Neither browser/CI nor an assistant may impersonate them.
3. **Ree** then deliberately signs the one source-scope TEST decision as `source`; **Jack** separately signs the corresponding `master` decision. QL-354 contains the exact original owner signing commands; avoid reusing stale signatures or a review-only acknowledgement.
4. On Ree's computer, with the private receiver OFF and genuine reviewed request and original four-witness path manifest, this optional **owner-supervised, non-activating** wrapper checks signed intake:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-790.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -ReviewSigned -RequestPath 'PATH_TO_REAL_FRESH_REQUEST.json' -EvidencePathsFile 'PATH_TO_FOUR_ORIGINAL_WITNESS_PATHS.json'
```

5. An independently authorized original private administrator executes the *real* QL-357 `executeQl357SupervisedEnrollment` once against the protected database. The admin must verify the independent issuer/witness, signed source/master owner decisions, exact original device key, six HELD peers and zero previous rows. Neither Rosie nor this helper supplies that admin transaction. **Do not** manually insert an enrollment, flip `NOLOGIN`, change RLS or start a receiver to get GREEN.

## Step 3 — one original signed device TEST, then separate Rosie source GET

Only after the actual QL-357 enrollment and approved limited receiver credential exist, Ree may run the non-activating original private readback (it writes an ACL-restricted evidence snapshot locally):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-790.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -PrivateReadback
```

The original administrator then separately authorizes and supervises QL-340C receiver `-Start` and the reviewed QL-352 private gateway for the one signed **device** TEST, preserving Jack → Ree Tailnet 8443 allowed and direct 8788 denied. QL-357 independently verifies the authentic Ed25519-signed device packet and **exactly one** immutable PostgreSQL receipt; this is not yet a Rosie GET.

Ree can run the genuine original QL-357 device-receipt verifier through the wrapper, with the actual local packet and separate owner review files:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-rosie-original-field-790.ps1 -CommsCheckout 'C:\Users\ree\rosevear-comms-hub-ql340' -VerifyDeviceReceipt -OriginalPacketPath 'PATH_TO_REAL_SIGNED_DEVICE_TEST_PACKET.json' -OwnerReviewPath 'PATH_TO_INDEPENDENT_OWNER_TEST_REVIEW.json'
```

**This verifies only the first device TEST.** The Rosie source needs its own authenticated `rosiedazzlers` signer enrollment, `rosie-dazzlers` child scope, *fresh separate* owner TEST decisions and protected QL-350 private broker operator. A source GET is **never** allowed directly from the public site, the CLI or a synthetic fixture.

## Step 4 — original private-only, one actual Rosie broker GET and independent receipt

The protected original Windows private operator must import QL-357's genuine `acceptQl357OneCrossDeviceTest`, supply its original private DB/signature/transport options, and provide:

- `verifyQl357DeviceReceipt()` — invokes that genuine QL-357 verifier, returning exactly one original signed **device** TEST receipt, still with zero connected peers.
- `runOriginal789(packet)` — calls the one-use Build 789 instance bound to the existing authenticated QL-350 → Build 788/787 Rosie read-only `GET /api/integration/v1/shell/health` path. Build 789 independently checks the field witness Ed25519 signature against its externally pinned key.
- `readFirstRosieLedger({sourceId,tenantId,operationId,requestSha256,brokerReceiptSha256,fieldWitnessSha256})` — independently reads the protected original append-only PostgreSQL source ledger **after** the GET and confirms the *first and only* Rosie source GET, zero customer bytes, unchanged held connection state and the exact same cryptographically validated witness hash. It must not return a copied JSON fixture or self-asserted browser status.

Private adapter import: `createOriginalQl357RosieFirstReceipt790({originalOperator,now})` in [`scripts/ql790_original_ql357_rosie_first_receipt.mjs`](../scripts/ql790_original_ql357_rosie_first_receipt.mjs). Its `runOne(sourceSignedPacket)` spends its one attempt, first verifies the real QL-357 device receipt, then invokes the existing one-shot QL-789 authenticated GET once and compares its signed first receipt against independent immutable original ledger readback. Any mismatch, unavailable original admin privilege, changed issuer/witness pin, expired owner decision or missing real operator results in **HOLD with no automatic retry**. A valid first Rosie GET **still leaves six-app connectivity, customer communications and device actions OFF**; this is a nonproduction proof only, never a production grant.

## Check software versus actual connection

```bash
node scripts/ql790_original_ql357_rosie_first_receipt.mjs --status
node scripts/build790_original_ql357_rosie_first_receipt_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

The Node regression uses **explicitly synthetic** QL-357/789 test collaborators. Its successful software case cannot certify a live original receipt. Only the real on-device QL-357 signed source/admin enrollment, original signed device TEST and separately authenticated Rosie source GET plus independent protected database readback can do that. Please share **redacted status JSON only** if troubleshooting; no DPAPI/private keys, `*.pem`, signing packet, access token, TLS key, database URL, customer records or raw witness packets should enter chat.
