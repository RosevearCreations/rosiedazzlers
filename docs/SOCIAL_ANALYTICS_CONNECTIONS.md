> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Social & Analytics Connections — Build 225

**Status:** Test-mode configuration and consent-first public tag loading are now available.  
**Read with:** `AI_PROJECT_HANDOFF.md`, then `MASTER_VALUE_ROADMAP.md`.  
**Admin screen:** `/admin-integrations.html`  
**Important:** This is a configuration and visibility release. It does **not** authorize unreviewed posting, contact-list uploads, Conversion APIs, DAIP storage, customer-media processing, or public DAIP publishing.

## The one safe place to enter values

Use Cloudflare, not the web app, not Supabase, not GitHub, and not any Markdown file.

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages**.
3. Select the correct Rosie Dazzlers project — staging first, production later.
4. Open **Settings** → **Variables and Secrets**.
5. Add each value using **Secret (encrypted)**. The current Cloudflare project may show only that choice; that is acceptable and preferred.
6. Select the correct environment when Cloudflare asks. Keep staging/test and production values separate.
7. Redeploy after changing variables.
8. Sign in as an administrator and check `/admin-integrations.html`.

The system reports only **configured**, **missing**, or **check format**. It never returns a value, access token, secret, or password to the browser.

## Two types of provider values

| Type | Examples | Where it is stored | Can it reach a public page? |
|---|---|---|---|
| Public browser tag identifier | `META_PIXEL_ID`, `GA4_MEASUREMENT_ID`, `TIKTOK_PIXEL_ID` | Cloudflare encrypted secret for safe operational handling | Yes, after the visitor grants optional measurement consent. These IDs are designed to appear in tag code. |
| Server-only credential | `FACEBOOK_PAGE_ACCESS_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, OAuth secrets, webhook secrets | Cloudflare encrypted secret only | No. It must never be sent to JavaScript, Supabase settings, notes, GitHub, or a browser. |

## Switches to set first

Add these before any provider-specific value:

| Cloudflare secret | Staging value | Production value | Purpose |
|---|---|---|---|
| `MARKETING_TRACKING_ENABLED` | `true` only while you are running a controlled staging test | `false` until privacy/consent testing is accepted; then `true` | Master on/off switch for browser marketing tags |
| `MARKETING_TRACKING_MODE` | `test` | `production` only after acceptance | Labels the tag load and enables debug mode for Google tags during staging |
| `MARKETING_TRACKING_CONSENT_VERSION` | `1` | `1` | Bump this when the marketing/privacy wording changes so visitors see the choice again |

**Safety default:** Missing or invalid values mean no third-party tag is loaded. The public site remains usable.

## Where the app uses each value

- `/admin-integrations.html` checks configuration presence through `/api/admin/integration_status`.
- `/api/tracking_config` can return only **public tag IDs** and the enabled/test/production state. It never returns publishing tokens, OAuth credentials, webhook secrets, or database keys.
- `/assets/marketing-consent.js` loads only on public marketing pages and only after a visitor chooses **Allow optional measurement**.
- It is intentionally excluded from admin, client, detailer, login, account, booking, progress, payment, checkout, invoice, completion, privacy, and terms routes.
- `/admin-social.html` remains an approval-first social queue. Publishing tokens are used server-side only by the existing platform dispatch bridge.

## Website measurement keys and where to obtain them

### 1. Meta Pixel — Facebook and Instagram advertising measurement

**Cloudflare variable:** `META_PIXEL_ID`  
**What it looks like:** a numeric ID.  
**Where to obtain it:** Open Meta Business Suite / **All tools** / **Events Manager**. Create or select the website data source, then select the Meta Pixel and copy its Pixel ID. Meta’s menu names change periodically; look for **Events Manager**, **Data sources**, or **Web**.

**Optional server-only follow-up, not enabled in Build 225:** Conversions API access token. Do not add a token until a separate server-side measurement and privacy review is completed.

**For Facebook Page social publishing:**  
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`

