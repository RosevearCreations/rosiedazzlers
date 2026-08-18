# CURRENT LIVING AUTHORITY 1 OF 2 — Build 260

**Updated:** 2026-08-18
**Build:** 260
**Read this file first in a new chat or by another AI.** The only other living planning authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` is the specialist acceptance/deployment runbook. All older Build sections retained below are historical evidence even when their original headings say “CURRENT”.

## Build 260 current state — stabilization, current acceptance and operator clarity

Build 260 removes several sources of operational confusion while preserving the Build 254 authored-image rule and Build 257 no-R2-scan-on-normal-load rule.

- **Photo Studio R2 sync:** `/api/admin/photo_library_sync` is prefix-bounded and database writes are batched. The browser synchronizes each approved R2 folder as cursor-paged requests, with at most 100 approved objects per Worker invocation, instead of making one large all-library request. This addresses the observed `Too many subrequests by single Worker invocation` failure.
- **Photo assignment behavior:** one managed photo may serve multiple independent placement targets. Resetting one target removes only that explicit assignment and restores that location's authored/default image; other placements and the media record remain intact.
- **Photo Studio diagnostics:** `/admin-media-health` is now database-first and aligned with `app_media_library` + `app_media_assignments`. Ordinary load performs no R2 scan and no public-image fan-out. The optional delivery test probes at most 12 exact managed URLs.
- **Startup Guide:** current catalog identity is Build 260. Historical Build 237–247 migration/deploy mechanics remain stored for audit but are retired from today's blocker list. The Evidence tab shows only evidence referenced by the current catalog and calls it **verification**, not blanket approval.
- **UI/cache health:** Startup script, cache checker, UI scanner, route matrix and service-worker cache all identify Build 260. Current fallback files are `data/build260_go_live_blockers.json` and `data/build260_ui_health_routes.json`.
- **DAIP start flow:** `/admin-creative-projects` is the normal new-project entry. `/admin-daip-media` is private raw-media intake. `/admin-daip-intake-dry-run` is fictional metadata validation only. `/admin-daip-gate-c` records technical/governance/rollback evidence and does not itself enable upload, processing or public publishing.
- **Current business features retained:** Build 259 editable public-media targets, add-on detail pages, vehicle-size correction workflow and editable Quote Pipeline remain in source.
- **Documentation:** two living planning authorities only. Other Markdown is specialist/historical and carries a Build 260 status banner; retained historical sections remain because release/audit references still depend on them.

## Database/deployment actions

1. If not already applied, run `sql/2026-08-13_build259_vehicle_size_review.sql` in staging.
2. Run `sql/2026-08-18_build260_startup_catalog_health_sync.sql` in staging. It deactivates obsolete Startup process rows without deleting historical evidence, seeds current Build 260 evidence/process rows, and makes the Build 260 next-20 roadmap cycle current.
3. Deploy Pages + Functions together.
4. Hard-refresh `/admin-startup-guide.html` and verify Build 260 cache/script/service-worker parity.
5. Open Photo Studio normally, then run one explicit approved-R2 sync. Verify all folder passes complete without subrequest-limit/1102 errors.
6. Open Media Health and confirm database-first diagnostics load; run the optional 12-URL delivery sample only when needed.
7. Complete current Startup evidence using harmless/staging records before unrestricted production promotion.

## Current important boundaries

- Do not silently replace authored package/product/service imagery. Explicit Photo Studio assignment is the owner-managed override; automatic matching remains fallback-only.
- Do not expose `DAIP_MEDIA_BUCKET`, raw Creative Project object keys, signed URLs or private customer media through public manifests or Photo Studio.
- Do not treat a saved Gate C review as public-publishing authorization.
- Do not make historical migration rows current blockers simply because their evidence still exists in the database.
- Continue one public H1 per exposed page, concise descriptive titles, accurate local wording, responsive/mobile CSS and contextual alt text.

## Immediate next engineering/acceptance priorities

The active 20-item queue is Build 260 in `MASTER_VALUE_ROADMAP.md` and the shared `app_roadmap_execution_items` cycle after the Build 260 SQL is applied. Highest-value unfinished engineering remains the private DAIP processing consumer/retry/dead-letter/derivative path; highest-value acceptance remains booking/payment/refund/notification, vehicle-size review, inventory posting/reversal, Photo Studio sync, Media Health, quote workflow, real-device CSS/accessibility, SEO/Business Profile evidence, restore/rollback, then controlled soft launch.

---

## Historical implementation record retained below

Everything below this boundary is retained for release guards, audit context and specialist detail. It does **not** override the Build 260 section above.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 259

> **Build 259 (2026-08-13):** Public presentation imagery is now comprehensively targetable from the existing Photo Studio without reassigning current photos; add-on cards are customer-clean and link to fully owner-editable service pages; Pricing/Services/Maintenance/Fleet CSS is repaired; Maintenance content is editable; uncertain vehicle sizes enter a staff review workflow with a secure customer confirm/cancel link when price/size changes; and Quote Pipeline rows are now selectable/editable. Apply `sql/2026-08-13_build259_vehicle_size_review.sql` before using the new vehicle-size review controls. Build 254 authored-image preservation and Build 257 no-R2-scan-on-normal-load rules remain mandatory. See `BUILD259_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 258

> **Build 258 (2026-08-13):** Public photo assignments now propagate consistently across Pricing town/high-intent cards, Services hub/special/town cards, FAQ access cards, Gift Card visuals, review-proof slots, managed landing pages, and the expanded mixed Gallery. Explicit Sync refreshes same-key R2 replacements by ETag and public URLs are versioned so updated files can replace stale cached images. Photo Studio adds safe current-unassigned deletion. Build 257's database-first/no-R2-scan-on-normal-load boundary and Build 254 authored-image preservation remain mandatory. No existing assignment is changed by this source update and no new SQL migration is required. See `BUILD258_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 257

> **Build 257 hotfix (2026-08-13):** Cloudflare Error 1102 mitigation for the growing public photo library. Ordinary Photo Studio loads and public website image-manifest requests are now database-first and do not scan R2. R2 enumeration occurs only through the explicit Photo Studio Sync action, with bounded prefix scans, compact responses, and batched database inserts. No existing image assignment was changed and no SQL migration is required. See `BUILD257_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 256

> **Build 256 (2026-08-12):** Photo Studio now shows exactly where each assigned photo is used, checks occupied target options in the assignment dropdown, distinguishes slots owned by the selected photo versus another image, and supports three explicit Before/After pairs per managed landing page. A pair renders publicly only after both Before and After are deliberately assigned. Build 254 image-preservation rules remain authoritative. No new SQL migration is required. See `BUILD256_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 255

> **Build 255 editor repair (2026-08-12):** Photo Studio thumbnails now open an immediate click-to-edit drawer with a grouped “Where should this image be used?” selector. Existing photos and assignments are not changed by this build; a placement changes only after an explicit target choice, **Use this image here**, and confirmation. R2-only photos may be registered as managed metadata when needed without assigning them. No new SQL migration is required. See `BUILD255_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 254

> **Build 254 hotfix (2026-08-12):** Existing configured product/package/add-on/landing imagery is protected again. Photo Studio explicit assignments are deliberate overrides; automatic R2 filename matching is fallback-only. Photo Studio selection/filter rendering was also hardened to reduce forced-reflow warnings. No new SQL migration is required. See `BUILD254_SUMMARY.md`.

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 253

**Updated:** 2026-08-12
**Build:** 253
**Use this file first in a new chat or by another AI.** The only other living planning authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` remains the specialist deployment/acceptance runbook.

## Build 253 current state — application-wide Photo Management Studio

Build 253 replaces filename-only website image maintenance with a reusable admin photo system while preserving automatic filename matching as the fallback. Rosie now has one managed public-image inventory built on the existing `app_media_library`, plus explicit placement records in `app_media_assignments` so a specific photo can be assigned to a specific package card, add-on, landing-page hero/gallery slot, home-page service/location card, or approved admin visual without editing source code.

### Implemented in source

- New protected `/admin-photo-studio.html` and clean `/admin-photo-studio/` route.
- Approved public R2 folders can be synchronized into the existing media library: `packages/`, `landing_pages/`, legacy `landing-pages/`, `CarPhotos/`, `addons/`, `brand/`, `gallery/`, and `products/`.
- Photo metadata editor: display name, filename/folder, alt text, SEO/title text, caption, tags, usage contexts, recommended size, focal point, decorative state, attribution, and license/consent notes.
- Safe R2 rename/move uses copy-then-database-update-then-delete so existing assignments follow the media record instead of being recreated.
- Explicit target assignments override filename matching; automatic matching remains the non-destructive fallback.
- Known assignment registry lives in `data/build253_photo_targets.json`; free-form target keys remain available for future components.
- Package card targets support default plus small/mid/oversize variants.
- Add-ons, landing-page hero/gallery slots, selected home service/location cards, and Gate C visuals accept explicit assignments.
- New canonical public manifest is `/api/public_website_images`; `/api/public/website_images` remains a compatibility alias after the Build 252 nested-route deployment 404.
- Public manifests contain only sanitized metadata for approved public R2 assets. They never expose `DAIP_MEDIA_BUCKET` or private Creative Project masters.
- Existing Media Health remains useful for technical health checks; Photo Studio becomes the normal human-facing assignment/metadata workflow.
- Service-worker cache is Build 253 and includes the new admin route/target registry.

## Database action required

Apply `sql/2026-08-12_build253_photo_management_studio.sql` in staging before using sync, metadata save, rename/move, or explicit assignments. The migration extends the existing `app_media_library` and creates `app_media_assignments`; it does not create a competing media table.

### Recommended staging order

1. Apply any still-outstanding Build 247 and Build 248 migrations first.
2. Apply `sql/2026-08-12_build253_photo_management_studio.sql`.
3. Deploy Pages + Functions together.
4. Hard-refresh `/admin-photo-studio`.
5. Press **Sync approved R2 photos** and confirm `packages/`, `landing_pages/`, `CarPhotos/` and other approved public folders appear.
6. Pick one harmless image, add descriptive alt text, save, refresh, and confirm the metadata persists.
7. Assign that image to one non-critical package or landing target, open the public page, and confirm the exact image/alt/focal point appears.
8. Rename or move one harmless test image inside approved public folders; confirm its assignment remains attached and the old R2 key disappears only after the database update succeeds.
9. Remove the test assignment and confirm automatic matching resumes.
10. Verify `/api/public_website_images` returns JSON while the nested compatibility URL may also continue to work.

## Important operating boundary

Photo Studio manages **public website assets only**. It is not a path around DAIP privacy review. Raw customer media remains in the private DAIP bucket and requires the separate consent/privacy/content-package process before any reviewed derivative can become a public website asset.

