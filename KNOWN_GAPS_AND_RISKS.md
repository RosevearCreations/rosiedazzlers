> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 known gaps and risks — FAQ/content-access pass

**Updated:** 2026-05-24

## Closed or reduced in Build 172

- The FAQ route is no longer just a roadmap item. `/faq` and `/faq/index.html` now have real customer-facing content.
- New public pages are easier to discover because FAQ is linked from navigation, footer, homepage, Services, Pricing, Contact, and sitemap.
- FAQ/help content now has a DB target (`public_faq_entries`) and a fallback API (`/api/public_faqs`), reducing future duplicate static-copy drift.
- FAQPage and BreadcrumbList schema are present on the new FAQ page.

## Still outstanding

1. Apply Build 172 SQL before expecting FAQ content to come from Supabase.
2. Build an Admin Content editor for FAQ, specials, services, and education content.
3. Add persistent quote/proposal draft records and send/review workflow.
4. Add lead → booking/quote conversion and status analytics.
5. Add service/town-aware gallery/recent-work filtering.
6. Enforce per-media privacy review before public gallery or social reuse.
7. Continue testing auth/session fallback after every deploy because missing env vars still prevent successful login, even though the console no longer hard-fails.

---
# Build 171 known gaps and risks update

**Updated:** 2026-05-24  
**Current build:** Build 171

Build 171 reduces the Admin Leads conversion gap by adding a quote-starter action. Staff can now transform a lead into consistent internal quote follow-up copy, but it still does not create a real booking, invoice, saved proposal, or customer-facing message automatically.

## Reduced in Build 171

- Admin Leads can build a quote starter from each public lead.
- Linked uploads and customer-provided photo/share links are included in the quote context.
- Privacy warnings are surfaced before staff use uploaded media publicly.
- Service-key alias checks are more consistent across lead/upload endpoints.
- A Build 171 release guard now requires the endpoint, UI action, SQL note, schema note, and docs markers.

## Remaining risks

- Build 167 SQL must exist before `public_inquiry_leads` and `photo_estimate_uploads` can store live data.
- Build 168 SQL is still needed for upload staff/privacy notes and reviewer tracking.
- The quote starter is copy-ready text only; it is not a persistent quote object yet.
- Staff must still manually verify pricing, service area, photos, water/power/parking access, and any quote-required add-ons before sending a customer message.
- Lead-to-booking conversion, saved quote drafts, DB-managed public content, service/town proof filtering, and media eligibility automation remain next major work.

---
# Build 168 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 168

Build 168 reduces the biggest Build 167 operations risk: public leads and optional estimate uploads are no longer just stored in database tables. Staff now have a protected Admin Leads screen to search, triage, update status, attach notes, link a lead/upload to a booking UUID, and mark media privacy status.

## Reduced in Build 168

- Admin Leads now exists for `public_inquiry_leads`.
- Staff can move public leads through `new`, `reviewing`, `contacted`, `quoted`, `converted`, `closed`, or `spam`.
- Staff can save lead notes and converted booking UUIDs.
- Admin photo/video upload review now exists for `photo_estimate_uploads`.
- Staff can mark upload status and media privacy status before photos are used elsewhere.
- Photo upload review can store staff notes, privacy notes, reviewer, and reviewed timestamp after the Build 168 SQL is applied.
- Release checks now require the Admin Leads page, endpoints, SQL migration, docs, and schema markers.

## Remaining risks

- Build 167 SQL must be applied before public lead/upload tables exist.
- Build 168 SQL must be applied before photo upload staff/privacy notes and reviewer tracking are fully stored.
- Direct uploads should remain disabled until storage bucket, public base URL, file-size limit, and privacy workflow are confirmed.
- Admin Leads can link a lead/upload to an existing booking UUID, but it does not yet create the booking or quote automatically.
- A full quote-builder, DB-managed public content editor, service/town proof filters, and gallery/social eligibility automation remain the next major backend/admin steps.

