# Known Gaps and Risks — Build 157


**Updated:** 2026-05-19

## Reduced in Build 157

- Social posts are no longer only passive drafts: Admin Social Queue now has `Publish/API`, `Send webhook`, and `Copy text/media` actions.
- Admin Progress can now create social drafts automatically after job/crafting progress updates or media posts.
- Admin Progress can optionally attempt approved platform API/webhook publishing immediately after draft creation.
- Direct API attempts are guarded: X, Facebook Page, and Instagram Business need configured tokens; unsupported platforms fail safely to webhook/manual flow.
- The root `/admin-progress.html` and `/admin-social.html` files were synchronized with their folder `index.html` versions to reduce stale-route drift.
- Release checks now require Build 157 social publishing bridge markers.

## Still open after Build 157

- TikTok, Google Business Profile, LinkedIn, and YouTube Shorts still need final approved platform apps/OAuth flows before true direct posting.
- X image upload is not wired yet; Build 157 posts text/progress links through X and keeps images available for manual/webhook flow.
- Facebook and Instagram publishing require public media URLs and valid Meta page/account tokens.
- Webhook automation needs the destination service configured in Cloudflare Pages environment variables.
- Customer privacy review for license plates/faces/addresses still needs a dedicated checklist before auto-publish is made default.


**Updated:** 2026-05-18

## Reduced in this pass

- Cloudflare Pages Functions deploy blocker from Build 151 was repaired in `/api/admin/media_library_list`.
- Duplicate object-key warnings in `landing_pages_public.js` were cleaned up.
- Release checks now include a Cloudflare Pages Functions deploy-safety guard for JavaScript syntax, esbuild-sensitive regexes, and duplicate landing-page normalization keys.
- Admin Catalog now has a media-library-aware image picker path through `/api/admin/media_library_list`.
- The picker can search DB media rows, app-setting media rows, bundled consumables/tools fallback rows, saved DB inventory rows, and helper image URLs.
- Staff can select inventory rows and use **Repair selected images** to persist fallback-matched images instead of only seeing temporary UI hydration.
- Browser-side **Scan visible images** can flag image URLs that fail to load during the current admin session.
- Duplicate-image groups are counted in the quality summary and shown on affected rows.
- Release checks now guard the Cloudflare deploy hotfix, media-library picker, selected image repair, duplicate diagnostics, image health scan, and endpoint markers.
- Schema tracking now includes the Build 151 `app_media_library` table/index baseline.

## Still open

1. The media-library endpoint can read `app_media_library`, but the table still needs to be seeded from the actual R2 product/tool folders.
2. Admin Catalog can pick existing media URLs, but it does not yet upload new files directly to R2.
3. Browser image scans are useful for staff checks, but they are not a scheduled/server-side 404 monitor yet.
4. Duplicate-image warnings do not yet have an approval/ignore list for intentional duplicate tools, multipacks, or shared product photos.
5. `Repair selected images` is intentionally conservative; a fuller review screen is still needed for repairing all fallback-matched rows at once.
6. Existing DB rows with blank images are hydrated visually, but the URL is only persisted after save or selected repair.
7. Supabase dev still needs the Build 150 and Build 151 SQL migrations applied and smoke-tested.
8. External location photos are still placeholders and should be replaced with Rosie-owned/R2-hosted images.
9. Reviews, before/after proof, and inventory/tool stories are not yet automatically filtered by town/service page.
10. Inventory/accounting still needs stock-count sessions, variance review, receipt attachment, and lockable month-end inventory valuation.
11. Search Console and Google Business Profile reporting are not yet connected.
12. Some historical Markdown snapshots remain for traceability, but active docs are the Build 155 working handoff source.

<!-- Build 155 sync 2026-05-18: reviewed during Cloudflare deploy hotfix and inventory/media image workflow pass. -->

## Build 155 known risks update

- Build 155 should resolve the Cloudflare unresolved `_lib` import errors by correcting root API import paths and hardening release checks.
- Deploy still needs to be confirmed on Cloudflare Pages because the previous failure happened during Cloudflare's Functions bundling step.
- Legacy flat root API JavaScript copies still exist for compatibility in this ZIP, but they should be retired after a clean deploy confirms `/functions/api` is the only needed route source.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Remaining risk: GitHub web uploads can leave older files in the branch. Build 155 guards the import pattern, but the cleanest long-term fix is still a clean/orphan branch replacement after a successful deploy.

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