## Current next engineering/operating priorities

1. Apply and accept Build 253 in staging using real approved R2 photos.
2. Review all principal package assignments and set deliberate default + vehicle-size imagery where enough photos exist.
3. Review SEO landing-page hero/gallery assignments and remove weak/generic imagery.
4. Fill missing alt text with short contextual descriptions; use decorative=true only for truly decorative images.
5. Add image-dimension extraction/validation to the managed library so oversized or undersized assets can be flagged before publishing.
6. Add optional image-usage reporting showing every page/card currently referencing a photo before archive/delete is allowed.
7. Add image replacement/version history so seasonal refreshes can be rolled back without losing placement metadata.
8. Continue DAIP private-processing acceptance and content-package review separately from the public photo library.
9. Continue public booking/payment/refund/notification acceptance and local Search Console/Business Profile evidence review.
10. Keep one-H1, concise-title, accurate local-area, mobile/CSS, public/private media isolation, and cumulative release checks on every pass.

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 1 OF 2 — Build 252 -->

---

# CURRENT LIVING AUTHORITY 1 OF 2 — Build 252

**Updated:** 2026-08-12
**Build:** 252
**Use this file first in a new chat or by another AI.** The only other living planning authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` is a specialist operational runbook.

## Build 252 current state — approved R2 website imagery is assigned by intent

Build 252 expands the public-image system from the earlier `CarPhotos/` proof library to all three approved website prefixes in `rosie-assets`: `packages/`, `landing_pages/`, and `CarPhotos/`.

### What is implemented

- New read-only `/api/public/website_images` inventories image objects only from `packages/`, `landing_pages/`, and `CarPhotos/` in the configured public R2 asset bucket.
- The endpoint never queries `DAIP_MEDIA_BUCKET` or any private raw-project prefix.
- New `/assets/website-images.js` ranks approved images by descriptive filename, service/package code, page slug, service name, and vehicle-size hints.
- Principal service cards prefer matching `packages/` imagery, then approved real-car proof, before an intentional placeholder.
- Add-on cards now look for matching `packages/` images before older bundled fallbacks.
- Dedicated service and town landing pages prefer matching `landing_pages/` images for the hero and use additional matches in the visual gallery.
- Home-page special-service and town cards receive matching approved R2 imagery when a descriptive filename is available.
- The hand-built Ceramic Coating page participates in the same approved R2 card-image system.
- Dynamic LocalBusiness/Service areaServed output is narrowed for town pages to the actual town/county cluster instead of claiming every Rosie town on every location page.
- Shared R2 card imagery has responsive crop/aspect-ratio CSS for desktop and mobile.

### Runtime matching rules

The application does not require a code deployment for every new approved image. Descriptive filenames are normalized across spaces, underscores, hyphens and common CamelCase names. For packages, include the package/service wording and optionally `small`, `mid`, `large`, `oversize`, `SUV`, `truck`, etc. For landing pages, include the service or location slug/name.

Machine-readable mapping and folder priority are recorded in `data/build252_public_r2_image_mapping.json`.

### Acceptance after deployment

1. Open `/api/public/website_images` and confirm `counts.packages`, `counts.landing_pages`, and `counts.car_photos` reflect the approved R2 uploads.
2. Open `/services` at desktop and phone width and confirm Premium Wash, Basic Detail, Complete Detail, Interior Detail and Exterior Detail use the intended package images for each size.
3. Check several add-ons such as pet hair, odour, headlight, clay, wax/sealant and ceramic-related cards.
4. Open the special-service and town landing pages and confirm descriptive `landing_pages/` files appear as the hero or gallery rather than generic fallbacks.
5. Check the home-page special-service and town cards for the correct matched IRL/service photos.
6. Rename only ambiguous R2 filenames; do not hard-code a wrong image just to eliminate a placeholder.
7. Confirm no private DAIP object key or URL is ever returned by the public manifest.

---

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 1 OF 2 — Build 251 -->

**Updated:** 2026-08-11
**Build:** 251
**Use this file first in a new chat or by another AI.** The only other living planning authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` remains a specialist operational runbook.


## Build 251 current state — readable Gate C + real approved Rosie work

Build 251 repairs `/admin-daip-gate-c` after its page-local card CSS fell back to a white surface inside the shared dark admin theme. The Gate C workspace now uses dark, high-contrast cards, readable muted/status text, consistent form controls, responsive KPI/evidence layouts and corrected label markup.

### Approved public photo use

- Gate C now shows real approved website imagery from `rosie-assets/CarPhotos/` for visual context.
- The page first asks `/api/public/car_photos` for the current approved public manifest and uses those returned URLs when available.
- Known approved CarPhotos keys remain as safe fallbacks so the page still has real Rosie context if the manifest is temporarily unavailable.
- This visual use is strictly separate from private DAIP raw media; no `DAIP_MEDIA_BUCKET` path or private object URL is read or rendered.
- Images have alt text, lazy loading for the strip and failure fallbacks.

### Gate C usability repairs

- Removed the undefined `--surface` dependency that caused white cards with light text.
- Corrected nested/malformed `<label>` markup for Technical owner and Independent reviewer.
- Added visible success/error status treatment, dark safety-note treatment and stronger KPI/audit contrast.
- Added responsive breakpoints for desktop, tablet and narrow-phone layouts.
- Bumped the service-worker cache to Build 251 so the repaired page is not masked by a stale cached copy after deployment.

### Required acceptance after deployment

1. Hard-refresh `/admin-daip-gate-c` on desktop and phone width.
2. Confirm every card, KPI, form field, note and audit entry is readable without light-on-light or dark-on-dark text.
3. Confirm `/api/public/car_photos` returns approved `CarPhotos/` entries; Gate C should replace its fallback photo set with those current images automatically.
4. Confirm the public photos are context only and no private DAIP media/object paths are displayed.
5. Save a harmless Draft review and verify status feedback remains readable.

---

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 1 OF 2 — Build 250 -->
# Historical Build 250 handoff snapshot

## Build 250 current state — simpler service choice + approved R2 website photos

Build 250 concentrates the public service journey around three plain steps: choose vehicle size, choose one main package, then check availability/book. The principal package cards now sit above the broader service hub; the two duplicate price/details chart controls were removed from Services because those comparisons belong on Pricing. Vehicle size is deliberately larger and more prominent. The goal-based chooser was rebuilt with consistent responsive cards.

### Public R2 photo integration

- Added read-only `/api/public/car_photos` backed by the existing public R2 assets binding aliases. It lists only approved public image objects under `CarPhotos/`; private DAIP media is never queried.
- Principal service cards try service-matched `CarPhotos/` assets first when filenames contain useful service terms, then retain the historical package artwork as fallback.
- If no service-specific match exists, a stable approved Rosie `CarPhotos/` image may be used after the package asset fails; the final fallback is an intentional service-photo placeholder rather than an unrelated reviews image.
- The endpoint is cached briefly and caps the public manifest to keep request/memory cost bounded.

### Clarity / UX changes

- Services: large Step 1 vehicle-size picker, Step 2 principal service cards, optional goal-based help, Step 3 booking/availability, then the Full Service Hub.
- Removed `Open price chart` and `Open details chart` from Services; Pricing remains the comparison destination.
- Rebuilt `Which service should we choose?` as five consistent goal cards tied directly to the five principal packages.
- Complete Detail is visually marked as the broadest starting choice without hiding cheaper/simpler packages.
- Home secondary CTA now says `Not sure? Compare services`.
- Booking top controls are reduced so the wizard remains the main path; full price comparison remains on Pricing.
- Build 250 CSS includes responsive decision-card, size-picker, package-card and CTA rules for desktop/tablet/phone widths.

### SEO/business direction retained

- One H1 per public page remains mandatory.
- Service-page titles/descriptions remain descriptive rather than keyword-stuffed.
- Local pages stay limited to real service areas; no thin location pages were added.
- Approved local Rosie photos are preferred because authentic proof supports users and local-business credibility better than generic filler imagery.

### Required acceptance after deployment

1. Confirm the Pages project public R2 binding points to `rosie-assets` using one supported alias (`ROSIE_PUBLIC_ASSETS_BUCKET`, `PUBLIC_ASSETS_BUCKET`, `R2_PUBLIC_ASSETS_BUCKET`, or `ASSETS_BUCKET`).
2. Open `/api/public/car_photos` and confirm the new `CarPhotos/` filenames appear.
3. Open `/services` on desktop and phone; verify Vehicle size is prominent and selecting a size updates package prices and booking links.
4. Confirm Premium Wash, Basic Detail, Complete Detail, Interior Detail and Exterior Detail show the intended R2 photos when their filenames match the service; rename ambiguous R2 filenames with clear service terms if needed.
5. Verify the Full Service Hub is below the five principal package cards and the old price/details chart buttons are gone.
6. Continue Build 249 inventory cleanup and outstanding Build 247/248 DAIP staging acceptance.

---

<!-- Historical release guard: # CURRENT LIVING AUTHORITY 1 OF 2 — Build 249 -->
# Historical Build 249 handoff snapshot


**Updated:** 2026-08-10
**Build:** 249
**Use this file first in a new chat or by another AI.** The only other living authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` remains a detailed operational runbook, not a third planning authority.

## Build 249 current state — inventory recovery through reviewed supplier refresh

Build 249 turns the Amazon supplier-link helper into an existing-row recovery workflow. Staff can select a bad supply/tool row, open the exact inventory key, paste an accurate Amazon link, choose which supplier fields may be refreshed, inspect staged before/after changes, and save back to the same row while preserving stock, reorder settings, receipts, gallery, station, service tags, ratings, visibility, active state and operational history.

### Completed in source

- Replaced the misleading URL-slug-only `Fill from Amazon link` behaviour with the real `/api/admin/catalog_supplier_link_preview` review workflow.
- Existing inventory edits now lock `item_key`; supplier refresh cannot silently create a second key for the selected row.
- Added explicit overwrite controls for identity, classification, description, CAD cost and featured image.
- Added staged before/after supplier diffs and a clear repair/new-item mode indicator.
- Added description editing plus visible Amazon ASIN/title/brand/category source metadata; those fields now persist through the inventory save payload.
- Amazon.com/non-CAD observed prices continue to preserve the existing CAD unit cost rather than overwrite it.
- Added `Amazon repair candidates` and `Missing Amazon / supplier link` Workbench filters plus direct `Amazon refresh` actions on desktop and mobile.
- Added query-string handoff (`/admin-catalog.html?item=<item_key>`) so Workbench repair links load the intended existing item automatically.
- Replaced misleading generic-addon image fallback in the inventory editor with the intentional inventory-tools visual placeholder.
- Retained Build 248 DAIP story-review/content-package gates, Build 247 `content/security` workstream repair, catalog publish readiness, one-H1 SEO rules and local structured-data precision.
- Documentation remains governed by exactly two living authorities: this file and `MASTER_VALUE_ROADMAP.md`.

### Required deployment/acceptance work

1. Deploy Build 249 Pages/Functions together; Build 249 itself adds no required database DDL.
2. In staging, open Inventory Workbench → `Amazon repair candidates`, choose one known bad row and select `Amazon refresh`.
3. Paste the correct Amazon link, verify the same item key remains locked, inspect the staged field changes, then save.
4. Confirm quantity, reorder thresholds, receipt, station, service tags, gallery, ratings and inventory history did not change unexpectedly.
5. Repeat with Amazon.ca and an Amazon short/share link; for Amazon.com verify a USD/non-CAD observation never overwrites the CAD cost automatically.
6. Continue outstanding Build 247/248 staging migration and private DAIP/R2 acceptance where not already complete.
7. Continue real-device booking/payment/refund/email, Search Console/Business Profile and controlled soft-launch acceptance.

---

# Historical Build 248 handoff snapshot

**Updated:** 2026-08-09
**Build:** 248
**Use this file first in a new chat or by another AI.** The only other living authority is `MASTER_VALUE_ROADMAP.md`. `STARTUP_GO_LIVE_BLOCKERS.md` remains a detailed operational runbook, not a third planning authority.

## Build 248 current state

Build 248 repairs Amazon supplier-link review imports and advances DAIP from private upload-only intake into reviewed private story evidence, operator retry/dead-letter controls, Creative Project content-package readiness, and an explicit human content-package review gate. Raw DAIP media remains private and no new workflow automatically publishes customer media.

### Completed in source

- Repaired `/api/admin/catalog_supplier_link_preview` `TypeError: patterns is not iterable` and hardened Amazon.ca/Amazon.com/a.co/amzn.to parsing, bounded response reads, currency handling, duplicate review, and error reporting.
- Added `sql/2026-08-09_build248_supplier_daip_story_review.sql`.
- Added private media `selected/excluded/not reviewed` story-evidence state, story ordering and review notes.
- Added processing-job retry, block, cancel and dead-letter operator controls with retry limits.
- Added Creative Project readiness reporting using approved sessions plus selected private media metadata.
- Content-plan drafts now carry a private evidence manifest containing asset IDs/review metadata only; raw object URLs are excluded.
- Added content-package gate: `not_ready`, `ready_for_review`, `in_review`, `approved`, `changes_requested`. Approval does not publish.
- Corrected canonical roadmap workstreams to allow `content` and `security`, and synchronized Build 248 schema changes into `SUPABASE_SCHEMA.sql`.
- Narrowed local landing-page structured-data `areaServed` to each actual town/county and retained the one-H1/title/meta guardrails.
- Sanity review confirms public pages already have a visual or intentional visual placeholder; no new thin location pages were added.
- Documentation is now governed by two living authorities: this file for current state/handoff and `MASTER_VALUE_ROADMAP.md` for current direction.

### Required deployment/acceptance work

1. If Build 247 is not applied yet, apply `sql/2026-08-07_build247_daip_private_media_ingestion.sql` first.
2. Apply `sql/2026-08-09_build248_supplier_daip_story_review.sql` in staging.
3. Test one Amazon.ca link, one Amazon.com link, and one Amazon short/share link; confirm imports stay review-only and non-CAD observed prices are not silently treated as CAD.
4. Create/bind the private Cloudflare R2 bucket as `DAIP_MEDIA_BUCKET`, then complete photo and >300 MB interrupted/resumed video acceptance.
5. Review/select private story evidence and exercise retry/dead-letter controls on harmless test jobs.
6. The actual FFmpeg-class processing/render consumer is still outstanding; Build 248 supplies the durable queue/review contract but does not pretend Pages Functions can render final long/short videos.
7. Continue real-device, booking/payment/refund/email, Search Console, Business Profile and controlled soft-launch acceptance.

---

# AI Project Handoff — Build 246 Current State

## Read first

Build 246 adds protected catalog publishing readiness. The latest functional migration is `sql/2026-08-07_build246_catalog_publish_readiness.sql`. Source implementation is complete; staging/production acceptance is not.

## Current authorities

1. `AI_PROJECT_HANDOFF.md`
2. `MASTER_VALUE_ROADMAP.md`
3. `STARTUP_GO_LIVE_BLOCKERS.md`

## Immediate next action

Apply the Build 246 migration in staging and complete process 37 before treating public catalog readiness as production-proven.

---

# Rosie Dazzlers — AI Project Handoff (Build 245)

**Updated:** 2026-08-06
**Build 245:** protected UI/SEO route scanner, Startup cache diagnostics and recovery controls, safer service-worker installation/fallbacks, service-specific static landing-page H1/metadata fallbacks, admin noindex corrections, gift-certificate one-H1 repair, and synchronized no-DDL documentation.

## Continue from here

- Deploy and open `/admin-ui-health.html`.
- Confirm `/assets/startup-command-center.js?v=20260807build245` reports Build 245.
- Export the deployed UI/SEO scan JSON and attach the safe result to Startup evidence.
- Build 240 remains the latest functional schema migration; Build 245 requires no DDL.
- Do not remove the standard booking path while Creative Projects and DAIP continue to expand.
- Current authority order: this file → `MASTER_VALUE_ROADMAP.md` → `STARTUP_GO_LIVE_BLOCKERS.md`.

---

# Rosie Dazzlers — AI Project Handoff (Build 241)

**Updated:** 2026-08-05
**Build 241 hotfix:** repairs the unified Startup Command Center summary crash caused by a JavaScript temporal-dead-zone name collision, adds all-settled refresh fallback handling, and advances browser/service-worker cache tokens. No database change is required.

## Build 241 continuation pointer

- Primary repaired route: `/admin-startup-guide.html`.
- Corrected asset: `/assets/startup-command-center.js?v=20260805build241`.
- No-DDL record: `sql/2026-08-05_build241_startup_command_center_initialization_hotfix_no_ddl.sql`.
- The Build 240 inventory posting/reversal migration remains the latest functional database migration.
- Do not reintroduce a local variable named `evidenceRows` inside `updateSummary`; the row factory is now `getEvidenceRows()`.
- `refreshAll()` uses `Promise.allSettled()` so one failed panel loads a labelled fallback rather than producing an uncaught promise rejection.

---

# Rosie Dazzlers — AI Project Handoff (Build 240)

**Updated:** 2026-08-05
**Build 240 operational release:** preview-first transactional inventory posting and authorized compensating reversal for bookings and reviewed Creative Project reservations; database row locking, shortage validation, idempotency, posting history, read-only fallback, mobile/desktop admin workflow, Startup catalog expansion, SEO/CSS/schema/document synchronization.

## Build 240 continuation pointer

- Operator route: `/admin-inventory-posting.html`.
- Migration: `sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql`.
- Apply after Builds 235, 237, 238 and 239, staging first.
- The original Inventory Workflow and Inventory Workbench remain supported.
- Booking and project stock deductions now use one database transaction; never restore the removed browser PATCH loop.
- Reversal is compensating history, not deletion. Booking reversals require accounting review.
- Current go-live authorities remain this file, `MASTER_VALUE_ROADMAP.md`, and `STARTUP_GO_LIVE_BLOCKERS.md`.

---

# Rosie Dazzlers — AI Project Handoff (Build 238)

**Updated:** 2026-07-30
**Build 238 operational release:** transactional inventory changes, reviewed duplicate merge, stronger API/UI fallbacks, current-cycle startup guidance, SEO metadata tightening, CSS/route regression protection and synchronized schema/documentation.

## Read order and authority

1. `AI_PROJECT_HANDOFF.md` — current architecture, deployment state and engineering handoff.
2. `MASTER_VALUE_ROADMAP.md` — current business/product direction and ordered next work.
3. `STARTUP_GO_LIVE_BLOCKERS.md` — exact go-live blockers, where to find them, detailed instructions and completion evidence.
4. `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` — operational detail and retained gap history; they do not override the first three files.

## Build 238 source changes

- Preserved the existing manual inventory editor, JSON tools, row editor, archive/restore, supplier importer and seven-image gallery.
- Replaced browser-sequential bulk inventory writes with a **preview-first, all-or-nothing database RPC**. The complete batch is validated before any write; an error rolls back the batch. Header and row audit tables preserve actor, reason, before/after values and changed fields.
- Added a **reviewed two-row duplicate merge**. It previews reference counts, proposed quantity and gallery results; requires an explicit reason and confirmation; transfers known references; records compensating inventory movements; keeps a merge audit; and archives the duplicate rather than hard deleting it.
- Added same-type and compatible-unit merge protections to reduce accidental tool/supply or unit mismatches.
- Added a cached **read-only Inventory Workbench fallback**. If the live list API is unavailable, the last successful inventory snapshot can still be searched while all write controls remain blocked.
- Added protected endpoints: `/api/admin/catalog_inventory_bulk_update`, `/api/admin/catalog_inventory_merge` and read-only `/api/admin/catalog_inventory_audit_list`.
- Added a readable **Transaction & merge history** dialog with recent batch/merge evidence and CSV export, so operators do not need to search Supabase tables for routine review.
- Added migration: `sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql`.
- Updated the Roadmap Execution Centre to Build 238 and added a packaged `data/build238_next_steps.json` fallback.
- Expanded the Startup Guide to 25 ordered items and added detailed migration, merge and rollback acceptance steps.
- Tightened titles/descriptions on 19 public pages while retaining one clear H1, local service wording and distinct customer intent.
- Bumped service-worker and compatibility stylesheet cache identifiers so older CSS does not mask the new release.

## Deployment order

1. Deploy the ZIP to the preview/development branch.
2. Hard-refresh `/admin-roadmap-execution`, `/admin-startup-guide`, `/admin-inventory-manager`, `/admin-blocks` and representative public pages.
3. Apply the Build 237 migration if shared launch evidence/current-cycle columns are not already present.
4. Apply the Build 235 gallery migration if `gallery_image_urls` is not already present.
5. Apply the Build 238 migration in staging.
6. Preview a harmless bulk edit, execute it, verify all selected rows changed and inspect the batch audit.
7. Deliberately preview an invalid mixed batch and confirm no row changes.
8. Preview a known same-type/same-unit duplicate merge, verify reference counts, execute it, and confirm the survivor/archived duplicate/audit/movements.
9. Continue through `STARTUP_GO_LIVE_BLOCKERS.md`; do not treat source completion as production acceptance.

## Current launch position

The application is feature-rich enough for an invite-only soft launch after the critical evidence is complete. Remaining launch risk is predominantly operational proof: booking/calendar consistency, live payment/refund/webhook evidence, notification delivery, Cloudflare production settings, backup/restore, policies/consent, real-device accessibility, Search Console/Business Profile verification, inventory cleanup, approved local media and controlled first-week monitoring.

## Guardrails

- Never guarantee first-page placement; improve relevance, accurate local information, prominence signals and technical quality.
- Keep one H1 per exposed HTML page.
- Do not hard-delete inventory rows with history.
- Do not restore browser-by-browser JSON as the authoritative source for multi-user operational data.
- Do not expose service-role credentials, payment secrets or private customer/media evidence in browser responses or Markdown.
- Continue to preserve old Markdown and migrations until release guards are modernized and an archive manifest is approved.

---

# Build 237 current handoff — 2026-07-28

- Fixes the missing CSS and AdminShell dependency on `/admin-roadmap-execution` and related historical admin pages.
- Adds `/admin-startup-guide.html` plus `STARTUP_GO_LIVE_BLOCKERS.md` as the detailed ordered launch guide.
- Adds DB-first shared launch evidence with browser fallback; apply `sql/2026-07-28_build237_css_startup_evidence_roadmap.sql`.
- Seeds the current next-20 roadmap cycle and adds exact action paths.
- Keeps `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` as the only living direction documents.
- Next operational priority: deploy preview, apply migration, verify Block Calendar, booking, Stripe, email, environment, backup, policies and security before invite-only soft launch.

---

# Build 236 current handoff — calendar and launch stabilization (2026-07-26)

Build 236 restores the broken Block Calendar, the missing shared responsive/admin CSS, the complete admin authorization/menu/shell, editable public chrome, and analytics registry integration, aligns all schedule readers with the retained `blocked_date`/`slot` schema, preserves compatibility aliases, adds selected-date quick actions and schedule-health evidence, expands launch preflight, and refreshes visual-placeholder coverage. No DDL is required. See `docs/BUILD236_CALENDAR_SEO_CSS_STABILIZATION.md` for the completed work and 30 connected next steps.

**First-read rule:** this file and `MASTER_VALUE_ROADMAP.md` are the only living strategy sources. Retained Markdown remains for operational reference and release/audit compatibility. Do not delete historical files until release-guard dependencies are modernized.

---

# Rosie Dazzlers — AI Project Handoff (Build 225)

**Updated:** 2026-07-07
**Living source of truth:** Read this file first, then `MASTER_VALUE_ROADMAP.md`. Historical Markdown is retained for audit/release support, not as competing planning.

## Build 225 central capability: social/analytics Connections Centre and DAIP external-service boundary

Build 225 adds `/admin-integrations.html`, a protected administrator workspace that reports only configuration presence for consent-first website measurement and Social Queue publishing connections. It does **not** show, accept, write, or store a credential in the browser, Supabase, GitHub, or Markdown.

- **Cloudflare only:** add every value at Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers project → Settings → Variables and Secrets → **Secret (encrypted)**. The project may show only Secret; that is correct.
- **Website tags:** `META_PIXEL_ID`, `GA4_MEASUREMENT_ID`, `GOOGLE_ADS_CONVERSION_ID`, `TIKTOK_PIXEL_ID`, `LINKEDIN_PARTNER_ID`, `PINTEREST_TAG_ID`, and `MICROSOFT_UET_TAG_ID` are public tag identifiers only. They are stored as Cloudflare Secrets for operations, then may be returned as public code identifiers only when a visitor opts into optional measurement.
- **Server credentials:** Page access tokens, OAuth credentials, webhook secrets, and every other secret remain Cloudflare-only and never pass through `/api/tracking_config`, the admin page, page source, browser logs, app settings, or Supabase.
- **Consent boundary:** `/assets/marketing-consent.js` does not load any third-party tag until a visitor explicitly chooses optional measurement. It excludes admin, client, detailer, login, booking, progress, payment, invoice, account, and completion routes.
- **DAIP:** Build 225 adds `docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md`. Marketing/social credentials are not DAIP credentials. Gate C remains held: no DAIP storage, upload/download, signed link, worker, processing, AI, customer-media access, public export, or publishing exists.

Primary docs:
- `docs/SOCIAL_ANALYTICS_CONNECTIONS.md` — exact variable names, how to obtain IDs/credentials, Cloudflare entry point, staging/test order, current social-publishing limits, and rollback.
- `docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md` — DAIP separation and preflight evidence.
- `docs/PRODUCTION_TEST_GUIDE.md` — Build 225 staging test sequence.

**Current first provider to test:** GA4 only, on staging, with `MARKETING_TRACKING_ENABLED=true`, `MARKETING_TRACKING_MODE=test`, and an administrator verification in `/admin-integrations.html`. Use a private browser on a non-sensitive public marketing page, opt in, and verify through Google’s diagnostic tools. Do not test on a booking/payment/progress/customer route.

# Rosie Dazzlers — AI Project Handoff (Build 224)

**Updated:** 2026-07-06
**Living source of truth:** Read this file first, then `MASTER_VALUE_ROADMAP.md`. Historical Markdown remains retained for audit and release checks.

## Build 224 central capability: Gate C technical review and customer profile-quality safeguards

Build 224 adds `/admin-daip-gate-c.html`, an admin-only, test-mode Gate C technical-review and rollback acceptance workspace. It can save Draft, Blocked, or `accepted_for_test_only_implementation_review` evidence only after the existing Build 222/223 evidence is current. **Gate C remains Held in every state**; technical/public capabilities remain zero.

- **DAIP hard boundary:** Build 224 creates no storage, upload/download, signed authorization, external service configuration, processor, queue, AI, customer-media route, public destination, Gallery/Social/GBP handoff, export, or publishing capability.
- **Customer quality:** managers see a review-only duplicate warning from matching email/phone/sms values and a safe preference-change history. The app never auto-merges accounts or changes consent by itself.
- **Deployment order:** Apply the two Build 224 migrations in development/staging only, deploy Pages and Functions together, execute the five new Guided Production Test Centre cases, then record only verified outcomes.


# Rosie Dazzlers AI Project Handoff — Build 222

**Updated:** 2026-07-04
**Read first:** This is the primary technical/business handoff for a new AI chat or future build pass.

## Product north star

Rosie Dazzlers is a mobile auto-detailing website and operations application for Oxford County and Norfolk County, Ontario. The app should help a small owner-operated business:

1. get found locally;
2. turn leads into trackable quotes;
3. convert quotes into bookings and deposits;
4. interact with customers during the detail;
5. document work and protect the business with private evidence;
6. invoice, collect payment, request reviews, and bring customers back.

The connected lifecycle is:

`lead / quote → booking → live detail interaction → proof of work → invoice/payment → review/public proof → repeat maintenance`

Avoid creating isolated admin pages unless they clearly advance this lifecycle.





## Build 223 central capability: DAIP private-MVP design blueprint for independent review only

Build 223 creates `/admin-daip-design.html`, a protected, mobile-safe workspace that turns the written DAIP private-MVP proposal into a controlled independent-review record.

- A blueprint can be Draft, Paused, or submitted for independent review only.
- Submission requires a **currently valid** Build 222 written-design-review authorization, named design owner and independent reviewer, a safe design scope, threat model, upload-control outline, private-original/derived separation, cost/stop-rule outline, rollback/acceptance outline, all three hard-stop acknowledgements, and the exact phrase `SUBMIT DESIGN BLUEPRINT`.
- The database stores only safe design evidence and audit notes behind RLS/service-role access. The server rejects submission if the readiness authorization is missing or stale.
- **Hard boundary:** Build 223 creates no bucket, upload/download, signed URL, object key, worker, queue, processing, AI, customer-media route, public export, Gallery/Social/GBP handoff, or automatic publishing. Gate C remains Held.

Primary migration: `sql/2026-07-05_build223_daip_private_mvp_design_blueprint.sql`.

**Deployment order:** apply in development/staging after Builds 218, 219, and 222; deploy Pages and Functions together; run the three Build 223 Guided Production Test Centre cases; then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.


## Build 222 central capability: DAIP Phase 1 readiness review for written private-MVP design only

Build 222 creates `/admin-daip-readiness.html`, a protected test-mode workspace that joins the Build 218 internal-test evidence, Build 219 owner decisions, and Build 220 readiness packet into one explicit decision: whether the owners may begin a **written** private-MVP design review.

- The server only accepts `ready_for_design_review` when Gate A (all 12 DAIP-0 decisions) and Gate B (all three Build 218 internal tests plus safe test control) are Ready.
- The exact phrase `AUTHORIZE DESIGN REVIEW`, consent separation, retention/legal-hold ownership, a budget stop rule, review date, and an accountable owner are required for that record.
- Records are append-only snapshots with safe audit events and stored gate evidence. Reopening a DAIP decision or losing passing test evidence makes an old authorization invalid for current planning.
- The system remains service-role-only behind Cloudflare Functions; browser roles are revoked from the new tables.
- **Hard boundary:** Build 222 does not provision storage, upload/download permissions, signed links, queues, workers, FFmpeg, proxies, thumbnails, AI, customer media, exports, Gallery/Social/GBP handoff, or automatic publishing. Gate C remains held.

Primary migration: `sql/2026-07-04_build222_daip_phase1_readiness_design_review.sql`.

**Deployment order:** apply the Build 222 migration in development/staging after Builds 218 and 219; deploy Pages and Functions together; run the three Build 222 Guided Production Test Centre cases; then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.

## Build 220 central capability: controlled customer access management and DAIP readiness

Build 220 closes the client-account support gap without turning passwords or personal data into staff-editable content.

- `/admin-customers.html` is now the role-aware client workspace: directory, profile editing, booking/vehicle summary, safe audit history, secure access actions, archive-first lifecycle controls, and forgotten-sign-in-email help queue.
- **Detailer / senior detailer:** may update job-relevant operational fields such as safe contact/access and detailer-visible notes.
- **Administrator / booking manager:** may create client profiles, edit protected customer fields, send account-setup/reset/verification email, revoke sessions, and work the forgotten-email queue.
- **Administrator / staff-management role:** may suspend, restore, and archive an account. There is no permanent customer-delete button because linked bookings, payments, tax, consent, and audit records must remain traceable.
- Clients sign in with the email address on record; there is no separate username. `/login` now offers password reset, email verification, and a privacy-neutral forgotten-email support form.
- Staff never see or set a client password. Recovery uses server-issued opaque links. New same-purpose messages retire earlier links, token consumption is single-use/atomic, and a successful password reset revokes old sessions before a new session is created.
- New audit and recovery-intake tables remain RLS-protected and service-role-only.

Primary migration: `sql/2026-07-03_build220_customer_access_management_and_daip_readiness.sql`.

**Customer-auth deployment setting:** set `PUBLIC_SITE_ORIGIN` to the approved HTTPS site origin (as a Cloudflare Secret in this project) before production email-link testing. The code rejects unapproved origins rather than building account links from an arbitrary host.

**DAIP boundary:** Build 220 adds only `docs/digital-asset-intelligence-platform/16_DAIP_Phase_1_Readiness_Packet.md`, an owner meeting/acceptance worksheet. It does not create DAIP storage, upload, signed-link, worker, AI, export, customer-media, gallery/social, or publication capability. Gates C–F remain held.

**Deployment order:** apply the Build 220 migration in development/staging, deploy Pages and Functions together, run the four Build 220 Guided Test Centre cases, then record only verified outcomes in this handoff and `MASTER_VALUE_ROADMAP.md`.

## Build 219 central capability: DAIP governance and promotion gates

Build 219 turns the DAIP-0 decision register into an admin-only, database-backed governance workspace without moving DAIP into media production.

- `/admin-daip-governance.html` records a draft or owner-approved answer for each of the 12 DAIP-0 decisions.
- Approval requires an exact decision-specific phrase, a recorded accountable owner, cost/operational impact, privacy/safety impact, review date, revision number, actor/time, and audit event.
- The workspace reads the three Build 218 DAIP Test Lab results and exposes Gates A–F in plain language.
- Gate A can only become ready when all twelve DAIP-0 rows are approved. Gate B can only become ready when Build 218 Test Lab evidence is passed and the test control remains safe.
- Gates C–F remain hard-held. Build 219 cannot provision storage, accept upload bytes, issue a signed URL, create a background worker, process a file, expose a customer route, hand off to Gallery/Social, or publish anything.
- New tables use RLS, revoke browser-role grants, and are accessed only through Cloudflare Functions using the service role.

Primary migration: `sql/2026-07-02_build219_daip_governance_workspace.sql`.

**Operational rule:** Complete decisions and Test Lab evidence in development/staging first. A DAIP-0 approval is a governance record, not a production switch. Before the next technical phase, read `docs/digital-asset-intelligence-platform/15_DAIP_Governance_Workspace_Process.md` and the promotion gates.

## Build 210 central capability: connected live-job closeout

Build 210 connects the original live-interaction promise to the rest of the business lifecycle instead of leaving updates as isolated timeline entries.

- New live updates and customer replies create customer/staff notification events.
- Customer and staff views expose unread counts using last-view timestamps.
- Detailer media uploads show progress, can be cancelled/retried, and preserve a failed upload session for diagnostics.
- Video uploads have duration/size limits, compression guidance, and retention metadata.
- A booking cannot be marked complete until arrival, during-work, and final media exist, unless an authorized override reason is recorded.
- Issue-stage updates/media can become linked private incident reports with evidence.
- Customer-visible recommendations can include a price and customer approve/decline/discuss controls.
- An approved priced recommendation creates a draft final-balance payment request.
- Staff can generate a completed-job customer summary with proof, products, payment state, care advice, and maintenance recommendations.
- Approved final photos can be queued for Gallery Approval and vehicle history without re-uploading.
- Review requests are blocked when completion, payment, summary, or incident safety conditions are not met.
- `/admin-today.html` provides one owner-friendly prioritized action queue.

Primary Build 210 migration: `sql/2026-06-17_build210_connected_live_workflow.sql`.
Primary structured build record: `data/build210_connected_live_workflow.json`.

## Build 209 central capability: live detail interaction

The original product promise is now explicit throughout the app. During a job, a detailer can post:

- text notes;
- photos;
- short videos;
- before, arrival, during, final, recommendation, and issue-stage updates;
- customer action requests;
- private evidence or discussion.

Every post must use one of three audiences:

1. **Customer now** — immediately customer-visible through the secure progress token.
2. **Admin review first** — private until an administrator approves the customer-safe version.
3. **Staff only** — detailer/administrator only and never returned by the public progress API.

Primary screens:

- `/detailer-jobs.html` — mobile-first live detailer workspace with direct photo/video upload.
- `/admin-progress.html` — staff moderation, approval, hiding, pinning, and customer-safe publishing.
- `/progress.html?token=…` — customer timeline, media, workflow status, comments, and sign-off.
- `/admin.html` — live interaction diagnostics and pending-review warning.

Primary APIs/tables:

- `functions/api/detailer/job_note_post.js`
- `functions/api/admin/progress_post.js`
- `functions/api/admin/progress_media_post.js`
- `functions/api/admin/progress_moderate.js`
- `functions/api/admin/progress_list.js`
- `functions/api/progress/view.js`
- `functions/api/progress/comment_post.js`
- `public.job_updates`
- `public.job_media`
- `public.job_signoffs`

Privacy rules:

- Public progress results include only approved customer-safe notes/media.
- Internal booking-event notes and payloads are filtered from the customer response.
- Private uploaded media may be stored by bucket/path and returned to staff using short-lived signed URLs.
- Review-pending rows remain internal until approval.
- Incident reports remain a separate protected workflow for damage, faulty equipment, or disputes.

Run `sql/2026-06-17_build209_live_detail_interaction.sql` before expecting all enhanced visibility, stage, storage, and review fields to be available.

## Current strong foundations

### Public/customer

- Responsive desktop website and mobile-first booking/progress experiences.
- Service, pricing, add-on, service-area, town, fleet, gift, maintenance, and gallery pages.
- Booking wizard, deposits, customer dashboard, progress token, comments, and sign-off.
- Before/after gallery with image fallback and approval workflow.
- Local service/town copy, structured-data previews, one-H1 release guard, sitemap/robots checks.

### Admin/owner

- Independent dashboard diagnostics so one failing card does not blank the dashboard.
- Booking, lead, quote, payment, accounting, inventory, media, gallery, incident, marketing, SEO, and editable-setting foundations.
- Workflow Command Center connecting quote through repeat maintenance.
- Gallery Approvals, Quote Pipeline, Value-Added Operations, Docs/Sanity, and live interaction diagnostics.
- Friendly editors for routine settings; raw JSON is emergency recovery only.

### Detailer/staff

- Assigned-job mobile workspace.
- Workflow status actions, notes, photos, videos, visibility selection, customer-action requests, incidents, and progress links.
- Proof-of-work and vehicle-history foundations from Build 206.

## Documentation policy

Only two Markdown files are active strategy documents:

1. `AI_PROJECT_HANDOFF.md` — current system state, safety rules, architecture, deployment, and continuation instructions.
2. `MASTER_VALUE_ROADMAP.md` — completed priorities, next 20 steps, SEO/competitive direction, and value sequencing.

Required audit/history files remain in the repository because historical release guards depend on them:

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DATABASE_STRUCTURE_CURRENT.md`
- `SUPABASE_SCHEMA.sql`
- `README.md`
- `DOC_INDEX.md`
- competitor/release-check documents named in `scripts/release_check.py`

