# Build 163 update — Admin booking intake review and optional direct field storage

**Updated:** 2026-05-21  
**Current build:** Build 163  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 163 continues the Build 160–162 competitor conversion path. Build 162 helped customers explain vehicle condition and media-use preference during booking; Build 163 makes that information easier for staff to see and prepares direct database storage when the optional migrations are applied. The admin booking screen now has a dedicated estimate-intake and media-consent review panel instead of forcing staff to hunt through general booking notes.

## Completed in Build 163

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Updated checkout to write condition helper flags into `bookings.condition_flags` when the Build 162 migration is available.
4. Updated checkout to write `condition_recommendation` when the field is available.
5. Updated checkout to write `photo_estimate_requested` when the field is available.
6. Updated checkout to write `media_consent_preference` when the field is available.
7. Added checkout-safe fallback so bookings still succeed if the optional intake columns have not been migrated yet.
8. Added `photo_estimate_status`, `condition_review_status`, and `media_privacy_status` planning fields.
9. Added privacy-review planning fields for plate, face, address, blur/crop needed, and blur/crop complete.
10. Added `sql/2026-05-21_build163_booking_intake_admin_review.sql`.
11. Updated the admin bookings API to try the new intake/privacy fields first.
12. Added admin bookings API fallback to the older select list if the optional columns are not deployed yet.
13. Added a new Admin Booking panel: `Estimate intake & media consent`.
14. The new panel displays photo-estimate request status.
15. The new panel displays condition-helper flags and recommendation summary.
16. The new panel displays customer media-use preference.
17. The new panel displays privacy-review status hints for plates, faces, addresses, and blur/crop.
18. The admin panel can read either direct DB fields or the Build 162 note fallback.
19. Added `scripts/booking_intake_admin_review_check.py`.
20. Wired the Build 163 guard into `scripts/release_check.py`.

## Next several value-added steps after Build 163

1. Deploy Build 163 and confirm Admin Booking shows the estimate-intake panel on mobile and desktop.
2. Run the Build 162 migration, then run `sql/2026-05-21_build163_booking_intake_admin_review.sql`.
3. Add admin edit controls so staff can update photo-estimate status, condition-review status, and media-privacy status.
4. Add true customer photo upload/lead capture before checkout, using Supabase Storage signed upload URLs.
5. Add media privacy review actions directly to each job photo/video: plate reviewed, face reviewed, address reviewed, blur/crop needed, blur/crop complete.
6. Add a gallery/social eligibility filter that only shows media with customer permission and completed privacy review.
7. Add a photo-estimate lead inbox so incomplete bookings with uploaded media can become quotes or draft bookings.
8. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, Services, and Pricing.
9. Add town/service-aware proof filtering for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Oxford County, and Norfolk County.
10. Add admin-managed specials/promos for salt cleanup, multi-vehicle, senior-friendly, work truck/fleet, and headlight refresh.
11. Add stronger service-specific gift card cards for Interior Detail, Full Detail, and custom amounts.
12. Move high-change service, add-on, specials, FAQ, proof, and testimonial content toward DB-first admin-managed records.
13. Add Search Console and Google Business Profile tracking notes into admin analytics.
14. Add social-platform preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and manual copy/paste.
15. Add scheduled social publish worker/retry controls after platform credentials and approvals are ready.
16. Add caption/media scoring for Google Business Profile-style local proof posts.
17. Add accessibility review for the booking condition helper and Admin Booking intake panel.
18. Add conversion tracking events for photo-estimate requests, condition-helper use, and booking completion.
19. Prepare a clean/orphan branch replacement after deploy stability so old GitHub web-upload leftovers are removed.
20. Keep this roadmap as the source of truth and keep older roadmap/gap files as historical support only.

---

# Build 162 update — Condition-based booking helper, photo-estimate intent, and media-consent preference

**Updated:** 2026-05-21  
**Current build:** Build 162  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 162 continues the Build 160/161 competitor sanity direction. The public booking flow now moves beyond static package aliases by adding a condition-based booking helper. Customers can select what they see — pet hair, salt, odour, stains, paint swirls, protection questions, headlights, work trucks, or photo-quote needs — and the page suggests a package, eligible add-ons, and staff-review notes. The same pass adds photo-estimate intent capture and a clear media-consent preference so estimate photos do not become public/social proof without permission and staff privacy review.