---

# Build 167 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 167

Build 167 reduces the remaining competitor-completion gap by adding structured fleet/maintenance lead capture, optional direct quote-photo upload foundation, public FAQPage/Breadcrumb schema foundations, and a release guard for the updated completion matrix.

## Reduced in Build 167

- Direct customer upload now has a safe env-gated foundation instead of only shared photo links.
- Fleet quote interest is now captured with a structured public form.
- Maintenance plan interest is now captured with a structured public form.
- Public lead capture now has an SQL-backed table.
- Optional quote-photo uploads now have an audit table for later privacy/media review.
- FAQPage and BreadcrumbList schema foundations are now present on public competitor routes.
- `COMPETETIVE_COMPLETION_MATRIX.md` now distinguishes complete public foundations from still-open admin/backend workflow.

## Remaining risks

- Direct uploads should stay disabled until storage bucket, public base URL, size limits, and privacy workflow are confirmed.
- Lead forms require the Build 167 SQL migration before saving into Supabase.
- There is not yet an Admin Leads screen to triage `public_inquiry_leads`.
- Uploaded estimate media is appended to booking links, but uploaded media still needs admin review and booking-linking workflow.
- Service/town proof filtering, quote builder, DB-managed content editing, and gallery/social eligibility automation remain the next major admin/backend tasks.

---

# Build 166 known gaps and risks update

**Updated:** 2026-05-23  
**Current build:** Build 166

Build 166 reduces the public-facing competitor-roadmap gap by adding the missing public entry routes for specials, gift cards, fleet/commercial work, maintenance plans, and customer education. It also expands add-on coverage and documents the remaining backend/admin work in `COMPETETIVE_COMPLETION_MATRIX.md`.

## Reduced in Build 166

- Specials are no longer only a roadmap idea; `/specials` now exists.
- Gift cards now have a customer-friendly `/gift-cards` guide in addition to the existing gift system.
- Fleet/commercial quoting now has `/fleet` as a plain-language entry point.
- Maintenance-plan messaging now has `/maintenance` as a public guide tied to the existing interest flow.
- Customer education now has `/blog` and starter articles.
- Add-on coverage now better matches the competitor roadmap.
- Sticky CTAs now keep Book, Send photos, Call/text, and Specials close to users.

## Remaining risks

- These new pages are static/public foundations; high-change content should still move into DB/admin management.
- Direct upload is still not complete; Build 165 share-link capture remains the current safe route.
- Gallery proof still needs service/town filtering and approval controls.
- Quote building from photo estimates still needs a staff workflow.
- Per-media privacy review is still needed before automatic public gallery/social eligibility.


---

# Build 165 known gaps and risks update

**Updated:** 2026-05-22  
**Current build:** Build 165

Build 165 reduces the quote-first conversion gap by letting customers paste photo-estimate links before checkout. The links are included in booking notes immediately and can be stored directly in `bookings.photo_estimate_links` after the Build 165 migration is applied.

## Reduced in Build 165

- Photo-estimate customers no longer have to rely on free-form notes only.
- Submitted photo/media links are visible in Admin Booking's intake/media consent panel.
- Checkout stays fallback-safe before the new optional column is live.
- Release checks now verify the booking-page, checkout, admin-booking, SQL, and roadmap markers for this workflow.

## Remaining risks

- Direct customer file upload still needs a follow-up pass; Build 165 captures share links, not uploaded files.
- Staff still need a quote-building workflow that turns reviewed photos into recommended packages/add-ons.
- Media-level privacy review is still booking-level plus staff checklist; each individual photo/video should get its own privacy status later.
- Social/gallery eligibility should eventually require both consent and per-media privacy approval.
- The Build 162, 163, 164, and 165 migrations should be applied in order before relying on direct reporting fields.

---

# Build 164 known gaps and risks update

**Updated:** 2026-05-22  
**Current build:** Build 164

