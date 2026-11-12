# Rosie Dazzlers Build 851 — Original-Device Provider Witness, Master ACK Correlation & Consent-Safe Review

## Release order
This Build 851 branch starts from Build 850 PR #978 feature commit `4b8f6f29955cd60303b1c6486321b4d940fedc1a`, because protected Build 850 GitHub Actions checks remain queued. The Build 851 feature PR targets the Build 850 feature branch, not production directly. Do not merge Build 851 into `dev` or `main` unless the complete protected Build 850 release is promoted first and every subsequent protected gate is GREEN.

## Implemented
- `GET /api/admin/jobday_witness_851?booking_id=<uuid>` provides owner-only enrollment/readiness counts, never raw witness details.
- `POST /api/admin/jobday_witness_851` requires a signed-in Rosie owner session (no legacy bridge), an exact original booking, a single linked DAIP project and complete bounded post/attempt/consent-audit windows.
- `admit_original_device_witness` checks an independently pinned Ed25519 signature, enrolled device ID, exact source deployment SHA, original booking/project/post/platform, Build 850 receipt IDs, owner case, revoked consent, distinct witness signer, nonce and short validity. It writes an append-only **review** rather than an operational provider assertion.
- `correlate_independent_master_ack` accepts a separately pinned AI Data Platform Ed25519-signed **non-authorizing** acknowledgment review bound to a **previously recorded** witness hash and nonce, exact revision, source/consumer contract, owner case, receipt reference and replay digest. A signed claim is **not** independent proof that transport or durable replay happened here; both remain HOLD.
- `review_consent_safe_exception` permits only a scoped internal decision after an original consent-revocation audit and matching recorded witness/ACK reviews. No re-consent or global third-party mirror removal is implied.
- Receipt nonce reuse is rejected against the complete 250-entry available original audit window. These history checks are not an atomic database uniqueness guarantee. A transactionally enforced, durable nonce ledger and independently verified runtime transport are required before any genuine receiver authority.
- No social provider writes, publication, CDN purge, cross-app events, consumer grant or CONNECTED state. The source never uploads photos, provider tokens, detached private signatures or signing keys to the Master.
- Run `node scripts/build851_original_device_receiver_test.mjs` and the existing Build 850 test. Complete all protected CI before merge.

## Required public enrollment (do not expose private keys)
- `CF_PAGES_COMMIT_SHA`: exact deployed 40-hex source SHA
- `ROSIE_ORIGINAL_DEVICE_ID_851`: independently enrolled original device ID
- `ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851`: pinned independent original-device witness Ed25519 public key
- `ROSIE_AIDATA_RECEIVER_ACK_ED25519_PUBLIC_KEY_851`: pinned independent Master receiver acknowledgment Ed25519 public key

## Master controller handoff
AI Data Platform controller issue [#857](https://github.com/RosevearCreations/ai-data-platform/issues/857) must verify contract `rosie.ai-data.social-recall.correlation.v851`, original-device witness key enrollment, receiver identity/audience, exact deployed source SHA, a durable ACK reference and atomic replay protection **independently**. Until a real consumer-side signed receipt and transport verification are demonstrated, external provider acceptance, original-device operational presence, consent closure, Master transport and CONNECTED remain HOLD.

## Release verification
A successful Cloudflare Pages preview does **not** equal protected production GREEN. After all gated changes are merged sequentially, check the exact `main` SHA and all six Cloudflare production jobs, including production smoke. Record the evidence in the PR before declaring software Production GREEN.
