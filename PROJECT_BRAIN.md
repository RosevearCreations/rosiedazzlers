# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
# Rosie Dazzlers Build 173 note — Admin Content Center and Help Articles access

**Updated:** 2026-05-24

Build 173 adds a protected Admin Content Center at `/admin-content.html` for FAQ editing, with new protected endpoints `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save`. It also expands `/blog` into a real Help Articles hub and exposes it from the public navigation as **Help**. This pass requires no new database table, but live FAQ saves require the Build 172 `public_faq_entries` SQL migration.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 project brain update

**Updated:** 2026-05-24

Rosie Dazzlers now has the start of a full public inquiry → staff review → quote handoff path. Build 171 adds quote-starter generation inside Admin Leads. It is intentionally copy-ready and staff-reviewed rather than auto-sent, because service area, access, condition, quote-required add-ons, and media privacy still need human confirmation.

---
# Project Brain — Build 168

**Updated:** 2026-05-23

Rosie Dazzlers now has a competitor-roadmap public journey and an internal lead/photo-estimate review foundation. Build 168 adds `/admin-leads` for public inquiries and quote-photo uploads, protected by the existing staff booking-management permission model.

The safest next value step is a quote-builder/conversion workflow: select a lead or photo estimate, choose package/add-ons, generate quote notes, and optionally create/link a booking.

Release habit remains: update Markdown/schema docs every pass, run release checks, keep no more than one H1 per public page, and continue local SEO wording based on Google guidance around clear titles/headings and local relevance.

---

# Build 164 sync — booking intake review fields

**Updated:** 2026-05-22

Build 164 adds optional booking review fields through `sql/2026-05-22_build164_booking_intake_review_actions.sql`: `intake_review_note`, `intake_reviewed_at`, and `intake_reviewed_by`. These support the Admin Booking photo-estimate, condition-review, and media/privacy review action controls. The workflow remains fallback-safe before migration by appending staff review status to booking notes.

---

# Build 161 sync — PROJECT_BRAIN.md

**Updated:** 2026-05-21

The current website/app now has competitor-aligned service chooser coverage on Services and Booking, clearer public package aliases, and a Contact-page photo-estimate path. Build 161 is a no-DDL pass; the new package metadata is JSON/catalog content and should be copied into the DB-managed pricing catalog when the live catalog is refreshed.

---

# Build 158 update — Social review gates and local caption templates

**Updated:** 2026-05-20  
**Current build:** Build 158

Build 158 continues the Build 156/157 social publishing workflow and makes it safer before any job/crafting-progress photo or summary is pushed to X, Facebook, Instagram, TikTok, Google Business Profile, or manual/webhook channels.

## Completed in Build 158

1. Added `functions/api/_lib/social-compliance.js`.
2. Added customer/public-use consent checks for social drafts.
3. Added license plate, face, address, and private-identifier review checks.
4. Added no-private-customer-info caption review.
5. Added platform warning generation for X length, Instagram media requirements, TikTok media requirements, Facebook media recommendations, and Google Business Profile local wording hints.
6. Added `Approve & ready` review action in Admin Social Queue.
7. Blocked direct `Publish/API` unless a draft is marked ready and the review gate passes.
8. Added fallback-safe inserts if the Build 158 SQL migration has not been applied yet.
9. Added fallback-safe social queue reads when new review columns do not exist yet.
10. Added review checklist controls to Admin Social Queue manual draft creation.
11. Added review checklist controls to Admin Progress social draft creation.
12. Updated immediate push workflow to approve-ready first, then publish only if the review gate passes.
13. Added review badges and platform warning display to Admin Social Queue cards.
14. Added `social_caption_templates` table.
15. Added `social_hashtag_presets` table.
16. Seeded local caption templates for Southern Ontario, Oxford County, Norfolk County, and Tillsonburg-style posts.
17. Seeded local hashtag presets for Rosie Dazzlers local discovery.
18. Added `duplicate_signature` on queued posts to support future duplicate-content warnings.
19. Updated social workflow release checks for Build 158 markers.
20. Updated Markdown and schema notes for the new social review gate.

## Next 20 value-added steps after Build 158

1. Apply the Build 156 social queue migration if it has not already been run.
2. Apply `sql/2026-05-20_build158_social_review_gates_and_templates.sql`.
3. Test Admin Progress with one internal job update and one media URL.
4. Confirm a draft is created with platform warnings in Admin Social Queue.
5. Confirm `Publish/API` is blocked until `Approve & ready` is clicked.
6. Add a duplicate-content warning in the Admin Social Queue UI using `duplicate_signature`.
7. Add a template picker that loads `social_caption_templates` from the DB.
8. Add a hashtag preset picker that loads `social_hashtag_presets` from the DB.
9. Add a scheduler calendar for planned posting times.
10. Add a posted URL capture form for manual posts.
11. Add customer-facing consent capture on the booking/progress flow.
12. Add media-crop/blur status fields for license plates and private identifiers.
13. Add staff training notes explaining that drafts are not public until approved/published.
14. Add platform-specific preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, and manual.
15. Add basic post analytics fields: clicks, views, likes, comments, shares, and last checked time.
16. Add webhook payload signing/verification documentation for Make/Zapier/n8n bridges.
17. Add scheduled retry rules for failed webhook/API attempts.
18. Add a public gallery promotion workflow that only uses approved social media rows.
19. Add Google Business Profile post/manual workflow notes once the account flow is finalized.
20. After deploy is stable, consider a clean-branch/orphan upload to remove stale GitHub files that web upload does not delete.

---

# Project Brain — Build 155

**Updated:** 2026-05-18

Rosie Dazzlers is a Cloudflare Pages + Functions site with Supabase-backed admin workflows and bundled JSON fallbacks for deploy safety.

Current priority: keep Admin Catalog inventory reliable while moving product/tool images from JSON-only fallback toward a DB-backed `app_media_library` and future R2 upload workflow, while keeping Cloudflare Pages Functions deploy checks strict enough to catch build-only syntax issues.

Release habit: every pass updates Markdown/schema docs, runs SEO/H1/static checks, watches CSS drift, and keeps fallback/error handling visible instead of silently failing.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 memory note

Build 155 repairs the Cloudflare Pages Functions unresolved helper import issue that appeared after the Build 152 regex fix. The inventory/media image workflow remains unchanged; the priority is now to confirm a clean Cloudflare deploy before adding new features.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.


## Next 20 value-added steps after Build 156

1. Run the Build 156 social queue SQL migration in Supabase.
2. Add a Social Queue card to staff role training notes so detailers know drafts are not public posts yet.
3. Decide the first direct-post platform: recommended order is Facebook/Instagram, Google Business Profile, X, TikTok, then YouTube Shorts.
4. Add per-platform caption length warnings and media-count warnings.
5. Add a privacy checklist before any customer vehicle/photo can be marked ready.
6. Add license-plate blur/cover reminder fields to the media workflow.
7. Add customer consent flags for public before/after use.
8. Add a reusable caption template library for job type, vehicle size, service area, and upsell language.
9. Add platform-specific hashtag presets for local SEO and discovery.
10. Add OAuth setup notes and token rotation guidance for each social platform.
11. Add a direct Meta/Facebook Page adapter after the app permissions are approved.
12. Add an Instagram Business publishing adapter after Meta media-container requirements are confirmed.
13. Add a Google Business Profile recent-work publishing path after the Google account scope is finalized.
14. Add a TikTok direct-post adapter only after app review and creator authorization are confirmed.
15. Add a queue calendar so posts can be scheduled by day/time.
16. Add duplicate-content warnings when the same photo/caption is queued twice.
17. Add analytics fields for clicked progress links and posted platform URLs.
18. Add customer-friendly public gallery promotion rules from approved job media.
19. Add fallback export buttons: copy caption, download media list, and open platform composer.
20. Add social performance notes back into the booking/customer history for future marketing decisions.


## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.

## Build 169 project memory

Auth and analytics are now intentionally fallback-safe during page boot. Do not reintroduce hard 500 responses for public account-widget checks or analytics ingest; only protected write/action endpoints should fail closed. Login remains secure and still requires valid Supabase staff/customer records and session tables.

## Build 170 project memory

The live dev site showed that `/api/client/dashboard` still produced a 401 failed-resource console message when signed out. Treat customer dashboard reads as optional public context: no customer session should return HTTP 200 with `ok:false`, `authenticated:false`, and `code:"not_authenticated"`. Protected customer write endpoints should continue to require a valid customer session.

## Build 172 handoff note

- New customer FAQ/help route: `/faq` and `/faq/index.html`.
- Access paths: top nav, footer, homepage, Services, Pricing, Contact, and sitemap.
- New FAQ DB/API foundation: `public_faq_entries`, `/api/public_faqs`, `data/site_faqs.json`.
- Next recommended build: Admin Content editor for FAQ/special/service/education copy, then persistent quotes and lead conversion.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — lead conversion, pricing suggestions, content expansion, gallery privacy, and analytics

- Added safe lead → draft booking/quote conversion using `public.lead_conversion_drafts` instead of creating live scheduled bookings too early.
- Added catalog-backed package/add-on price suggestions for Admin Leads from the current pricing catalog.
- Added quote draft status workflow controls: draft, needs review, ready to send, sent, accepted, declined, archived.
- Expanded Admin Content Center beyond FAQ with reusable content blocks for specials, service blurbs, homepage cards, help articles, trust proof, fleet, and maintenance copy.
- Added service/town filtering for the public before/after gallery and enforced public reuse only for approved-public/sample media.
- Added FAQ/help/lead/quote conversion analytics summary endpoint for admin reporting.
- Added SQL/schema sync in `sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql`.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.
