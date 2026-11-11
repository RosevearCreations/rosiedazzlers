# Rosie Dazzlers Build 849 — Multi-Episode Recall Integrity, Marketing Exception Priority & Independent Master ACK Preflight

**Release authority:** Source-owned Rosie Dazzlers business shell. **Software Production GREEN:** [protected dev PR #974](https://github.com/RosevearCreations/rosiedazzlers/pull/974), [protected main PR #975](https://github.com/RosevearCreations/rosiedazzlers/pull/975), and [all six successful exact-SHA Cloudflare Production jobs #43094264347](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/43094264347), including verified deployed feature `main` revision `60b5a4acf3ed9aefa7a43332d70733b0bfd2dbc3`. Any later documentation-only release record requires its own protected Production checks. **External provider, original-device, independent Master runtime ACK and CONNECTED:** HOLD unless independently proven.

## Multiple recall episodes without loss of evidence

`GET/POST /api/admin/jobday_integrity_849` requires a genuine Rosie owner session, unique original job/DAIP project, consent withdrawal, specific job-originated social post and complete bounded audit/receipt history. It rejects legacy password or an unsigned staff bridge. No social provider, image R2, CDN or AI Data system is mutated or called.

Action `reopen_repeat_verified_conflict` requires the **latest** prior scoped closure (846 or 848) plus a **later, authenticated HTTP 200 verified LIVE provider** receipt. Owner confirms revocation and external recall remains HOLD. A new append-only `recall_reopened_verified_provider_conflict` row links both exact receipt IDs and the episode number; previous closure and evidence stay intact. The same live receipt or previous closure cannot be reused for a later episode. The existing 848 scoped-reclosure action can then require fresh signed provider removal/CDN evidence *after the newest reopening* and a live R2 origin absence check. Broken links, duplicated evidence, incomplete source windows and later verified LIVE evidence block autonomous closure. Build 849 prioritizes conflict states, reopened issues and elapsed recall age as `CRITICAL`, `HIGH`, `ELEVATED`, `MONITOR` or `NONE`; these are source evidence priorities, not guaranteed external SLA resolutions.

## Independent Master runtime ACK **preflight only**

An owner may request `preflight_independent_master_runtime_ack` with a separately signed Ed25519 **schema-preflight** review. The server needs its independent public pin `ROSIE_AIDATA_SOCIAL_ACK_PREFLIGHT_ED25519_PUBLIC_KEY` (raw 32-byte public key encoded base64url); private signing keys never enter the UI/repository. Receipt must have exactly ordered fields:

`version, kind, source_id, source_contract, source_revision, consumer_id, receiver_id, decision, permissions, schema_digest_sha256, master_case_reference, nonce, issued_at, observed_at, expires_at, signer_id, runtime_acknowledged, consumer_authorized`.

Canonical signed bytes: UTF-8 prefix `ROSIE-849-AIDATA-PREFLIGHT-V1\n` followed by JSON of the field **values array**, in the order above. Receipt values: `version=1`, `kind=runtime_ack_preflight_review`, `source_id=rosiedazzlers`, `source_contract=rosie.ai-data.social-evidence.preview.v849`, `source_revision` exact runtime `CF_PAGES_COMMIT_SHA`, `consumer_id=ai-data-platform`, `decision=schema_preflight_compatible_hold`, `permissions=review_only_no_consumer_grant`, `runtime_acknowledged=false`, `consumer_authorized=false`. The independent digest must equal `schemaDigest849()` for the exact aggregate-only v849 schema; receipt issued/observed age <=10 minutes and expires <=20 minutes after issue. Distinct signer, safe owner case, valid nonce, expiry/replay and exact schema are mandatory.

Only a private owner audit of the safe canonical SHA-256 is admitted. This is **NOT** an original Master consumer transport receipt, runtime ACK, signed HEALTHY uptime receipt, source signer enrollment, cross-app audience grant, owner acceptance or CONNECTED state. No customer name, post URL, private media, provider account, access token or booking UUID is transferred to AI Data.

## Dashboard & privacy

New Socials owner exception view shows read-only status, incident priority, reopen episode count, verified chain gaps and a deliberate multi-episode reopening + Master preflight intake; status announcements support mobile assistive technology. Private source endpoint `/api/admin/master_social_intelligence_v849` stays signed-supervisor-only and local, with safe de-identified aggregate counts `multi_episode_recall`, `priority_critical`, `priority_high`; source-window truncation and UNKNOWN completion scoring are preserved. No Master external consumer is granted.

**Tests:** `node scripts/build849_multi_episode_master_ack_test.mjs` and the full cumulative `scripts/current_booking_wizard_regression.sh`. Independently verify GitHub source checks and exact Production Cloudflare run before status GREEN.

**Direct Master instructions:** [AI Data Platform issue #839](https://github.com/RosevearCreations/ai-data-platform/issues/839). Master must independently accept contract/schema, enroll and custody an Ed25519 signer, source revision, nonce/freshness ledger, consumer audience and receiver policy; return sanitized proof, or explicit HOLD reasons. No proxy credential access or runtime status invention.

**Next proposed Build 850 — Evidence-Custodied Provider Recovery, Cross-Platform Social Recall & Master Receiver Pilot Decision.**
