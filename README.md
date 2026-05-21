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

# Rosie Dazzlers Dev Build — Build 157


**Updated:** 2026-05-19

## Build 157 focus

- Social publishing bridge for job/crafting process photos and summaries.
- Admin Progress can create social drafts after update/media posts.
- Optional immediate API/webhook publishing attempt after draft creation.
- Admin Social Queue now includes Publish/API, Send webhook, Copy text/media, Mark posted, Ready, and Skip actions.
- X, Facebook Page, and Instagram Business API attempts are wired behind environment variables.
- TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and unsupported platforms remain safe webhook/manual fallbacks.
- SEO/H1 and Cloudflare Pages Functions release checks remain active.



**Updated:** 2026-05-18

This ZIP is the current dev baseline for Rosie Dazzlers.

## Build 155 focus

- Cloudflare Pages Functions deploy hotfix for `media_library_list.js`.
- Landing page public API duplicate object-key cleanup.
- Release-check hardening for deploy-only JavaScript issues.
- Admin Catalog inventory media-library picker foundation.
- Staff-protected `/api/admin/media_library_list` endpoint.
- Selected-row image repair for fallback-matched inventory images.
- Duplicate image diagnostics.
- Browser image health scan for visible inventory rows.
- Schema and Markdown synchronization.
- Continued SEO/H1/CSS release checks.

## Important files

- `admin-catalog.html`
- `admin-catalog/index.html`
- `functions/api/admin/media_library_list.js`
- `scripts/media_library_picker_check.py`
- `scripts/cloudflare_pages_functions_check.py`
- `scripts/inventory_image_picker_check.py`
- `scripts/release_check.py`
- `sql/2026-05-18_build151_media_library_inventory_image_workflow.sql`
- `SUPABASE_SCHEMA.sql`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_CHECK.md`

## Release check

```bash
python scripts/release_check.py
```

## Deploy note

Apply SQL migrations in order. If `app_media_library` is not seeded yet, Admin Catalog should keep working from app settings and bundled product/tool image fallbacks. Build 155 should also avoid the prior Cloudflare deploy regex failure.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 focus

Build 155 is a Cloudflare Pages Functions deploy hotfix. It repairs unresolved `_lib` imports in root API route files, preserves the media-library image workflow from Build 151/152, keeps the duplicate landing-page key cleanup, and adds import-resolution checking to the deploy-safety script. No database DDL is required.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Important Build 155 files: `functions/api/blocks_range_save.js`, `functions/api/catalog_amazon_matches.js`, `functions/api/catalog_bulk_import.js`, `functions/api/catalog_bulk_visibility.js`, `scripts/cloudflare_pages_functions_check.py`, `scripts/stale_root_function_shims_check.py`, `scripts/release_check.py`, and `sql/2026-05-18_build155_cloudflare_root_import_release_check_no_ddl_note.sql`.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.


## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.