## Completed in Build 162

1. Reviewed `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and the Build 160/161 competitor conversion priorities before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added a Booking Step 2 condition-based booking helper beneath the quick service chooser.
4. Added condition flags for maintained interior, maintained exterior, pet hair, salt stains, odour, stains/shampoo, paint swirls, protection, headlights, full reset, work truck/fleet, and photo quote.
5. Added `Recommend package` and `Clear helper` controls.
6. Added recommendation logic that maps interior-heavy conditions to Interior Detail, exterior/paint concerns to Exterior Detail, maintained-only cases to Basic Detail or Premium Wash, and full-reset cases to Complete Detail.
7. Added optional add-on suggestions for paint/protection conditions where existing add-ons allow it.
8. Added recommendation output explaining the selected flags, package, add-ons, and staff-review notes.
9. Appended condition helper details into the customer notes field so staff can see why a package was suggested.
10. Added photo-estimate intent capture in Booking Step 4.
11. Added customer media-consent preference options: estimate only, ask first, or possible public use after staff privacy review.
12. Added booking analytics events for condition helper apply/clear, photo-estimate request, and media-consent preference.
13. Updated checkout payload handling to preserve customer notes, condition flags, condition recommendation, photo-estimate request, and media-consent preference in booking notes.
14. Kept checkout backwards-compatible by writing the new public-intake details into existing notes even before the optional SQL migration is applied.
15. Added optional DB planning fields for direct storage of condition flags, recommendation, photo-estimate request, and media-consent preference.
16. Added `sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql`.
17. Updated `SUPABASE_SCHEMA.sql` with Build 162 schema-sync notes.
18. Added `scripts/booking_condition_recommender_check.py`.
19. Wired the new Build 162 guard into `scripts/release_check.py`.
20. Synced `/book.html` and `/book/index.html`, and updated Markdown docs and handoff notes.

## Next several value-added steps after Build 162

1. Deploy Build 162 and smoke-test the Booking Step 2 condition helper on mobile and desktop.
2. Run `sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql` after confirming prior migrations are applied.
3. Update checkout/booking insert logic to write the new condition and media-consent fields directly once the migration is live.
4. Add an admin booking-detail panel that displays condition helper flags, recommendation summary, photo-estimate status, and media-consent preference separately from general notes.
5. Add a customer-facing photo upload/lead form that stores estimate media before checkout, not just a photo link.
6. Add staff privacy workflow fields for plate reviewed, face reviewed, address reviewed, blur/crop needed, and blur/crop complete.
7. Add public gallery/social eligibility filters that only allow consented and privacy-reviewed media.
8. Add service-page FAQ blocks for Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
9. Add proof/recent-work filtering by town and service so Oxford/Norfolk pages can show more relevant examples.
10. Add admin-managed specials cards for seasonal salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
11. Add service-specific gift-card merchandising for Interior Detail, Full Detail, and custom amounts.
12. Move high-change service, add-on, specials, FAQ, and proof content toward DB-first admin-managed records.
13. Add Search Console and Google Business Profile reporting notes to admin analytics.
14. Add social performance entry/reporting using `social_post_metrics_snapshots`.
15. Add platform preview cards in Admin Social Queue for Facebook, Instagram, X, TikTok, Google Business Profile, and manual copy/paste.
16. Add scheduled publish worker/retry rules for planned social posts once platform credentials and approvals are ready.
17. Improve Contact page estimate handling so photo-estimate inquiries can become draft bookings or leads.
18. Add accessibility review for the new recommender chips and booking step controls.
19. Prepare a clean/orphan branch replacement after deploy stability so stale GitHub web-upload leftovers are removed permanently.
20. Keep `DEVELOPMENT_ROADMAP.md` as the source of truth and keep older roadmap files as history/reference only.

---

# Build 161 update — Conversion path service chooser and photo-estimate guidance

**Updated:** 2026-05-21  
**Current build:** Build 161  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 161 continues the competitor sanity-check direction from Build 160. The focus is not a new back-office module; it is the public conversion path. Visitors now get clearer package aliases, a Booking Step 2 service chooser, and stronger photo-estimate guidance on Booking and Contact while the existing pricing codes remain stable for admin, checkout, and data compatibility.

## Completed in Build 161

1. Reviewed `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETITOR_SANITY_CHECK.md` before continuing.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Recreated `COMPETITOR.md` and `COMPETETOR.md` aliases that were missing from the uploaded ZIP.
4. Added customer-facing package aliases to the pricing catalog without changing stable package codes.
5. Added `display_alias`, `customer_goal`, `service_level`, `best_for`, `recommendation_tags`, `photo_estimate_recommended`, and `chooser_prompt` metadata to each package.
6. Synced enriched package metadata into `data/rosie_services_pricing_and_packages.json`.
7. Synced enriched package metadata into `functions/api/data/rosie_services_pricing_and_packages.json`.
8. Regenerated the inline `FALLBACK_CATALOG` in `functions/api/_lib/pricing-catalog.js` so DB fallback responses include the new metadata.
9. Added a booking-page service chooser to Step 2.
10. Added quick buttons for exterior wash, interior refresh, interior detail, full detail, exterior detail, and photo-estimate notes.
11. Added package-card display of aliases and customer goals in the booking flow.
12. Added a Step 4 photo-estimate checklist for condition photos.
13. Added analytics events for package recommendation clicks and photo-estimate jumps.
14. Added a Contact-page photo-estimate panel with an email CTA and booking CTA.
15. Synced root and folder copies for `/book`, `/contact`, and `/services`.
16. Added `scripts/conversion_path_check.py` to protect the competitor-aligned conversion path.
17. Wired the new conversion-path check into `scripts/release_check.py`.
18. Added a Build 161 no-DDL SQL note.
19. Updated `SUPABASE_SCHEMA.sql` with Build 161 no-schema-change notes.
20. Re-ran release, Cloudflare, social workflow, competitor roadmap, conversion path, inline script, and SEO/H1 checks.


## Next 20 value-added steps after Build 161

1. Deploy Build 161 and confirm the Cloudflare Pages build stays clean.
2. Smoke-test Booking Step 2 on mobile and desktop to confirm the chooser buttons select the expected packages.
3. Smoke-test Booking Step 4 to confirm the photo-estimate checklist reads well on mobile.
4. Apply any pending SQL migrations through Build 159 if they are not already applied.
5. Copy the enriched package metadata into the DB-managed `app_management_settings.pricing_catalog` once the live DB catalog is updated.
6. Add a condition-based recommendation engine using vehicle size, interior/exterior concern, pet hair, odour, salt, paint condition, and quote/photo flags.
7. Add a small public “send photos” form or uploader that can attach estimate media to a lead or draft booking.
8. Add customer-facing consent capture for public gallery and social before/after use.
9. Add media privacy fields for plate reviewed, face reviewed, address reviewed, blur/crop required, and blur/crop complete.
10. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
11. Add admin-managed specials cards for salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
12. Improve gift-card merchandising with Interior Detail, Full Detail, and custom amount gift-card cards.
13. Add proof/recent-work filtering by service and town.
14. Add admin placement controls for reviews and recent work on service/town pages.
15. Start moving high-change service/add-on/specials/FAQ/proof content toward DB-first admin-managed records.
16. Add Search Console and Google Business Profile reporting notes to admin analytics.
17. Add social performance entry and reporting using `social_post_metrics_snapshots`.
18. Add platform preview cards in Admin Social Queue.
19. Prepare a clean/orphan branch replacement after deploy stability so old GitHub web-upload leftovers are removed.
20. Keep using `DEVELOPMENT_ROADMAP.md` as the source of truth and keep older roadmap files as history/reference only.


---

# Build 160 update — Competitor sanity check and roadmap reset

**Updated:** 2026-05-21  
**Current build:** Build 160  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`  
**Competitor/service source reviewed:** `COMPETETIVE.md`