**For Instagram Business social publishing:**  
Use one of the supported pairs:
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` + `INSTAGRAM_ACCESS_TOKEN`, or
- `INSTAGRAM_IG_USER_ID` + `META_PAGE_ACCESS_TOKEN`, or
- `META_INSTAGRAM_BUSINESS_ACCOUNT_ID` + `META_PAGE_ACCESS_TOKEN`.

The Facebook Page must be connected to the Instagram professional/business account, and the connected Meta user/app must have the necessary Page and Instagram permissions. The current app only attempts publishing after a staff-reviewed and consent-cleared Social Queue draft.

### 2. Google Analytics 4

**Cloudflare variable:** `GA4_MEASUREMENT_ID`  
**What it looks like:** `G-XXXXXXXXXX`.  
**Where to obtain it:** Google Analytics → **Admin** → **Data collection and modification** → **Data streams** → choose the Web stream → copy the Measurement ID.

Build 225 uses the Google tag only after optional measurement consent. It enables `debug_mode` while `MARKETING_TRACKING_MODE=test`.

### 3. Google Ads

**Cloudflare variable:** `GOOGLE_ADS_CONVERSION_ID`  
**What it looks like:** `AW-123456789`.  
**Where to obtain it:** Google Ads → **Goals** → **Conversions** → **Summary** → set up the Google tag / view tag details.

Build 225 initializes the base tag only. Individual booking/lead conversion labels are intentionally **not** sent yet; that later work needs a consented, reviewed event mapping that excludes customer personal information.

### 4. TikTok Pixel

**Cloudflare variable:** `TIKTOK_PIXEL_ID`  
**Where to obtain it:** TikTok Ads Manager → **Tools** → **Events Manager** → create/select a Web Event / TikTok Pixel → copy the Pixel ID.

**For future TikTok publishing readiness only:**  
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_ACCESS_TOKEN`

Build 225 can report those values as present but does not add a direct TikTok publishing adapter. The current Social Queue uses manual or webhook handoff until a separately reviewed adapter is built.

### 5. LinkedIn Insight Tag

**Cloudflare variable:** `LINKEDIN_PARTNER_ID`  
**Where to obtain it:** LinkedIn Campaign Manager → **Account assets** → **Insight Tag**. Copy the Partner ID from the generated tag instructions.

**For future LinkedIn publishing readiness only:**  
- `LINKEDIN_AUTHOR_URN`
- `LINKEDIN_ACCESS_TOKEN`

Do not upload client/customer contact lists or turn on Matched Audiences as part of this release. That requires a separate consent, legal, and audience-governance decision.

### 6. Pinterest Tag

**Cloudflare variable:** `PINTEREST_TAG_ID`  
**Where to obtain it:** Pinterest Ads Manager → **Conversions** → **Pinterest Tag**. Create/select the tag and copy its tag ID.

Build 225 loads the page tag only after optional measurement consent. No server conversion API is configured.

### 7. Microsoft Advertising UET

**Cloudflare variable:** `MICROSOFT_UET_TAG_ID`  
**Where to obtain it:** Microsoft Advertising → **Tools** → **Conversion goals** → **UET tags**. Create/select the tag and copy its ID.

Build 225 loads the UET base page tag only after optional measurement consent.

### 8. X social publishing

**Cloudflare variable:** `X_USER_ACCESS_TOKEN`  
**Where to obtain it:** X Developer Portal → create/select the project and app → use the relevant OAuth user-access credential with the permissions required for posting.

Current limitation: direct X posting can be attempted only where the provider token and app plan permit it. Media posting and changed provider requirements must be separately verified in staging. Do not put an X token into the Social Queue or into the browser.

### 9. YouTube Shorts

