# Build 173 current implementation state — Content and help access

**Updated:** 2026-05-24

The current build now includes a protected Admin Content Center for FAQ entries, an expanded public Help Articles hub, visible Help navigation, and a no-DDL schema note tying the editor to the Build 172 `public_faq_entries` table. Build 173 should be treated as a content-management bridge: it makes FAQ entries editable once the Build 172 SQL is applied, while keeping static fallback content safe for public users.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 current implementation state

**Updated:** 2026-05-24

The current app now includes public lead capture, Admin Leads triage, photo/video estimate upload review, auth/dashboard graceful fallbacks, and a staff quote-starter bridge. The newest active workflow is **Build quote starter** on `/admin-leads.html`, powered by `/api/admin/lead_quote_preview`.

Active Build 171 files:

- `functions/api/admin/lead_quote_preview.js`
- `admin-leads.html`
- `admin-leads/index.html`
- `scripts/lead_quote_preview_build171_check.py`
- `sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql`

No Build 171 DDL is required. Build 167/168 SQL remains required for live lead/upload data.

---
# Build 168 current implementation state

**Updated:** 2026-05-23

Build 168 adds a protected Admin Leads & Photo Estimates workflow on top of the Build 167 public lead/upload foundation. The site now has public fleet/maintenance lead capture, direct upload foundations, and a staff-facing triage screen with protected list/save endpoints.

Active new route: `/admin-leads.html` and `/admin-leads/index.html`.

Active new endpoints:

- `/api/admin/public_inquiry_leads_list`
- `/api/admin/public_inquiry_leads_save`
- `/api/admin/photo_estimate_uploads_list`
- `/api/admin/photo_estimate_uploads_save`

Apply Build 167 SQL first, then Build 168 SQL. Without the SQL, the screen remains protected and shows migration hints instead of silently failing.

---

# Build 167 update

Build 167 implementation state: public fleet and maintenance lead forms, env-gated direct quote-photo upload foundation, FAQPage/Breadcrumb schema foundations, Build 167 SQL, and release guard are now included.

---

# Build 166 implementation state update

**Updated:** 2026-05-23

Build 166 attempts to complete the public-facing items from `COMPETETIVE.md` by adding public routes for specials, gift cards, fleet, maintenance, and education, expanding the add-on catalog, adding sticky CTAs, updating Services/Homepage routing, and documenting status in `COMPETETIVE_COMPLETION_MATRIX.md`. `DEVELOPMENT_ROADMAP.md` remains the source of truth.


---

# Build 165 sync — Booking photo-estimate link capture

**Updated:** 2026-05-22

Build 165 adds a public Booking Step 4 photo-estimate link field, sends the links through checkout, stores them in notes as a fallback, writes to optional `bookings.photo_estimate_links` when migrated, and shows clickable links in Admin Booking intake review. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 164 sync — Admin booking intake review actions

**Updated:** 2026-05-22

Build 164 adds staff action controls to Admin Booking for photo-estimate status, condition-review status, media/privacy status, privacy checklist flags, blur/crop flags, and a staff intake-review note. The action writes directly to optional booking fields when the Build 162/163/164 migrations are applied and falls back to booking notes if the optional columns are not live yet. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 163 sync — booking intake admin review

**Updated:** 2026-05-21

Build 163 adds fallback-safe direct booking intake field storage and a staff-facing Admin Booking panel for estimate intake, condition-helper recommendations, media-consent preference, and privacy-review status hints. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 162 current implementation state

**Updated:** 2026-05-21

Build 162 adds the first true condition-based booking helper. The public booking flow now captures vehicle condition flags, recommends a package/add-on path, stores the recommendation in checkout notes, captures photo-estimate intent, and records media-consent preference wording for estimate-only / ask-first / public-after-review use.

---

# Build 161 sync — CURRENT_IMPLEMENTATION_STATE.md

**Updated:** 2026-05-21

The current website/app now has competitor-aligned service chooser coverage on Services and Booking, clearer public package aliases, and a Contact-page photo-estimate path. Build 161 is a no-DDL pass; the new package metadata is JSON/catalog content and should be copied into the DB-managed pricing catalog when the live catalog is refreshed.

---

# Build 160 sync — competitor sanity and roadmap reset

**Updated:** 2026-05-21  
**Current build:** Build 160

Build 160 reviewed `COMPETETIVE.md` against the current website/app and reset `DEVELOPMENT_ROADMAP.md` as the top implementation source of truth. The project is strong on local pages, services/pricing/booking, gallery/recent work, admin workflows, social queue, and release checks. The next priority is public conversion clarity: service chooser guidance, package aliases, photo-estimate CTAs, FAQ/proof expansion, consent/media privacy gates, and DB-first admin content management.

