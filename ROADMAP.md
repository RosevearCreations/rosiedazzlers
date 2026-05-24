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