**Cloudflare variable:** `YOUTUBE_ACCESS_TOKEN`  
**Alternative current readiness variable:** `GOOGLE_OAUTH_ACCESS_TOKEN`  
**Where to obtain it:** Google Cloud Console → enable YouTube Data API → configure OAuth consent screen → create OAuth credentials → complete an authorized flow that returns an access token with the required scope.

Current limitation: the current app reports credential readiness but does not include a direct YouTube/Shorts publishing adapter. Continue using the reviewed manual/webhook queue until a separate video-publish release is approved.

### 10. Google Business Profile

**Cloudflare variables:**
- `GOOGLE_BUSINESS_PROFILE_LOCATION_NAME`
- `GOOGLE_OAUTH_ACCESS_TOKEN`

**Where to obtain them:** Manage the business in Google Business Profile; for API work, use Google Cloud Console OAuth plus the Business Profile APIs and retrieve the selected location resource name through the authorized API/tooling.

Current limitation: this app keeps Google Business Profile in the reviewed manual/webhook Social Queue path. Do not treat configuration presence as proof that posts will publish.

## Recommended first test: only one provider

Start with **GA4**, because it is easiest to verify without sending customer data.

1. In the **staging** Cloudflare Pages project, set:
   - `MARKETING_TRACKING_ENABLED=true`
   - `MARKETING_TRACKING_MODE=test`
   - `MARKETING_TRACKING_CONSENT_VERSION=1`
   - `GA4_MEASUREMENT_ID=G-...`
2. Redeploy the Pages project.
3. Sign in as an administrator and open `/admin-integrations.html`; it should show GA4 as **Configured** and tracking mode as **test**.
4. Open a public marketing page such as the home, services, pricing, gallery, or contact page in a private browser window. Do not use booking, progress, payment, client, or admin pages.
5. Select **Allow optional measurement** in the banner.
6. Use Google Analytics DebugView / Tag Assistant to verify the staging page view.
7. Record only Pass/Fail and safe observations in the Guided Production Test Centre. Do not copy IDs, screenshots of browser request headers, or personal data into test notes.
8. Keep production mode off until the result and consent behavior have been reviewed.

## Test and production separation

- **Staging/test:** Use a staging domain, `MARKETING_TRACKING_MODE=test`, one provider at a time, no live customer flows, and provider test/diagnostic tools.
- **Production:** Add the same named secrets separately in the production environment. Set `MARKETING_TRACKING_MODE=production` only after the staging result, privacy notice, and opt-in choice are accepted.
- **Rollback:** Set `MARKETING_TRACKING_ENABLED=false`, redeploy, and the public config returns no provider IDs. The site continues to function.

## DAIP separation

Marketing/social credentials are not DAIP credentials.

Build 225 adds a documented boundary:
- no DAIP bucket, object path, signed URL, upload/download, worker, queue, AI, customer-media route, public export, Gallery handoff, or publishing capability is created;
- no DAIP storage name or provider credential appears in the Connections screen;
- DAIP Gate C remains held;
- completing a social/analytics configuration is **not** evidence that DAIP storage or technical implementation is approved.

See `docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md` before any future DAIP service integration is proposed.

## References to verify before setup

Use the provider’s current official documentation because menus, API permissions, token expiry behavior, and plan requirements change:
- Meta Business Help Center / Events Manager and Meta for Developers
- Google Analytics Help, Google Ads Help, Google Tag Manager Help, and Google Cloud OAuth documentation
- TikTok Business Help Center / Events Manager and TikTok for Developers
- LinkedIn Marketing Solutions Help / Campaign Manager
- Pinterest Business Help / Pinterest Tag
- Microsoft Advertising Help / UET tags
- X Developer Platform documentation
- YouTube Data API documentation
- Google Business Profile API documentation
- Cloudflare Pages documentation for Variables and Secrets

This guide is an operational implementation guide, not legal advice. Before enabling production marketing measurement or audience use, review the privacy notice and consent approach for the jurisdictions where Rosie Dazzlers operates and markets.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->

<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->
