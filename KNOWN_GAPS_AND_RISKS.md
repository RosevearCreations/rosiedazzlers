# Known Gaps and Risks — Build 159

**Updated:** 2026-05-20

## Reduced in Build 159

- Admin Social Queue now loads reusable caption templates and hashtag presets from the DB when available.
- Built-in fallback templates keep the page usable before the Build 158/159 SQL migrations are applied.
- Manual drafts can now include a planned publish time and can be filtered by planned/unscheduled status.
- Duplicate draft warnings are visible when the same platform/caption/first-media signature appears more than once in the current queue view.
- Staff can capture a posted URL and optional platform post ID when marking a manual post as posted.
- Build 159 schema support adds duplicate review helpers and optional social metrics snapshots for future reporting.

## Still open after Build 159

1. Build 156, Build 158, and Build 159 SQL migrations must be applied in order on Supabase before all social fields are available.
2. Direct API posting still depends on platform credentials, scopes, and platform approval.
3. TikTok, Google Business Profile, LinkedIn, and YouTube Shorts remain safer as webhook/manual flows until the account/app approval paths are confirmed.
4. Draft text cannot yet be edited inline after creation.
5. Scheduled publish times are stored and visible, but there is no automated scheduler worker yet.
6. Duplicate warnings are advisory only; they do not yet block approval or provide an ignore/approve-as-intentional workflow.
7. Customer-facing consent capture still needs to be wired into the booking/progress experience.
8. Media crop/blur confirmation is still checklist-based, not image-analysis based.
9. Social metrics snapshots have schema support, but the admin data-entry/reporting UI still needs to be added.
10. A clean branch/orphan upload is still the cleanest way to permanently remove stale GitHub files left behind by web uploads.

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