Build 164 reduces the staff workflow gap from Build 163 by adding Admin Booking controls for photo-estimate status, condition review status, media/privacy status, privacy checklist flags, blur/crop flags, and a staff review note. The admin action is fallback-safe, but direct reporting still depends on the Build 162, Build 163, and Build 164 migrations being applied.

## Reduced in Build 164

- Staff can now save intake-review statuses instead of only viewing intake details.
- Photo-estimate, condition, and media/privacy review workflows now have a clear admin action path.
- Privacy checklist flags can be stored for plates, faces, addresses/private identifiers, blur/crop needed, and blur/crop complete.
- Staff review notes can be stored directly when the Build 164 migration is applied.
- If optional columns are not migrated yet, the review action is appended to booking notes instead of breaking the admin workflow.

## Still open after Build 164

1. Apply the Build 162 migration, then Build 163, then Apply the Build 164 migration.
2. Confirm the live Supabase schema cache sees the new optional booking fields.
3. Add true customer photo upload/lead capture before checkout.
4. Add media-level privacy review actions for individual job photos/videos.
5. Enforce gallery/social eligibility from consent, privacy review, and blur/crop completion.
6. Add staff quote-building tools from customer photo estimates and condition flags.
7. Add automated customer messages for photo-estimate received and quote-ready states.
8. Continue migrating scattered public service content into DB-managed admin content.
9. Continue clean/orphan branch planning to prevent stale GitHub files from surviving web uploads.

---

# Build 163 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 163

Build 163 reduces the staff-side risk created by Build 162 note-only intake capture. Checkout can now write the optional condition/photo/media-consent fields directly when migrations are applied, and Admin Booking now surfaces the intake/consent review in its own panel. The main remaining risk is that the new optional fields must be migrated before reporting/editing can rely on them fully.

## Reduced in Build 163

- Admin Booking no longer relies only on buried notes for condition-helper and media-consent review.
- Checkout has fallback-safe optional-field insertion, so the booking flow should not break if the new columns are not live yet.
- Staff can quickly see whether a customer requested a photo estimate.
- Staff can see media-use preference before using job photos publicly or socially.
- Schema now has planning fields for photo-estimate, condition-review, and media-privacy workflows.

## Still open after Build 163

1. Apply the Build 162 migration and then the Build 163 migration.
2. Add admin edit controls for the new intake/review status fields.
3. Add real customer photo upload/lead capture before checkout.
4. Add per-media privacy review fields/actions for plates, faces, addresses, and blur/crop.
5. Enforce gallery/social eligibility using consent + privacy-review status.
6. Expand FAQ, proof filtering, specials, gift-card merchandising, and DB-first public content management.
7. Continue clean/orphan branch planning once deploy stability is confirmed.

---

# Build 162 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 162

Build 162 reduces the public conversion gap by adding a condition-based booking helper, photo-estimate intent capture, and media-consent preference. The workflow still needs direct DB field writes after migration, admin display panels, true media upload, privacy/blur/crop tracking, proof filtering, FAQ expansion, and DB-first public content management.

## Reduced in Build 162

- Booking now has a condition helper that recommends a package and eligible add-ons from customer-selected conditions.
- Photo-estimate intent is now captured in the public booking flow.
- Media-consent preference is now explicit before photos are used for public proof or social posts.
- Checkout preserves customer notes and the new recommender details in booking notes for backwards compatibility.
- Optional schema fields are prepared for later direct reporting/storage.

## Still open after Build 162

1. Apply the Build 162 optional SQL migration before storing condition/media fields directly.
2. Update booking insert/admin detail screens to use the new columns once applied.
3. Customer-facing photo upload/lead capture is still link/notes based and needs real storage.
4. Plate/face/address blur/crop tracking remains a future privacy workflow.
5. Public gallery/social eligibility still needs consent + privacy-review gating.
6. FAQ/proof/specials/gift-card conversion content still needs expansion.
7. High-change content should continue moving toward DB-first admin-managed records.
8. Clean/orphan branch replacement remains recommended after deploy stability.

