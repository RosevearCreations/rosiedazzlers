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

# Sanity Check — Build 157


**Build 157 update — 2026-05-19:** Social progress publishing bridge added. Admin Progress can automatically create social drafts and optionally attempt approved API/webhook posting. Admin Social Queue now supports Publish/API, Send webhook, Copy text/media, Ready, Mark posted, and Skip. No DDL is required beyond Build 156; Build 157 adds `sql/2026-05-19_build157_social_api_publish_bridge_no_ddl_note.sql`.


**Updated:** 2026-05-18

## Release checks to run

```bash
python scripts/release_check.py
```

Build 155 release check coverage includes:

- JSON parsing under `data/`
- `sitemap.xml` parsing
- Cloudflare Pages Functions deploy-safety checks
- static page/link checks
- local SEO/H1 audit
- catalog fallback merge checks
- service-area rule checks
- catalog quality report
- catalog DB import preview
- service/product link checks
- Amazon catalog match checks
- mobile navigation checks
- landing-photo checks
- Admin App editor checks
- inventory image picker/fallback checks
- media-library picker / repair / duplicate / health-scan checks

## Manual smoke tests after deploy

1. Open Admin Catalog while signed in as staff/admin.
2. Confirm inventory loads even if `/api/admin/catalog_inventory_list` falls back or returns partial DB rows.
3. Edit a saved DB item that previously had a blank image and confirm the fallback-matched image appears.
4. Open **Pick existing image** and confirm bundled images plus media-library rows appear when available.
5. Select a fallback-matched row and click **Repair selected images**.
6. Reload and confirm the image remains saved on the row.
7. Click **Scan visible images** and confirm failed images are reported without breaking the page.
8. Confirm duplicate-image warnings are informational and do not block editing.
9. Check Home, Services, Pricing, Book, Gear, Consumables, Gallery, and Contact for one H1 and normal CSS layout.
10. Confirm clean routes do not create redirect loops.

## Known deploy caution

`app_media_library` may not be populated on dev yet. That is okay. Admin Catalog should still work through app settings and bundled JSON/R2 fallbacks. Build 155 also specifically guards the prior Cloudflare deploy failure in `media_library_list.js` and duplicate landing-page object-key warnings.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 sanity check

- PASS: `scripts/cloudflare_pages_functions_check.py` completed successfully across 499 JavaScript files.
- PASS: Node syntax checks completed successfully across 384 Functions JavaScript files.
- PASS: relative import resolution check found no unresolved local JavaScript imports.
- PASS: no esbuild-sensitive literal newline regex issue found in media-library route files.
- PASS: landing page normalizePage duplicate-key check is clean.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Build 155 release check passed with JSON, sitemap, Cloudflare Functions, stale-root import, static, SEO/H1, catalog fallback, service-area, catalog quality, import preview, Amazon match, mobile nav, landing-photo, Admin App editor, inventory picker, and media-library picker checks.

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