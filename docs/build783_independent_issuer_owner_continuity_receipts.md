# Rosie Dazzlers Build 783 — Independent Original-Issuer Attestation Intake, Expiring Owner Decision Continuity & Nonproduction Broker Receipt Provenance Controls

## Release scope and original evidence boundary

The existing **Admin → I.T. Connections → Comms Hub** page remains at `/admin-comms-hub-v781.html` with an added Build 783 original-evidence provenance panel. The panel works only with independently reviewed, **sanitized**, nonsecret QL-346/347/353 readback JSON. It cross-checks the original QL-346 signed-envelope and owner-request SHA-256 references against QL-347's deterministic nonauthorizing custody receipt, verifies source/master role ordering and held decisions, expires stale QL-345 owner reviews, and rejects QL-353 reports claiming an active or cross-tenant connection. Browser files stay in-tab, no upload/storage occurs, and the downloaded provenance register is unsigned and explicitly **not** permission to connect.

The original QL-346 Windows heartbeat contains a private nonce and session ID; **never submit it to this public source web page, ChatGPT, GitHub, or a static report**. Build 783 adds `scripts/ql783_original_issuer_offline.mjs`, a local Node-only, side-effect-free Ed25519 verification command. It requires the exact original QL-346 signed heartbeat, the corresponding original device **public** candidate and the independently observed original public SPKI SHA-256 fingerprint. It checks the exact TEST-only audience/device/workload, capabilities, one original sequence, zero queue, 90-second expiry and Ed25519 signature. Its output does **not** contain the original packet, nonce, session ID, signature, credentials or private keys. It can verify signature mechanics, **not issuer identity, source owner consent, database enrollment, an independent receipt or an active network connection**.

Build 783 does **not** introduce a database migration, KMS key, private operator session, signed grant, remote GET, source/cross-app data, Windows/Tailscale change or any customer/booking/payment activity. QL-345 review-only signatures and copied QL-346/347/353 status flags do not replace separate original QL-340B enrollment decisions and source-owner TEST authorization. Even a future authentic **one-device** QL-353 receipt cannot itself authorize Rosie's individual source signed GET.

## Latest original Comms Hub evidence observed for this build

Comms Hub `main` source inspected at QL-353 `30e1113...` on November 6, 2026. The QL-353 production runbook reports original device enrollments **0**, original relay signed receipts **0**, six peer rows **HOLD**, and the dedicated private receiver DB role `NOLOGIN`. A supervised QL-352 private Tailnet HTTPS transport test was stopped and returned `503 HOLD`, which proves only the gated transport behavior, not owner authority or a signed handshake. The latest original Windows `-Status` readback provided by the owner likewise reports no signed enrollment, no independently approved public pins, no private DB credential and no activated private receiver. The original source Proof-B file remains absent in this repository.

## Owner field procedure (not performed by this software release)

1. On Ree's **original Windows computer**, open PowerShell in the trusted clean Rosie Dazzlers checkout at the Build 783 `main` commit. Confirm the original Comms Hub checkout is genuinely the expected signed release and the original device/public candidate belongs to the right issuer. Do not transfer private keys, passphrases, cookies, database credentials or raw private heartbeat JSON to ChatGPT.
2. The original issuer must independently authenticate the original public Ed25519 SPKI fingerprint over a separate trusted channel. Only for an authentic, **fresh 90-second** original QL-346 heartbeat, use this read-only local command:

   ```powershell
   node .\scripts\ql783_original_issuer_offline.mjs --verify-local "FULL_PRIVATE_PATH_TO_QL346_HEARTBEAT.json" "FULL_PATH_TO_ORIGINAL_DEVICE_PUBLIC_CANDIDATE.json" "64_CHARACTER_INDEPENDENTLY_VERIFIED_PUBLIC_SPKI_SHA256"
   ```

   This command never sends a network request. If the heartbeat has expired, it stays HOLD; do not rewrite timestamps or reuse a copied signature. Retain the original private packet in original-owner-controlled storage only. The *printed redacted summary* may be reviewed later, never the raw packet.
3. Ree and Jack each independently review/sign their distinct exact QL-340B **TEST enrollment** decisions only after authentic issuer and field evidence, following the [Comms Hub QL-353 runbook](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-353_ORIGINAL_OWNER_SESSION_AND_FIRST_SIGNED_TEST_RECEIPT.md). An old QL-345 review acknowledgement must be replaced if expired; it is not TEST consent.
4. Only a separately authorized original database custodian can approve an actual enrollment; a limited private receiver session must independently verify it and exactly one immutable original device receipt using QL-342/353. Never use management access to bypass `ql340c_private_receiver` role rules.
5. In Rosie Admin I.T. Connections, re-run the **local** QL-345 public review, and supply only the sanitized QL-346, QL-347 and QL-353 summaries. A matching format/digest chain remains `DISCONNECTED / HOLD`: verify real receipt provenance through the independently authenticated private broker and authorize Rosie's own source-scope TEST separately before any network connection.

## Tests

`node scripts/build783_original_issuer_custody_provenance_test.mjs` exercises valid **synthetic** original-device Ed25519 signatures, altered scope/capabilities, stale 90-second envelope, SPKI mismatch, expired/changed source-master decisions, QL-347 digest tampering and contradictory QL-353 receipt/grant claims. `bash scripts/current_booking_wizard_regression.sh`, `bash scripts/current_source_gate_contracts.sh`, and `bash scripts/current_optional_authority_triggers.sh` keep every required prior workflow and authority gate. Original issuer/customer/source handshake tests remain **NOT RUN** in CI; synthetic fixtures never represent real signing approval.