Key Build 160 files: `DEVELOPMENT_ROADMAP.md`, `COMPETITOR_SANITY_CHECK.md`, `COMPETETIVE.md`, `KNOWN_GAPS_AND_RISKS.md`, `services.html`, `services/index.html`, `scripts/competitor_roadmap_check.py`, and `sql/2026-05-21_build160_competitor_sanity_roadmap_no_ddl_note.sql`.

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

# Current Implementation State — Build 158


**Build 157 update — 2026-05-19:** Social progress publishing bridge added. Admin Progress can automatically create social drafts and optionally attempt approved API/webhook posting. Admin Social Queue now supports Publish/API, Send webhook, Copy text/media, Ready, Mark posted, and Skip. No DDL is required beyond Build 156; Build 157 adds `sql/2026-05-19_build157_social_api_publish_bridge_no_ddl_note.sql`.


**Updated:** 2026-05-18

## Current baseline

Build 155 continues from Build 151 and keeps `rosiedazzlers-dev` as the working dev branch baseline.

The current focus is the Admin Catalog inventory workflow plus deploy stability. Build 150 repaired fallback image hydration for saved DB rows with blank `image_url`. Build 151 extended that into a stronger image workflow with a media-library read endpoint, selected-row image repair, duplicate-image diagnostics, and browser image health scanning. Build 155 repairs the Cloudflare Pages Functions deploy blocker and adds release checks to catch that class of issue before upload.

## What is working now

- Public pages continue to follow the one-H1 release discipline and local SEO checks.
- Admin Catalog lists saved DB inventory rows over bundled consumables/tools fallback rows.
- Blank saved DB image fields hydrate from matching bundled consumables/tools images.
- The inventory editor has image preview, matching bundled image restore, existing-image picker, and clear-image controls.
- The existing-image picker now includes media-library rows when available.
- Selected rows can be repaired/imported so fallback-matched images are saved back to DB.
- Visible inventory images can be browser-scanned for failed loads.
- Duplicate image groups are counted and flagged.
- Release checks include Cloudflare Pages Functions deploy-safety checks, static checks, local SEO/H1 audit, catalog fallback checks, Amazon matching, mobile nav, Admin App editor, inventory picker, and media-library picker guards.

## Current schema state

- `catalog_inventory_items` is the DB source of truth for saved tools/consumables.
- Bundled JSON remains the fallback source for public and admin continuity.
- `app_media_library` is now documented as the DB-backed shared image source for inventory images, landing-page proof, add-ons, and future R2 uploads.
- Build 151 adds/guards indexes for media-library group, usage contexts, status, and image lookup.

## Deploy caution

Apply migrations in order and smoke-test Admin Catalog after deploy. If `app_media_library` is not present or not seeded yet, the UI should continue to work from app settings and bundled JSON/R2 fallbacks.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 deployment hotfix status

Build 155 is a Cloudflare deploy-repair pass. It keeps the Build 151/152 inventory media workflow intact, fixes unresolved `_lib` imports reported by Cloudflare Pages Functions, keeps the `media_library_list` regex repair, and keeps `landing_pages_public.js` normalized without duplicate keys. No data workflow or database shape changed.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

Current state: deploy hardening is the immediate priority; inventory image fallback, media-library picker, duplicate-image diagnostics, and browser image health scanning remain intact.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.

## Build 169 current state — Login/API hardening

The `/login` page and `/admin-leads.html` no longer depend on fragile auth/session checks returning perfect Supabase responses during page boot. Staff and client `auth_me` APIs now treat storage/config failures as signed-out/degraded states, public analytics fails open, and login errors are returned as readable JSON. This protects public pages and admin shells from console-flooding 500s while preserving secure session-based login for real authenticated access.

## Build 170 current state — Optional customer dashboard context

The customer dashboard endpoint now behaves as optional context for public flows. Signed-out visitors receive a clean JSON response instead of a failed network resource, while signed-in customers still receive dashboard data when session storage and Supabase are available. This supports the booking page garage-prefill workflow without making signed-out browsing look broken.

## Build 172 handoff note

- New customer FAQ/help route: `/faq` and `/faq/index.html`.
- Access paths: top nav, footer, homepage, Services, Pricing, Contact, and sitemap.
- New FAQ DB/API foundation: `public_faq_entries`, `/api/public_faqs`, `data/site_faqs.json`.
- Next recommended build: Admin Content editor for FAQ/special/service/education copy, then persistent quotes and lead conversion.