Twenty redundant handoff/planning files were moved to `docs/archive/` in Build 209. Do not restart active planning inside archived files.

## SEO/local visibility rules

- Keep exactly one meaningful visible H1 on every public page.
- Keep title, meta description, H1, canonical, and structured data aligned.
- Use real customer language and town/service combinations without creating thin duplicate pages.
- Prioritize Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria where service coverage and proof are legitimate.
- Use descriptive image filenames, alt text, captions, and nearby relevant copy.
- Add owned/customer-approved local proof; placeholders are temporary only.
- Keep Google Business Profile information, hours, services, photos, and review responses current.
- Never claim that a code change guarantees first-page placement. Search visibility also depends on distance, competition, prominence, reviews, crawl/index status, and ongoing proof.

## Competitive direction

Current detailing/field-service platforms emphasize the same direction this app is taking:

- Jobber: scheduling, route optimization, progress tracking, on-my-way messages, job photos, checklists, client portal, quoting, invoices, payments, and automated follow-up.
- Urable: automotive-detailing CRM, mobile workflow, route optimization, automated messaging, line-item projects, and customer portal.
- Mobile Tech RX: damage documentation with photos/notes, scheduling, photo capture, CRM, and reminders.
- OctopusPro: required photos, before/after evidence, findings, approvals, signatures, and proof of work.
- QuoteIQ: route-aware operations, photo documentation, quoting/invoicing, reviews, and recurring/fleet workflows.

Rosie Dazzlers should match the useful workflow outcomes without copying competitor wording or adding enterprise complexity that does not help a one-vehicle-per-day business.

## Current risks and constraints

1. **Migration dependency:** enhanced live interaction safely falls back to legacy columns, but the Build 209 migration is required for full review/storage metadata.
2. **Admin complexity:** many foundations exist; owner “today needs attention” grouping remains more valuable than more siloed pages.
3. **Real media:** visual placeholders improve presentation, but real approved photos/videos create trust and local prominence.
4. **Video cost/limits:** future work should add file-size/duration limits, compression guidance, retention controls, and storage diagnostics.
5. **Browser testing:** static release checks do not replace testing Cloudflare Pages, Supabase, R2, Stripe, PayPal, email, and mobile devices.
6. **Legacy release guards:** old build guards make documentation cleanup slower. Retire guards only after replacing their current coverage.

## Deployment checklist

1. Run outstanding SQL migrations, especially Build 209.
2. Set/verify Cloudflare and Supabase/R2 environment variables.
3. Run `python3 scripts/release_check.py`.
4. Run `python3 scripts/seo_h1_check.py`.
5. Run `python3 scripts/sync_route_copies.py --check`.
6. Deploy and browser-test:
   - `/`
   - `/book`
   - `/gallery`
   - `/detailer-jobs.html`
   - `/admin-progress.html`
   - `/progress.html?token=<real token>`
   - `/admin`
7. Test all three live-update audiences with a real staff session.
8. Confirm a staff-only update never appears in the customer response.
9. Confirm an admin-review update appears only after approval.
10. Confirm photo/video upload, signed preview, customer comment, and sign-off on mobile and desktop.

## Next best direction

Continue with the next 20 steps in `MASTER_VALUE_ROADMAP.md`. The first priorities are live-update notifications, media retention/compression, customer unread indicators, proof-of-work checklist integration, and automatic handoff from completed work to invoice/review/maintenance.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

## Build 211 central capability: production reliability hardening

Build 211 focuses on making the connected live workflow production-ready rather than adding more scattered screens.

Primary additions:

- `/admin-production.html` — one owner/staff screen for notification providers, hosted payment links, upload reliability, retention cleanup, and end-to-end readiness.
- `/api/admin/production_reliability_report` — safe diagnostics that check provider configuration, payment-link gaps, failed notifications, weak-network upload sessions, retention-due media, unresolved incidents, and environment readiness without exposing secrets.
- `/api/admin/notification_provider_test` — configuration-only or safe test-send checks for email/SMS providers.
- `/api/admin/final_balance_checkout_create` — creates Stripe-hosted final-balance checkout sessions when `STRIPE_SECRET_KEY` is configured; manual fallback remains available.
- `/api/admin/storage_retention_sweep` — dry-run first retention review; permanent proof and legal-hold evidence are excluded and no physical object deletion happens.
- `/admin-today.html` now includes production reliability work such as provider setup, payment-link creation, upload recovery, and retention review.

Primary Build 211 migration: `sql/2026-06-18_build211_production_reliability.sql`.
Primary structured build record: `data/build211_production_reliability.json`.

Production reality check: email/SMS delivery still requires real provider webhook configuration; hosted final-balance links require Stripe test/live keys and webhook reconciliation; mobile upload reliability must still be tested on real devices and weak connections.

Build 211 documentation sync: canonical handoff updated for production reliability, hosted payment-link automation, notification provider checks, upload/retention diagnostics, and owner action simplification.

## Build 212 central capability: guided production testing

Build 212 converts the remaining reliability work into a plain-language, staff-facing acceptance process rather than leaving it as technical endpoint names.

- `/admin-test-centre.html` is the protected Guided Production Test Centre.
- It covers environment preflight, notification delivery, Stripe test checkout, customer privacy, mobile upload recovery, proof gates, incident/review safety, retention dry-run, and an end-to-end internal smoke test.
- Each test includes prerequisites, safety notes, exact actions, expected result, failure-recording instructions, and pass/blocked/fail history.
- Results are stored in `public.production_test_runs` after `sql/2026-06-20_build212_guided_production_testing.sql` is applied. Browser-only fallback is explicit when that table is not deployed.
- `docs/PRODUCTION_TEST_GUIDE.md` provides the same detailed instructions outside the app.

Build 212 does **not** prove the live Cloudflare/Supabase/R2/Stripe/provider environment from this build workspace. Production-readiness claims must be based on recorded internal tests, not static code checks.

Primary Build 212 migration: `sql/2026-06-20_build212_guided_production_testing.sql`.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 central capability: owner action control and customer trust records

Build 213 reduces the last recurring owner friction in the connected workflow. Generated rows in **Today Needs Attention** are no longer only links: an authorized owner can assign a row to themselves, snooze it for one day or one week, resolve it with a recorded note, or reopen it. Each action is stored in `owner_attention_tasks`, avoids repeated noise for the configured suppression window, and writes a best-effort live-interaction audit event.

Customer-facing price decisions now require a typed acknowledgement name and explicit confirmation before a priced recommendation is approved. When Stripe is configured, the approval tries to create a hosted final-balance Checkout Session automatically while preserving the draft payment request when Checkout creation cannot complete. The secure progress page now displays approved payment links only for that booking token.

Completed-job summaries now support a customer acknowledgement, revision number, and revision archive. Staff can export a booking-scoped interaction audit CSV from `/admin-progress.html` without exposing signed private URLs or private storage paths.

Primary Build 213 migration: `sql/2026-06-22_build213_owner_action_customer_trust.sql`.

### Build 213 required acceptance tests

1. On `/admin-today.html`, use a safe internal test row and select **Assign me**, **Snooze 1 day**, and **Resolve**. Refresh and confirm the recorded state is respected.
2. On a test progress token, approve a paid recommendation only after typing an internal test name and checking the acknowledgement box. Confirm an open payment link is visible only on that test token.
3. Generate a completed-job summary, acknowledge it through the customer token, regenerate it, and confirm the new revision resets the customer acknowledgement while the prior revision is archived.
4. In `/admin-progress.html`, export the interaction audit and confirm the CSV does not contain a private media URL, R2 key, API key, address, or customer payment details.

Build 213 does not claim a final payment is settled until the real Stripe/PayPal webhook reconciliation is configured and tested in the deployed environment.

> **Build 213 documentation sync:** Active direction remains in this handoff and `MASTER_VALUE_ROADMAP.md`. Use `docs/PRODUCTION_TEST_GUIDE.md`, `/admin-test-centre.html`, and `/admin-production.html` for real-world acceptance evidence. Historical Markdown remains retained for audit and prior release guards.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


## Build 214 central capability: security containment and owner-task orchestration

Build 214 responds to the Supabase Security Advisor RLS/public-table alert while reducing owner workflow friction.

Primary changes:

- `sql/2026-06-23_build214_security_task_orchestration.sql` enables RLS for public-schema tables, removes direct `anon`/`authenticated`/`PUBLIC` table grants, preserves service-role access for Cloudflare Functions, and adds the protected `rosie_security_posture_report()` RPC.
- `/admin-security.html` shows only table names, RLS state, and browser access flags. It never exposes records, keys, tokens, or customer data.
- `/admin-today.html` now supports manual tasks, My assigned work, due-date filters, due dates, and escalation metadata.

Critical deployment order:

1. Run the Build 214 SQL migration in Supabase SQL Editor.
2. Refresh Security Advisor and confirm RLS/public-access findings clear.
3. Use an internal booking to run the Guided Production Test Centre.
4. If a normal site screen fails, repair its Cloudflare Function or create a narrow server endpoint—never reintroduce broad direct browser table grants.

The browser must never contain `SUPABASE_SERVICE_ROLE_KEY`; Cloudflare Functions are the intended database boundary.

## Build 215 — public asset compatibility and DAIP planning (2026-06-30)

Build 215 addresses two separate concerns without conflating them.

### Public site asset compatibility

Verified Rosie-owned Service Hub/Local Hero images may exist in R2 as JPG files even where older runtime records, media tasks, or client markup expected `.webp`. The public image path is now format-aware for known Rosie asset URLs:

- canonical Local Hero keys use `landing-pages/<local-page-slug>.jpg`;
- the client tries the original URL, then same-name JPG/JPEG/WebP/PNG variants before visual fallback;
- the Admin Media Health scan reports the actual resolved URL and whether a compatible extension was used;
- `sql/2026-06-30_build215_media_asset_format_alignment.sql` aligns legacy Local Hero `media_asset_tasks` records to canonical JPG keys.

This does not hide a wrong filename, wrong folder, or wrong letter case. R2 keys are case-sensitive. The required first test is an incognito load of the exact `https://assets.rosiedazzlers.ca/<key>` URL and then the public page.

### DAIP documentation-only planning

The Digital Asset Intelligence Platform documentation under `docs/digital-asset-intelligence-platform/` is now part of the active planning context. Read `docs/digital-asset-intelligence-platform/10_Rosie_Dazzlers_Integration_Plan.md` before any DAIP implementation.

**Build 215 deliberately adds no DAIP production code, `daip_*` tables, worker, R2 DAIP bucket, AI model, Google Drive integration, processing queue, public export, or automatic publishing.** The plan establishes safe boundaries with existing bookings, job media, incidents, gallery approvals, vehicle history, RLS, retention, and staff approvals.

Primary future decision sequence:

`DAIP-0 security/cost/retention/consent decisions → DAIP-1 reviewed schema/storage foundation → selected manual intake → proxy/thumbnail worker → privacy review → story/export review → approved gallery/content handoff.`

## Build 216 — public media recovery and DAIP governance

Build 216 strengthens the public-asset boundary without changing the DAIP implementation status.

### Media reliability

- `/admin-media-health.html` now performs bounded concurrent public-image checks and reports failure categories rather than only blank/missing status.
- The client resolver still tries the approved original URL first, then compatible JPG/JPEG/WebP/PNG variants of the same known public asset key. It now has a bounded candidate timeout before it proceeds to the next safe fallback.
- After `sql/2026-07-01_build216_media_reliability_daip_governance.sql` is applied, each Media Health scan records only public asset metadata in `media_asset_health_observations`.
- A failure is **monitoring** after its first failed scan and becomes an active persistent alert after the second consecutive failed scan. One passing scan resolves it automatically.
- `media_asset_alerts` is staff-only and must never hold signed URLs, customer media, incident evidence, customer names, addresses, VINs, payment data, or secrets.
- Active/acknowledged public-media alerts also roll into Today Needs Attention as staff-only tasks.
- Public asset alerts are not yet automatically sent by email/SMS; use the protected Media Health screen and Today Needs Attention until notification provider delivery has passed guided tests.

### DAIP governance

DAIP remains **planning only**. Build 216 adds:

- `docs/digital-asset-intelligence-platform/11_DAIP_Decision_Register.md`
- `docs/digital-asset-intelligence-platform/12_DAIP_Phase_1_Security_Acceptance.md`

No DAIP worker, queue, schema, bucket, Drive sync, AI processing, export, or publishing flow was added. Do not create DAIP production code until all DAIP-0 decisions are owner-approved and a harmless internal test job is selected.

### Required Build 216 deployment order

1. Confirm Build 214 RLS containment is active and Supabase Security Advisor is clear.
2. Deploy Build 216 and confirm Cloudflare publishes both assets and Functions.
3. Run `sql/2026-07-01_build216_media_reliability_daip_governance.sql`.
4. Run Media Health twice with a harmless missing internal key; confirm monitoring then active alert.
5. Verify a passing scan resolves the alert.
6. Test Local Hero and Service Hub pages in incognito before replacing any further filenames.

### Current next best direction

Do not add another large standalone module. Verify the media/security production path, wire active media alerts into Today Needs Attention only after live testing, complete DAIP-0 decisions, and continue connecting approved final proof to gallery, vehicle history, reviews, and repeat maintenance.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

## Build 217 — secure final-balance links and customer-safe payment status (2026-06-30)

Build 217 closes the previously incomplete final-balance path. Staff can now create a tracked final-balance request, issue a short-lived opaque link, create Stripe Checkout from that request, and let the Stripe webhook settle the record idempotently. The customer-facing payment page is token-gated, has one clear H1, is noindex/noarchive, returns no customer PII, and only exposes an open/paid/expired/cancelled state with amount and a provider checkout URL when appropriate.

### What changed

- Added `/final-balance-payment.html` and clean route copy as the customer-safe landing page for a final-balance link.
- Added SHA-256 token-hash storage, 14-day default expiry, 90-day maximum expiry, replacement, cancellation, reopen, and explicit notification-queue controls.
- Added `/api/final_balance_payment_view`, which requires both request UUID and opaque token and disables caching.
- Added an Admin Payments final-balance work queue with copy, checkout, expiry, rotate, cancel/reopen, and notification actions.
- Added Stripe `checkout.session.completed` final-balance settlement with idempotency and safe booking-event logging.
- Removed token hashes and staff-entered notes from browser-facing final-balance responses.
- Added a generic secure-payment visual placeholder slot; it must never use a real invoice, payment link, QR code, card data, or customer details.

### Required deployment and controlled test

1. Apply `sql/2026-06-30_build217_secure_final_balance_links.sql` after the existing payment migrations.
2. Deploy Cloudflare Pages and Functions together.
3. In Stripe **test mode**, create one final-balance request, create checkout, complete it once, then resend the same event to confirm idempotency.
4. Verify invalid-token, expired, and cancelled URLs reveal no customer information.
5. Test notification queuing with a controlled mailbox before treating it as delivery-confirmed.

### Current next best direction

Do not expand payments further until the migration, Stripe test-mode webhook, and controlled notification test pass. Then pair approved final media with consent into Gallery and vehicle history, complete the real mobile upload tests, and only schedule review requests after final payment, customer acknowledgement, and incident checks.

### SEO and competitive recheck — 2026-06-30

- Rechecked Google Search Central guidance: keep people-first service copy, use the words customers search in titles and the single main heading, make links crawlable, and keep descriptive image filenames/alt text near relevant content. Continue validating structured data against visible page content rather than using markup as a ranking shortcut.
- Rechecked Jobber Client Hub and Urable’s detailing workflow positioning. The competitive baseline is a mobile-friendly self-service journey: request/quote approval, appointment information, payment/receipt, connected booking-to-billing status, customer communication, and vehicle/job history.
- Build 217 directly improves the payment/receipt/status portion of that path. Do not chase broad feature parity before the controlled payment release, consent-aware proof reuse, and review/maintenance gates work reliably.



## Build 218 — DAIP internal test foundation (2026-07-02)

Build 218 turns the DAIP documentation into a narrow **internal-test-only** system without treating DAIP as production-ready. The protected **DAIP Test Lab** is the only Build 218 operating surface.

### What is implemented

- `sql/2026-07-02_build218_daip_test_mode_foundation.sql` creates service-role-only DAIP test control, `RD-TEST-YYYYMMDD-###` media-job records, metadata-only asset records, non-executing planning tasks, internal privacy reviews, and safe audit events.
- Every control flag is constrained to internal test/no storage/no worker/no public export/no automatic publishing.
- The asset table deliberately has no public URL, signed URL, storage bucket, storage key, object path, or Drive ID column.
- `/admin-daip.html` is an administrator-only mobile/desktop Test Lab. It does not show customer details or receive media bytes.
- `/admin-test-centre.html` now includes three Build 218 tests: DAIP safety preflight, internal registry, and internal privacy/export-block proof.
- `docs/digital-asset-intelligence-platform/13_DAIP_Test_Mode_Process.md` describes exact test use; `14_DAIP_Production_Promotion_Gates.md` defines the next production gates.

### What remains intentionally disabled

No DAIP original upload, R2 DAIP bucket, signed URL, Google Drive mirror, worker, FFmpeg, proxy, contact sheet, AI/vision/transcription, export, gallery handoff, customer media access, social/GBP integration, or publishing is available in Build 218.

### Required deployment/test order

1. Confirm Build 214 RLS containment and Security Posture still pass.
2. Deploy site and Functions together.
3. Apply `sql/2026-07-02_build218_daip_test_mode_foundation.sql` in **development/staging only**.
4. Open `/admin-daip.html` as admin and confirm `internal_test`, metadata-only, public blocked, and zero executable tasks.
5. Use one opaque DAIP-only test reference and fictional test asset metadata only; never connect the Test Lab to a booking record.
6. Record all three DAIP tests in `/admin-test-centre.html`.
7. Confirm Gallery, customer progress, and Social Queue never show the DAIP test record.
8. Do not consider real media/storage/worker work until DAIP-0 decisions and `14_DAIP_Production_Promotion_Gates.md` are complete.

### Current strongest next direction

First run the Build 218 internal tests. Then complete the 12 DAIP-0 owner decisions in the decision register, especially worker host, budget stop rule, storage/backup policy, consent language, retention, and privacy approvers. The next code pass should be a reviewed private upload/storage design only—not AI, public galleries, or automatic posting.

## Build 221 hotfix — customer-admin route 405 repair

Build 221 is a no-schema hotfix for the `/admin-customers.html` page after staging showed `api/admin/customer_admin_list` returning HTTP 405 while the page displayed the Customer account access visual placeholder.

What changed:
- Added generic Cloudflare Pages `onRequest` dispatchers to the Build 220 customer-admin endpoints so GET, POST, and OPTIONS are accepted through a single route entrypoint as well as the method-specific handlers.
- Added a safe page-side fallback so list-style customer-admin requests retry with GET if a deployment returns 405 on POST.
- Updated the service-worker cache to `rosie-app-v20260703build221` so old admin page code is less likely to stay cached.
- Added `data/build221_customer_admin_route_hotfix.json` and a Build 221 guard script.

No Supabase migration is required. Deploy the Pages site and Functions together, then hard-refresh `/admin-customers.html`. A correct result is a normal JSON response, authentication response, or permission response from `/api/admin/customer_admin_list`; it should not be 405.

DAIP boundary remains unchanged: no production storage, uploads, workers, AI, customer media access, public gallery export, social publishing, Google Business Profile export, or automatic publishing was added.


## Build 226 — DAIP metadata-only intake dry run (2026-07-08)

Build 226 adds a protected fictional-manifest validator at `/admin-daip-intake-dry-run.html`. It validates filename, MIME type, declared size, fictional SHA-256 shape, rejection reasons, aggregate size, and a planning-only cost estimate. It accepts no file bytes and creates no storage authorization, object path, worker execution, customer-media route, public destination, or publishing path. Gate C remains held.

Apply `sql/2026-07-08_build226_daip_intake_dry_run.sql` in staging only, then run one accepted and one rejected fictional manifest. The two living strategy documents remain this file and `MASTER_VALUE_ROADMAP.md`; older Markdown remains retained audit and release evidence.

## Build 227 — roadmap execution and DAIP validation policy (2026-07-09)

### Completed next 20 steps

1. Added a DB-backed active roadmap execution queue.
2. Seeded the current next 20 cross-workstream priorities.
3. Added roadmap status values: planned, in progress, blocked, done, and deferred.
4. Added priority, workstream, owner, target build, source document, and sort order.
5. Added safe evidence notes for deployment/test proof.
6. Added an append-only roadmap audit table.
7. Added protected admin dashboard and save APIs.
8. Added `/admin-roadmap-execution.html` with responsive desktop/mobile controls.
9. Added status KPI counts for the active next 20.
10. Added a visual placeholder for the internal execution workflow.
11. Moved DAIP manifest-count limits into a protected DB policy.
12. Moved image/video declared-size limits into the protected DB policy.
13. Moved storage-rate planning assumptions into the protected DB policy.
14. Added monthly warning and hard-stop planning values.
15. Forced Gate C to remain held at the database constraint level.
16. Forced technical capability to remain disabled at the database constraint level.
17. Updated Build 226 validation to read policy with safe code defaults.
18. Updated admin navigation, route copies, service worker, and access rules.
19. Updated canonical schema, active Markdown, test guidance, and release evidence.
20. Re-ran one-H1, route parity, JavaScript, CSS/responsive, and release checks.

### Next 20 steps after Build 227

1. Apply the Build 227 migration in staging and verify RLS/service-role containment.
2. Assign owners and statuses to all 20 seeded roadmap items.
3. Record Build 226 accepted and rejected fictional-manifest evidence.
4. Confirm warning and hard-stop amounts with the owners.
5. Complete all DAIP Gate A owner decisions.
6. Complete all DAIP Gate B safety-test evidence.
7. Conduct the independent Gate C rollback review.
8. Keep real uploads, storage, workers, AI, and publishing disabled until Gate C is separately approved.
9. Run customer recovery, archive, and restore staging tests.
10. Build a manual duplicate-customer merge dry run with no automatic transfer.
11. Verify Stripe final-balance settlement, cancellation, and webhook replay in test mode.
12. Verify notification delivery with a controlled inbox.
13. Run mobile weak-network upload retry tests using harmless test media.
14. Add approved final proof to gallery candidates only with consent/provenance.
15. Add approved final proof to vehicle history only after privacy review.
16. Gate review requests on settled payment, acknowledgement, and no unresolved incident.
17. Review Search Console and Business Profile evidence before changing local titles.
18. Replace public placeholders only with approved Rosie-owned local proof.
19. Archive redundant Markdown only after release-guard dependency scanning.
20. Continue one-H1, title/meta, local wording, error fallback, and CSS drift checks every pass.


## Build 228 — Creative Project Intelligence foundation (2026-07-12)

Build 228 changes the operational centre from product-first to **project/process-first**. `/admin-creative-projects.html` records a project idea, purpose, audience, lifecycle, work sessions, materials, mistakes/fixes, time, costs, outcomes, lessons, and future recommendations. Each new project receives governed output records for YouTube, Shorts, Reels, TikTok, Facebook video, Pinterest, Etsy draft, website page, blog, gallery, before/after, educational article, archive, material report, cost analysis, lessons learned, and future recommendations.

Publishing is never automatic: public publishing defaults off, consent review is separate, and every output follows planned → drafting → review → approved → scheduled → published or not applicable. Product pages and Etsy drafts are optional outputs; they are not the primary project record.

Primary migration: `sql/2026-07-12_build228_creative_project_intelligence_foundation.sql`. Primary UI: `/admin-creative-projects.html`. Canonical schema: `SUPABASE_SCHEMA.sql`.

### Next 20 steps after Build 228

1. Apply the Build 228 migration in staging and verify RLS/service-role containment.
2. Create one fictional project and verify all seventeen output records are seeded.
3. Test mobile project creation and session logging.
4. Add controlled project-to-booking association without making bookings the project source of truth.
5. Add media-manifest references after DAIP Gate C approval; keep file bytes disabled until then.
6. Add structured material-line usage tied to inventory transactions.
7. Add session time rollups and estimated-versus-actual labour.
8. Add project cost breakdown with material, labour, overhead, fees, and waste.
9. Add before/after applicability and consent gating.
10. Add a project story outline generated from approved session notes.
11. Add YouTube long-form outline drafts.
12. Add short-form hook and clip-plan drafts for Shorts, Reels, TikTok, and Facebook.
13. Add Pinterest title/description/image-plan drafts.
14. Add Etsy and website listing drafts without automatic publication.
15. Add blog and educational article drafts with source-note citations.
16. Add project archive export and recovery package.
17. Add lessons-learned extraction with human approval.
18. Add future-project recommendation ranking using completed project history.
19. Add output approval dashboard and destination readiness checks.
20. Keep one-H1, title/meta, local wording, responsive CSS, fallback, and privacy checks in every release.


## Build 229 — standard jobs remain first-class
Rosie Dazzlers now has two explicit operating paths. The existing customer-led booking workflow remains the default **standard job** and does not require a creative project. Staff may deliberately opt a selected booking into Creative Project Intelligence from `/admin-booking.html`; that creates a separate project record while the booking remains the operational source of truth for scheduling, service, payment, progress and completion. No booking is automatically converted and no project output publishes automatically.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 — project profitability and content planning

Build 231 adds reversible project cost lines, revenue/profitability, therapeutic and non-commercial classifications, a reviewed project-consumption ledger, read-only booking comparison, template administration, consent-expiry reminders, shot plans, approved-session content plans, metadata-only archive manifests, lessons approval and future recommendation scoring. Ordinary bookings remain unchanged and DAIP Gate C remains required.


## Build 232 — accessible project controls and archive history (2026-07-15)

Build 232 replaces the remaining JSON prompt used to edit project material, labour and cost rows with an accessible dialog form. It adds project budget and target-margin guidance, budget variance and break-even calculations, assignable/evidence-aware shot plans, reviewed consent-reminder queue records, draft revision history, and authenticated metadata-only archive downloads. Ordinary bookings remain unchanged; inventory posting still does not mutate stock; DAIP Gate C and all media/publication controls remain held.

Migration: `sql/2026-07-15_build232_project_controls_archive_history.sql`. Workspace: `/admin-creative-projects.html`.

### Next 20 connected steps
1. Apply and test Build 232 in staging.
2. Add reservation availability checks against live inventory.
3. Define the transactional stock-posting and reversal RPC.
4. Add sales-channel revenue-source and fee lines.
5. Add budget-warning tasks to Today Needs Attention.
6. Connect approved consent reminders to the notification review queue.
7. Add shot-plan drag ordering and mobile capture evidence selection after Gate C.
8. Display draft version comparisons and restore controls.
9. Add provider-neutral AI draft adapter contracts with hard cost limits, disabled by default.
10. Add editable YouTube chapter timecodes.
11. Add clip evidence selection after Gate C.
12. Add Pinterest board administration.
13. Add Etsy taxonomy and shipping-profile lookup.
14. Add website schema validation and internal-link checks.
15. Add educational safety reviewer assignment.
16. Add CSV archive exports alongside JSON.
17. Add lessons-to-knowledge-base promotion with human approval.
18. Improve recommendation scoring with cost, audience and reusable-skill factors.
19. Add destination-readiness checks before social or commerce handoff.
20. Keep standard bookings, DAIP media and publishing approval-only.


## Build 233 — Supplier-link inventory intake
- Added a provider-neutral supplier-link preview contract, with Amazon.ca and Amazon.com enabled first.
- Staff paste a product URL, review extracted public metadata and suggested tool/consumable classification, then save through the existing authoritative inventory endpoint.
- Exact duplicate checks use normalized Amazon URL and ASIN. Imported images, prices and descriptions are drafts only and require human review.
- Import attempts are audited in `catalog_supplier_import_audit`; no browser credentials, scraping tokens or automatic purchases are introduced.
- Ordinary booking inventory, project reservation ledgers and DAIP Gate C remain unchanged.


## Build 234 — Separate Inventory Manager

Build 234 preserves the existing `admin-catalog.html` Inventory Workflow and adds `admin-inventory-manager.html` as an optional spreadsheet-style management surface. It supports row-level edits, suspicious-name review, filtering, sorting, soft archive, restore, desktop tables, and mobile cards. The authoritative save path remains `/api/admin/catalog_inventory_save`; no hard delete was added.


## Build 235 — operational readiness, JSON table editing, galleries
- Preserved the original Inventory Workflow and expanded the separate Inventory Workbench.
- Added field/value JSON table editing with individual-field and complete-row save actions.
- Added bulk changes, CSV export, readiness scoring, and ordered gallery previews.
- Added up to seven gallery images through `gallery_image_urls` while retaining `image_url` as featured.
- Added `/admin-launch-readiness.html` with automatic audits plus manual real-world preflight confirmations.
- Migration: `sql/2026-07-19_build235_inventory_json_gallery_launch_readiness.sql`.
- Next focus: deploy migration, perform real payment/email/booking tests, then address the highest-impact launch blockers shown by the dashboard.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 — Unified Startup Command Center

The normal launch workflow now begins at `/admin-startup-guide.html`. It incorporates every detailed startup blocker, shared launch evidence, production readiness, guided tests, and the current next-20 roadmap. The database catalog `app_startup_process_items` is authoritative after the Build 239 migration; `data/build239_go_live_blockers.json` is the complete read-only fallback. Legacy readiness routes forward to Startup sections and should not be used as separate checklists.

Apply migrations in order: Build 235 gallery if outstanding, Build 237 evidence/roadmap, Build 238 inventory transaction/merge, then Build 239 unified startup catalog.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->


## Build 242 update

- Repaired `/admin-daip-intake-dry-run` contrast and card styling.
- Replaced many SVG-only visual placeholders with reusable local raster photo-style placeholders.
- Advanced Startup Command Center cache-busting and service-worker references to Build 242.
- No new database migration was introduced in this build.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->
# Build 247 — DAIP private raw-media ingestion

**Current build:** 247
**Updated:** 2026-08-07

Build 247 moves DAIP from metadata-only intake planning to a deliberately private, Creative-Project-linked raw-media ingestion layer. It does **not** weaken the historical Build 218 metadata-only Test Lab: that older subsystem continues using `daip_media_assets`. Production project masters use a separate table, `daip_project_media_assets`.

## Architecture now implemented in source

- Private R2 binding expected as `DAIP_MEDIA_BUCKET`; aliases are accepted only for backward/operator flexibility.
- Raw object keys are project scoped: `projects/{project_uuid}/raw/photos|video|files/{asset_uuid}/{safe_filename}`.
- The browser sends 32 MiB multipart chunks through authenticated Pages Functions rather than uploading a >300 MB body in one request.
- Multipart state and ETags are stored in Supabase so a staff member can reselect the same file and continue from completed parts.
- Completed masters are treated as immutable from the intake interface. Abort is available only while a multipart upload is incomplete.
- Duplicate completed imports are blocked by Creative Project + normalized filename + file size.
- Raw media remains `private_internal`; `public_destination_enabled` is structurally false.
- Completion creates downstream job rows for metadata, privacy review and content candidate indexing; video additionally queues proxy, frame, audio, transcript and scene-analysis jobs.
- If `DAIP_PROCESSING_QUEUE` is configured, completion dispatches job IDs to the queue. If dispatch fails, the DB jobs remain queued and retain the error for recovery.
- No raw media is copied into the public `rosie-assets` bucket automatically.
- Standard detailing bookings remain unchanged unless staff explicitly opt the booking into a Creative Project.

## Primary interface

`/admin-daip-media.html`

Use it to select a Creative Project, choose raw capture stage/consent state, upload multiple JPG/JPEG/PNG/WebP/HEIC/HEIF/MP4/MOV/M4V/WebM files, pause/resume, inspect raw-media records and inspect downstream processing jobs.

## Cloudflare account work still required

The application source is ready, but the actual private bucket must exist in the user's Cloudflare account and be bound to the Pages project. Follow `DAIP_R2_MEDIA_SETUP_GUIDE.md`. The required binding name is `DAIP_MEDIA_BUCKET`. The bucket should remain private with no public `r2.dev` or custom-domain exposure.

## Important processing boundary

Build 247 creates the ingestion and processing-job pipeline, but it does **not yet render edited long-form/short-form videos**. The next engineering wave needs a processing consumer/runtime capable of FFmpeg-class work for proxies, frame/audio extraction and final video assembly. The database/queue contracts added here are the handoff point for that processor.

## Current next 20

1. Create and bind the private DAIP R2 bucket as DAIP_MEDIA_BUCKET.
2. Apply the Build 247 DAIP media migration in staging.
3. Upload and verify one private DAIP photo.
4. Prove a video larger than 300 MB uploads through multipart chunks.
5. Interrupt and resume a large video without restarting from zero.
6. Create/import the first historical detailing Creative Project and its raw media.
7. Create/import the second historical detailing Creative Project and its raw media.
8. Create/import the third historical detailing Creative Project and its raw media.
9. Configure the optional DAIP_PROCESSING_QUEUE binding.
10. Implement the processing consumer for proxy video, frames, audio and transcript.
11. Implement scene analysis and before/after candidate scoring.
12. Implement reviewed story assembly from selected evidence.
13. Implement a rendering adapter for long-form and short-form MP4 outputs.
14. Keep every generated derivative private until human consent/privacy review.
15. Add reviewed copy-to-public workflow for approved gallery/social derivatives.
16. Complete real-device DAIP uploader acceptance on desktop and mobile.
17. Continue catalog publish-readiness cleanup and product-image completion.
18. Complete booking, payment, refund and notification production acceptance.
19. Complete Search Console and Google Business Profile alignment.
20. Run an invite-only soft launch with daily evidence review.

## Following 20

1. Add automatic proxy generation presets for 1080p and 720p editing copies.
2. Add key-frame extraction at scene boundaries and configurable intervals.
3. Add audio waveform and silence detection for narration/edit decisions.
4. Add speech-to-text transcript storage with timestamp segments.
5. Add privacy detection for license plates, faces and sensitive documents.
6. Add reviewed blur/redaction derivatives rather than modifying raw originals.
7. Add before/during/after auto-classification suggestions with manual override.
8. Add duplicate and near-duplicate visual detection across each project.
9. Add best-shot scoring for sharpness, exposure, framing and transformation evidence.
10. Add timeline storyboard editor with drag-and-drop selected evidence.
11. Add soundtrack/narration planning without embedding unlicensed music.
12. Add long-form YouTube edit recipe generation from the approved storyboard.
13. Add Shorts/Reels/TikTok vertical crop and hook recipe generation.
14. Add thumbnail candidate generation and review.
15. Add website-gallery and Google Business Profile derivative presets.
16. Add per-platform caption, title, description, hashtag and CTA drafts.
17. Add rendering cost/time estimates before starting expensive media jobs.
18. Add retry/dead-letter handling for failed processing jobs.
19. Add retention/storage-class policy for old proxies while preserving raw masters.
20. Add project-level “Content package ready for review” gate and one-click review queue.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->

<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->
