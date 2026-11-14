# Rosie Dazzlers Build 882 — Signed Scheduler Enrollment, External Anchor Readback & Owner Grace ACK Continuity

## Delivery boundaries
Build 882 adds a Cloudflare Pages Functions **bearer + independently signed fresh challenge** verification endpoint, an exact GitHub external Ed25519 anchor comment readback reconciliation (all source digests, no gaps/duplicates), and a human GitHub owner acknowledgment check pinned to the **current redacted source-history alert fingerprint**. Nothing writes to customer or financial records, rotates a key, or manufactures native provider events.

The enrollment endpoint POST `/api/roadside_scheduler_enrollment_v882` is read-only. It accepts an authenticated `watch` or `anchor` challenge, signs using the separately held GitHub Ed25519 private signer, and verifies against Cloudflare's original pinned public JWK distinct from operator keys. Challenge age is <=5 min; **this is not a persistent nonce replay ledger, lease, or proof that GitHub's scheduler executed continuously**. The scheduled workflow reports any missing or mismatched secret or signer as **HOLD**, not GREEN.

## Original owner acknowledgment continuity
The GitHub owner must review the alert issue titled `[Rosie 881] Original signed native history / issuer grace owner alert` and reply **from the `RosevearCreations` GitHub owner account**, in an exact issue comment:
`ROSIE882-ACK: <snapshot_sha256>`

Obtain the fingerprint from the 882 owner job's readback log after the 881 watch job publishes the current issue snapshot. Verification checks original owner login, exact snapshot match, exact SHA-256 fingerprint, original comment readback and a <=7-day acknowledgment. After severity/count changes or seven days, a renewed owner review and fresh acknowledgment is required. An ACK never closes the alert or proves provider delivery, financial settlement, physical rotation or issuer grace extension. No automation is authorized to fabricate a human acknowledgment.

## Independent readback
The 882 anchor job retrieves the original Supabase receipt digests only via the existing authenticated Cloudflare endpoint, validates original pinned signer versus the GitHub signer, reads the original GitHub issue comments, cryptographically verifies Ed25519 signatures and checks an exact one-to-one match for every digest. No original receipt -> **HOLD**. Missing, extra, duplicated, malformed, stale-coverage or tampered comment -> **HOLD**. The GitHub provider is separate from Supabase; GitHub issue comments are not WORM or independent human attestation.

## Enrollment prerequisites & verification
Cloudflare Production variables already required by 881: `ROSIE881_OWNER_WATCH_ENABLED=true`, `ROSIE881_EXTERNAL_ANCHOR_ENABLED=true`, matching strong watch/anchor bearer secrets, and `ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK` distinct from the closure key roster. GitHub Actions secrets: the two matching job secrets and the separately held `ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK` (private signer must **never** be added to Cloudflare). Provision through the original vendor consoles; this repository cannot read back their secret values.

Run the 881 watch and 881 independent anchor manual workflows after genuine supervised original Build 880 receipts, then `Rosie 882 Signed Enrollment, Independent Anchor Readback and Owner Grace ACK` via workflow_dispatch. Confirm exact workflow logs and the current owner issue. Scheduled checks may run late. A **software production GREEN** state is separate from **operational enrollment and owner ACK GREEN**; never infer one from the other.

Release: feature -> protected dev -> protected main -> exact main SHA Cloudflare Pages Functions-aware Production, Source/Business acceptance and Release Health GREEN including CI budget. No Supabase migration for 882.

References: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule ; https://docs.github.com/en/rest/issues/comments ; https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ .
