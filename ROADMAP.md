> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

> **Build 248 documentation status:** Historical/compatibility reference. Current state is `AI_PROJECT_HANDOFF.md`; current direction is `MASTER_VALUE_ROADMAP.md`. Retained to preserve audit/release history and old references.

## Digital Asset Intelligence Platform

New planned subsystem documented in:

`docs/digital-asset-intelligence-platform/`

Purpose: automatically turn each completed detailing job into:
- 1 YouTube video
- 3 Facebook videos
- 5 Instagram Reels
- 5 TikToks
- before/after images
- website gallery
- Google Business Profile photos
- SEO assets
- blog article
- thumbnails
- captions
-
  # Build 207 pointer

Current planning now lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This historical file is retained for context and release history.

---


# Build 184 update — 20-step operations, media, and payment hardening

**Updated:** 2026-06-01  
**Build:** 184

Build 184 completes the requested next-20 pass by tightening the payment/refund operations, improving image/media readiness review, and documenting the next operational bundle. This pass is intentionally no-DDL: it uses the existing Build 180–182 payment tables and the Build 183 image requirements foundation.

## Build 184 — 20 completed items

1. Added `/admin-media-health.html` and `/admin-media-health/` so staff can review missing required photos/videos from a protected admin page.
2. Added `/api/admin/media_asset_health_scan` to scan required public R2/media URLs and return missing/not-public files with upload keys.
3. Added `data/image_requirements_build184.json` as the machine-readable source for required app, add-on, landing, gallery, and proof images.
4. Added the Media Health page to the shared Admin Menu.
5. Added Media Health access rules to `assets/admin-auth.js`.
6. Added a Media Health card to the Admin Dashboard.
7. Added `/api/admin/payment_refund_status_poll` so staff can poll Stripe/PayPal refund status and refresh local refund rows.
8. Added `/api/admin/payment_receipt_resend` so staff can requeue a customer quote-deposit receipt email from a payment request.
9. Added `/api/admin/payment_accountant_package_export` for an accountant-style payment CSV with Ontario HST allocation estimates.
10. Added an **Export accountant package** button to Admin Payments.
11. Added **Resend receipt** controls to quote deposit/payment request cards.
12. Added **Poll provider status** controls to refund record cards.
13. Kept manual refund records, provider refund initiation, webhook settlement, and replay controls on one Payments page for easier review.
14. Added `sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql` to document the no-DDL Build 184 schema status.
15. Updated `SUPABASE_SCHEMA.sql` with Build 184 operational notes.
16. Updated `DATABASE_STRUCTURE_CURRENT.md` with the Build 184 no-DDL dependency summary.
17. Updated `IMAGES.md` with the Admin Media Health scan workflow and upload review method.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` to reflect Build 184 media/payment/accounting hardening.
19. Added `scripts/build184_twenty_step_ops_media_payment_check.py` and wired it into the release check chain.
20. Re-ran the one-H1 and release guard path so exposed public pages still use one clear H1.

## Next 20 steps after Build 184

1. Deploy Build 184 and test `/admin-media-health.html` against live R2 assets.
2. Upload the missing add-on images listed in `IMAGES.md`, then re-run the Media Health scan.
3. Replace regional landing placeholders with Rosie-owned images for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria.
4. Capture the first four approved-public before/after gallery proof sets by town/service.
5. Add real image dimension validation instead of URL-only health checks.
6. Add R2 signed upload URLs for admin media replacement so uploads can happen from the app instead of the Cloudflare dashboard only.
7. Add a media task status table so missing-image items can be assigned, marked uploaded, reviewed, and approved.
8. Add provider refund polling for payment requests without refund rows, not only existing refund records.
9. Add scheduled retry checks for pending Stripe/PayPal refunds.
10. Add payment reconciliation variance warnings for paid amount vs. quote/deposit amount.
11. Add processor fee capture and estimated net payout fields to the payment export.
12. Add HST/GST allocation review screens before accountant export is considered final.
13. Add failed receipt email retry controls and visible notification-event status on Admin Payments.
14. Add customer-facing receipt PDF/download links.
15. Add final-balance invoice/payment requests after job completion.
16. Add payment application to final invoices, deposits, refunds, and tips.
17. Add month-end payment close checklist tied to reconciled provider exports.
18. Add dashboard warnings for missing images on high-traffic public pages.
19. Add Search Console/local SEO task cards tied to missing service/town proof content.
20. Add a consolidated accountant export package that bundles payment CSV, refund CSV, journal candidates, HST summary, and close checklist.

---

# Build 181 handoff note — verified provider quote deposits

Build 181 adds verified Stripe/PayPal webhook settlement for accepted quote deposit/payment requests. Apply `sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql` after Build 180, then test Stripe Checkout metadata settlement and PayPal verified capture settlement through `quote_deposit_payment_requests`.

# Build 178 update — Status Saves, Saved Price Reviews, Public Content Rendering & Privacy Badges

**Current build:** Build 178  
**Date:** 2026-05-25

Build 178 closes the next operational gaps after Build 177 by adding conversion-draft status saving, saved final price reviews, live rendering of Admin Content Center blocks on public pages, media privacy readiness badges in the Social Queue/App Management flow, and deeper local SEO proof recommendations. No new DDL is required; this pass depends on the Build 175 content/conversion tables and Build 177 final-price review fields.

## Completed in Build 178

1. Added `/api/admin/lead_conversion_status_save` so staff can move conversion drafts through `draft_booking`, `needs_review`, `ready_to_book`, `converted`, and `closed`.
2. Added `/api/admin/lead_conversion_price_review_save` so catalog reconciliation results can be saved before booking creation.
3. Updated `/admin-conversions.html` with Save Status and Save Price Review controls.
4. Added `/assets/public-content-blocks.js` and live public content mounts on Home, Services, Specials, Fleet, Maintenance, and Help pages.
5. Added Social Queue media privacy readiness badges using the existing media privacy summary endpoint.
6. Expanded local SEO proof reporting with concrete next-proof recommendations by town/service.
7. Added a Build 178 release guard and no-DDL SQL note.

## Updated completion status after Build 178

| Area | Status | Build 178 notes |
| --- | --- | --- |
| Conversion draft status workflow | Stronger foundation | Status can now be saved without creating a booking. |
| Final price reconciliation | Stronger foundation | Reconciliation can be saved before booking creation. |
| Admin Content public rendering | Added foundation | DB/fallback content blocks can now render on public pages. |
| Media privacy before reuse | Stronger foundation | Social/Admin flows now show privacy readiness reminders. |
| Local SEO proof reporting | Stronger foundation | Report now recommends next town/service proof to create. |

## Remaining priority after Build 178

1. Add a fuller conversion-draft detail page with audit history.
2. Render saved content blocks into exact page sections rather than only generic cards.
3. Add admin approval gates that block publish/API actions unless consent and privacy statuses are approved.
4. Turn proof recommendations into assignable content/media tasks.
5. Add quote/proposal email delivery and customer acceptance tracking.

---

# Build 177 update — Conversion Review Queue, Price Reconciliation & Local Proof Reporting

**Updated:** 2026-05-25  
**Current build:** Build 177  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 177 closes the next workflow gap after Build 176 by adding a dedicated `/admin-conversions.html` review queue. Staff can now review all lead conversion drafts in one place, reconcile final package/add-on/travel/HST pricing from the pricing catalog, confirm the required booking fields, and create a live booking only after the draft is ready. Build 177 also adds local SEO proof reporting that counts only privacy-approved before/after examples by town and service.

## Completed in Build 177

1. Added `/admin-conversions.html` and `/admin-conversions/` as a protected conversion-draft review queue.
2. Added `/api/admin/lead_conversion_price_reconcile` for catalog-backed package/add-on/travel/HST/deposit review before booking creation.
3. Added `/api/admin/local_seo_proof_report` for privacy-approved town/service proof coverage reporting.
4. Updated Admin Analytics with a **Local SEO proof coverage** card.
5. Updated public Gallery cards with clearer consent/privacy badges.
6. Added optional final-price review fields to `public.lead_conversion_drafts` via `sql/2026-05-25_build177_conversion_review_price_local_proof.sql`.
7. Updated Admin Dashboard, Admin Menu, Admin Shell, and Admin Leads access paths so the Conversion Queue is easy to find.
8. Updated `SUPABASE_SCHEMA.sql`, `DATABASE_STRUCTURE_CURRENT.md`, and release guards.

## Updated completion status after Build 177

| COMPETETIVE.md area | Current status | Build 177 notes |
| --- | --- | --- |
| Lead → booking workflow | Stronger foundation | Dedicated review queue now separates draft review from the lead card UI. |
| Final price reconciliation | Added foundation | Catalog-backed package/add-on/travel/HST review is available before creating a real booking. |
| Quote/booking status workflow | Improved | Conversion drafts can be filtered/reviewed before becoming live booking rows. |
| Admin-managed content | Partial but improved | FAQ and reusable content blocks exist; page-specific live rendering remains next. |
| Service/town proof reporting | Added foundation | Analytics now reports approved proof coverage by target town/service. |
| Media privacy enforcement | Improved | Public Gallery shows consent/privacy badges and still filters non-approved media. |
| Conversion analytics | Improved | Lead/quote summary exists and local proof coverage was added to Admin Analytics. |

## Remaining competitive gap priority after Build 177

1. Save final price reconciliation payloads directly from `/admin-conversions.html` before booking creation.
2. Add a dedicated conversion-draft status update endpoint for `needs_review`, `ready_to_book`, `converted`, and `closed`.
3. Add visible privacy badges beside every admin gallery/social publish action, not only public gallery and App Management warnings.
4. Render Admin Content Center blocks live on public Specials, service, homepage, fleet, maintenance, and Help pages.
5. Add town/service proof dashboards that recommend the next local page or gallery item to create.
6. Add customer-facing quote/proposal send and acceptance tracking.

---

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
# Build 173 next steps

1. Deploy Build 173 and test `/blog`, `/faq`, `/admin-content.html`, and Admin Dashboard.
2. Apply Build 172 SQL before saving FAQ rows in Admin Content Center.
3. Extend Admin Content Center to specials, services, education/help articles, and homepage support content.
4. Build persistent quote/proposal drafts.
5. Add one-click lead → booking/quote conversion.
6. Add town/service proof filtering and media privacy enforcement.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 roadmap sync

**Updated:** 2026-05-24

Current priority moved from raw public lead review to lead-to-quote conversion. Build 171 adds a copy-ready quote starter; the next highest-value work is persistent quote drafts, one-click lead-to-booking creation, catalog-backed price suggestions, service/town proof filtering, DB-managed public content, and privacy-gated gallery/social publishing.

---
# Build 168 roadmap sync

**Updated:** 2026-05-23

Current priority moved from completing the public competitor matrix to turning public leads and quote-photo uploads into staff-reviewed quotes/bookings. `DEVELOPMENT_ROADMAP.md` is still the source of truth.

Next highest-value work: lead-to-quote/booking conversion, quote-builder, service/town proof filtering, DB-managed public content, and media privacy eligibility automation.

---

# Build 161 sync — ROADMAP.md

**Updated:** 2026-05-21

The current website/app now has competitor-aligned service chooser coverage on Services and Booking, clearer public package aliases, and a Contact-page photo-estimate path. Build 161 is a no-DDL pass; the new package metadata is JSON/catalog content and should be copied into the DB-managed pricing catalog when the live catalog is refreshed.

---

# Development Roadmap — Build 153

**Updated:** 2026-05-18  
**Target branch:** `dev`  
**Pass focus:** Cloudflare Pages Functions deploy hotfix, media-library endpoint syntax repair, duplicate landing-page key cleanup, release-check hardening, schema/docs synchronization, and continued SEO/H1/CSS release discipline.


## Build 153 completed deployment hotfix pass

1. Reviewed the Cloudflare Pages deploy log and confirmed the blocking error was an unterminated regular expression in `functions/api/admin/media_library_list.js`.
2. Repaired `normalizeList()` so comma/newline splitting uses an esbuild-safe `/[\n,]/` expression instead of a literal newline inside the regex character class.
3. Reviewed Cloudflare warnings in `functions/api/landing_pages_public.js`.
4. Removed duplicate `related_products` normalization from `normalizePage()` while keeping the richer image-capable product normalization.
5. Removed duplicate `hero_image_url`, `region_photo_caption`, `region_photo_source`, and `region_photo_source_url` keys from the same object literal.
6. Removed the now-unused `normalizeProductRefs()` helper to avoid future confusion between two product reference shapes.
7. Added `scripts/cloudflare_pages_functions_check.py` to catch deploy-only JavaScript issues before upload.
8. The new checker runs `node --check` across project JavaScript files and also catches literal-newline regex character classes that Cloudflare/esbuild can reject.
9. The new checker guards `landing_pages_public.js` against duplicate `normalizePage()` object keys.
10. Wired the new Cloudflare Pages Functions deploy-safety checker into `scripts/release_check.py`.
11. Re-ran the full release checklist after the deploy hotfix.
12. Updated Markdown and schema tracking notes so Build 153 is documented as the current baseline.

## Build 151 completed 20-step pass

1. Reviewed the Build 150 roadmap and known gaps before selecting the next inventory/media workflow items.
2. Added `/api/admin/media_library_list` as a staff-protected media-library read endpoint for Admin Catalog.
3. Made the new media-library endpoint DB-first against `app_media_library`.
4. Added fallback reading from `app_management_settings.media_library` if the DB media table is not available yet.
5. Kept the endpoint deploy-safe by returning warnings instead of breaking the page when optional media-library storage is missing.
6. Updated Admin Catalog image candidate collection so media rows can use `media_url`, `fallback_url`, `public_url`, or `url` in addition to existing inventory image fields.
7. Updated the existing image picker so it now searches media-library rows, bundled consumables/tools rows, saved DB rows, and saved helper URLs together.
8. Added media-library count visibility to the Admin Catalog image completeness summary.
9. Added **Repair selected images** to persist matched fallback images onto selected saved/fallback inventory rows.
10. Made selected image repair import selected bundled fallback rows when they are not yet saved to DB.
11. Protected existing deliberate DB images by skipping saved rows that already have a non-fallback image.
12. Added **Scan visible images** to browser-check up to 100 visible inventory image URLs.
13. Added per-row image health messages after a scan, showing whether an image passed or failed browser loading.
14. Added duplicate-image group detection to the inventory quality summary.
15. Added per-row duplicate-image warnings where multiple inventory rows use the same image URL.
16. Preserved the Build 150 fallback merge fix so blank DB `image_url` values still hydrate from matching bundled consumables/tools images.
17. Added `scripts/media_library_picker_check.py` to guard the new media picker, image repair, duplicate diagnostics, and image health markers.
18. Wired the new checker into `scripts/release_check.py` and expanded the inventory picker guard markers.
19. Added `sql/2026-05-18_build151_media_library_inventory_image_workflow.sql` and synchronized `SUPABASE_SCHEMA.sql`.
20. Updated the active Markdown handoff, roadmap, gaps, schema, image, and sanity documents for Build 151.

## Next logical 20 steps

1. Apply the Build 150 and Build 151 SQL migrations in Supabase dev, then confirm `catalog_inventory_items` and `app_media_library` are present.
2. Smoke-test `/api/admin/media_library_list?usage_context=inventory_item` on the deployed dev URL while signed in as admin/staff.
3. Seed `app_media_library` from the current R2 product/tool image folders with `group_key='products'` and `usage_contexts` containing `inventory_item`.
4. Add an Admin Catalog **Upload image to R2** flow so new product/tool images do not require manual URL pasting.
5. Add editable image metadata in the picker: alt text, caption, source/consent, preferred public image, and recommended size.
6. Add a **Repair all fallback-matched images** review screen so staff can persist safe image fixes without selecting rows one by one.
7. Add a server-side image URL health report so 404/timeout checks can run without depending on browser scans.
8. Add a duplicate-image review screen where staff can mark duplicates as intentional multipack/shared-image cases.
9. Connect media rows to towns, services, reviews, and before/after gallery proof for stronger local landing pages.
10. Convert the before/after gallery from sample JSON into an admin-managed `app_content_entries` or dedicated DB content set.
11. Add receipt/bill attachment workflows to inventory purchases and accounting entries.
12. Link booking completion consumable usage to inventory movement and accounting COGS posting.
13. Add monthly inventory count sessions with variance approval and lock/reopen controls.
14. Connect vendor directory editing between Admin Catalog and Accounting so purchases, receipts, and reorders share one source.
15. Add Search Console and Google Business Profile reporting panels once credentials/API access are ready.
16. Continue town/service page improvements for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, and Norfolk/Oxford searches.
17. Replace remaining external/location placeholder photos with Rosie-owned R2-hosted local proof images.
18. Expand API fallback/error banners so staff can tell when the UI is using DB, app-setting, or bundled JSON fallbacks.
19. Add mobile detailer job closeout that records consumables/tools used, photos/videos, customer sign-off, and follow-up notes.
20. Keep every release pass checking one H1 per exposed page, local title/meta clarity, structured data, CSS drift, and stable redirects.

<!-- Build 153 sync 2026-05-18: Cloudflare Pages Functions deploy hotfix, media-library endpoint regex repair, landing-page duplicate-key cleanup, release-check hardening, schema sync, and local SEO/H1 discipline pass. -->

## Build 153 roadmap note

Build 153 is a deploy-stability pass. After confirming a clean Cloudflare deploy, continue with media-library seeding, direct R2 upload, bulk image repair, image health dashboards, and local SEO/H1 release checks.

## Build 156 completed work - social progress publishing foundation

1. Added a reviewable social queue for job progress photos and summaries.
2. Added Admin Progress controls to create social drafts after posting updates.
3. Added Admin Progress controls to create social drafts after attaching job media.
4. Added per-platform draft selection for Facebook, Instagram, X, TikTok, and Google Business Profile.
5. Added default local hashtags for Rosie Dazzlers job proof posts.
6. Added Admin Social Queue page for reviewing drafts.
7. Added manual social draft creation for content not tied to a booking.
8. Added social post status workflow: draft, ready, posted, failed, skipped.
9. Added optional webhook dispatch action for future automation bridge tools.
10. Added platform readiness display without exposing credentials.
11. Added `social_post_queue` schema for staged publishing.
12. Added `social_channels` schema for platform/channel setup.
13. Added `social_dispatch_attempts` schema for audit history.
14. Added booking event logging when drafts are created from job progress.
15. Added social draft loading into Admin Progress for the current booking.
16. Fixed missing `resolveBookingIdByToken` runtime helper in progress update routes.
17. Hardened progress media posting with consistent CORS and auth fallback handling.
18. Added social workflow release checks.
19. Added Cloudflare Pages Functions static/import checks for this pass.
20. Re-checked one-H1-per-page behavior after adding Admin Social Queue.


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

## Build 170 roadmap note

Customer dashboard reads are now safe for signed-out visitors. Continue by confirming customer login/session creation on Preview and Production, then return to the value-add roadmap: lead-to-quote conversion, quote-builder output, service/town landing proof, and admin-managed public content.

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
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.


## Build 185 — Next 20 completed foundations

1. Added real image dimension validation to Media Health for PNG/JPEG/WebP files.
2. Added admin R2 upload endpoint with size validation and safe allowed folders.
3. Added DB-backed media task workflow with JSON fallback.
4. Added `public.media_asset_tasks` SQL foundation.
5. Added refund retry scan endpoint for pending/failed provider refunds.
6. Added payment variance warning summary.
7. Added processor-fee capture endpoint and Admin Payments fee field.
8. Added HST/GST review screen and tax summary endpoint.
9. Added receipt retry queue endpoint.
10. Added customer receipt HTML/download endpoint.
11. Added final-balance payment request tables and APIs.
12. Added payment application tables and APIs for deposits/invoices/refunds.
13. Added month-end close checklist table/API/screen.
14. Added dashboard warnings for missing media, undersized media, payment variances, and receipt retries.
15. Added Search Console/local SEO task card table/APIs/screen.
16. Added consolidated full accountant export endpoint.
17. Added processor-fee fields to `quote_deposit_payment_requests`.
18. Added `data/image_requirements_build185.json` for scan/task fallback.
19. Rebuilt `IMAGES.md` with exact upload keys, sizes, requirements, and methods.
20. Added Build 185 release guard and schema/docs synchronization.

## Next 20 recommended steps after Build 185

1. Deploy Build 185.
2. Apply `sql/2026-06-02_build185_next_twenty_ops_foundations.sql`.
3. Configure the Cloudflare Pages R2 bucket binding for admin uploads.
4. Upload the 12 missing add-on images listed in `IMAGES.md`.
5. Replace the eight regional placeholder hero images with Rosie-owned photos.
6. Test `/admin-media-health.html` upload, scan, and task creation.
7. Add R2 signed/direct browser upload support for larger video files.
8. Add media approval status transitions: assigned → uploaded → reviewed → approved_public.
9. Add automatic image alt-text suggestions from the media task label/category/town.
10. Add a public-page missing-media warning badge beside affected page links.
11. Test processor-fee capture on real Stripe and PayPal sandbox transactions.
12. Add automatic processor-fee import from Stripe balance transactions and PayPal captures.
13. Test `/admin-tax-review.html` and confirm HST assumptions with the accountant.
14. Test `/admin-close.html` for a month-end payment close dry run.
15. Add final-balance payment checkout links for Stripe and PayPal.
16. Add customer-facing final invoice/receipt PDF generation.
17. Add payment application posting into journal candidates.
18. Add variance approvals so resolved warnings stop showing on the dashboard.
19. Add Search Console API import for query/page data if credentials are configured.
20. Build the full accountant package zip with separate CSVs, PDF receipts, close checklist, HST summary, and journal candidates.

---

## Build 186 - verified water restrictions and next-20 planning sync (2026-06-02)

Build 186 corrected the service-area water-use guidance after source verification. Oxford County / Tillsonburg now uses the May 1-September 30 rule under Oxford County By-law No. 4193-2002: outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity, with residential hours of 6:00-9:00 a.m. or 6:00-9:00 p.m. and commercial/industrial hours of 8:00-10:00 a.m. or 3:00-5:00 p.m. Norfolk County now uses the May 15-September 15 Water Restriction By-law rule: 9:00-11:00 a.m. and 7:00-10:00 p.m., with odd/even house-number days and the first-24-hours sod exemption note.

Updated runtime/content areas: `data/service_area_rules.json`, `data/water_restriction_rules_build186.json`, booking fallbacks, Admin App service-area defaults, landing page content, `functions/api/water_restrictions_public.js`, `functions/api/admin/water_restrictions_audit.js`, and the Build 186 release guard.

Completed next-20 items for this pass:
1. Verified Tillsonburg/Oxford County water restrictions from the official Tillsonburg and Oxford pages.
2. Verified Norfolk County watering restrictions from the official Norfolk County page.
3. Corrected all Oxford County service-area rows in `data/service_area_rules.json`.
4. Corrected all Norfolk County service-area rows in `data/service_area_rules.json`.
5. Added the Tillsonburg water-restriction page as an official source for Tillsonburg rows.
6. Added `data/water_restriction_rules_build186.json` as a compact verified rule source.
7. Corrected booking fallback water rules in `book.html`.
8. Synced the `/book/` mirror.
9. Corrected Admin App default service-area water rules in `admin-app.html`.
10. Synced the `/admin-app/` mirror.
11. Corrected water wording in root landing-page public content.
12. Corrected water wording in the Functions landing-page public content copy.
13. Added `/api/water_restrictions_public` as a public safe fallback endpoint.
14. Added `/api/admin/water_restrictions_audit` as a staff DB audit endpoint.
15. Added a no-DDL SQL note for Build 186.
16. Updated `SUPABASE_SCHEMA.sql` with the Build 186 schema/data note.
17. Updated `DATABASE_STRUCTURE_CURRENT.md` with the water-rule data dependency note.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with water-rule accuracy progress.
19. Added `scripts/build186_verified_water_restrictions_check.py`.
20. Wired the Build 186 guard into `scripts/release_check.py`.

Next 20 steps to move toward:
1. Deploy Build 186.
2. Re-import/resave `data/service_area_rules.json` into Supabase if the `service_area_rules` table is live.
3. Test `/api/water_restrictions_public` for Oxford County and Norfolk County.
4. Test `/api/admin/water_restrictions_audit` while signed in as admin.
5. Check `/book` and confirm the selected service-area rules show the corrected wording.
6. Check `/admin-app` and confirm service-area defaults show the corrected wording.
7. Add an Admin App button to import bundled service-area rules into Supabase.
8. Add a visual warning when the DB service-area rules are older than bundled fallback rules.
9. Add a scheduled or manual source-verification checklist for municipal rule pages.
10. Add a public FAQ item explaining water-use timing for mobile detailing.
11. Add booking-time validation that reminds staff when a requested appointment conflicts with local water-use windows.
12. Add a customer-facing note that Rosie Dazzlers can bring water/power when needed, but municipal rules still need checking.
13. Add per-town temporary notice overrides for drought/emergency restrictions.
14. Add a service-area rule version field in Supabase.
15. Add admin change history for service-area rule edits.
16. Add local SEO copy snippets that mention the accurate county rules without over-promising availability.
17. Add a quick “Can we do exterior work at this time?” helper for staff dispatch.
18. Continue payment/tax work from Build 185: processor-fee imports and HST/GST review.
19. Continue media work from Build 185: R2 direct uploads, media approval transitions, and missing-media warnings.
20. Continue accountant export work: HST summary, journal candidates, receipts, and close checklist packaging.


## Build 187 Sync — Verified Local Page Water Rules (2026-06-03)

- Reverified Oxford/Tillsonburg, Woodstock/Oxford, and Norfolk water-use restrictions from official public sources.
- Corrected the static town landing-page shell so `/tillsonburg-auto-detailing/` and every other local page shows the water-use note even before client-side rendering.
- Added server-side landing-page enforcement so stale Admin App/DB landing-page rows cannot hide the corrected water-rule note.
- Added `data/water_restriction_rules_build187.json`, updated service-area/local SEO data, and added a no-DDL SQL note.
- Added a Build 187 release guard to check every local page for the correct Oxford/Norfolk water-rule language.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

## Build 188 roadmap direction

Continue the DB/file authority pattern beyond water rules. The next strongest migrations are landing-page defaults, business profile/contact details, policy copy, notification/document templates, business hours, navigation/footer settings, dropdown option libraries, and analytics event definitions.


---

## Build 189 — Editable site settings and hard-coding reduction (2026-06-04)

This pass moves the next high-priority mutable content/configuration domains out of hard-coded JavaScript and into DB-first app-management settings with stable JSON fallbacks. Completed items:

1. Extracted large default landing-page fallback content from `functions/api/landing_pages_public.js` into `data/landing_pages_content.json`.
2. Added `functions/api/data/landing_pages_content.json` so Cloudflare Functions can import the same stable fallback.
3. Moved add-on landing-page templates out of JavaScript into the landing-page content fallback.
4. Added editable `business_profile` fallback data for identity, contact, social links, and structured-data values.
5. Added editable `site_policies` fallback data for deposit, cancellation, refund, driveway, water, power, and media privacy copy.
6. Added editable `document_templates` fallback data for notification, receipt, refund, quote, proposal, invoice, and confirmation templates.
7. Added editable `business_hours_holidays` fallback data for hours, closure days, and availability notes.
8. Added editable `navigation_footer` fallback data for top navigation and footer links.
9. Exposed dropdown/option libraries through the editable settings registry.
10. Added editable `analytics_event_registry` fallback data for analytics event keys and display labels.
11. Added stable `data/media_requirements.json` as the long-term media requirement fallback.
12. Added shared `functions/api/_lib/editable-settings.js` for DB-first / JSON-fallback setting loading.
13. Added protected `/api/admin/editable_site_settings` for staff editing.
14. Added public `/api/site_settings_public` for safe front-end consumption.
15. Added `/admin-site-settings.html` and `/admin-site-settings/` as the protected editor bridge.
16. Added Admin Menu and Admin Auth access for the new editor page.
17. Added `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
18. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
19. Updated `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json`.
20. Added `scripts/build189_editable_site_settings_check.py` and wired it into `scripts/release_check.py`.

Next 20 steps after Build 189:

1. Deploy Build 189.
2. Apply `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
3. Open `/admin-site-settings.html` and verify all editable domains load.
4. Save one small test edit to `business_profile`.
5. Save one small test edit to `site_policies`.
6. Sync the full landing-page fallback payload into `app_management_settings.landing_pages_content` only after reviewing size/performance.
7. Move live landing-page editor controls from raw JSON into a structured form.
8. Render public business profile values into structured data and page footer from `/api/site_settings_public`.
9. Render editable navigation/footer links from `navigation_footer`.
10. Wire editable policies into booking, FAQ, quote, and payment pages.
11. Wire document templates into quote delivery, deposit receipts, refund notices, invoices, and final confirmations.
12. Add business-hours and holiday-closure checks to booking availability.
13. Replace scattered hard-coded dropdown values with `option_libraries`.
14. Add analytics event validation against `analytics_event_registry`.
15. Replace build-specific media requirement checks with stable `media_requirements`.
16. Add a one-click “sync bundled JSON into DB setting” control for each editable domain.
17. Add setting version history or audit events.
18. Add field-level validation for each editable setting.
19. Add a public settings cache/version badge in Admin Diagnostics.
20. Continue moving remaining large inline page/content objects into DB-managed content blocks.

## Build 190 - Editable settings live rendering and diagnostics

Build 190 continues the editable-content migration by rendering public business profile, contact details, social links, navigation/footer links, policy notes, LocalBusiness structured data, analytics labels, and media requirements from DB-first editable settings with bundled JSON fallback. It adds validation, sync-from-bundle controls, DB/fallback diagnostics, and setting history support through `/admin-site-settings.html` and the Build 190 SQL migration.

---

## Build 191 — Editable settings hardening and live-use pass

- Fixed `/admin-site-settings.html` crash by adding `AdminAuth.guardPage()` and `AdminAuth.fetchWithAuth()` compatibility helpers and by making the page initialization defensive.
- Added structured helper fields for business profile and navigation/footer settings while keeping raw JSON available.
- Added editable setting dependency map and restore-from-history API foundations.
- Wired editable policy copy into booking, FAQ, quote-response, and quote-payment customer pages with a static fallback.
- Wired editable document templates into quote/proposal delivery plus deposit receipt/refund email queue helpers.
- Added business-hours/holiday status API and booking-page helper.
- Added analytics ingest validation against the editable analytics event registry.
- Switched Media Health JSON fallback from build-specific image requirement files to stable `data/media_requirements.json`.
- Added Build 191 release guard.

<!-- Build 192 documentation sync: editable-domain editors, restore-from-history UI, business-hours booking warnings, dynamic policies/templates, analytics registry warnings, media requirement sync/restore, and fallback diagnostics were reviewed on 2026-06-05. -->

---

## Build 193 documentation sync — 2026-06-05

This Markdown file was included in the Build 193 documentation sync. Build 193 fixes the Admin Social template-list 500, adds social-template fallback UI handling, strengthens editable-setting validation schemas, preserves the one-H1 SEO guard, and records that no new Supabase DDL is required for this pass.

---

## Build 194 — diff, preview, analytics quick-add, and option-library expansion — 2026-06-06

### Completed 20-step pass

1. Added `/api/admin/editable_site_settings_compare` for DB/editor versus bundled fallback JSON diffs.
2. Added visual compare controls in Editable Site Settings before force-sync or restore actions.
3. Added per-domain preview panes showing where each editable setting is used.
4. Added domain permission guidance beside each structured editor.
5. Added SEO copy-length checks for title, meta-description, H1/headline, and description-like fields.
6. Added history/fallback comparison support in the settings workflow without new database tables.
7. Added `/api/admin/analytics_registry_add_event` for one-click addition of unknown analytics events.
8. Added Admin Analytics “Add to registry” buttons on unknown event warnings.
9. Added `assets/admin-option-libraries.js` as a shared DB-first dropdown hydrator.
10. Expanded option-library dropdown usage into Admin Booking finance/status/privacy controls.
11. Expanded option-library dropdown usage into Admin Catalog stock and purchase-order controls.
12. Expanded option-library dropdown usage into Admin Leads lead, quote, draft, and media privacy status controls.
13. Fixed Admin App option-library loading to read the current `/api/site_settings_public?key=option_libraries` response shape.
14. Added business-hours warning display support to Admin Booking status saves when warning payloads are returned.
15. Added staff-auth capability aliases for `view_analytics` and `manage_settings` so analytics/settings utilities are not accidentally admin-password-only.
16. Normalized `/admin-site-settings.html` and `/admin-site-settings/` so the routed copy no longer lags behind the root page.
17. Normalized patched admin route copies for Analytics, Booking, Catalog, Leads, and App pages where route folders exist.
18. Added `sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql` documenting that no DDL is required.
19. Added `scripts/build194_diff_preview_option_libraries_check.py` and wired it into `scripts/release_check.py`.
20. Re-ran release/H1/archive checks for the packaged build.

### Next 20 recommended steps

1. Add full JSON Schema validation with field-level UI markers, not only required-path checks.
2. Add a side-by-side visual diff for selected history rows, not only current versus fallback.
3. Add role-scoped enforcement on save per editable domain once the staff role model has dedicated capabilities for content, media, analytics, and settings.
4. Add send-test controls for appointment confirmation, invoice, deposit receipt, refund notice, quote, and proposal templates.
5. Add invoice PDF/export packaging once invoice wording is approved.
6. Add customer-visible policy version stamping to bookings, quotes, invoices, and payment requests.
7. Add admin override reason logging when staff intentionally create or keep bookings on closed/holiday dates.
8. Add sub-day business-hours windows beyond AM/PM for exact arrival windows.
9. Add richer option-library dropdown hydration to finance, media-health, payments, content, and tax-review screens.
10. Add editable landing-page preview cards that render the actual hero, service, town, and FAQ copy.
11. Add broken-link scans for editable navigation/footer links.
12. Add local SEO proof gap reminders to the main dashboard diagnostics card.
13. Add sitemap/robots preview checks when landing-page content changes.
14. Add public structured-data preview for LocalBusiness and service landing pages.
15. Add template token previews with sample customer/booking data.
16. Add an audit export for editable-setting changes and restores.
17. Add scheduled fallback-backed settings reports for the dashboard.
18. Add media requirement diff/preview before restore-from-history.
19. Add automated smoke tests for invoice, confirmation, quote payment, booking availability, and settings APIs.
20. Continue migrating duplicated JSON/page content into DB-first editable settings where it reduces failure points.

---

## Build 195 — schema markers, history diffs, template previews, export diagnostics, and SEO proof reminders — 2026-06-06

### Completed 20-step pass

1. Added field-level validation results from the editable-setting validation API.
2. Added UI field-marker rendering in Editable Site Settings.
3. Updated editable-setting validation schema metadata to Build 195.
4. Added selected-history side-by-side diff API for settings history rows.
5. Added selected-history diff buttons beside restore-from-history controls.
6. Added document-template sample preview API for invoice, confirmation, receipt, refund, quote, and proposal templates.
7. Added dry-run template test-send API that returns queue-ready payloads without external sending.
8. Added template preview and test controls to Editable Site Settings.
9. Added editable navigation/footer broken-link scan API and UI control.
10. Added sitemap/robots preview API and UI control for editable navigation and landing-page paths.
11. Added LocalBusiness/service structured-data preview API and UI control.
12. Added editable-setting audit export API with JSON and CSV modes.
13. Added fallback-backed settings report API and dashboard card.
14. Added media-requirement diff API and UI control before restore/force-sync decisions.
15. Added richer editable landing-page preview cards for town/service content.
16. Added customer-visible policy version stamping to booking document payloads and document pages.
17. Added admin booking business-hours/holiday override reason logging into booking events when warnings are present.
18. Expanded option-library hydration into Payments, Content, Tax Review, Accounting, and Media Health surfaces where useful.
19. Added dashboard local SEO proof-gap reminders and fallback report diagnostics.
20. Added Build 195 no-DDL schema note and release guard coverage.

### Next 20 recommended steps

1. Add real per-domain staff capability enforcement on editable-setting saves, beyond visible guidance.
2. Store template test-send attempts in notification_events once final sender/provider rules are approved.
3. Add real PDF generation or browser-print packaging for invoices and appointment confirmations.
4. Add customer-facing policy version snapshots directly onto booking/payment rows when new records are created.
5. Make admin booking save block closed/holiday dates unless an override reason is supplied.
6. Add exact arrival-window/sub-day business-hours support beyond AM/PM.
7. Expand the link scanner into a deploy-time crawler that checks actual route responses after Cloudflare publish.
8. Add live sitemap.xml and robots.txt generation from the approved editable navigation/landing registry.
9. Add schema.org validation warnings for every service/town landing page before publish.
10. Add a side-by-side visual page preview for landing pages, not just preview cards.
11. Add assignable local SEO proof tasks directly from dashboard proof gaps.
12. Add audit filters by date, setting key, actor, and restore action once actor history is stored consistently.
13. Add media requirement restore preview comparing DB/current/history/fallback in one screen.
14. Add smoke tests that call live deployed APIs after each Cloudflare deployment.
15. Add full invoice export packaging into the accountant export bundle.
16. Add approved customer email/SMS test-send controls with clear recipient confirmation.
17. Continue moving duplicated public copy from page JavaScript into editable DB-backed settings.
18. Add mobile quick actions for media health, payment warnings, and SEO proof tasks.
19. Add better fallback messaging on every public page that uses editable settings.
20. Review all option-library dropdowns and retire any remaining hard-coded status/payment/category lists.

> Build 196 documentation sync (2026-06-06): repaired the live Admin Dashboard local SEO proof 405, Admin App `esc` helper crash, and Landing Page Builder add-on fallback hydration. Schema status remains no-DDL; see `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_STRUCTURE_CURRENT.md`, `SUPABASE_SCHEMA.sql`, and `sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql`.

---

## Build 197 documentation sync

Build 197 was reviewed during the self-healing admin diagnostics pass. Relevant implementation notes now point toward pricing catalog source/repair diagnostics, route-copy parity, independent dashboard fallback handling, landing-page SEO/readiness warnings, and continued one-H1/local-search discipline. No database DDL is required for this pass.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 documentation sync

Build 213 adds owner action controls in Today Needs Attention, customer price/summary acknowledgements, secure payment-link handoff, summary revision history, and booking-scoped safe interaction audit export. Active direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; use `docs/PRODUCTION_TEST_GUIDE.md` for hands-on testing.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

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

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