Build 160 pauses feature expansion long enough to sanity-check the current Rosie Dazzlers website/app against the competitor/service roadmap. The conclusion is that the project already has a strong technical foundation — local pages, service pages, booking/pricing, gallery/recent work, admin workflows, social queue, accounting/admin systems, image/media tooling, and release checks — but the public conversion path still needs to be simplified so visitors can choose the right detail, send photos, see proof, and book or request a quote with less confusion.

## Build 160 competitor sanity check — current state vs target

| Competitor roadmap target | Current website/app state | Status | Next action |
| --- | --- | --- | --- |
| Clear local homepage hero and local wording | Homepage targets Oxford/Norfolk and major towns. | Strong | Keep tuning local wording and proof placement each pass. |
| Sticky CTAs: Book, Quote, Call/Text, Send Photos | Book CTAs exist; photo-estimate and call/text CTAs need stronger repeated placement. | Partial | Add a consistent CTA strip to Services, Booking, Contact, and landing pages. |
| Strong service hub | Services page has packages, add-ons, proof, town pages, and links to special pages. | Partial | Add a decision guide and package recommender. Build 160 adds the Services decision guide. |
| Package selector | Pricing/booking has vehicle size, packages, add-ons, and availability. | Partial | Add condition-based recommendations and public photo estimate prompts. |
| Service package cards | Existing package codes are Premium Wash, Basic Detail, Complete Detail, Interior Detail, Exterior Detail. | Partial | Add customer-facing aliases/tier labels without breaking existing pricing codes. |
| Add-ons | Add-ons exist and many have dedicated pages/images. | Strong/partial | Add compatibility rules, FAQ, and stronger admin-managed copy. |
| Specials | Admin promos exist, but public specials are not yet competitor-level. | Partial | Add specials/promos content blocks for salt cleanup, multi-vehicle, senior-friendly, fleet, and headlight offers. |
| Gift cards | Gift system exists. | Partial | Add service-specific gift-card merchandising. |
| Reviews/proof/before-after | Gallery, recent work, review fallback, and local pages exist. | Partial | Filter proof by town/service and make placements admin-managed. |
| Ceramic coating education | Dedicated ceramic page exists. | Partial | Add richer FAQ, maintenance instructions, and prep expectations. |
| Paint correction education | Dedicated paint correction page exists. | Partial | Add staged service tier details, before/after proof, and FAQ. |
| Interior vs deep interior clarity | Packages exist, but public distinction can be clearer. | Partial | Add plain-language service chooser and booking recommender logic. |
| Admin service controls | Admin app controls exist across services/catalog/settings/social. | Partial | Move more static page copy and specials into DB-first admin-managed content. |
| Social proof/publishing | Social Queue has drafts, review gates, templates, scheduling, duplicate warnings, and API/webhook attempts. | Strong/partial | Add consent capture, media privacy status, platform previews, and metrics. |
| Local SEO reporting | SEO/H1 checks exist; Search Console/GBP reporting not connected. | Partial | Add reporting notes and future dashboard hooks. |

