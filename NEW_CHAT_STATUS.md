# Handoff Next Chat — Build 155

**Updated:** 2026-05-18

Current build: **Build 155**.

## What changed last

Build 155 repairs the Cloudflare Pages Functions deploy blocker in `/api/admin/media_library_list`, cleans duplicate landing-page public API object keys, and keeps the Build 151 media-library-aware image picker, selected-row fallback image repair, duplicate image diagnostics, and browser image health scanning.

## First things to test next

1. Apply Build 150 and Build 151 SQL migrations in Supabase dev.
2. Open Admin Catalog on the deployed dev URL.
3. Confirm existing fallback-matched images still appear.
4. Open **Pick existing image** and confirm images are searchable.
5. Select rows and test **Repair selected images**.
6. Run **Scan visible images** and review any failed URLs.

## Next coding direction

Deploy Build 155, confirm Cloudflare Pages Functions compile cleanly, then seed `app_media_library` from R2 product/tool folders and add direct R2 upload plus editable image metadata from Admin Catalog.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 handoff note

Current build: **Build 155**. Deploy this ZIP next. It specifically repairs the Cloudflare Pages Functions unresolved `_lib` import errors that appeared after the regex fix. The next confirmation target is a clean Cloudflare Functions upload/compile.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Next chat should first review the latest Cloudflare deploy result. If deploy is clean, move into media-library seeding, direct R2 upload, and admin-managed before/after gallery content.

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