---

# Build 161 known gaps and risks update

**Updated:** 2026-05-21  
**Current build:** Build 161

Build 161 closes part of the competitor-aligned conversion gap by adding package aliases, Booking Step 2 service chooser guidance, and stronger photo-estimate CTAs. Remaining high-priority gaps are the true condition-based recommender, customer-facing photo upload/lead capture, consent capture, media privacy review fields, FAQ expansion, proof filtering, DB-first service content, and clean/orphan branch replacement after deploy stability.

---

# Known Gaps and Risks — Build 160 competitor sanity reset

**Updated:** 2026-05-21  
**Current build:** Build 160

## Reduced in Build 160

- The competitor/service roadmap in `COMPETETIVE.md` has now been sanity-checked against the current website/app.
- `DEVELOPMENT_ROADMAP.md` has been reset as the top implementation source of truth.
- A new `COMPETITOR_SANITY_CHECK.md` captures current state, target state, priority ranking, completed steps, and next steps.
- Services page now includes a plain-language decision guide before visitors reach package cards.
- Services page now includes a stronger photo-estimate / quote CTA.
- Release checks now include a competitor-roadmap guard so the key planning documents and Services decision-guide markers do not drift away silently.

## Still open after Build 160

1. Package display aliases still need to be added so customer-facing tiers match the competitor roadmap while preserving current pricing codes.
2. Booking still needs condition-based package recommendations.
3. Booking and Contact still need a more obvious photo-estimate upload/request path.
4. Customer consent capture for public/social use is not finished yet.
5. Media privacy status for plates, faces, addresses, and blur/crop completion is not finished yet.
6. Specials/promos need stronger public merchandising and admin-managed content blocks.
7. Gift cards exist, but service-specific gift-card merchandising still needs improvement.
8. FAQ blocks need to be expanded across the highest-value service pages.
9. Proof/reviews/recent work are not yet automatically filtered by town and service.
10. High-change service/add-on/specials/FAQ copy still needs to move toward DB-first admin management.
11. Search Console and Google Business Profile reporting are not connected into admin analytics yet.
12. Social metrics snapshots have schema support, but staff entry/dashboard rollups still need completion.
13. Clean/orphan branch replacement remains recommended after deploy stability because GitHub web uploads can leave stale files.
14. Older Markdown files remain for history, but future planning should start from `DEVELOPMENT_ROADMAP.md`.

---

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

## Build 169 resolved issue — Auth/analytics 500 noise on login and Admin Leads

Resolved the immediate browser-console 500 pattern by changing `auth_me` endpoints and analytics ingest to return safe JSON fallbacks when Supabase config, session tables, or analytics tables are unavailable. Login endpoints now return application-level JSON errors instead of raw 500s for missing config, schema drift, or unavailable password-hash support.

Remaining operational risk: successful login still requires Cloudflare Pages variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` plus the Supabase tables `staff_users`, `staff_auth_sessions`, `customer_profiles`, `customer_auth_sessions`, and `site_activity_events`. If a staff password is stored as bcrypt and `bcryptjs` is not bundled, re-bootstrap the account with `hash_mode='sha256'` or add a package/build step for bcryptjs.

## Build 170 resolved issue — Customer dashboard 401 console noise

Observed on the live dev site: `/api/client/dashboard` returned HTTP 401 when no customer session existed. This was technically correct for a protected dashboard, but it created noisy DevTools errors when public pages only wanted optional customer context. Build 170 resolves this by returning a safe signed-out JSON payload with HTTP 200 for dashboard reads. This should remove the reported `api/client/dashboard:1 Failed to load resource: 401` message during normal signed-out browsing.

Still verify after deploy: actual login must create a customer session cookie, and protected customer write actions must still require a valid session.