## Completed in Build 160

1. Reviewed `COMPETETIVE.md` end-to-end as the desired website/app direction.
2. Compared the competitor/service roadmap against the current public pages, admin pages, data files, and social workflow.
3. Classified each major competitor target as strong, partial, or missing.
4. Identified the highest-conversion gap: visitors need a simpler “which service should we choose?” path before package cards.
5. Identified the highest-local-SEO gap: reviews/recent work/proof should become town- and service-aware.
6. Identified the highest-admin gap: high-change service/add-on/specials copy still needs DB-first management.
7. Identified the highest-safety gap: consent capture and media privacy/blur status must be completed before public/social automation scales.
8. Identified the highest-repo-cleanup gap: GitHub web uploads can leave stale files, so a clean/orphan branch replacement remains important.
9. Added `COMPETITOR_SANITY_CHECK.md` as the full current-vs-target audit.
10. Added `COMPETITOR.md` and `COMPETETOR.md` aliases so future chats can find the competitor roadmap despite spelling variations.
11. Updated this `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
12. Updated `KNOWN_GAPS_AND_RISKS.md` with competitor-aligned remaining risks.
13. Updated `CURRENT_IMPLEMENTATION_STATE.md`, `SANITY_CHECK.md`, `README.md`, `NEW_CHAT_STATUS.md`, and `HANDOFF_NEXT_CHAT.md` with Build 160 status.
14. Added a no-DDL SQL note for Build 160.
15. Added `scripts/competitor_roadmap_check.py`.
16. Added the competitor roadmap check to `scripts/release_check.py`.
17. Added a Services-page decision guide with practical package direction for maintenance, daily-use interiors, exterior gloss, paint correction/ceramic, fleet, and gifts.
18. Added stronger Services-page photo-estimate and quote CTAs.
19. Synced root `/services.html` and folder `/services/index.html`.
20. Re-ran release checks including Cloudflare, social workflow, competitor roadmap, and SEO/H1 checks.

## Next 20 value-added steps after Build 160

1. Deploy Build 160 and confirm the Cloudflare Pages build stays clean.
2. Apply pending SQL migrations through Build 159 if any are still missing.
3. Smoke-test Services page on desktop and mobile to confirm the new decision guide improves clarity.
4. Add the same decision guidance to Booking as a step-by-step recommendation panel.
5. Add package display aliases: Express Interior Refresh, Full Interior Detail, Interior Detail Pro, Exterior Wash & Protect, Full Detail, Paint Enhancement, Paint Correction Quote, Ceramic Protection Quote.
6. Add a photo-estimate prompt to Booking and Contact with examples of the 2–6 photos customers should send.
7. Build a simple recommendation engine using vehicle type, service type, condition, add-ons, and photos.
8. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
9. Add admin-managed specials/promos blocks for seasonal salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
10. Improve gift-card merchandising with Interior Detail, Full Detail, and custom amount gift cards.
11. Add customer-facing consent capture for public/social before-and-after use.
12. Add media privacy fields for plate/face/address review and blur/crop completion.
13. Add admin proof-placement controls so staff can choose which reviews/recent work appear on each town/service page.
14. Filter gallery/recent work by town, service, add-on, and vehicle type where data is available.
15. Move high-change service, add-on, specials, FAQ, and proof content toward DB-first admin management.
16. Add Search Console and Google Business Profile reporting notes to admin analytics.
17. Add social performance entry and dashboard rollups using `social_post_metrics_snapshots`.
18. Add social platform preview cards before publishing.
19. Prepare a clean/orphan branch replacement plan once deploy stability is confirmed.
20. Keep this file as the top implementation source of truth; use older roadmap files only as history.

---

# Build 159 update — Social templates, scheduling, duplicate warnings, and manual posted-link capture

**Updated:** 2026-05-20  
**Current build:** Build 159

Build 159 continues the social publishing workflow by making Admin Social Queue easier to use day-to-day. It adds reusable caption/hashtag pickers, planned publish timing, duplicate draft warnings, posted-link capture, and schema support for future social metrics snapshots while keeping the Build 158 human review gates in place.

## Completed in Build 159

1. Reviewed Build 158 Development Roadmap and Known Gaps before selecting the next social workflow items.
2. Added `functions/api/admin/social_templates_list.js` as a staff-protected template/preset endpoint.
3. Added root shim `functions/api/social_templates_list.js` for compatibility with flat Cloudflare routes.
4. Added DB-first reading from `social_caption_templates`.
5. Added DB-first reading from `social_hashtag_presets`.
6. Added built-in fallback caption templates when the DB tables are not migrated yet.
7. Added built-in fallback hashtag presets when the DB tables are not migrated yet.
8. Added a caption template picker to Admin Social Queue.
9. Added a hashtag preset picker to Admin Social Queue.
10. Added a planned publish time input for manual social drafts.
11. Passed `scheduled_for` into new manual social drafts.
12. Added planned/unscheduled queue filters.
13. Added visible planned-time badges on draft cards.
14. Added duplicate draft grouping in the visible queue using `duplicate_signature`.
15. Added duplicate warning cards so repeated platform/caption/first-media drafts are easier to spot.
16. Added posted URL and platform post ID prompts when staff use **Mark posted**.
17. Kept **Publish/API** blocked by the Build 158 consent/privacy review gate.
18. Added `sql/2026-05-20_build159_social_templates_schedule_duplicate_metrics.sql`.
19. Added schema support for duplicate review status, social metrics JSON, and `social_post_metrics_snapshots`.
20. Updated release checks, Markdown, schema notes, and the social publishing guide for Build 159.

## Next 20 value-added steps after Build 159

1. Apply Build 156, Build 158, and Build 159 SQL migrations in order if they are not already applied.
2. Smoke-test manual draft creation with a caption template and hashtag preset.
3. Smoke-test planned publish time filtering in Admin Social Queue.
4. Smoke-test duplicate warnings by creating two similar draft rows.
5. Add editable draft text inside Admin Social Queue before approval.
6. Add an approval role so detailers can draft while owners approve/publish.
7. Add customer-facing consent capture on booking/progress pages.
8. Add license-plate/face/address blur status to each media row.
9. Add a crop/blur reminder panel before drafts with vehicle photos can be approved.
10. Add a calendar view for scheduled social posts.
11. Add retry scheduling for failed API/webhook attempts.
12. Add a social performance entry form using `social_post_metrics_snapshots`.
13. Add dashboard rollups for posted count, failed count, and platform coverage.
14. Add town-specific caption templates for Woodstock, Ingersoll, Simcoe, Delhi, and Port Dover.
15. Add platform preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, LinkedIn, and YouTube Shorts.
16. Add automatic public-gallery promotion only from approved/posted rows.
17. Add webhook signing verification examples for Make, Zapier, and n8n.
18. Add a clean-branch/orphan upload plan after Cloudflare deploy is stable.
19. Add Search Console and Google Business Profile reporting notes into the admin analytics roadmap.
20. Continue SEO/H1/CSS drift checks on every release pass.

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

# Development Roadmap — Build 157


**Updated:** 2026-05-19  
**Target branch:** `dev`  
**Pass focus:** Social publishing bridge for job/crafting progress posts, safer API/webhook dispatch, Admin Progress immediate social draft/publish controls, Admin Social Queue copy/API buttons, schema/doc synchronization, and continued SEO/H1/CSS release discipline.

## Build 157 completed — social progress publishing bridge

1. Kept the Build 156 social queue as the base instead of bypassing review controls.
2. Added a platform publish helper at `functions/api/_lib/social-platform-dispatch.js`.
3. Added approved API publish attempts for X text posts using the X v2 create-post endpoint.
4. Added Facebook Page API publish attempts for text posts and public image URLs.
5. Added Instagram Business publish attempts using media container creation plus publish.
6. Kept TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and unsupported networks on webhook/manual fallback until each platform OAuth/app review is complete.
7. Added optional `SOCIAL_DISPATCH_WEBHOOK_SECRET` header support for automation tools.
8. Added `Publish/API` action inside Admin Social Queue.
9. Kept `Send webhook`, `Copy text/media`, `Mark posted`, `Ready`, and `Skip` fallbacks.
10. Expanded readiness display for X, Facebook Page, Instagram Business, TikTok, LinkedIn, YouTube/Google, queue DB, and webhook bridge.
11. Added copy-to-clipboard support for draft captions and media URLs.
12. Added Admin Progress checkbox to create social drafts automatically after progress updates/media.
13. Added Admin Progress checkbox to attempt approved API/webhook push immediately after draft creation.
14. Synced `/admin-progress.html` with `/admin-progress/index.html` so the public route is not stale.
15. Synced `/admin-social.html` with `/admin-social/index.html`.
16. Updated release checks so Build 157 social markers are required.
17. Updated Cloudflare Pages Functions check to syntax-check the new publish helper.
18. Added Build 157 SQL no-DDL note documenting required environment variables.
19. Updated `SUPABASE_SCHEMA.sql` with the Build 157 no-DDL note.
20. Kept local SEO/H1 guard active so exposed pages continue to have one clear main heading.

## Next 20 value-added steps after Build 157

1. Add a secure Admin Settings screen for platform connection status without showing secrets.
2. Add per-platform caption templates, including short X text and longer Facebook/Instagram text.
3. Add per-platform image/video requirements and warnings before publishing.
4. Add a draft preview mode that shows how the post will look on each platform.
5. Add batch-publish selected drafts from the Social Queue.
6. Add scheduled publishing windows by platform and local audience timing.
7. Add a reusable hashtag library for towns, services, and seasonal campaigns.
8. Add before/after carousel support for Facebook and Instagram where supported.
9. Add a Make/Zapier/webhook recipe guide for TikTok, Google Business Profile, LinkedIn, and YouTube Shorts.
10. Add platform response permalink repair when APIs return IDs but not URLs.
11. Add automatic retry rules for temporary API errors and rate limits.
12. Add an approval role so staff can draft while owners approve/publish.
13. Add customer privacy flags so license plates, faces, and addresses are blocked before posting.
14. Add media scoring checks for social-safe size, format, and orientation.
15. Add alt text/caption fields for accessibility and local SEO.
16. Add social performance tracking fields for reach, clicks, and conversions.
17. Add a recent-work public gallery fed from approved social/job posts.
18. Add town-specific posting templates for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Oxford County, and Norfolk County.
19. Add a rollback/unpublish checklist for posts published by mistake.
20. Add a monthly content calendar tied to bookings, seasonal services, and local promotions.



**Updated:** 2026-05-18  
**Target branch:** `dev`  
**Pass focus:** Cloudflare Pages Functions deploy hotfix, media-library endpoint syntax repair, duplicate landing-page key cleanup, release-check hardening, schema/docs synchronization, and continued SEO/H1/CSS release discipline.


## Build 155 completed deployment hotfix pass

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
12. Updated Markdown and schema tracking notes so Build 155 is documented as the current baseline.

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

<!-- Build 155 sync 2026-05-18: Cloudflare Pages Functions deploy hotfix, media-library endpoint regex repair, landing-page duplicate-key cleanup, release-check hardening, schema sync, and local SEO/H1 discipline pass. -->

## Build 155 completed deployment repair pass

1. Repaired root `/functions/api/*.js` import paths from `../_lib/...` to `./_lib/...` so Cloudflare Pages Functions can resolve helpers.
2. Preserved valid nested admin imports and mirrored helper libraries as a defensive fallback for legacy flat route files.
3. Confirmed `functions/api/admin/media_library_list.js` no longer contains the esbuild-breaking regex newline issue.
4. Confirmed `functions/api/landing_pages_public.js` normalizePage no longer has duplicate object keys.
5. Added a no-DDL migration note for Build 155.
6. Hardened `scripts/cloudflare_pages_functions_check.py` to check relative import resolution before packaging.
7. Ran the Cloudflare deploy-safety check successfully across 499 JavaScript files.
8. Ran Node syntax checks successfully across 384 Functions JavaScript files.
9. Kept the Build 151 inventory media picker/fallback workflow unchanged.
10. Updated active Markdown and schema notes for Build 155.

## Next 20 recommended steps after Build 155

1. Deploy Build 155 to Cloudflare Pages and confirm the Functions compile finishes cleanly.
2. If any Cloudflare log remains, fix only the exact named file before starting new features.
3. Apply Build 150 and Build 151 SQL migrations in Supabase dev if not already applied.
4. Seed `app_media_library` from current R2 tool, consumable, add-on, and service-image folders.
5. Add an Admin Media Library screen to edit label, alt text, usage context, source status, and sort order.
6. Add direct R2 upload from Admin Catalog image picker.
7. Add bulk image repair for all inventory rows, not only visible selected rows.
8. Add a missing/duplicate/broken image dashboard for catalog, services, add-ons, and landing pages.
9. Add image alt-text quality scoring to Admin Catalog save validation.
10. Add local-service landing page smoke tests for title, meta, H1, locality terms, and canonical links.
11. Add deployed smoke checks for `/api/admin/media_library_list` and key Admin Catalog endpoints.
12. Move legacy flat root API JavaScript copies out of the live root once Cloudflare deploy is stable.
13. Keep `service-worker.js` as the only intentional root JavaScript file unless a page explicitly loads another root script.
14. Add a repo-cleanliness check that flags duplicate API route files outside `/functions`.
15. Add admin UI messaging when media library DB tables are unavailable and fallbacks are being used.
16. Add inventory/product image history so changed images can be reverted.
17. Add service-area/town page image assignment from the shared media library.
18. Continue one-H1 checks on every exposed page.
19. Continue CSS drift checks on public and admin pages after each feature pass.
20. Re-run the full release check after the deploy hotfix is confirmed.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.



## Build 155 completed 20-step pass - 2026-05-18

1. Used the latest uploaded Build 147 ZIP as the active baseline for this pass.
2. Rechecked the Cloudflare Pages Functions route tree before adding any new feature work.
3. Found four remaining root `/functions/api/*.js` files still importing `../_lib/...` from the wrong level.
4. Repaired `functions/api/blocks_range_save.js` to import helpers through `./_lib/...`.
5. Repaired `functions/api/catalog_amazon_matches.js` to import helpers through `./_lib/...`.
6. Repaired `functions/api/catalog_bulk_import.js` to import helpers through `./_lib/...`.
7. Repaired `functions/api/catalog_bulk_visibility.js` to import helpers through `./_lib/...`.
8. Confirmed nested `/functions/api/admin/*.js` imports were left alone because `../_lib/...` is correct from the admin folder.
9. Kept the Build 154 stale-route compatibility shims in place for older flat route files left behind by GitHub web uploads.
10. Added `scripts/stale_root_function_shims_check.py` into the normal `scripts/release_check.py` flow so bad root imports fail before upload.
11. Tightened `scripts/cloudflare_pages_functions_check.py` to focus on Cloudflare Functions JavaScript instead of every root/static JavaScript copy.
12. Added a per-file timeout guard around `node --check` inside the Cloudflare deploy-safety checker.
13. Updated `scripts/release_check.py` so Python check scripts can run in-process, avoiding nested subprocess hangs seen in the sandbox.
14. Re-ran the Cloudflare deploy-safety check and confirmed 405 Functions JavaScript files pass.
15. Re-ran the stale root function import guard and confirmed no root `/functions/api/*.js` file still imports parent `_lib` helpers.
16. Re-ran the local SEO/H1 audit to keep the one-H1 and local title/meta discipline active.
17. Re-ran inventory image picker checks and confirmed all 149 bundled fallback inventory rows still have image coverage.
18. Re-ran the media-library picker check to keep selected image repair, duplicate diagnostics, and health scan markers covered.
19. Added a Build 155 no-DDL SQL note and synchronized `SUPABASE_SCHEMA.sql`.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, and implementation-state docs for the next upload.


## Next 20 recommended steps after Build 155

1. Upload Build 155 to the `dev` branch and confirm Cloudflare Pages Functions compile cleanly.
2. If Cloudflare still fails, fix only the exact file named in the new deploy log before starting feature work.
3. After a clean deploy, use a clean/orphan branch upload to remove any stale GitHub web-upload leftovers permanently.
4. Apply Build 150 and Build 151 SQL migrations in Supabase dev if they have not already been applied.
5. Confirm `/api/admin/media_library_list?usage_context=inventory_item` returns either DB media rows or a safe warning fallback.
6. Seed `app_media_library` from existing R2 tool, consumable, add-on, landing, and service-image folders.
7. Add an Admin Media Library screen for label, alt text, caption, usage context, group key, source status, and sort order.
8. Add direct R2 image upload from the Admin Catalog image picker.
9. Add bulk image repair for all fallback-matched rows, not only selected/visible rows.
10. Add a server-side broken-image report for catalog, services, add-ons, gallery, and landing pages.
11. Add image alt-text quality scoring to Admin Catalog save validation.
12. Add service/town landing-page media assignment from the shared media library.
13. Convert before/after gallery sample JSON into an admin-managed DB content set.
14. Add receipt/bill attachment workflow for inventory purchases and accounting entries.
15. Link booking completion consumables/tools used to inventory movement and accounting COGS posting.
16. Add monthly inventory count sessions with variance approval and lock/reopen controls.
17. Connect vendor directory editing between Admin Catalog and Accounting.
18. Add Search Console and Google Business Profile reporting panels once credentials/API access are ready.
19. Continue town/service page improvements for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norfolk, and Oxford searches.
20. Keep every release pass checking Cloudflare Functions, one H1 per exposed page, local title/meta clarity, CSS drift, stable redirects, and inventory/media fallback safety.

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