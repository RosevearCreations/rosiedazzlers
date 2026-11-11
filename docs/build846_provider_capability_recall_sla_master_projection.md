# Rosie Dazzlers Build 846 — Provider capability, scoped recall SLA and Master source intelligence

**Source:** `rosiedazzlers`, owned-business shell. **Build status:** candidate until protected `dev`/`main` merges and exact-`main` Cloudflare Production acceptance. **External acceptance:** HOLD until evidenced separately.

## Implemented software scope

1. `POST /api/admin/jobday_recall_capabilities_846` action `verify_read_capability` requires original owner authority, exact booking, an authenticated Build 845 enrollment for the current account within 24 hours, explicit permission to make one read-only request, and protected environment credentials. It verifies the Facebook Page feed or Instagram Business media-list **read** permission using fixed-origin Meta Graph `GET`, bounded replies and a private audit digest. It cannot verify `publish` or `delete` scopes and performs **no** provider mutation. Authentication/read failure remains HOLD.
2. Action `admit_cdn_invalidation_witness` requires customer-consent withdrawal, the original per-post recall request and a separately confirmed Build 844 public R2 derivative origin deletion. It accepts only a distinct custodian's signed, source-bound Ed25519 receipt attesting an *authenticated* CDN API purge acknowledgment (HTTP 200/204), not a 404, owner screenshot or self-asserted public deletion. Exact receipt metadata, its public-key pin and a fresh one-time nonce are checked server-side. **This does not prove every edge replica or third-party mirror was removed.** No purge is executed by Rosie.
3. Action `close_recall_sla` requires owner-configured `ROSIE_RECALL_SLA_TARGET_HOURS` (1–168), independently witnessed provider deletion, Build 844 R2 origin absence, Build 846 signed CDN API acknowledgment, no subsequent authenticated provider visibility, and two explicit owner acknowledgments. It writes `recall_sla_closed_scoped` with an honest `WITHIN_OWNER_TARGET` or `BREACHED_OWNER_TARGET`. Scope is strictly **provider post + R2 public origin + CDN API acknowledgment**; external mirrors and other public copies remain UNKNOWN/HOLD. Mere age, 404, acknowledgement by a customer, or a manually closed ticket cannot qualify. A breached SLA does not become on-time.
4. `GET /api/admin/master_social_intelligence_v846` is an **original signed Rosie supervisor-only**, private read-only local preview. It aggregates bounded job-originated social-post and recall statuses, with freshness, revision and truncation qualifiers. It contains **no customer name, booking ID, post ID, media, URL, staff email, account credential or case note**. It does not emit an AI Data event, authenticate Master systems, calculate an unapproved completion percentage, or mark a Master connection `CONNECTED`. No external consumer audience has been granted.
5. The Socials admin job-day panel provides screen-reader-friendly status and independently acknowledged controls. Owner actions are explicit; no posting, CDN invalidation or public copying occurs from the UI.

## Independent CDN witness receipt contract

Pin the separately controlled **public** Ed25519 key in server-only `ROSIE_SOCIAL_CDN_WITNESS_ED25519_PUBLIC_KEY` (base64url raw 32 bytes). Never store a private key in the repo, frontend, browser, Supabase public schema or owner notes. Exact canonical bytes are the UTF-8 string `ROSIE-846-CDN-V1\n` followed by JSON of this ordered value array:

`version, kind, booking_id, post_id, platform, public_asset_url, edge_origin, cache_purge_operation_id, cache_purge_http_status, cache_purge_result, cache_response_sha256, observed_at, nonce, witness_id, authenticated_edge_request`.

Use `version:1`, `kind:"cdn_invalidation"`, authenticated purge `cache_purge_http_status:200` or `204`, `cache_purge_result:"cdn_purge_acknowledged"`, `authenticated_edge_request:true`, exact one-to-one original `public_asset_url` and its HTTPS origin, fresh `observed_at` within 24 hours, a unique 20–100-character nonce, separately authenticated witness identity and a SHA-256 digest of the actual provider reply. Supply a detached base64url Ed25519 signature. The source verifies the signature against the enrolled independent pin and records a private replay reference. An HTTP status alone without the independently signed custodian evidence is not sufficient.

**Owner policy configuration:** `ROSIE_RECALL_SLA_TARGET_HOURS` is a server environment variable whose numeric hour target must be expressly approved by the business owner. The code has no silent default. Changing policy requires separate owner action and does not retroactively reclassify previously recorded measured outcomes.

## AI Data Platform — direct Master-side integration instructions (HOLD)

**For `RosevearCreations/ai-data-platform`, Build 368/369+ source intake owner:**

1. Review proposed source-only contract `rosie.ai-data.social-evidence.preview.v846` and schema returned by `masterSocialProjection846` from Rosie. This is only a **local preview**, not a signed `HEALTHY` receipt. Keep identity `sourceId:"rosiedazzlers"`, `shellId:"rosiedazzlers"`, `role:"owned_business_shell"`; do not treat bookings/customers as additional tenant shells.
2. Establish and document the independent trusted signer enrollment, rotated public-key custody, replay/freshness ledger, approved data audience and source revision pin required by Master 366–369. Until **independently** fulfilled, leave `approvedAudience:[]`, `consumerPayloadEligible:false`, `signedEnvelope:null`, `externalConnection:"HOLD"`, `ownerAcceptance:"HOLD"`. Do **not** scrape or reuse Rosie supervisor credentials to fetch the private preview.
3. If a signed source projection is approved, negotiate a versioned minimal counters-only contract and an authorized receiving endpoint with a real independent source proof. Require a matching exact production revision, a signed envelope, bounded replay-resistant nonce, source-bound receipt and real owner consumer acceptance. **Do not** manufacture a CONNECTED state or a completion percentage from these source-only counts; empty or truncated data is UNKNOWN.
4. AI Data owns portfolio scoring, incident/connection authority, age/freshness and trusted consumer projection. Rosie owns original customer consent, provider accounts and job-level evidence. Comms retains notification/incident routing. Cross-system mutation is out of scope for Build 846.

## Validation and independently pending gates

The source regression `node scripts/build846_provider_recall_master_test.mjs` covers denied original authority, no credential/pin, authenticated read-only provider capability, invalid/mismatched/duplicate CDN signature, scoped SLA rejection, late non-forgiven SLA closure, private signed-supervisor projection and no privacy-leaking output. It runs inside `scripts/current_booking_wizard_regression.sh` with prior Builds 841–845.

**Real-world HOLD:** owner-enrolled live provider credentials and tested account permissions; real independently witnessed post removal; actual CDN provider API response and independent signer pin/custody; original customer consent and public derivative; original physical mobile device; AI Data signer, allowed consumer and runtime ACK; live Comms connection. Local tests and GREEN deployment cannot satisfy these external gates.

**Next conditional Build 847:** Original Provider/Custodian Pilot Review, Recall Reopen Conflict Detection & Master Social Evidence Contract Acceptance. Only use an approved external receiving path after independent master authority is verified.
