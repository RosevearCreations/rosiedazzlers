# Rosie Dazzlers Build 852 — Cross-Platform Recall Recovery Aging, Original-Device Recheck & Master Consumer Decision Continuity

## Software scope
- Original-owner-only `GET /api/admin/jobday_continuity_852?booking_id=<uuid>` shows **bounded local-source** per-platform recall aging and priority (under 24h / 24–72h / 72h+), open versus scoped-reviewed cases, manifest gaps, and independent enrollment indicators. It never claims all third-party mirrors are absent.
- Private `POST /api/admin/jobday_continuity_852` supports two append-only, review-only operations, both requiring original Rosie owner session, exact booking/project/post, a recorded Build 843 consent withdrawal, complete 20-post / 200-receipt-per-post / 250-audit-row windows, and explicit HOLD acknowledgements.
- `admit_signed_original_device_recheck`: independent Ed25519 signature under the enrolled Build 851 original-device public identity, exact current Pages source SHA, source contract, owner case, linked prior signed Build 851 witness digest/nonce/source revision, distinct signer, fresh 10-minute evidence window and new nonce. Records a non-authorizing digest; **signed evidence does not by itself prove physical device presence**.
- `record_signed_master_consumer_decision`: independently pinned AI Data Platform Ed25519 signature, matching prior Build 851 Master ACK digest, nonce and revision, a fresh recorded 852 device-recheck digest and nonce, shared original witness lineage, separate Master signer and a non-authorizing decision (HOLD / require recheck / reject stale). Previously recorded rechecks must still be unexpired at decision intake. No external receiver transport or replay confirmation is inferred.
- Signed receipt schemas are strict and domain separated; provider tokens, customer photos and private keys are not accepted into audit notes. Source-only owner events are append-only and bounded.
- Same-project nonce history checks reject replays within the 250-row audit window but are **not an atomic database uniqueness guarantee**; a durable transactionally unique ledger remains mandatory before any operational authority or Master CONNECTED status.
- The independent source review result always has `decision: HOLD` for operational integration, `master_connection: HOLD`, `consumer_authorized: false`, `master_runtime_ack: false`, `external_mirrors_verified: false`, and zero provider/receiver mutations.
- The explicit `ROSIE_RECALL_EXPECTED_PLATFORMS_852` environment manifest must enumerate all locally expected covered social platforms as comma-separated values from facebook, instagram, tiktok, youtube, pinterest and x. Missing, duplicated, unexpected or unrepresented platforms yield a fail-closed HOLD (the manifest is **not** proof of all Internet mirrors).

## New environment enrollment
- `ROSIE_RECALL_EXPECTED_PLATFORMS_852` — owner-approved exact local social platform manifest
- `ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852` — independently enrolled, distinct-from-device Master consumer Ed25519 public key
- Existing `ROSIE_ORIGINAL_DEVICE_ID_851`, `ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851` and `CF_PAGES_COMMIT_SHA` remain required
- Never place private keys, bearer tokens, signed receipt bodies, or customer media in Git, workflow logs or source-only Master projections

## Protected software release
Run `bash scripts/current_jobday_custody_regression.sh` plus all regular protected Source Gate and release checks. That release-number-neutral helper now includes the Build 850/851/852 regressions. Follow feature PR into `dev` only after all required checks GREEN, then protected `dev` to `main`, and independently verify the **exact deployed main SHA** Cloudflare Pages Production six-job workflow, including smoke test. Do not mistake a PR preview deployment for production.

## AI Data Platform independent controller
The independent controller must verify the source SHA, enrolled consumer identity, original-device hardware/witness provenance, durable signed receiver ACK and atomic nonce replay ledger, current consent and cross-platform evidence, and maintain a separately signed owner/consumer decision trail. Source-side cryptographic review is **not** independent runtime transport, provider deletion, third-party mirror confirmation, or receiver `CONNECTED`. Those remain operational HOLD absent controller-owned durable proof.

## Next proposed regular build
Rosie Dazzlers 853 — Master Consumer Replay-Ledger Verification, Cross-Platform Recall Escalation Routing & Owner Incident Decision History.
