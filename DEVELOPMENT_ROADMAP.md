> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

> **Build 248 documentation status:** Historical/compatibility reference. Current state is `AI_PROJECT_HANDOFF.md`; current direction is `MASTER_VALUE_ROADMAP.md`. Retained to preserve audit/release history and old references.

# Development Roadmap — Build 245 Current Execution

**Updated:** 2026-08-06

## Completed in source

- UI/SEO Health scanner, cache diagnostics, safe service-worker recovery and exported scan evidence.
- Service-worker malformed-cache-list and all-or-nothing installation repair.
- Add-on landing-page static H1, title, description and image fallbacks.
- Admin noindex and gift-certificate one-H1 corrections.

## Acceptance required

Deploy to preview, run `/admin-ui-health.html`, clear any stale Build 244 cache, export the scan, then continue the current Startup acceptance sequence. Source checks do not replace payment, email, database, mobile, accessibility or recovery proof.

---

# Development Roadmap — Build 241 Hotfix

**Updated:** 2026-08-05

## Completed

- Repaired Startup Command Center summary initialization.
- Added `Promise.allSettled()` refresh isolation and visible fallback reporting.
- Advanced asset/service-worker cache tokens.
- Added an automated Build 241 regression guard.
- Preserved every Build 240 roadmap action and launch blocker.

## Resume next

Continue the Build 240 current execution cycle after preview acceptance of `/admin-startup-guide.html`.

---

# Development Roadmap — Build 240 Current Execution

**Updated:** 2026-08-05

## Completed in source

- Atomic booking and Creative Project inventory posting RPC with preview, locking, shortage checks, idempotency and audit rows.
- Authorized reversal RPC using compensating return movements and preserved source evidence.
- Project-reservation availability/conflict API and operator loader.
- Responsive Inventory Posting & Reversal page with cached read-only history fallback and CSV export.
- Existing job-progress and catalog usage routes moved off direct stock PATCH writes.
- Startup catalog expanded to 36 processes; Build 240 next-20 cycle added.

## Acceptance required

Apply the Build 240 migration in staging and complete the exact migration, posting, idempotency, shortage, reversal and accounting tests in `STARTUP_GO_LIVE_BLOCKERS.md`. Source completion is not production evidence.

## Next implementation wave

Resumable uploads and derivatives; automatic product publishing gates; payment application and HST review; month-end close/lock/reopen; accountant export; local-proof replacement; Search Console/GBP alignment; controlled soft launch.

---

# Development Roadmap — Build 238 Current Execution

**Build 238 operational release:** source implementation is complete for the first two previously open inventory reliability items: transactional bulk updates and reviewed duplicate merge. They remain open for staging acceptance until the migration and exact tests below pass.

## Completed in source

- All-or-nothing inventory bulk RPC with dry-run preview and audit rows.
- Duplicate merge RPC with preview, reference counts, compensating movements, gallery/tag consolidation, same-type/unit safeguards and duplicate soft archive.
- Inventory Workbench controls for batch reasons, preview/commit, merge selection, cached read-only fallback and readable transaction/merge history with CSV export.
- Build 238 Startup Guide, Roadmap Execution fallback, SEO metadata cleanup and release guard coverage.

## Acceptance work now required

1. Apply `sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql` in staging.
2. Use two deliberately created test duplicates of the same item type and compatible unit.
3. Preview the merge; compare every reference count with Supabase rows.
4. Execute; confirm survivor quantity, archived duplicate, transferred references, movement evidence and merge audit.
5. Preview a valid multi-row bulk update, then execute and inspect batch/row audits.
6. Submit one invalid row in a test batch and confirm no selected row changed.
7. Repeat on mobile and verify write controls remain disabled during cached/offline fallback.

## Next engineering queue after acceptance

- Add merge-audit viewer and export from the Inventory Workbench.
- Add conflict-aware merge handling for future tables as they are introduced.
- Add an authorized compensating reversal workflow rather than automatic unmerge.
- Move real job inventory consumption and reservation posting into transactional RPCs.
- Add resumable media uploads and responsive derivatives.
- Add publish-readiness gates for price, inventory, image roles, alt text, consent and shipping/pickup settings.
- Continue preflight, accessibility, performance, security and first-week monitoring work from the Startup Guide.

---

# Build 237 synchronization note

Build 237 repairs missing CSS/AdminShell dependencies, adds a current-cycle roadmap, shared launch evidence and a detailed Startup Guide. The living roadmap is `MASTER_VALUE_ROADMAP.md`; this file remains synchronized release history.

---

# Rosie Dazzlers Development Roadmap — Build 217

**Updated:** 2026-06-30
**Build:** 217

Build 215 keeps the canonical handoff/roadmap model, adds public asset format compatibility for verified JPG Local Heroes and Service Hub media, and records DAIP integration planning without implementing DAIP production infrastructure. The immediate operational priority is verifying deployed R2 URL rendering before starting any DAIP Phase 1 work.

## Build 207 — 20 completed items

1. Added `AI_PROJECT_HANDOFF.md` as the first-read handoff file for new chats/AI sessions.
2. Added `MASTER_VALUE_ROADMAP.md` as the primary roadmap going forward.
3. Added `MARKDOWN_SANITY_BUILD207.md` to explain which Markdown files are canonical, retained, or retired-for-editing.
4. Added `data/markdown_sanity_build207.json` for app-readable documentation sanity status.
5. Added `data/build207_enhancement_sweep.json` to convert scattered Markdown recommendations into a current priority stack.
6. Added `data/visual_placeholder_registry.json` for service, town, gallery, seasonal, fleet, incident, and review placeholder slots.
7. Added `/api/admin/markdown_sanity_report` for admin documentation diagnostics.
8. Added `/api/admin/visual_placeholder_report` for admin visual-placeholder diagnostics.
9. Added `/admin-docs.html` as a dedicated Docs & Sanity Center.
10. Added `/admin-docs/` route copy for clean Cloudflare routing.
11. Added `assets/visual-placeholders.js` to provide safe SVG placeholders and broken-image fallbacks.
12. Updated `assets/chrome.js` so placeholder enrichment auto-loads with the shared site chrome.
13. Updated `assets/site.css` with responsive placeholder cards, reduced-motion-safe hover, and mobile-safe grids.
14. Added Admin Dashboard diagnostics for Markdown consolidation and visual placeholder readiness.
15. Added an Admin Dashboard card linking to the new Docs & Sanity Center.
16. Added Admin Menu/auth access for the Docs & Sanity Center.
17. Bumped the service worker cache and added placeholder assets/data to the cache list.
18. Updated route-copy sync to include `/admin-docs.html`.
19. Added the Build 207 no-DDL SQL note and schema documentation.
20. Added `scripts/build207_markdown_visual_sanity_check.py` and wired it into `scripts/release_check.py`.

## Next 20 steps after Build 207

1. Connect Quote Pipeline to real quote proposal, lead conversion, deposit request, and accepted/declined DB rows.
2. Add quote create/edit/save controls directly inside `/admin-quotes.html`.
3. Add follow-up due dates, stale quote warnings, and owner reminders.
4. Add Meta campaign create/edit rows with spend, leads, booked jobs, revenue, and UTM/source mapping.
5. Add proof-of-work checklist templates for interior, exterior, complete detail, ceramic/wax, pet hair, and fleet.
6. Add the proof-of-work checklist to `/detailer-jobs.html` as a mobile-first workflow.
7. Add customer sign-off and proof summary publishing after job completion.
8. Add customer/admin vehicle history timelines from bookings, invoices, photos, incidents, and recommendations.
9. Add maintenance-plan reminders generated from completed bookings and vehicle history.
10. Add fleet account CRUD with company contacts, vehicle lists, service intervals, and quote terms.
11. Add route clustering from real bookings by town/date/time slot.
12. Add review request queue after completed jobs with Google Business Profile link/template support.
13. Add approved testimonial/public proof workflow from review responses.
14. Add seasonal campaign builder with placeholder graphics and approved-image picker.
15. Add before/after slider component to Gallery and selected service/town pages.
16. Add visual placeholder replacement tasks into Media Health and Gallery Approvals.
17. Add owner “Today needs attention” dashboard combining quotes, gallery approvals, payments, incidents, media, reviews, and SEO proof.
18. Add live screenshot/mobile smoke checklist for `/`, `/book`, `/gallery`, `/admin`, and `/detailer-jobs`.
19. Modernize release guards so duplicate historical Markdown can move into `docs/archive/` safely.
20. Continue CSS drift checks, one-H1 checks, title/meta clarity, local wording, and responsive layout review on every build.

---

# Build 205 update — Sanity check, competitor research, and value-added roadmap

Build 205 is a sanity-check pass rather than a heavy database migration. It adds a dedicated Admin Sanity Check page, a dashboard value-roadmap diagnostic, a value-added backlog data file, and a detailed Markdown review of where the app stands. The research confirms that the app has strong foundations; the next best work is owner-facing simplification, quote/CRM revenue visibility, gallery approvals, memberships, proof-of-work, fleet mini-CRM, review automation, and sharper visual conversion blocks.

## Build 205 — 20 completed items

1. Reviewed the latest Build 204 zip structure and confirmed the current app footprint.
2. Added `APP_SANITY_CHECK_BUILD205.md` with a detailed current-state breakdown.
3. Added `data/value_added_feature_backlog.json` for priority value-added ideas.
4. Added `/api/admin/value_added_sanity_report` with staff/admin access protection.
5. Added `/admin-sanity.html` as a focused sanity/value-roadmap screen.
6. Added `/admin-sanity/` route-copy page for Cloudflare-style routing.
7. Added an Admin Dashboard Build 205 sanity/value-roadmap diagnostic card.
8. Added an Admin Dashboard card link to the sanity-check page.
9. Documented competitor-inspired patterns from mobile detailing sites and detailing CRM/software providers.
10. Documented the attached detailer-note takeaways: SEO long-term, Meta ads short/mid-term, and CRM quote tracking.
11. Reconfirmed that desktop website and mobile app-style foundations exist.
12. Identified admin complexity as the biggest current risk.
13. Ranked the dedicated Gallery Approvals screen as the strongest next workflow simplification.
14. Ranked quote pipeline revenue tracking as the strongest next revenue visibility improvement.
15. Ranked Meta ads ROI tracking as the strongest short-term lead-generation improvement.
16. Ranked memberships/maintenance plans as the strongest recurring-revenue improvement.
17. Added visual-enrichment recommendations for sliders, trust badges, hero images, and mobile action bars.
18. Added the Build 205 no-DDL SQL note.
19. Added the Build 205 release guard.
20. Synced root Markdown, schema notes, route-copy checks, and release checks.

## Next 20 steps after Build 205

1. Build `/admin-gallery.html` with direct approve/hide/needs-consent/image-repair actions.
2. Add before/after upload buttons directly to the gallery approval workflow.
3. Add gallery consent status filters: needs review, approved public, private, rejected, sample.
4. Add a quote pipeline dashboard showing total open quote dollars and follow-up age.
5. Add close-rate reporting by month, service package, add-on, and source.
6. Add Meta ads campaign tracker fields: spend, leads, CPL, booked jobs, CAC, revenue, and average ticket.
7. Add landing-page source/UTM reporting into lead and quote records.
8. Add maintenance-plan membership statuses and recurring reminders.
9. Add customer vehicle history timeline with past services, photos, invoices, and recommended next service.
10. Add proof-of-work job checklist with required start/finish photos and customer sign-off.
11. Add jobsite route-clustering hints by town, travel zone, and time slot.
12. Add fleet mini-CRM for companies, contacts, vehicle lists, service intervals, and contract notes.
13. Add review-request automation after job completion.
14. Add review reply tracking and reusable testimonial approval workflow.
15. Add seasonal campaign visual builder for salt removal, spring reset, pet hair, ceramic, gift cards, and fleet cleanup.
16. Add before/after slider component to public gallery and service landing pages.
17. Add trust badge strip to service pages and booking: mobile, brings power/water, Oxford/Norfolk, customer-approved photos.
18. Add mobile bottom action bar for Book, Call/Text, Gift Card, and Packages.
19. Add print/PDF quote, proof-of-work, invoice, and incident report exports.
20. Add a simplified “Today needs attention” owner dashboard that groups approvals, payments, quotes, reviews, and media issues.

# Build 204 update — Before/after gallery image resilience and fallback repair

**Updated:** 2026-06-12  
**Build:** 204

Build 204 repairs the reported public Gallery regression where before/after media could disappear or render as broken images. The public gallery API now understands legacy/friendly-editor media field aliases, uses the bundled static gallery fallback when saved content has no usable media URLs, rewrites known Rosie brand assets to local packaged paths, and returns fallback metadata for the public Gallery and homepage recent-work cards. The public UI now shows a clear repair placeholder instead of a blank/broken image, and the Admin Dashboard adds a Gallery image health diagnostic card.

## Build 204 — 20 completed items
1. Fixed the public before/after Gallery media regression reported after Build 203.
2. Changed default gallery sample media from remote `assets.rosiedazzlers.ca/brand/...` URLs to packaged `/assets/brand/...` URLs.
3. Updated `data/before_after_gallery.json` to use packaged local brand asset paths.
4. Added static JSON fallback loading from `/data/before_after_gallery.json` before emergency defaults.
5. Added fallback use reporting through `/api/before_after_gallery_public`.
6. Added `source_status` and `fallback_used` to the public gallery response.
7. Added legacy/friendly field aliases for before media URLs.
8. Added legacy/friendly field aliases for after media URLs.
9. Added consent/privacy status alias normalization for older approved-public wording.
10. Preserved strict privacy blocking for pending, private, rejected, or needs-review gallery rows.
11. Rewrote known Rosie brand asset-domain URLs to local packaged assets when safe.
12. Added fallback metadata for before and after gallery images.
13. Added public Gallery `img.onerror` handling so broken images try local fallback first.
14. Added a customer-safe placeholder message when an image still cannot load.
15. Added the same image-fallback behavior to homepage recent-work cards.
16. Added visual placeholder styling for unavailable media.
17. Added `/api/admin/gallery_image_health_report` for admin diagnostics.
18. Added an Admin Dashboard Gallery image health card.
19. Synced `/gallery.html` with `/gallery/` and `/admin.html` with `/admin/`.
20. Updated Markdown, schema notes, SQL no-DDL note, release guard, and H1 checks.

## Next 20 steps after Build 204
1. Add a media-library picker directly inside each before/after gallery row.
2. Add real image existence checks for R2/object URLs instead of URL-shape checks only.
3. Add a gallery repair button that copies known local fallback URLs into broken sample rows.
4. Add a public proof rotation block on town/service landing pages using approved gallery pairs.
5. Add visual crop/blur preparation for public gallery photos before publishing.
6. Add image dimension/aspect-ratio validation before gallery save.
7. Add customer consent record linking to each gallery row.
8. Add job/booking link fields to gallery rows so proof is tied back to the completed service.
9. Add per-row history restore for gallery items.
10. Add gallery category tags for interior, exterior, pet hair, odor, headlight, ceramic, and maintenance work.
11. Add mobile card/table switcher for long admin gallery lists.
12. Add before/after proof requirements to local SEO task creation.
13. Add a screenshot QA checklist for `/gallery`, `/`, and landing proof sections.
14. Add WebP/AVIF optimization guidance for approved gallery images.
15. Add customer-safe captions generated from package, town, and service fields.
16. Add gallery empty-state recommendations in Admin App when no approved public rows exist.
17. Add broken-image warnings to Media Health with one-click R2 upload guidance.
18. Add Meta ad proof-card templates using approved before/after rows.
19. Add quote/lead source attribution into gallery proof analytics.
20. Continue retiring emergency JSON panels and moving routine media management into owner-friendly screens.

---

# Build 203 update — Desktop/mobile polish and professional visual enrichment

Build 203 continues the roadmap by making the site feel more like a finished desktop website and a usable mobile app-style experience at the same time. This pass adds shared visual polish, responsive utilities, a homepage desktop/mobile showcase, a dashboard diagnostics card, and an admin API that checks sampled pages for viewport, H1, image, and shared-CSS readiness. No new database tables were required; the responsive visual registry is a bundled JSON fallback that can later be moved into the friendly settings editor.

## Build 203 — 20 completed items
1. Added a shared responsive visual registry for desktop, tablet, and mobile targets.
2. Added professional visual-polish CSS utilities for glass panels, image frames, proof stats, desktop preview cards, and mobile frame previews.
3. Added a viewport-tier marker so pages know whether they are in mobile, tablet, or desktop view.
4. Added lazy/async image defaults for non-hero images through the shared chrome script.
5. Added a homepage desktop/mobile showcase without adding another H1.
6. Added public-facing desktop website and mobile app-style proof cards on the homepage.
7. Added mobile touch-target improvements for action rows and CTAs.
8. Added reduced-motion protection for professional visual effects.
9. Added a dashboard desktop/mobile and visual polish diagnostics card.
10. Added `/api/admin/responsive_visual_report` for sampled viewport/H1/image/shared-CSS checks.
11. Added visual-slot reporting for hero, reviews, service cards, before/after proof, and incident evidence.
12. Added checks for viewport meta tags on sampled public/admin pages.
13. Added checks for public pages with no detected imagery so bland pages are easier to find.
14. Added service-worker cache refresh for updated CSS, chrome, and the responsive visual registry.
15. Kept the one-H1 rule intact while adding richer visual sections.
16. Synced the admin dashboard route copy after dashboard diagnostics changes.
17. Added Build 203 release guard for responsive visual registry, CSS, dashboard card, API, and route copy.
18. Updated schema documentation and SQL notes with no new database tables for this pass.
19. Updated root Markdown files with Build 203 status and next-step guidance.
20. Kept SEO wording aligned to local Oxford/Norfolk service and town intent while improving presentation.

## Next 20 steps after Build 203
1. Add a full admin desktop/mobile preview mode with iframe toggles for homepage, booking, pricing, and service pages.
2. Add per-page visual scorecards for missing hero image, missing proof image, weak alt text, and low image count.
3. Connect the responsive visual registry to Admin App so visual-slot requirements can be edited without JSON.
4. Add a gallery image picker directly inside landing-page hero/proof editors.
5. Add a public before/after comparison slider component for approved gallery pairs.
6. Add customer-safe visual proof rotation by town and service on local landing pages.
7. Add admin warnings when a town/service page lacks approved public media.
8. Add mobile screenshot checklist fields to release QA.
9. Add desktop screenshot checklist fields to release QA.
10. Add image aspect-ratio warnings before publishing service cards or landing pages.
11. Add a professional testimonial/proof block editor that can choose review, photo, and town/service pairing.
12. Add performance hints for oversized hero images and non-optimized gallery images.
13. Add WebP/AVIF preferred-image guidance in Media Health.
14. Add visual theme presets for seasonal promos without editing CSS.
15. Add compact mobile admin tables that can switch between table and card view.
16. Add incident evidence thumbnail review and customer-public crop/blur prep.
17. Add marketing campaign landing-page templates for Meta ad offers.
18. Add lead-source attribution fields to booking/customer records for Meta, Google, referral, and direct traffic.
19. Add quote pipeline dashboards from marketing tracker data.
20. Continue retiring emergency JSON panels by adding owner-friendly editors wherever routine updates still require structured data.

---

# Build 202 update — Incident reports and detailer marketing tracker

**Updated:** 2026-06-12  
**Build:** 202

Build 202 adds a private incident-report workflow for vehicle damage, pre-existing damage, faulty equipment/tool contact, customer disputes, safety issues, and other job-site concerns. Reports require photo evidence, keep detailer/admin discussion private, and only show customers the admin-approved summary and selected evidence photos after the report is intentionally published. This build also applies the attached detailer marketing notes by adding a simple marketing tracker for Meta ad math, quote value, close rate, and cost-per-lead/customer-acquisition-cost thinking while SEO continues to build over time.

## Build 202 — 20 completed items

1. Added a DB-backed `incident_reports` table schema for private incident reports.
2. Added `/admin-incident-reports.html` and `/admin-incident-reports/` route copies.
3. Added private incident creation for assigned detailers, senior detailers, and booking managers.
4. Required a valid booking ID before incident creation.
5. Required a private report title and detailer report body.
6. Required at least one photo evidence URL/upload before creating a new incident report.
7. Added R2 evidence upload endpoint scoped to `incident-reports/` keys.
8. Added incident types for damage, faulty equipment, pre-existing damage, customer dispute, safety, and other.
9. Added severity/status/decision-status fields for admin triage.
10. Added private admin/detailer discussion fields that are never returned to the customer progress page.
11. Added admin-only customer-publish controls.
12. Required approved customer summary before customer visibility can be enabled.
13. Required at least one selected public evidence photo before customer visibility can be enabled.
14. Added customer-visible incident report rendering on the customer progress page.
15. Added `/api/progress/incident_reports` and integrated public incident reports into `/api/progress/view`.
16. Added dashboard and navigation links for Incident Reports.
17. Added `/admin-marketing.html` and `/admin-marketing/` using the attached detailer marketing notes.
18. Added Meta ad/quote-pipeline calculator fields for CPL, CAC, projected revenue, quote close rate, and open quote value.
19. Added `DETAILER_MARKETING_NOTES_APPLIED.md` to summarize which source ideas fit Rosie Dazzlers.
20. Updated Markdown, schema notes, SQL migration, and release guards for this incident/marketing pass.

## Next 20 steps after Build 202

1. Add real CRM quote records connected to leads, bookings, and marketing source.
2. Add quote sent value, approved value, lost value, and close-rate dashboard cards.
3. Add lead-source fields to every public form and admin lead conversion flow.
4. Add Meta campaign records with spend, objective, creative URL, offer, service area, and run dates.
5. Add automatic campaign CPL/CAC/ROAS calculations from real lead and booking records.
6. Add branded-search/source-assisted attribution notes when a lead says they saw an ad then searched Google.
7. Add seasonal close-rate charts for summer/winter detailing demand.
8. Add package/add-on bundle analytics from accepted quotes.
9. Add customer-safe incident report notification email/template after admin publication.
10. Add incident-report PDF export for internal records and insurance/vendor follow-up.
11. Add incident report follow-up task reminders for repair, customer credit, vendor warranty, or no-action decisions.
12. Add media-library selection for incident evidence instead of upload/paste only.
13. Add mobile quick-create incident button inside detailer job pages.
14. Add pre-existing-damage checklist prompts during jobsite intake to reduce disputes.
15. Add incident counts and unresolved urgent incident warnings to the Admin Dashboard.
16. Add staff-role audit reasons before publishing customer-visible incident summaries.
17. Add customer acknowledgement/signoff for published incident outcomes.
18. Add equipment-maintenance linkage when an incident type is faulty equipment.
19. Add browser smoke tests for incident create/upload/decision/publish flows.
20. Continue replacing any remaining raw JSON repair surfaces with owner-friendly update screens.

---

# Build 201 update — Friendly editor validation, media pickers, and route-copy sync

**Updated:** 2026-06-09  
**Build:** 201

Build 201 continues the move away from direct JSON editing by making the friendly editors safer to use. Admin App now adds inline validation hints beside routine fields, live SEO counters for landing-page titles/meta/slug/hero text, media URL picker controls for image fields, consent/source badges beside media fields, and owner-safe save review summaries before major DB-backed content saves. The build also adds a route-copy synchronization script so edited root admin pages and their folder `index.html` routes stay identical during packaging instead of relying on manual copy checks.

## Build 201 — 20 completed items

1. Added Build 201 markers to Admin App and Admin Dashboard.
2. Added reusable inline field-hint styling for friendly editor inputs.
3. Added live title/meta/H1 character counters for landing-page editor fields.
4. Added slug format validation for landing slugs and package codes.
5. Added URL format warnings for public links and media/image URL fields.
6. Added media-picker controls beside image-oriented URL fields.
7. Built the media picker from saved package, add-on, landing-page, and gallery URLs.
8. Added owned/R2-media badges for Rosie-controlled asset URLs.
9. Added consent/source warning badges for external or review-needed media.
10. Added gallery consent-status hints beside before/after media rows.
11. Added LocalBusiness/service schema previews inside each landing-page editor panel.
12. Added friendly save-review summaries before pricing catalog saves.
13. Added friendly save-review summaries before landing-page content saves.
14. Added friendly save-review summaries before social feed saves.
15. Added friendly save-review summaries before before/after gallery saves.
16. Added `scripts/sync_route_copies.py` to synchronize edited root admin pages with matching folder routes.
17. Added route-copy sync checking to the release process.
18. Synced `/admin-app.html` with `/admin-app/` and `/admin.html` with `/admin/` after the patch.
19. Updated Markdown and schema notes for the Build 201 owner-friendly validation pass.
20. Added a Build 201 release guard for inline validation, media pickers, schema preview, and route-copy sync coverage.

## Next 20 steps after Build 201

1. Add the same inline validation/media picker helper to Admin Site Settings friendly rows.
2. Replace remaining prompt-based create flows with inline modal/card forms.
3. Add per-row restore-from-history for pricing packages, add-ons, landing pages, gallery rows, and navigation links.
4. Add true visual diff modals showing before/after rows before DB saves.
5. Connect image pickers to the uploaded media library and R2 records instead of cycling known URLs only.
6. Add staff-role enforcement directly to publish/save buttons for public-facing domains.
7. Add audit-reason prompts before changing prices, policies, public navigation, or public media proof.
8. Add browser smoke tests for add/edit/delete/save flows in Admin App.
9. Add browser smoke tests for Admin Site Settings friendly row editors.
10. Add public crawl validation after deploy for sitemap, robots, nav/footer, and all generated landing routes.
11. Add invoice/confirmation PDF export packaging for accountant/customer workflows.
12. Add media consent record lookup directly beside each media URL picker result.
13. Add warning badges when landing pages use stock/external images without source notes.
14. Add automatic schema validation for every landing page before publish.
15. Add option-library dropdowns to remaining free-text category/status fields.
16. Add mobile quick-action cards for pricing warnings, media readiness, SEO proof, and payment warnings.
17. Add dashboard counts for friendly-field validation warnings by domain.
18. Add repair buttons for partial landing-page and document-template DB rows.
19. Add admin-visible fallback/source labels on every public-content preview.
20. Continue migrating duplicated JSON/page content into DB-first, owner-safe screens wherever it lowers failure risk.

---

# Build 200 update — Friendly pricing editor completion and JSON retirement dashboard

**Updated:** 2026-06-09  
**Build:** 200

Build 200 continues the owner-friendly editing work by reducing the last major Admin App pricing-catalog reason to open raw JSON. Package included services, chart/service-detail bullets, best-for notes, duration labels, images, SEO focus phrases, and customer-facing descriptions now have a friendly selected-package editor. Live chart previews/downloads now read from the friendly pricing editor state instead of requiring staff to refresh or repair the raw JSON first. The Admin Dashboard also now lists remaining Advanced JSON panels so they can be retired intentionally instead of being forgotten.

## Build 200 — 20 completed items

1. Added a selected-package detail editor inside Admin App pricing catalog management.
2. Added friendly package fields for public package description, duration label, image URL, and SEO focus phrase.
3. Added friendly line editors for included services, chart detail bullets, best-for/selling points, and package notes.
4. Added save controls for the selected package details without requiring a raw JSON edit.
5. Added duplicate-package controls for safe package-family creation from an existing package.
6. Kept package family price rows for quick small/mid/oversize price editing.
7. Moved the live chart helper out of the raw JSON emergency panel.
8. Updated live chart preview/download logic to read the current friendly pricing editor state.
9. Removed the requirement to refresh raw JSON before previewing or downloading pricing charts.
10. Relabelled pricing catalog raw JSON as **Advanced raw catalog JSON / emergency repair**.
11. Updated pricing help copy so staff know raw JSON is no longer the normal workflow for package details or chart work.
12. Preserved emergency JSON apply/refresh controls for developer-level recovery.
13. Added a dashboard diagnostics card listing the remaining advanced JSON panels and why they still exist.
14. Synced `/admin-app.html` and `/admin-app/` after the pricing editor update.
15. Synced `/admin.html` and `/admin/` after the dashboard diagnostics update.
16. Updated schema documentation to confirm this pass is no-DDL and continues using existing `app_management_settings` payloads.
17. Updated known gaps to reflect that pricing chart/package detail work no longer depends on raw JSON.
18. Added a Build 200 SQL no-DDL note.
19. Added a Build 200 release guard for friendly pricing editor and dashboard diagnostics coverage.
20. Re-ran release, H1, JavaScript syntax, route-copy parity, and zip checks before packaging.

## Next 20 steps after Build 200

1. Add a reusable row/card editor component so Admin App, Site Settings, Gallery, Social, Water Rules, and Recovery stop duplicating custom row code.
2. Add inline field-level validation beside every friendly pricing, Site Settings, gallery, social, and water-rule input.
3. Add media-library picker buttons beside package, add-on, landing, gallery, and before/after image URL fields.
4. Add consent/privacy badges beside every package/add-on/landing/gallery media field before publish.
5. Convert the remaining recovery provider/conditional rules into a fuller visual rule builder.
6. Add owner-safe diff modals before saving pricing, navigation, landing, media, analytics, and policy changes.
7. Add per-row restore-from-history controls for package rows, landing cards, navigation links, media requirements, and social/gallery rows.
8. Add official-source URL validation for water rules and external navigation/footer links.
9. Add live SEO counters while typing landing meta title, meta description, slug, and hero/H1 fields.
10. Add LocalBusiness/service schema preview beside each landing-page editor card.
11. Add automatic route-copy sync during packaging so folder `index.html` copies cannot drift.
12. Add browser-level smoke tests for row add/remove/apply/save flows in Admin App and Site Settings.
13. Add DB-backed option dropdowns to pricing package categories, analytics groups, media categories, gallery consent states, and water-rule statuses.
14. Add per-domain staff-role enforcement for editable settings and public-content publish actions.
15. Add audit reason prompts before publishing navigation, policy wording, pricing, or public proof changes.
16. Add fallback-repair previews that show exact DB rows/keys before force sync.
17. Add public crawl validation for generated landing, navigation, footer, sitemap, and robots output after deploy.
18. Add invoice/confirmation PDF packaging to accountant/customer export workflows.
19. Add mobile quick-action cards for media health, pricing warnings, payment warnings, and SEO proof tasks.
20. Continue migrating duplicated JSON/page content into DB-first, owner-friendly screens wherever it lowers failure risk.

---

# Build 199 update — Friendly Site Settings domain editors

**Updated:** 2026-06-07  
**Build:** 199

Build 199 continues the direct-JSON replacement work. The biggest change is that Admin Site Settings now treats raw JSON as an Advanced/emergency fallback, while routine owner/admin edits use row/card editors for navigation links, footer groups, analytics events, media requirements, holiday closures, and landing-page SEO/hero content. Admin Recovery delivery rules also now have normal fields instead of requiring Rules JSON edits.

## Build 199 — 20 completed items

1. Collapsed the Admin Site Settings raw JSON textarea into an **Advanced JSON fallback / emergency repair** panel.
2. Renamed the settings workflow to a friendly editor so staff are guided toward forms first.
3. Added friendly holiday-closure rows for date, label, reason, note, and closed/blocking status.
4. Preserved business-hours day fields while removing the routine holiday-closure JSON textarea.
5. Added friendly main-navigation link rows for label, URL/path, and group/note.
6. Added friendly footer quick-link rows for label, URL/path, and group/note.
7. Added friendly footer-group rows using simple `Label | /path` lines instead of nested JSON.
8. Removed routine navigation/footer JSON helper fields from the structured editor.
9. Added friendly analytics event rows for event key, label, group/category, status, and active state.
10. Removed routine analytics event JSON helper fields from the structured editor.
11. Added friendly media requirement rows for label, category, R2 key, width, height, size guidance, and upload method.
12. Removed routine required-assets JSON helper fields from the structured editor.
13. Added friendly landing-page cards for slug, name, type, nav group, meta title, meta description, hero title, hero intro, and enabled state.
14. Preserved deeper landing-page arrays/objects while exposing the highest-risk SEO fields as owner-friendly controls.
15. Updated landing-page preview cards so object-based `default_pages.pages` content previews correctly.
16. Added add/remove controls for all new friendly Site Settings row groups.
17. Added apply-to-JSON conversion so friendly rows update the underlying DB/fallback payload safely before save.
18. Synced `/admin-site-settings.html` and `/admin-site-settings/` after the editor conversion.
19. Converted Admin Recovery delivery rules from direct Rules JSON to friendly fields for send window, quiet hours, delay, max attempts, and opt-in requirement.
20. Updated roadmap, known gaps, database/schema notes, SQL no-DDL note, and release guards for this pass.

## Next 20 steps after Build 199

1. Build a shared reusable row-editor component instead of one-off row code per admin screen.
2. Add field-level validation messages directly beside every friendly Site Settings row input.
3. Add media-library picker buttons beside landing-page hero/gallery image URL fields.
4. Add image consent/privacy badges beside landing and gallery media fields.
5. Convert pricing catalog charts, included services, and rich package notes out of the remaining advanced JSON area.
6. Convert recovery-template conditional/provider rules into a fuller visual rule builder.
7. Add owner-safe visual diff modals before saving navigation, landing, media, and analytics registry changes.
8. Add per-row restore-from-history controls, not just whole-domain restore.
9. Add official-source URL validation for water rules and footer/navigation external links.
10. Add live SEO counters while typing in landing meta title, meta description, hero/H1, and slug fields.
11. Add LocalBusiness/service schema preview beside each landing-page card.
12. Add a dashboard card listing all remaining advanced JSON panels and why each still exists.
13. Add a release script that automatically syncs root `.html` and folder `index.html` route copies.
14. Add automated browser-level smoke tests for Admin Site Settings row add/remove/apply/save flows.
15. Add DB-backed option dropdowns to friendly rows where values are controlled, such as analytics groups and media categories.
16. Add staff-role enforcement per editable domain and row-level warning labels in the UI.
17. Add audit reason prompts before publishing major public-navigation or policy wording changes.
18. Add fallback-repair previews that show exactly what DB rows would be updated before force sync.
19. Add public crawl validation for generated landing, navigation, footer, sitemap, and robots output.
20. Continue migrating duplicated JSON/page content into DB-first, owner-friendly screens where it reduces failure points.

---

# Build 198 update — Friendly editors replacing direct JSON editing

**Updated:** 2026-06-07  
**Build:** 198

Build 198 responds to the request to stop making staff directly edit JSON where a normal update screen is possible. This pass keeps the JSON/API fallback layer intact for safety, but moves the day-to-day admin workflow to friendly row editors for social feeds, before/after gallery rows, and municipal water-use rules. The raw JSON boxes are now marked as Advanced/emergency repair areas instead of the primary editing method.

## Build 198 — 20 completed items

1. Converted the Admin App Social Feed Manager from a raw JSON textarea to a platform/post row editor.
2. Added **Add platform** controls for social feed management.
3. Added **Add post** and **Delete post** controls inside each social platform row.
4. Kept generated social-feed JSON under an Advanced panel for emergency repair and fallback review.
5. Added **Apply JSON to friendly editor** for social feeds so old JSON payloads can still be recovered safely.
6. Converted the Admin App Before/After Gallery Manager from a raw JSON textarea to customer-safe row editing.
7. Added **Add gallery row** and **Delete row** controls for public before/after proof items.
8. Added friendly gallery fields for title, location, media kind, before URL, after URL, consent status, vehicle label, customer label, and public note.
9. Kept generated gallery JSON under an Advanced panel for emergency repair and fallback review.
10. Added **Apply JSON to friendly editor** for gallery data so existing payloads can be imported without hand-editing code.
11. Added image preview support inside the friendly before/after gallery rows.
12. Preserved the media privacy readiness summary below the gallery editor.
13. Converted Admin Water Rules from a raw JSON-first screen to a friendly water-rule row editor.
14. Added **Add water rule** and **Delete** controls for municipal/county water-use rules.
15. Added friendly water-rule fields for rule key, label, county, municipality, public reminder, source label, source URL, verified date, next-review date, status, and internal notes.
16. Kept generated water-rule JSON under an Advanced panel for emergency repair and fallback synchronization.
17. Added advanced JSON apply/format back into the friendly water-rule editor.
18. Synced `/admin-app.html` with `/admin-app/` and `/admin-water-rules.html` with `/admin-water-rules/`.
19. Added Build 198 release guards to prevent the friendly editor markup from being removed accidentally.
20. Updated roadmap, known gaps, database/schema notes, and the no-DDL SQL note for this pass.

## Next 20 steps after Build 198

1. Convert remaining Admin Site Settings JSON helper fields into purpose-built row editors for social links, holiday closures, navigation links, footer groups, analytics event rows, media requirements, and landing content.
2. Add reusable row-editor components so future editable domains do not need one-off JavaScript.
3. Add import/export buttons that label JSON as owner/developer backup data, not the normal editing flow.
4. Add DB-backed validation summaries beside every friendly editor before save.
5. Add save-time warnings when a gallery row is missing consent or before/after pairing.
6. Add a media-library picker beside gallery and landing image URL fields.
7. Add official-source link validation for water-rule URLs.
8. Add calendar reminders for water-rule next-review dates.
9. Add a route-copy sync script so root admin HTML and folder `index.html` copies are updated automatically during packaging.
10. Add dashboard cards that list remaining direct-JSON editor fields by page and domain.
11. Add live character counters to landing-page SEO fields while typing.
12. Add public preview/diff modals for social feeds, gallery rows, and water rules before save.
13. Add structured editors for sitemap/robots, schema preview settings, and LocalBusiness fields.
14. Add template-specific editors for invoice, receipt, appointment confirmation, refund, and abandoned-cart emails.
15. Add option-library dropdowns inside the new friendly gallery/water editors where controlled values are useful.
16. Add a repair flow that can copy DB-friendly editor rows back into bundled fallback JSON during release prep.
17. Add an owner-safe “restore previous version” button directly on each friendly editor section.
18. Add per-field audit notes for who changed a row and why.
19. Add mobile layout tuning for long admin row editors on small screens.
20. Continue replacing hard-coded copy and remaining file-edited JSON with DB-backed, owner-friendly screens.

---

# Build 197 update — Self-healing admin diagnostics and landing SEO readiness

**Updated:** 2026-06-06  
**Build:** 197

Build 197 continues the roadmap after the live-error repair pass by adding admin-facing diagnostics that make drift easier to find before it becomes a customer-facing problem. This pass is no-DDL: it uses existing `app_management_settings` rows, existing root/folder route copies, and bundled JSON fallbacks. The biggest additions are pricing-catalog source/repair diagnostics, route-copy parity reporting, independent dashboard card loading, and landing-page SEO/readiness checks in Admin App.

## Build 197 — 20 completed items

1. Added `/api/admin/pricing_catalog_diagnostics` for pricing catalog source, row-count, and missing fallback-row reporting.
2. Added `/api/admin/pricing_catalog_repair` so staff can repair partial DB pricing catalogs by adding only missing fallback groups/rows.
3. Preserved existing DB pricing values during repair and only filled missing charts, packages, add-ons, service matrix, service areas, public requirements, and booking-rule defaults.
4. Added `/api/admin/route_copy_parity_report` for root `.html` versus folder `index.html` drift checks.
5. Added Admin Dashboard pricing catalog diagnostics card.
6. Added Admin Dashboard one-click **Repair partial pricing catalog** control.
7. Added Admin Dashboard route-copy parity diagnostics card.
8. Changed the Admin Dashboard loader to use independent guarded card loads so one failing diagnostics endpoint does not blank the whole dashboard.
9. Fixed the editable-setting diagnostics display so array responses from `/api/admin/editable_site_settings_status` show real setting keys instead of numeric array indexes.
10. Added landing-page SEO/readiness preview panels inside Admin App.
11. Added landing meta-title length warning guidance using the 70-character working limit.
12. Added landing meta-description length warning guidance using the 160-character working limit.
13. Added hero-title/H1 readiness checks so landing pages continue using one clear main heading.
14. Added clean-slug readiness checks for landing pages.
15. Added image/proof readiness checks for landing pages.
16. Added public preview links beside add-on and town landing editors.
17. Added save-time warning summaries for add-on landing pages.
18. Added save-time warning summaries for location landing pages.
19. Synced `/admin.html` with `/admin/` and `/admin-app.html` with `/admin-app/` after the edits.
20. Added Build 197 release guards, schema notes, and the no-DDL SQL note.

## Next 20 steps after Build 197

1. Browser-test `/admin` and confirm pricing diagnostics, route-copy diagnostics, fallback settings, and local proof cards can fail independently without blocking the dashboard.
2. Click **Repair partial pricing catalog** on staging if diagnostics reports missing rows, then re-open Landing Page Builder and confirm add-ons remain loaded.
3. Add a staff confirmation preview modal for pricing repair before the write action runs.
4. Add route-copy parity results into the release ZIP summary so drift is visible before upload.
5. Add a deploy-time script that copies every root admin HTML file into its matching folder `index.html` route copy automatically.
6. Add live keyup refresh for landing-page SEO/readiness warnings instead of requiring section reload/save.
7. Add structured-data validation hints directly beside each landing editor.
8. Add media consent/privacy badges beside landing hero/gallery image fields.
9. Add an **Assign proof task** button directly from each dashboard local SEO recommendation.
10. Add local SEO proof trend history so town/service proof coverage can show improvement over time.
11. Add Search Console query/manual keyword fields to each landing page row.
12. Add town/service internal-link recommendations from the landing editor.
13. Add dashboard warning totals for missing hero images on enabled landing pages.
14. Add document-template preview/send-test controls directly inside Admin App for invoice, confirmation, receipt, quote, and reminder copy.
15. Add option-library repair controls for missing dropdown libraries.
16. Add GET/POST endpoint-method compatibility checks to the release guard for all admin fetches.
17. Add public page content-drift detection for service/town landing pages generated from fallback versus DB settings.
18. Add a visible **DB / fallback / repaired** source badge beside every editable Admin App section.
19. Add a one-click export of pricing diagnostics for accountant/owner review.
20. Continue replacing remaining hard-coded public/payment/booking copy with DB-backed editable settings.

---

# Build 196 update — Admin live-error repairs and fallback hardening

**Updated:** 2026-06-06  
**Build:** 196

Build 196 responds to the latest live checks on `dev.rosiedazzlers.pages.dev`: the Admin Dashboard local SEO proof card was calling `/api/admin/local_seo_proof_report` with GET and receiving a 405, the Landing Page Builder could show **No add-ons loaded**, and Admin App could stop with `esc is not defined`. This pass is no-DDL and focuses on safer route/API compatibility, fallback-backed pricing data, and keeping public/local SEO editing tools usable even when a DB setting is partial.

## Build 196 — 20 completed items

1. Fixed `/api/admin/local_seo_proof_report` so both GET and POST callers work.
2. Updated the proof-report CORS allow-list to include GET, POST, and OPTIONS.
3. Kept staff access checks on the proof report for both supported request methods.
4. Added compatibility aliases on the proof report: `proof_recommendations`, `recommendations`, `next_proof_recommendations`, and `gaps`.
5. Kept the existing privacy rule that only sample or approved-public/customer-approved-public media counts as local proof.
6. Fixed Admin Dashboard local proof loading by making the endpoint compatible with its existing GET request.
7. Fixed Admin App `esc is not defined` by adding a local `esc()` alias beside the page’s existing `escapeHtml()` helper.
8. Updated both `/admin-app.html` and `/admin-app/` so the route copy cannot keep the broken helper.
9. Hardened Admin App pricing loading so the bundled pricing catalog is used if the live pricing API is unavailable.
10. Hardened editable pricing loading so partial DB rows are hydrated with bundled charts.
11. Hardened editable pricing loading so partial DB rows are hydrated with bundled packages.
12. Hardened editable pricing loading so partial DB rows are hydrated with bundled service matrix data.
13. Hardened editable pricing loading so partial DB rows are hydrated with bundled add-ons.
14. Kept saved DB values preferred while filling only missing pricing/media/category/type fields from fallback data.
15. Added an explicit Landing Page Builder warning if add-ons are missing after hydration.
16. Kept add-on landing-page image hydration preferring real PNG/photo media over SVG placeholders.
17. Kept location/service landing pages merge-safe so saved pages and fallback-generated add-on pages can coexist.
18. Added Build 196 no-DDL SQL/schema note.
19. Added a Build 196 release guard covering the reported live errors.
20. Re-ran release, syntax-oriented guard, one-H1, and zip integrity checks before packaging.

## Next 20 steps after Build 196

1. Browser-test `/admin` and confirm the Local SEO proof card no longer returns 405.
2. Browser-test `/admin-app` and confirm the console no longer reports `esc is not defined`.
3. Open the Landing Page Builder and confirm all pricing add-ons appear.
4. Save one test add-on landing page and confirm `/api/landing_pages_public` still merges fallback-generated pages.
5. Add an Admin Dashboard mini-card that displays the pricing catalog source: DB, API, or bundled fallback.
6. Add a one-click **Repair partial pricing catalog** action that safely writes missing fallback rows into the editable DB setting.
7. Add a pricing-catalog diff preview that shows DB rows missing compared with bundled fallback rows.
8. Add a landing-page proof-gap assignment button from each local SEO recommendation.
9. Add public landing-page preview links directly beside each add-on/location editor.
10. Add SEO title/meta counters directly inside the Admin App landing editor.
11. Add a one-H1 live preview warning for landing pages before save.
12. Add an image-readiness badge beside every landing page hero/gallery image field.
13. Add media consent and privacy badges beside related products/proof media used in landing pages.
14. Add versioned document templates for invoice, confirmation, receipt, quote, and reminder copy.
15. Add preview/send-test controls for every customer-facing document template in Admin App.
16. Add option-library repair controls for missing dropdown libraries.
17. Add an admin-visible route-copy parity diagnostic card for pages that exist as both root HTML and folder `index.html`.
18. Add a release guard that checks all admin GET/POST fetches match their endpoint method exports.
19. Add local SEO proof trend history so gaps can show whether coverage is improving.
20. Continue replacing remaining hard-coded public/payment/booking copy with DB-backed editable settings.

---


# Build 184 update — 20-step operations, media, and payment hardening

**Updated:** 2026-06-01  
**Build:** 184

Build 184 completes the requested next-20 pass by tightening the payment/refund operations, improving image/media readiness review, and documenting the next operational bundle. This pass is intentionally no-DDL: it uses the existing Build 180–182 payment tables and the Build 183 image requirements foundation.

## Build 184 — 20 completed items

1. Added `/admin-media-health.html` and `/admin-media-health/` so staff can review missing required photos/videos from a protected admin page.
2. Added `/api/admin/media_asset_health_scan` to scan required public R2/media URLs and return missing/not-public files with upload keys.
3. Added `data/image_requirements_build184.json` as the machine-readable source for required app, add-on, landing, gallery, and proof images.
4. Added the Media Health page to the shared Admin Menu.
5. Added Media Health access rules to `assets/admin-auth.js`.
6. Added a Media Health card to the Admin Dashboard.
7. Added `/api/admin/payment_refund_status_poll` so staff can poll Stripe/PayPal refund status and refresh local refund rows.
8. Added `/api/admin/payment_receipt_resend` so staff can requeue a customer quote-deposit receipt email from a payment request.
9. Added `/api/admin/payment_accountant_package_export` for an accountant-style payment CSV with Ontario HST allocation estimates.
10. Added an **Export accountant package** button to Admin Payments.
11. Added **Resend receipt** controls to quote deposit/payment request cards.
12. Added **Poll provider status** controls to refund record cards.
13. Kept manual refund records, provider refund initiation, webhook settlement, and replay controls on one Payments page for easier review.
14. Added `sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql` to document the no-DDL Build 184 schema status.
15. Updated `SUPABASE_SCHEMA.sql` with Build 184 operational notes.
16. Updated `DATABASE_STRUCTURE_CURRENT.md` with the Build 184 no-DDL dependency summary.
17. Updated `IMAGES.md` with the Admin Media Health scan workflow and upload review method.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` to reflect Build 184 media/payment/accounting hardening.
19. Added `scripts/build184_twenty_step_ops_media_payment_check.py` and wired it into the release check chain.
20. Re-ran the one-H1 and release guard path so exposed public pages still use one clear H1.

## Next 20 steps after Build 184

1. Deploy Build 184 and test `/admin-media-health.html` against live R2 assets.
2. Upload the missing add-on images listed in `IMAGES.md`, then re-run the Media Health scan.
3. Replace regional landing placeholders with Rosie-owned images for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria.
4. Capture the first four approved-public before/after gallery proof sets by town/service.
5. Add real image dimension validation instead of URL-only health checks.
6. Add R2 signed upload URLs for admin media replacement so uploads can happen from the app instead of the Cloudflare dashboard only.
7. Add a media task status table so missing-image items can be assigned, marked uploaded, reviewed, and approved.
8. Add provider refund polling for payment requests without refund rows, not only existing refund records.
9. Add scheduled retry checks for pending Stripe/PayPal refunds.
10. Add payment reconciliation variance warnings for paid amount vs. quote/deposit amount.
11. Add processor fee capture and estimated net payout fields to the payment export.
12. Add HST/GST allocation review screens before accountant export is considered final.
13. Add failed receipt email retry controls and visible notification-event status on Admin Payments.
14. Add customer-facing receipt PDF/download links.
15. Add final-balance invoice/payment requests after job completion.
16. Add payment application to final invoices, deposits, refunds, and tips.
17. Add month-end payment close checklist tied to reconciled provider exports.
18. Add dashboard warnings for missing images on high-traffic public pages.
19. Add Search Console/local SEO task cards tied to missing service/town proof content.
20. Add a consolidated accountant export package that bundles payment CSV, refund CSV, journal candidates, HST summary, and close checklist.

---

# Build 181 roadmap update — verified provider deposits

**Updated:** 2026-05-26

Build 181 completes the next requested workflow step: accepted quote deposits can now be settled automatically by verified Stripe/PayPal provider events instead of staff-only manual confirmation. Stripe Checkout metadata, PayPal webhook verification, and the private quote-payment PayPal return capture all update the same `quote_deposit_payment_requests` table.

## Completed in Build 181

1. Added shared quote deposit settlement helper at `functions/api/_lib/quote-deposit-payments.js`.
2. Updated `/api/stripe/webhook` to verify raw Stripe signatures and mark matching quote deposit requests paid when `quote_deposit_payment_request_id` metadata is present.
3. Added `/api/paypal/webhook` to verify PayPal webhook signatures using `PAYPAL_WEBHOOK_ID` and settle completed capture/sale events.
4. Added `/api/paypal/capture-quote-deposit` so the private customer payment page can capture approved PayPal orders and settle the same deposit request.
5. Extended quote deposit request creation so staff can choose `stripe`, `paypal`, or `manual`.
6. Added Build 181 SQL/schema tracking for provider audit fields and PayPal provider support.

## Next roadmap items

1. Add provider webhook event history with retry/replay and failure reason display.
2. Add customer receipt/booking-confirmation delivery after verified deposit.
3. Add refund/partial refund tracking connected to quote deposit requests.
4. Add final-balance invoice/payment request after job completion.
5. Add accounting journal candidates for deposits, HST, processor fees, and revenue recognition.

# Build 178 update — Status Saves, Saved Price Reviews, Public Content Rendering & Privacy Badges

**Current build:** Build 178  
**Date:** 2026-05-25

Build 178 closes the next operational gaps after Build 177 by adding conversion-draft status saving, saved final price reviews, live rendering of Admin Content Center blocks on public pages, media privacy readiness badges in the Social Queue/App Management flow, and deeper local SEO proof recommendations. No new DDL is required; this pass depends on the Build 175 content/conversion tables and Build 177 final-price review fields.

## Completed in Build 178

1. Added `/api/admin/lead_conversion_status_save` so staff can move conversion drafts through `draft_booking`, `needs_review`, `ready_to_book`, `converted`, and `closed`.
2. Added `/api/admin/lead_conversion_price_review_save` so catalog reconciliation results can be saved before booking creation.
3. Updated `/admin-conversions.html` with Save Status and Save Price Review controls.
4. Added `/assets/public-content-blocks.js` and live public content mounts on Home, Services, Specials, Fleet, Maintenance, and Help pages.
5. Added Social Queue media privacy readiness badges using the existing media privacy summary endpoint.
6. Expanded local SEO proof reporting with concrete next-proof recommendations by town/service.
7. Added a Build 178 release guard and no-DDL SQL note.

## Updated completion status after Build 178

| Area | Status | Build 178 notes |
| --- | --- | --- |
| Conversion draft status workflow | Stronger foundation | Status can now be saved without creating a booking. |
| Final price reconciliation | Stronger foundation | Reconciliation can be saved before booking creation. |
| Admin Content public rendering | Added foundation | DB/fallback content blocks can now render on public pages. |
| Media privacy before reuse | Stronger foundation | Social/Admin flows now show privacy readiness reminders. |
| Local SEO proof reporting | Stronger foundation | Report now recommends next town/service proof to create. |

## Remaining priority after Build 178

1. Add a fuller conversion-draft detail page with audit history.
2. Render saved content blocks into exact page sections rather than only generic cards.
3. Add admin approval gates that block publish/API actions unless consent and privacy statuses are approved.
4. Turn proof recommendations into assignable content/media tasks.
5. Add quote/proposal email delivery and customer acceptance tracking.

---

# Build 177 update — Conversion Review Queue, Price Reconciliation & Local Proof Reporting

**Updated:** 2026-05-25  
**Current build:** Build 177  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 177 closes the next workflow gap after Build 176 by adding a dedicated `/admin-conversions.html` review queue. Staff can now review all lead conversion drafts in one place, reconcile final package/add-on/travel/HST pricing from the pricing catalog, confirm the required booking fields, and create a live booking only after the draft is ready. Build 177 also adds local SEO proof reporting that counts only privacy-approved before/after examples by town and service.

## Completed in Build 177

1. Added `/admin-conversions.html` and `/admin-conversions/` as a protected conversion-draft review queue.
2. Added `/api/admin/lead_conversion_price_reconcile` for catalog-backed package/add-on/travel/HST/deposit review before booking creation.
3. Added `/api/admin/local_seo_proof_report` for privacy-approved town/service proof coverage reporting.
4. Updated Admin Analytics with a **Local SEO proof coverage** card.
5. Updated public Gallery cards with clearer consent/privacy badges.
6. Added optional final-price review fields to `public.lead_conversion_drafts` via `sql/2026-05-25_build177_conversion_review_price_local_proof.sql`.
7. Updated Admin Dashboard, Admin Menu, Admin Shell, and Admin Leads access paths so the Conversion Queue is easy to find.
8. Updated `SUPABASE_SCHEMA.sql`, `DATABASE_STRUCTURE_CURRENT.md`, and release guards.

## Updated completion status after Build 177

| COMPETETIVE.md area | Current status | Build 177 notes |
| --- | --- | --- |
| Lead → booking workflow | Stronger foundation | Dedicated review queue now separates draft review from the lead card UI. |
| Final price reconciliation | Added foundation | Catalog-backed package/add-on/travel/HST review is available before creating a real booking. |
| Quote/booking status workflow | Improved | Conversion drafts can be filtered/reviewed before becoming live booking rows. |
| Admin-managed content | Partial but improved | FAQ and reusable content blocks exist; page-specific live rendering remains next. |
| Service/town proof reporting | Added foundation | Analytics now reports approved proof coverage by target town/service. |
| Media privacy enforcement | Improved | Public Gallery shows consent/privacy badges and still filters non-approved media. |
| Conversion analytics | Improved | Lead/quote summary exists and local proof coverage was added to Admin Analytics. |

## Remaining competitive gap priority after Build 177

1. Save final price reconciliation payloads directly from `/admin-conversions.html` before booking creation.
2. Add a dedicated conversion-draft status update endpoint for `needs_review`, `ready_to_book`, `converted`, and `closed`.
3. Add visible privacy badges beside every admin gallery/social publish action, not only public gallery and App Management warnings.
4. Render Admin Content Center blocks live on public Specials, service, homepage, fleet, maintenance, and Help pages.
5. Add town/service proof dashboards that recommend the next local page or gallery item to create.
6. Add customer-facing quote/proposal send and acceptance tracking.

---

# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
# Build 173 update — Admin Content Center and Help Articles access pass

**Updated:** 2026-05-24  
**Current build:** Build 173  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 173 continues from the Build 172 FAQ/content-access foundation by adding a protected Admin Content Center and expanding the public Help Articles page. FAQ entries now have an admin editor path (`/admin-content.html`) using the existing Build 172 `public_faq_entries` table, and the public site now exposes Help Articles from the main navigation, footer, FAQ access section, and homepage CTA path.

## Completed in Build 173

1. Added `/admin-content.html` and `/admin-content/index.html`.
2. Added protected FAQ editor APIs: `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save`.
3. Updated Admin Dashboard, shared admin menu, and staff page-access helpers so Content Center is accessible to admins, promo managers, and staff managers.
4. Expanded `/blog` and `/blog/index.html` from a thin placeholder into a Help Articles hub with article cards, quick paths, ItemList schema, and customer-facing guidance.
5. Added public Help link to the main navigation and footer through `assets/chrome.js`.
6. Added homepage and FAQ access links to Help Articles.
7. Added `sql/2026-05-24_build173_admin_content_faq_editor_no_ddl_note.sql`.
8. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the Build 173 no-DDL schema bridge.
9. Added `scripts/admin_content_build173_check.py` and wired it into `scripts/release_check.py`.
10. Re-ran the one-H1 check and release checks.

## Active next steps after Build 173

1. Apply the Build 172 FAQ SQL before using live FAQ saves from Admin Content Center.
2. Browser-test `/admin-content.html` after staff login.
3. Add persistent quote/proposal drafts from the Build 171 quote starter.
4. Add one-click lead → draft booking/quote conversion.
5. Extend Admin Content Center to Specials, service blurbs, education/help articles, and homepage support blocks.
6. Add service/town-aware proof filtering for gallery and recent work.
7. Enforce media privacy approval before any gallery/social use.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 update — Public FAQ content and page-access cleanup

**Updated:** 2026-05-24  
**Current build:** Build 172  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 172 answers the open question about new pages: `/faq` is now a real public help page with content, FAQPage/Breadcrumb schema, search/filter behaviour, clear CTA paths, and links from the top navigation, footer, homepage, Services, Pricing, Contact, and sitemap. This pass also starts moving duplicated FAQ/help copy toward DB-managed content through `public_faq_entries` and `/api/public_faqs`, while keeping static fallback content so the page works before the SQL is applied.

## Completed in Build 172

1. Added `/faq.html` and `/faq/index.html` with mobile-detailing FAQ content for booking, service areas, pricing, photos, privacy, gift cards, fleet, and maintenance.
2. Added visible explanation of how FAQ and newer public pages are accessed.
3. Added FAQPage JSON-LD and BreadcrumbList JSON-LD to the FAQ page.
4. Added `/api/public_faqs` with DB-first read and static fallback.
5. Added `data/site_faqs.json` as the static FAQ seed/fallback dataset.
6. Added SQL migration `sql/2026-05-24_build172_public_faq_content_foundation.sql` for `public.public_faq_entries`.
7. Added `/faq` to the public top navigation and footer, plus access links from homepage, Services, Pricing, and Contact.
8. Added FAQ/access CSS helpers to `assets/site.css`.
9. Added `/faq/` to `sitemap.xml`.
10. Updated schema notes in `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
11. Added release guard `scripts/public_faq_content_build172_check.py` and wired it into `scripts/release_check.py`.
12. Continued one-H1, local wording, title/meta clarity, fallback handling, and public conversion-path discipline.

## Next several steps after Build 172

1. Deploy Build 172 and open `/faq`, `/services`, `/pricing`, `/contact`, and `/` to confirm the new FAQ links are visible.
2. Apply `sql/2026-05-24_build172_public_faq_content_foundation.sql` after Build 167/168 lead migrations if FAQ content should be DB-managed.
3. Add an Admin Content screen for FAQ, specials, service blurbs, and education snippets.
4. Add persistent quote/proposal drafts from the Build 171 quote starter.
5. Add one-click lead → draft booking/quote conversion.
6. Add service/town proof filtering for Gallery and Recent Work.
7. Add media privacy eligibility enforcement for gallery/social publishing.
8. Keep updating `COMPETETIVE_COMPLETION_MATRIX.md` until the remaining items are admin-managed rather than static.

---
# Build 171 update — Admin lead quote starter and service-key fallback polish

**Updated:** 2026-05-24  
**Current build:** Build 171  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 171 completes the next practical step after Admin Leads: staff can now generate a copy-ready quote starter from a public lead without waiting for the full quote-builder/booking-conversion system. This helps turn fleet, maintenance, specials, gift-card, general, and photo-estimate leads into consistent staff-reviewed follow-up text while keeping privacy warnings visible.

## Completed in Build 171

1. Added staff-protected `/api/admin/lead_quote_preview`.
2. Added **Build quote starter** action to `/admin-leads.html` and `/admin-leads/index.html`.
3. Quote starter reads `public_inquiry_leads` plus linked `photo_estimate_uploads`.
4. Quote starter includes contact details, vehicle/cadence clues, customer message, photo links, linked upload summaries, privacy warnings, suggested next step, and staff checklist.
5. Added copy-to-clipboard support with a manual Ctrl+C fallback.
6. Added topic-aware recommendations for fleet, maintenance, gift cards, specials, photo estimates, condition-heavy interiors, and paint/coating work.
7. Kept the workflow no-DDL and fallback-safe before optional Build 168 upload note columns are present.
8. Tightened Admin Leads/upload API configuration checks so Supabase service-key aliases match the Build 169 auth/session fallback work.
9. Added `sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql`.
10. Added `scripts/lead_quote_preview_build171_check.py` and wired it into `scripts/release_check.py`.
11. Re-ran Cloudflare Functions syntax/static checks, Build 160–171 release guards, and one-H1 validation.
12. Updated all Markdown handoff/planning files and `SUPABASE_SCHEMA.sql`.

## Next several steps after Build 171

1. Deploy this build and test `/admin-leads.html` with one lead that has no upload and one lead with linked uploads.
2. Apply Build 167 SQL and Build 168 SQL if not already applied.
3. Add one-click **lead → draft booking** creation.
4. Add persistent quote/proposal drafts so the quote starter can be saved, revised, and sent later.
5. Add package/add-on price suggestions from the live pricing catalog into the quote starter.
6. Add analytics events for quote starter generation, copy action, lead status change, and lead conversion.
7. Add service/town-aware proof filtering for gallery and recent work.
8. Move specials, FAQs, service copy, and education snippets into DB-managed admin content.
9. Enforce gallery/social eligibility from consent + privacy review + blur/crop completion.
10. Continue CSS drift, one-H1, title/meta, local wording, Cloudflare import, schema, and fallback checks every pass.

---
# Build 168 update — Admin Leads and photo estimate review

**Updated:** 2026-05-23  
**Current build:** Build 168  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 168 completes the next immediately-actionable items from `COMPETETIVE_COMPLETION_MATRIX.md`: the public lead and direct-upload foundations from Build 167 now have an internal Admin Leads screen, staff review endpoints, privacy-status controls, and release checks. This closes the largest remaining “capture exists but staff cannot triage it” gap without waiting for a full CMS or quote-builder rebuild.

## Completed in Build 168

1. Added protected `/admin-leads.html` and `/admin-leads/index.html`.
2. Added a dashboard card and top-nav link for Leads & Photo Estimates.
3. Added `admin-leads` permission handling to `assets/admin-auth.js` using the existing booking-management permission model.
4. Added `Leads & Estimates` to the shared admin menu.
5. Added `/api/admin/public_inquiry_leads_list` to search/filter structured public leads.
6. Added `/api/admin/public_inquiry_leads_save` to update lead status, staff notes, and converted booking UUID.
7. Added `/api/admin/photo_estimate_uploads_list` to search/filter direct quote-photo/video uploads.
8. Added `/api/admin/photo_estimate_uploads_save` to update upload status, privacy status, lead/booking links, and staff/privacy notes.
9. Added fallback-safe migration hints when Build 167/168 SQL has not been applied.
10. Added SQL migration `2026-05-23_build168_admin_leads_photo_review.sql`.
11. Extended `photo_estimate_uploads` planning schema with `staff_note`, `privacy_note`, `reviewed_at`, and `reviewed_by_staff_user_id`.
12. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with Build 168 schema notes.
13. Updated `COMPETETIVE_COMPLETION_MATRIX.md` so Admin Leads, lead conversion notes, and photo upload review are no longer listed as completely missing.
14. Added release guard `scripts/admin_leads_build168_check.py`.
15. Wired the Build 168 guard into `scripts/release_check.py`.
16. Re-ran Cloudflare Functions static checks, Build 160-168 release guards, and one-H1 validation.

## Next several steps after Build 168

1. Apply Build 167 SQL, then apply Build 168 SQL in Supabase.
2. Open `/admin-leads.html` after deploy and confirm public leads load for staff with booking-management access.
3. Submit one test fleet form and one maintenance form, then mark each through new → contacted → quoted/converted.
4. If enabling direct uploads, configure `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`, bucket env vars, public media base URL, and upload-size limits.
5. Add a true quote-builder action that creates a quote/package recommendation from lead details, photo links/uploads, condition flags, and add-ons.
6. Add a one-click conversion action from public lead → draft booking or draft quote.
7. Add service/town-aware proof filtering for gallery and recent work.
8. Move specials, service FAQ, education snippets, and service/package public copy into DB-managed admin content.
9. Enforce gallery/social publishing eligibility from customer consent + upload/media privacy status + blur/crop completion.
10. Add analytics events for public lead submit, Admin Leads status changes, upload review actions, and quote conversion.
11. Continue CSS drift, one-H1, title/meta, local wording, Cloudflare imports, and fallback checks every pass.

---

# Build 167 update — COMPETETIVE completion matrix follow-up

**Updated:** 2026-05-23  
**Current build:** Build 167  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 167 attempts to complete the remaining immediately-actionable items in `COMPETETIVE_COMPLETION_MATRIX.md`. The pass adds a direct photo/video estimate upload foundation, structured public lead capture for fleet and maintenance, FAQPage/Breadcrumb schema foundations, and a formal release guard so these competitor-matrix improvements stay visible.

## Completed in Build 167

1. Re-read `COMPETETIVE_COMPLETION_MATRIX.md`, `DEVELOPMENT_ROADMAP.md`, and `KNOWN_GAPS_AND_RISKS.md`.
2. Kept this file as the source of truth.
3. Added public endpoint `/api/public_lead_submit`.
4. Added public endpoint `/api/public_photo_estimate_upload_url`.
5. Added optional direct upload UI to Booking Step 4.
6. Added upload status/fallback messaging when direct upload is not enabled.
7. Added automatic append of uploaded estimate media links into `photo_estimate_links`.
8. Added structured fleet quote form to `/fleet`.
9. Added structured fleet quote form to `/fleet/index.html`.
10. Added structured maintenance interest form to `/maintenance`.
11. Added structured maintenance interest form to `/maintenance/index.html`.
12. Added FAQPage schema foundations to competitor-route public pages.
13. Added BreadcrumbList schema foundations to competitor-route public pages and starter education articles.
14. Added SQL migration `2026-05-23_build167_competetive_matrix_leads_upload_schema.sql`.
15. Added `public_inquiry_leads` schema for fleet/maintenance/public lead capture.
16. Added `photo_estimate_uploads` schema for optional public estimate-upload auditing.
17. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with new completion status.
18. Updated `KNOWN_GAPS_AND_RISKS.md` with Build 167 risks and reduced gaps.
19. Updated schema documentation and handoff docs.
20. Added `scripts/competetive_matrix_build167_check.py` and wired it into release checks.
21. Re-ran release checks, Cloudflare Functions checks, inline-script checks, and one-H1 validation.

## Next several steps after Build 167

1. Run the Build 167 SQL migration in Supabase.
2. Decide whether to enable direct uploads by setting `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`.
3. Configure `PHOTO_ESTIMATE_BUCKET` / `JOB_MEDIA_BUCKET` and a safe public media base URL if direct uploads should return public links.
4. Add an Admin Leads screen for `public_inquiry_leads`.
5. Add staff actions to convert a public lead into a booking, quote, or follow-up task.
6. Add Admin Photo Estimate Uploads review for `photo_estimate_uploads`.
7. Link direct uploaded media to booking intake after checkout when customer details match.
8. Add DB-managed editing for services, specials, FAQs, and education snippets.
9. Add service/town-aware proof filtering for gallery and recent work.
10. Add quote-builder workflow from booking intake, photo links/uploads, condition flags, package recommendation, and add-ons.
11. Add media-level privacy records for every uploaded or progress photo/video.
12. Enforce gallery/social publishing eligibility from consent, privacy approval, and blur/crop completion.
13. Add analytics for lead form submit, upload start, upload success/failure, and quote conversion.
14. Add more local education pages from the competitor roadmap.
15. Continue CSS drift, one-H1, title/meta, Cloudflare import, and fallback checks every pass.

---

# Build 166 update — COMPETETIVE.md completion pass

**Updated:** 2026-05-23  
**Current build:** Build 166  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 166 completes a broad public-facing pass against `COMPETETIVE.md`. It adds missing customer entry routes for specials, gift cards, fleet/commercial work, maintenance plans, and education articles; expands the add-on catalog; adds a global sticky conversion CTA; updates the Services hub and homepage route choices; and documents the remaining backend/admin work in `COMPETETIVE_COMPLETION_MATRIX.md`.

## Completed in Build 166

1. Re-read `COMPETETIVE.md`, `DEVELOPMENT_ROADMAP.md`, and `KNOWN_GAPS_AND_RISKS.md`.
2. Kept this file as the implementation source of truth.
3. Added `COMPETETIVE_COMPLETION_MATRIX.md`.
4. Updated `COMPETETIVE.md` with a Build 166 completion-pass note.
5. Synced `COMPETITOR.md` and `COMPETETOR.md` aliases.
6. Added a global sticky conversion CTA bar through `assets/chrome.js`.
7. Updated default nav links to include Specials, Gift Cards, and Fleet.
8. Added public `/specials` and `/specials/index.html`.
9. Added public `/gift-cards` and `/gift-cards/index.html`.
10. Added public `/fleet` and `/fleet/index.html`.
11. Added public `/maintenance` and `/maintenance/index.html`.
12. Added public `/blog` help hub.
13. Added education pages for Ontario road salt cleanup, pet hair removal, ceramic coating vs wax, paint correction basics, and preparing for mobile detailing.
14. Expanded bundled add-ons in the pricing catalog and Functions fallback catalog.
15. Synced catalog JSON in `/data` and `/functions/api/data`.
16. Updated Services with a full competitor-aligned service hub.
17. Updated Homepage with a clearer choose-the-easiest-path CTA section.
18. Updated sitemap entries for the new public routes.
19. Added `scripts/competetive_completion_check.py`.
20. Added the new guard to `scripts/release_check.py`.
21. Added Build 166 no-DDL SQL note and schema documentation.
22. Re-ran release checks and one-H1 validation.

## Next several steps after Build 166

1. Deploy Build 166 and verify the new routes: `/specials`, `/gift-cards`, `/fleet`, `/maintenance`, and `/blog`.
2. Add direct customer file upload to complement photo/media share links.
3. Add a quote-builder screen that turns reviewed photo estimates into package/add-on proposals.
4. Add service/town-aware proof filters for gallery and recent work.
5. Add media-level privacy records for each job photo/video.
6. Enforce gallery/social eligibility from consent, privacy status, and blur/crop completion.
7. Move specials, gift cards, service FAQs, and education snippets into DB/admin-managed content.
8. Add FAQPage and BreadcrumbList schema generation for public service/help pages.
9. Add structured fleet and maintenance lead forms.
10. Add analytics for sticky CTA clicks, photo-estimate starts, special-page visits, and quote-first conversion.
11. Add more education articles from `COMPETETIVE.md`, including coffee stains, UV protection, and how often to detail.
12. Add real review/proof mapping when service/town proof items are approved.
13. Continue CSS drift checks on Services, Booking, Contact, Admin Booking, Admin Social, and new public pages.
14. Continue one-H1/title/meta/local wording checks every pass.
15. Continue Cloudflare deploy safety checks to avoid stale function/import problems.


---

# Build 165 update — Booking photo-estimate link capture

**Updated:** 2026-05-22  
**Current build:** Build 165  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 165 continues the conversion-path work from Builds 160–164. The public booking flow now lets customers paste photo/media share links before checkout, marks the booking as photo-estimate reviewable when links are present, stores the links directly when the Build 165 migration is applied, and still falls back to booking notes if the optional database column is not live yet. Admin Booking now surfaces the submitted links in the intake/media consent panel so staff can open them while quoting or privacy-reviewing the job.

## Completed in Build 165

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added a customer-facing `Photo estimate links` field to Booking Step 4.
4. Added duplicate-safe parsing for pasted Google Drive, Dropbox, iCloud, Facebook, or other media links.
5. Auto-checks the photo-estimate request flag when customers paste photo/media links.
6. Added photo-estimate link count to the final booking summary.
7. Sends `photo_estimate_links` through checkout.
8. Checkout now treats link submissions as photo-estimate requests even when the checkbox was missed.
9. Checkout stores the links in booking notes for fallback-safe staff review.
10. Checkout writes `photo_estimate_links` directly when the optional Build 165 column is live.
11. Added `photo_estimate_links` to the optional booking-field fallback list so checkout does not break before migration.
12. Added `photo_estimate_links` to admin booking-list optional selects.
13. Admin Booking intake review panel now shows submitted photo/media links as clickable staff review links.
14. Added Build 165 SQL migration for `bookings.photo_estimate_links`.
15. Added a GIN index for future reporting/filtering of photo-estimate link data.
16. Updated `SUPABASE_SCHEMA.sql`.
17. Added release guard `scripts/booking_photo_estimate_links_check.py`.
18. Added the new guard to `scripts/release_check.py`.
19. Re-ran SEO/H1, Cloudflare, social, conversion, booking-intake, and release checks.
20. Updated active Markdown files so Build 165 status and next steps are documented.

## Next several value-added steps after Build 165

1. Deploy Build 165 and apply SQL migrations in order: Build 162, Build 163, Build 164, then Build 165.
2. Confirm public booking saves photo-estimate links into notes before migration and into `photo_estimate_links` after migration.
3. Add a direct public upload flow for customers who do not want to use third-party share links.
4. Add staff quote-building actions that convert photo-estimate review into a proposed package/add-on set.
5. Add media-level privacy review records for each uploaded or linked job photo/video.
6. Enforce gallery/social eligibility from booking consent plus media-level privacy status.
7. Add Admin Booking filters for photo-estimate links present, quote needed, media review needed, and blur/crop needed.
8. Add customer notification templates for photo estimate received, quote ready, and media/privacy approval request.
9. Add approved-photo proof blocks to town/service landing pages.
10. Move more service FAQ/proof content into DB-managed admin content where possible.
11. Add analytics for photo-estimate link submissions and quote-first conversion rate.
12. Add abandoned booking recovery that references the selected package and quote-first intent without exposing private details.
13. Add optional customer portal upload/edit for estimate media after booking is created.
14. Add reminder workflow for staff when a photo-estimate request has not been reviewed within the target window.
15. Continue CSS drift checks on Booking, Admin Booking, Services, Contact, and Admin Social.
16. Continue one-H1 and local title/meta checks every pass.
17. Continue Cloudflare Pages Function import/syntax checks every pass.
18. Plan a clean/orphan branch refresh after deploy stability is confirmed so stale GitHub files cannot keep reappearing.
19. Keep `COMPETITOR_SANITY_CHECK.md` aligned with this roadmap after each conversion-path pass.
20. Keep `KNOWN_GAPS_AND_RISKS.md` focused on active risks and next decisions, not old completed build notes.

---

# Build 164 update — Admin booking intake review actions

**Updated:** 2026-05-22  
**Current build:** Build 164  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 164 continues the competitor/conversion-path work after Builds 160–163. Build 163 made booking condition, photo-estimate, and media-consent details visible to staff; Build 164 adds staff action controls so those details can be reviewed, marked, and documented from Admin Booking. The workflow is fallback-safe: if the optional direct columns are not migrated yet, the action is appended to booking notes instead of breaking the admin screen.

## Completed in Build 164

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added Admin Booking intake review controls for photo-estimate status.
4. Added Admin Booking intake review controls for condition-review status.
5. Added Admin Booking intake review controls for media/privacy status.
6. Added staff checkboxes for license plate review, face review, address/private-identifier review, blur/crop needed, and blur/crop complete.
7. Added a staff intake-review note field.
8. Added `set_intake_review` support to `/api/admin/booking_update`.
9. Synced the root compatibility route `/api/booking_update`.
10. Added allowed-value validation for photo, condition, and media/privacy statuses.
11. Added direct booking updates for review statuses and privacy flags when the Build 162/163/164 migrations are live.
12. Added direct booking updates for `intake_review_note`, `intake_reviewed_at`, and `intake_reviewed_by` when Build 164 migration is live.
13. Added fallback behavior that appends the review action to booking notes if optional intake columns are missing.
14. Added booking-event logging for staff intake review changes.
15. Added optional fields to the Admin Booking list select so saved review notes and review timestamps can display.
16. Synced `/admin-booking.html` and `/admin-booking/index.html`.
17. Added `sql/2026-05-22_build164_booking_intake_review_actions.sql`.
18. Updated `SUPABASE_SCHEMA.sql` with the Build 164 schema note.
19. Added `scripts/booking_intake_review_actions_check.py`.
20. Wired the Build 164 guard into `scripts/release_check.py`.

## Next several value-added steps after Build 164

1. Deploy Build 164 and confirm Admin Booking can save intake review status fields.
2. Apply SQL migrations in order: Build 162, Build 163, then Build 164.
3. Add real customer photo upload/lead capture before checkout so photo estimates can include customer images.
4. Add media-level privacy review actions on each uploaded job photo/video, not only at the booking level.
5. Enforce gallery/social eligibility from consent + media privacy status + blur/crop completion.
6. Add a staff “quote from photos” workflow that can convert a photo-estimate booking into a proposed package/add-on set.
7. Add customer notification templates for photo-estimate received, quote ready, and privacy/media approval request.
8. Move public service FAQs/proof blocks from scattered JSON/HTML into DB-managed admin content where possible.
9. Add proof filtering by service type, town, vehicle type, and consent/privacy status.
10. Add a gift-card/specials merchandising path after the booking conversion path is stable.
11. Add town/service landing-page proof blocks using only approved public media.
12. Add analytics for service chooser usage, condition-helper selections, quote-first starts, and booking conversions.
13. Add abandoned booking recovery that references the chosen package/condition flags without exposing private details.
14. Add booking-intake dashboard filters: photo estimate requested, needs condition review, needs media review, ready for quote.
15. Continue CSS drift checks on Booking, Admin Booking, Services, Contact, and Admin Social.
16. Continue one-H1 and local title/meta checks every pass.
17. Continue Cloudflare Pages Function import/syntax checks every pass.
18. Plan a clean/orphan branch refresh after deploy stability is confirmed so stale files cannot remain in GitHub.
19. Keep `COMPETITOR_SANITY_CHECK.md` aligned with this roadmap after each conversion-path pass.
20. Keep `KNOWN_GAPS_AND_RISKS.md` focused on active risks, not historical build notes.

---

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

## Build 169 — Auth/API 500 fallback repair (2026-05-23)

Completed after live testing showed `/api/admin/auth_me`, `/api/client/auth_me`, `/api/analytics/ingest`, `/api/client/auth_login`, and `/api/admin/auth_login` returning browser-visible 500s on `/login` and `/admin-leads.html`. This pass hardened the shared auth/session endpoints so identity checks fail open as signed-out/degraded JSON instead of breaking page load, while actual login remains protected by Supabase staff/customer records. Analytics ingestion now skips safely when storage is unavailable. A root `favicon.ico` was added to remove the browser 404.

Next roadmap focus: apply/verify auth tables and environment variables in Cloudflare Pages, then add lead-to-quote conversion on top of the now-stable Admin Leads screen.

## Build 170 — Customer dashboard signed-out fallback repair (2026-05-24)

Live testing showed `/api/client/dashboard` still returned a browser-visible 401 when the booking/account UI checked for saved garage/customer data without a valid customer session. Build 170 changes the customer dashboard read endpoint to return a safe signed-out payload instead of a failed resource:

- `ok:false`, `authenticated:false`, `signed_out:true`, `code:"not_authenticated"` for normal signed-out visitors.
- Safe degraded JSON for missing Supabase dashboard/session storage.
- Empty arrays for bookings, vehicles, media, gift certificates, redemptions, and reviews so public helpers can stop quietly.
- Existing customer write endpoints remain protected and can still reject unauthenticated writes.

Next roadmap action: once login/session creation is confirmed on Preview and Production, continue lead-to-draft-quote conversion from the Build 168 Admin Leads screen.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — next roadmap items moved forward

Completed foundations for the listed outstanding items: lead → draft booking/quote conversion, catalog-backed package/add-on price suggestions, quote draft status workflow, Admin Content expansion beyond FAQ, gallery service/town proof filtering, media privacy enforcement before public reuse, and FAQ/help/lead/quote conversion analytics. Next work should turn conversion drafts into one-click real booking creation once staff confirms date, address, access, vehicle size, and final price.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 update

Completed the next step after Build 175: reviewed conversion drafts can now become real booking rows from Admin Leads, but only after required final booking details are confirmed. Admin Analytics now shows lead/quote conversion summary cards, and App Management now warns when gallery or uploaded media is not public-ready.

Next roadmap focus: add a fuller booking review screen for conversion drafts, improve pricing-to-final-total reconciliation, and add visible admin badges wherever content/media is blocked by privacy state.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

### Build 179 roadmap movement

Completed foundations for hard social publish blocking, local proof task assignment, and quote/proposal delivery acceptance tracking. Next roadmap priority is turning accepted quotes into deposit/payment and customer booking confirmation steps.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 roadmap progress

Completed foundation: accepted quote → deposit/payment request → final booking confirmation tracking.

New/changed pieces:
- `/api/admin/quote_deposit_request_create` creates a deposit/payment request from an accepted quote draft.
- `/quote-payment.html` gives the customer a private, noindex review/payment page.
- `/api/admin/quote_deposit_request_mark_paid` lets staff record manual/verified deposit payment and confirm a linked booking when available.
- `/api/admin/quote_deposit_requests_list` lets Admin Leads reload deposit/payment request history per quote.

Next roadmap item: connect provider webhooks or return verification into the same request table so Stripe/PayPal payments can mark requests paid automatically instead of staff-only confirmation.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

## Build 182 completed — payment reliability pass

Completed the next payment-system reliability step: provider webhook event history, replay controls for verified events, queued customer receipt emails, and refund/partial-refund tracking. This gives the quote-deposit workflow an audit trail instead of only relying on the current payment request row.

Next best payment steps:

1. Add direct Stripe/PayPal refund initiation from Admin Payments with staff confirmation and reason codes.
2. Add receipt/refund delivery status cards that read from `notification_events`.
3. Add payment reconciliation export rows for accountant review.
4. Add dashboard warnings for unverified/failed webhook events that need staff review.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

### Build 183 completed

- Added direct provider refund initiation for quote deposit/payment requests using Stripe Refunds and PayPal captured-payment refunds.
- Added payment reconciliation CSV export from deposit requests, refunds, and webhook events.
- Added dashboard warnings for failed/unverified webhook events so payment issues surface outside the Payments page.
- Cleared and rebuilt `IMAGES.md` with missing add-on, package, regional, gallery, and video media requirements plus upload methods.

### Next payment/media direction

1. Add provider refund status polling so pending refunds can refresh automatically.
2. Add accountant-ready payment export packaging with HST/GST allocation.
3. Add image-health scanning against the R2 public asset domain and show missing-image warnings in Admin App.


## Build 185 — Next 20 completed foundations

1. Added real image dimension validation to Media Health for PNG/JPEG/WebP files.
2. Added admin R2 upload endpoint with size validation and safe allowed folders.
3. Added DB-backed media task workflow with JSON fallback.
4. Added `public.media_asset_tasks` SQL foundation.
5. Added refund retry scan endpoint for pending/failed provider refunds.
6. Added payment variance warning summary.
7. Added processor-fee capture endpoint and Admin Payments fee field.
8. Added HST/GST review screen and tax summary endpoint.
9. Added receipt retry queue endpoint.
10. Added customer receipt HTML/download endpoint.
11. Added final-balance payment request tables and APIs.
12. Added payment application tables and APIs for deposits/invoices/refunds.
13. Added month-end close checklist table/API/screen.
14. Added dashboard warnings for missing media, undersized media, payment variances, and receipt retries.
15. Added Search Console/local SEO task card table/APIs/screen.
16. Added consolidated full accountant export endpoint.
17. Added processor-fee fields to `quote_deposit_payment_requests`.
18. Added `data/image_requirements_build185.json` for scan/task fallback.
19. Rebuilt `IMAGES.md` with exact upload keys, sizes, requirements, and methods.
20. Added Build 185 release guard and schema/docs synchronization.

## Next 20 recommended steps after Build 185

1. Deploy Build 185.
2. Apply `sql/2026-06-02_build185_next_twenty_ops_foundations.sql`.
3. Configure the Cloudflare Pages R2 bucket binding for admin uploads.
4. Upload the 12 missing add-on images listed in `IMAGES.md`.
5. Replace the eight regional placeholder hero images with Rosie-owned photos.
6. Test `/admin-media-health.html` upload, scan, and task creation.
7. Add R2 signed/direct browser upload support for larger video files.
8. Add media approval status transitions: assigned → uploaded → reviewed → approved_public.
9. Add automatic image alt-text suggestions from the media task label/category/town.
10. Add a public-page missing-media warning badge beside affected page links.
11. Test processor-fee capture on real Stripe and PayPal sandbox transactions.
12. Add automatic processor-fee import from Stripe balance transactions and PayPal captures.
13. Test `/admin-tax-review.html` and confirm HST assumptions with the accountant.
14. Test `/admin-close.html` for a month-end payment close dry run.
15. Add final-balance payment checkout links for Stripe and PayPal.
16. Add customer-facing final invoice/receipt PDF generation.
17. Add payment application posting into journal candidates.
18. Add variance approvals so resolved warnings stop showing on the dashboard.
19. Add Search Console API import for query/page data if credentials are configured.
20. Build the full accountant package zip with separate CSVs, PDF receipts, close checklist, HST summary, and journal candidates.

---

## Build 186 - verified water restrictions and next-20 planning sync (2026-06-02)

Build 186 corrected the service-area water-use guidance after source verification. Oxford County / Tillsonburg now uses the May 1-September 30 rule under Oxford County By-law No. 4193-2002: outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity, with residential hours of 6:00-9:00 a.m. or 6:00-9:00 p.m. and commercial/industrial hours of 8:00-10:00 a.m. or 3:00-5:00 p.m. Norfolk County now uses the May 15-September 15 Water Restriction By-law rule: 9:00-11:00 a.m. and 7:00-10:00 p.m., with odd/even house-number days and the first-24-hours sod exemption note.

Updated runtime/content areas: `data/service_area_rules.json`, `data/water_restriction_rules_build186.json`, booking fallbacks, Admin App service-area defaults, landing page content, `functions/api/water_restrictions_public.js`, `functions/api/admin/water_restrictions_audit.js`, and the Build 186 release guard.

Completed next-20 items for this pass:
1. Verified Tillsonburg/Oxford County water restrictions from the official Tillsonburg and Oxford pages.
2. Verified Norfolk County watering restrictions from the official Norfolk County page.
3. Corrected all Oxford County service-area rows in `data/service_area_rules.json`.
4. Corrected all Norfolk County service-area rows in `data/service_area_rules.json`.
5. Added the Tillsonburg water-restriction page as an official source for Tillsonburg rows.
6. Added `data/water_restriction_rules_build186.json` as a compact verified rule source.
7. Corrected booking fallback water rules in `book.html`.
8. Synced the `/book/` mirror.
9. Corrected Admin App default service-area water rules in `admin-app.html`.
10. Synced the `/admin-app/` mirror.
11. Corrected water wording in root landing-page public content.
12. Corrected water wording in the Functions landing-page public content copy.
13. Added `/api/water_restrictions_public` as a public safe fallback endpoint.
14. Added `/api/admin/water_restrictions_audit` as a staff DB audit endpoint.
15. Added a no-DDL SQL note for Build 186.
16. Updated `SUPABASE_SCHEMA.sql` with the Build 186 schema/data note.
17. Updated `DATABASE_STRUCTURE_CURRENT.md` with the water-rule data dependency note.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with water-rule accuracy progress.
19. Added `scripts/build186_verified_water_restrictions_check.py`.
20. Wired the Build 186 guard into `scripts/release_check.py`.

Next 20 steps to move toward:
1. Deploy Build 186.
2. Re-import/resave `data/service_area_rules.json` into Supabase if the `service_area_rules` table is live.
3. Test `/api/water_restrictions_public` for Oxford County and Norfolk County.
4. Test `/api/admin/water_restrictions_audit` while signed in as admin.
5. Check `/book` and confirm the selected service-area rules show the corrected wording.
6. Check `/admin-app` and confirm service-area defaults show the corrected wording.
7. Add an Admin App button to import bundled service-area rules into Supabase.
8. Add a visual warning when the DB service-area rules are older than bundled fallback rules.
9. Add a scheduled or manual source-verification checklist for municipal rule pages.
10. Add a public FAQ item explaining water-use timing for mobile detailing.
11. Add booking-time validation that reminds staff when a requested appointment conflicts with local water-use windows.
12. Add a customer-facing note that Rosie Dazzlers can bring water/power when needed, but municipal rules still need checking.
13. Add per-town temporary notice overrides for drought/emergency restrictions.
14. Add a service-area rule version field in Supabase.
15. Add admin change history for service-area rule edits.
16. Add local SEO copy snippets that mention the accurate county rules without over-promising availability.
17. Add a quick “Can we do exterior work at this time?” helper for staff dispatch.
18. Continue payment/tax work from Build 185: processor-fee imports and HST/GST review.
19. Continue media work from Build 185: R2 direct uploads, media approval transitions, and missing-media warnings.
20. Continue accountant export work: HST summary, journal candidates, receipts, and close checklist packaging.


## Build 187 Sync — Verified Local Page Water Rules (2026-06-03)

- Reverified Oxford/Tillsonburg, Woodstock/Oxford, and Norfolk water-use restrictions from official public sources.
- Corrected the static town landing-page shell so `/tillsonburg-auto-detailing/` and every other local page shows the water-use note even before client-side rendering.
- Added server-side landing-page enforcement so stale Admin App/DB landing-page rows cannot hide the corrected water-rule note.
- Added `data/water_restriction_rules_build187.json`, updated service-area/local SEO data, and added a no-DDL SQL note.
- Added a Build 187 release guard to check every local page for the correct Oxford/Norfolk water-rule language.


## Build 187 Completed Next 20

1. Reverified Tillsonburg/Oxford water restrictions from the official Town of Tillsonburg page.
2. Reverified Oxford County water-conservation communities and hours from the official Oxford County page.
3. Reverified City of Woodstock outdoor water-use wording from the official Woodstock page.
4. Reverified Norfolk County watering restrictions from the official Norfolk County page.
5. Added `data/water_restriction_rules_build187.json`.
6. Synced `data/water_restriction_rules_build186.json` so older fallback references are not stale.
7. Added Zorra Township to `data/service_area_rules.json` with the verified Oxford County water rule.
8. Added verified water-rule summaries to `data/local_seo_targets.json`.
9. Added static visible water-rule sections to all eight local town landing pages.
10. Updated `/tillsonburg-auto-detailing/` so the corrected Tillsonburg/Oxford rule is visible without waiting for JavaScript.
11. Updated `/woodstock-ingersoll-auto-detailing/` with Woodstock/Oxford verified rule wording.
12. Updated `/norwich-otterville-auto-detailing/` with Oxford verified rule wording.
13. Updated `/zorra-thamesford-embro-auto-detailing/` with Oxford verified rule wording.
14. Updated all Norfolk local pages with Norfolk May 15–September 15 odd/even and time-window wording.
15. Updated `assets/landing-page.js` to render a dedicated local water-use reminder card.
16. Updated `landing_pages_public.js` and `functions/api/landing_pages_public.js` to enforce verified local water rules over stale DB landing-page values.
17. Updated `/api/water_restrictions_public` to Build 187 fallback data.
18. Added CSS for local water-rule cards.
19. Added `sql/2026-06-03_build187_local_page_water_rules_no_ddl_note.sql`.
20. Added and wired `scripts/build187_local_page_water_rules_check.py`.


## Build 187 Next 20 To Move Toward

1. Deploy Build 187.
2. Hard refresh `/tillsonburg-auto-detailing/` and confirm the static water-use note appears.
3. Test `/api/landing_pages_public` for `tillsonburg-auto-detailing`.
4. Test `/api/water_restrictions_public?slug=tillsonburg-auto-detailing`.
5. Re-import the bundled service-area rules into Supabase if live DB rows are used.
6. Add an Admin App “sync verified service-area rules” button.
7. Add DB row version warnings when DB service-area rules are older than bundled fallback rules.
8. Add booking-time warnings when exterior work conflicts with a customer’s local water-use window.
9. Add address parity helper: even/odd address + date = “allowed/not allowed.”
10. Add staff “Can we use customer water at this time?” helper.
11. Add emergency/drought override rows by county/town.
12. Add municipal-source recheck reminders before each May water-restriction season.
13. Add Search Console/local SEO task cards for all town pages.
14. Add local proof cards to each town page once real before/after photos are uploaded.
15. Replace Wikimedia/placeholder region photos with Rosie-owned local photos.
16. Add Admin Media Health warnings beside local pages that still use placeholder photos.
17. Continue R2 signed/direct uploads for larger video files.
18. Continue processor-fee imports and HST/GST review.
19. Continue final balance invoice/payment request work.
20. Continue accountant export packaging with HST summary, journal candidates, receipts, and close checklist.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

## Build 188 completed roadmap items

1. Fixed the `landing_pages_public.js` module-initialization crash without hard-coding water rules.
2. Added DB-first `water_restriction_rules` authority with stable JSON fallback.
3. Added protected Water Rules admin editor.
4. Changed service-area rows to reference `water_rule_key` instead of duplicated rule text.
5. Updated booking, local landing pages, service-area APIs, and dispatch audit to derive water wording at runtime.
6. Removed giant inline pricing-catalog JSON from three JavaScript loaders.
7. Removed Cloudflare’s invalid `/landing/*` redirect-loop rule.
8. Added a 40-domain editable-content hard-coding audit.
9. Added Build 188 SQL, schema notes, release guard, and documentation sync.

### Next 20 roadmap steps

1. Apply the Build 188 SQL and save the bundled water rules through `/admin-water-rules.html`.
2. Add a one-click “sync bundled fallback to DB” action with preview/diff.
3. Add database rule-version and stale-review warnings.
4. Add temporary emergency/drought override rows with start/end dates.
5. Add booking-time water-window conflict warnings using address parity and appointment time.
6. Add a staff “Can exterior work use customer water now?” helper.
7. Move the large default landing-page objects from JavaScript into `data/landing_pages.json`.
8. Move business identity, contact details, social links, and structured-data values into one business-profile setting.
9. Move deposits, cancellations, rescheduling, refund, driveway, water, and power policy copy into editable content.
10. Finish notification template management for booking, lead, payment, and operational emails.
11. Finish quote, proposal, invoice, receipt, and refund document templates.
12. Add editable social caption templates and approval workflow.
13. Add editable business hours, holiday closures, and seasonal availability.
14. Add editable navigation/footer links and labels.
15. Add one option-library authority for lead, booking, quote, content, and accounting dropdowns.
16. Move analytics event labels/definitions into an editable registry.
17. Replace build-specific media requirement files with a stable fallback plus DB tasks.
18. Add hard-coded-content release checks for business identity and policy copy.
19. Add a content-authority dashboard showing DB/file/code ownership and stale fallbacks.
20. Continue local SEO proof, Search Console, payment, accounting, and media workflow improvements.


---

## Build 189 — Editable site settings and hard-coding reduction (2026-06-04)

This pass moves the next high-priority mutable content/configuration domains out of hard-coded JavaScript and into DB-first app-management settings with stable JSON fallbacks. Completed items:

1. Extracted large default landing-page fallback content from `functions/api/landing_pages_public.js` into `data/landing_pages_content.json`.
2. Added `functions/api/data/landing_pages_content.json` so Cloudflare Functions can import the same stable fallback.
3. Moved add-on landing-page templates out of JavaScript into the landing-page content fallback.
4. Added editable `business_profile` fallback data for identity, contact, social links, and structured-data values.
5. Added editable `site_policies` fallback data for deposit, cancellation, refund, driveway, water, power, and media privacy copy.
6. Added editable `document_templates` fallback data for notification, receipt, refund, quote, proposal, invoice, and confirmation templates.
7. Added editable `business_hours_holidays` fallback data for hours, closure days, and availability notes.
8. Added editable `navigation_footer` fallback data for top navigation and footer links.
9. Exposed dropdown/option libraries through the editable settings registry.
10. Added editable `analytics_event_registry` fallback data for analytics event keys and display labels.
11. Added stable `data/media_requirements.json` as the long-term media requirement fallback.
12. Added shared `functions/api/_lib/editable-settings.js` for DB-first / JSON-fallback setting loading.
13. Added protected `/api/admin/editable_site_settings` for staff editing.
14. Added public `/api/site_settings_public` for safe front-end consumption.
15. Added `/admin-site-settings.html` and `/admin-site-settings/` as the protected editor bridge.
16. Added Admin Menu and Admin Auth access for the new editor page.
17. Added `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
18. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
19. Updated `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json`.
20. Added `scripts/build189_editable_site_settings_check.py` and wired it into `scripts/release_check.py`.

Next 20 steps after Build 189:

1. Deploy Build 189.
2. Apply `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
3. Open `/admin-site-settings.html` and verify all editable domains load.
4. Save one small test edit to `business_profile`.
5. Save one small test edit to `site_policies`.
6. Sync the full landing-page fallback payload into `app_management_settings.landing_pages_content` only after reviewing size/performance.
7. Move live landing-page editor controls from raw JSON into a structured form.
8. Render public business profile values into structured data and page footer from `/api/site_settings_public`.
9. Render editable navigation/footer links from `navigation_footer`.
10. Wire editable policies into booking, FAQ, quote, and payment pages.
11. Wire document templates into quote delivery, deposit receipts, refund notices, invoices, and final confirmations.
12. Add business-hours and holiday-closure checks to booking availability.
13. Replace scattered hard-coded dropdown values with `option_libraries`.
14. Add analytics event validation against `analytics_event_registry`.
15. Replace build-specific media requirement checks with stable `media_requirements`.
16. Add a one-click “sync bundled JSON into DB setting” control for each editable domain.
17. Add setting version history or audit events.
18. Add field-level validation for each editable setting.
19. Add a public settings cache/version badge in Admin Diagnostics.
20. Continue moving remaining large inline page/content objects into DB-managed content blocks.

## Build 190 - Editable settings live rendering and diagnostics

Build 190 continues the editable-content migration by rendering public business profile, contact details, social links, navigation/footer links, policy notes, LocalBusiness structured data, analytics labels, and media requirements from DB-first editable settings with bundled JSON fallback. It adds validation, sync-from-bundle controls, DB/fallback diagnostics, and setting history support through `/admin-site-settings.html` and the Build 190 SQL migration.

---

## Build 191 — Editable settings hardening and live-use pass

- Fixed `/admin-site-settings.html` crash by adding `AdminAuth.guardPage()` and `AdminAuth.fetchWithAuth()` compatibility helpers and by making the page initialization defensive.
- Added structured helper fields for business profile and navigation/footer settings while keeping raw JSON available.
- Added editable setting dependency map and restore-from-history API foundations.
- Wired editable policy copy into booking, FAQ, quote-response, and quote-payment customer pages with a static fallback.
- Wired editable document templates into quote/proposal delivery plus deposit receipt/refund email queue helpers.
- Added business-hours/holiday status API and booking-page helper.
- Added analytics ingest validation against the editable analytics event registry.
- Switched Media Health JSON fallback from build-specific image requirement files to stable `data/media_requirements.json`.
- Added Build 191 release guard.

## Build 192 — editable operations completion pass — 2026-06-05

### Completed 20-step pass

1. Expanded Editable Site Settings into structured editors for every editable domain: business profile, site policies, document templates, business hours/holidays, navigation/footer, option libraries, analytics event registry, media requirements, and landing-page content.
2. Added direct restore-from-history controls inside the Editable Site Settings UI using the existing history and restore APIs.
3. Added business-hours and holiday-closure conflict data to `/api/availability` so public slot selection can warn/block closed dates.
4. Updated the booking wizard slot UI to respect `business_hours_conflict` and show clear AM/PM booked/closed messaging.
5. Added admin booking-save business-hours warnings so manual/admin-created bookings surface holiday or closed-day conflicts without silently saving blind.
6. Replaced booking wizard hard-coded requirement copy with dynamic `site_policies` bindings.
7. Added dynamic deposit/refund policy notes to the quote-payment page.
8. Enabled dynamic policy injection on the quote-response page.
9. Reworked booking document template loading to support nested editable `document_templates.templates` payloads.
10. Added rendered invoice template output to public invoice payloads/pages.
11. Added rendered appointment-confirmation template output to public confirmation payloads/pages.
12. Updated queued order-confirmation email text to render from editable appointment-confirmation templates instead of fixed strings.
13. Added shared option-library loading to Admin App dropdowns, starting with communication-channel selectors.
14. Expanded bundled option libraries with communication channels, payment methods, booking statuses, job statuses, finance entry types, reason codes, media privacy statuses, and template domains.
15. Added `/api/admin/analytics_registry_warnings` to flag raw analytics event names missing from the editable registry.
16. Added an Analytics dashboard card for unknown analytics event names and recommended registry/emitter fixes.
17. Added Media Health controls to sync bundled `media_requirements` into DB-backed editable settings.
18. Added Media Health restore-from-history controls for media requirement sets.
19. Added an Admin dashboard diagnostics card showing DB-backed versus fallback-backed editable settings.
20. Added a Build 192 release guard script and wired it into `scripts/release_check.py`.

### Next 20 recommended steps

1. Add field-level validation schemas for each structured editor so bad JSON is caught before save.
2. Add per-domain preview panes that show exactly where each setting appears on public pages.
3. Add forced sync confirmation for replacing a DB-backed setting with bundled fallback data.
4. Add visual diffing between current JSON, bundled fallback, and selected history rows.
5. Add role-aware permissions around each editable domain, not only the page as a whole.
6. Add full option-library dropdown usage to booking, quote, inventory, finance, and media task editors.
7. Add a template token reference drawer beside every document/email template editor.
8. Add send-test controls for appointment confirmation, deposit receipt, refund notice, and invoice templates.
9. Add invoice PDF/export packaging once the rendered invoice template is approved.
10. Add customer-visible policy version stamping on bookings and quotes.
11. Add business-hours slot granularity beyond AM/PM if future scheduling needs exact time windows.
12. Add admin override reason logging when staff intentionally book a closed holiday/business-hours date.
13. Add unknown-analytics-event quick actions to add the event to the registry from the warning card.
14. Add weekly fallback-backed settings report to the dashboard diagnostics card.
15. Add media requirement history diff/preview before restoring.
16. Add SEO structured-data preview for business profile and service landing-page settings.
17. Add copy-length warnings for title/meta/header fields in editable landing-page content.
18. Add broken-link scans for editable navigation/footer links.
19. Add local SEO proof gap reminders to the admin dashboard using the same diagnostics pattern.
20. Add automated smoke tests for invoice, confirmation, quote payment, booking availability, and admin settings APIs.

---

## Build 193 — social-template endpoint hotfix and validation guard pass — 2026-06-05

### Completed pass

1. Fixed `/api/admin/social_templates_list` so a plain request with no `platform` or `service_area` query parameter no longer throws a null `.toLowerCase()` error.
2. Fixed fallback caption/template filtering so fallback rows with `platform: null` or blank service-area fields no longer throw while filtering.
3. Kept the endpoint DB-first when `social_caption_templates` and `social_hashtag_presets` exist, while preserving built-in social caption and hashtag fallbacks when those optional tables are missing.
4. Added Admin Social UI fallback handling so a temporary template-list problem no longer prevents the rest of the Social Queue from loading.
5. Added a visible Admin Social template-options notice when the endpoint is using fallback templates or when manual drafting must continue without saved templates.
6. Added bundled field-level validation schema data at `data/editable_setting_validation_schemas.json`.
7. Expanded editable-setting validation to use required/optional path rules for business profile, policies, document templates, business hours/holidays, navigation/footer, option libraries, analytics registry, media requirements, and landing-page content.
8. Added warning-level validation for editable navigation/footer links with missing or unsupported href values.
9. Added warning-level validation for document/email template tokens that are not in the supported token reference list.
10. Exposed validation schema details through `GET /api/admin/editable_site_settings_validate` for the selected editable domain.
11. Updated the Admin Site Settings validation result display so non-blocking warnings are visible instead of being lost.
12. Added a document-template token reference drawer directly in the structured editor.
13. Added a navigation/footer validation helper note in the structured editor.
14. Added a force-sync bundled fallback button with explicit confirmation for cases where a reviewed DB value needs to be replaced by the bundled fallback.
15. Added `sql/2026-06-05_build193_social_templates_validation_no_ddl_note.sql` documenting that no new DDL is required.
16. Updated schema documentation and release guards for the Build 193 pass.
17. Added `scripts/build193_social_templates_and_validation_check.py` and wired it into `scripts/release_check.py`.
18. Re-ran release, SEO/H1, and archive integrity checks for the new package.

### Next 20 recommended steps

1. Add visual JSON diffs between current DB setting, bundled fallback, and selected history rows.
2. Add per-domain preview panes that show exactly where each setting appears on public pages.
3. Add role-aware permissions for each editable domain instead of one broad settings permission.
4. Add quick actions to Admin Analytics so unknown events can be added to `analytics_event_registry` from the warning card.
5. Expand option-library dropdowns into booking, quote, inventory, finance, media, lead, and content editors.
6. Add test-send controls for appointment confirmation, invoice, deposit receipt, refund notice, quote, and proposal templates.
7. Add invoice PDF/export packaging once invoice template wording is approved.
8. Add customer-visible policy version stamping to bookings, quotes, invoices, and payment requests.
9. Add admin override reason logging when staff intentionally create or keep a booking on a closed/holiday date.
10. Add sub-day business-hours windows beyond AM/PM when future scheduling needs exact time slots.
11. Add local SEO title/meta length warnings to editable landing-page content.
12. Add internal broken-link checks for all editable navigation/footer links and landing-page CTA links.
13. Add local proof gap reminders to the Admin Dashboard for towns/services still missing real before/after photos.
14. Add weekly fallback-backed settings report cards to Admin Dashboard diagnostics.
15. Add media requirement history diff/preview before restoring a prior media setting.
16. Add structured-data preview for `business_profile` and service landing-page settings.
17. Add saved template-token presets and example payloads beside every document/email template editor.
18. Add stronger release checks for remaining hard-coded policy/email copy.
19. Add smoke tests for social templates, invoice rendering, confirmation rendering, quote payment, booking availability, and admin settings APIs.
20. Continue replacing duplicate JSON/DB authorities with one DB-first source plus stable bundled fallback per domain.

---

## Build 194 — diff, preview, analytics quick-add, and option-library expansion — 2026-06-06

### Completed 20-step pass

1. Added `/api/admin/editable_site_settings_compare` for DB/editor versus bundled fallback JSON diffs.
2. Added visual compare controls in Editable Site Settings before force-sync or restore actions.
3. Added per-domain preview panes showing where each editable setting is used.
4. Added domain permission guidance beside each structured editor.
5. Added SEO copy-length checks for title, meta-description, H1/headline, and description-like fields.
6. Added history/fallback comparison support in the settings workflow without new database tables.
7. Added `/api/admin/analytics_registry_add_event` for one-click addition of unknown analytics events.
8. Added Admin Analytics “Add to registry” buttons on unknown event warnings.
9. Added `assets/admin-option-libraries.js` as a shared DB-first dropdown hydrator.
10. Expanded option-library dropdown usage into Admin Booking finance/status/privacy controls.
11. Expanded option-library dropdown usage into Admin Catalog stock and purchase-order controls.
12. Expanded option-library dropdown usage into Admin Leads lead, quote, draft, and media privacy status controls.
13. Fixed Admin App option-library loading to read the current `/api/site_settings_public?key=option_libraries` response shape.
14. Added business-hours warning display support to Admin Booking status saves when warning payloads are returned.
15. Added staff-auth capability aliases for `view_analytics` and `manage_settings` so analytics/settings utilities are not accidentally admin-password-only.
16. Normalized `/admin-site-settings.html` and `/admin-site-settings/` so the routed copy no longer lags behind the root page.
17. Normalized patched admin route copies for Analytics, Booking, Catalog, Leads, and App pages where route folders exist.
18. Added `sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql` documenting that no DDL is required.
19. Added `scripts/build194_diff_preview_option_libraries_check.py` and wired it into `scripts/release_check.py`.
20. Re-ran release/H1/archive checks for the packaged build.

### Next 20 recommended steps

1. Add full JSON Schema validation with field-level UI markers, not only required-path checks.
2. Add a side-by-side visual diff for selected history rows, not only current versus fallback.
3. Add role-scoped enforcement on save per editable domain once the staff role model has dedicated capabilities for content, media, analytics, and settings.
4. Add send-test controls for appointment confirmation, invoice, deposit receipt, refund notice, quote, and proposal templates.
5. Add invoice PDF/export packaging once invoice wording is approved.
6. Add customer-visible policy version stamping to bookings, quotes, invoices, and payment requests.
7. Add admin override reason logging when staff intentionally create or keep bookings on closed/holiday dates.
8. Add sub-day business-hours windows beyond AM/PM for exact arrival windows.
9. Add richer option-library dropdown hydration to finance, media-health, payments, content, and tax-review screens.
10. Add editable landing-page preview cards that render the actual hero, service, town, and FAQ copy.
11. Add broken-link scans for editable navigation/footer links.
12. Add local SEO proof gap reminders to the main dashboard diagnostics card.
13. Add sitemap/robots preview checks when landing-page content changes.
14. Add public structured-data preview for LocalBusiness and service landing pages.
15. Add template token previews with sample customer/booking data.
16. Add an audit export for editable-setting changes and restores.
17. Add scheduled fallback-backed settings reports for the dashboard.
18. Add media requirement diff/preview before restore-from-history.
19. Add automated smoke tests for invoice, confirmation, quote payment, booking availability, and settings APIs.
20. Continue migrating duplicated JSON/page content into DB-first editable settings where it reduces failure points.

---

## Build 195 — schema markers, history diffs, template previews, export diagnostics, and SEO proof reminders — 2026-06-06

### Completed 20-step pass

1. Added field-level validation results from the editable-setting validation API.
2. Added UI field-marker rendering in Editable Site Settings.
3. Updated editable-setting validation schema metadata to Build 195.
4. Added selected-history side-by-side diff API for settings history rows.
5. Added selected-history diff buttons beside restore-from-history controls.
6. Added document-template sample preview API for invoice, confirmation, receipt, refund, quote, and proposal templates.
7. Added dry-run template test-send API that returns queue-ready payloads without external sending.
8. Added template preview and test controls to Editable Site Settings.
9. Added editable navigation/footer broken-link scan API and UI control.
10. Added sitemap/robots preview API and UI control for editable navigation and landing-page paths.
11. Added LocalBusiness/service structured-data preview API and UI control.
12. Added editable-setting audit export API with JSON and CSV modes.
13. Added fallback-backed settings report API and dashboard card.
14. Added media-requirement diff API and UI control before restore/force-sync decisions.
15. Added richer editable landing-page preview cards for town/service content.
16. Added customer-visible policy version stamping to booking document payloads and document pages.
17. Added admin booking business-hours/holiday override reason logging into booking events when warnings are present.
18. Expanded option-library hydration into Payments, Content, Tax Review, Accounting, and Media Health surfaces where useful.
19. Added dashboard local SEO proof-gap reminders and fallback report diagnostics.
20. Added Build 195 no-DDL schema note and release guard coverage.

### Next 20 recommended steps

1. Add real per-domain staff capability enforcement on editable-setting saves, beyond visible guidance.
2. Store template test-send attempts in notification_events once final sender/provider rules are approved.
3. Add real PDF generation or browser-print packaging for invoices and appointment confirmations.
4. Add customer-facing policy version snapshots directly onto booking/payment rows when new records are created.
5. Make admin booking save block closed/holiday dates unless an override reason is supplied.
6. Add exact arrival-window/sub-day business-hours support beyond AM/PM.
7. Expand the link scanner into a deploy-time crawler that checks actual route responses after Cloudflare publish.
8. Add live sitemap.xml and robots.txt generation from the approved editable navigation/landing registry.
9. Add schema.org validation warnings for every service/town landing page before publish.
10. Add a side-by-side visual page preview for landing pages, not just preview cards.
11. Add assignable local SEO proof tasks directly from dashboard proof gaps.
12. Add audit filters by date, setting key, actor, and restore action once actor history is stored consistently.
13. Add media requirement restore preview comparing DB/current/history/fallback in one screen.
14. Add smoke tests that call live deployed APIs after each Cloudflare deployment.
15. Add full invoice export packaging into the accountant export bundle.
16. Add approved customer email/SMS test-send controls with clear recipient confirmation.
17. Continue moving duplicated public copy from page JavaScript into editable DB-backed settings.
18. Add mobile quick actions for media health, payment warnings, and SEO proof tasks.
19. Add better fallback messaging on every public page that uses editable settings.
20. Review all option-library dropdowns and retire any remaining hard-coded status/payment/category lists.

## Build 206 — value-added operations foundations

Completed the next high-value bundle from the sanity check list:

1. Added dedicated `/admin-gallery.html` Gallery Approvals screen.
2. Added gallery approval list/save APIs with DB-first editable-setting storage and bundled fallback.
3. Added approve, hide/private, reject, delete, and add-gallery-row controls.
4. Added customer-safe consent/status guidance on the dedicated gallery screen.
5. Added `/admin-quotes.html` Quote Pipeline dashboard foundation.
6. Added `/admin-growth.html` Value-Added Operations workbench.
7. Added a shared value-added operations report API.
8. Added sample/seed foundation for quote pipeline metrics.
9. Added sample/seed foundation for Meta ads ROI metrics.
10. Added sample/seed foundation for membership/maintenance plans.
11. Added sample/seed foundation for vehicle history events.
12. Added sample/seed foundation for proof-of-work checklists.
13. Added sample/seed foundation for fleet mini-CRM prospects.
14. Added sample/seed foundation for review request automation.
15. Added sample/seed foundation for seasonal campaign planning.
16. Added sample/seed foundation for route clustering hints.
17. Added database migration destinations so these modules can move beyond JSON-only records.
18. Added Admin Dashboard cards for Gallery Approvals, Quote Pipeline, and Value-Added Operations.
19. Synced route copies and extended route-copy automation for the new admin pages.
20. Added Build 206 release guard and updated schema/documentation notes.

### Next 20 recommended steps after Build 206

1. Connect Quote Pipeline dashboard to real quote proposal drafts and lead conversion rows.
2. Add quote follow-up reminders with overdue badges.
3. Add quote accepted/declined reason tracking.
4. Add Meta campaign create/edit/save screens instead of seed rows.
5. Add Meta campaign UTM/source attribution into lead records.
6. Convert membership interest rows into real customer plan records.
7. Add automatic next-service reminder suggestions after completed jobs.
8. Add customer-facing vehicle history timeline on `/my-account`.
9. Add detailer proof-of-work checklist completion directly inside `/detailer-jobs`.
10. Add required start/finish photo checks before job completion.
11. Add fleet account create/edit screen with vehicle roster.
12. Add fleet quote-to-contract conversion.
13. Add review request queue with preview/send controls.
14. Add Google Business Profile review-link setting.
15. Add seasonal campaign builder with hero image and service/town pairing.
16. Add campaign-to-landing-page publishing workflow.
17. Add route clustering hints inside Admin Booking calendar.
18. Add travel-time warnings between same-day bookings.
19. Add mobile bottom action bar for Book/Call/Text/Gift Card.
20. Add before/after slider visual treatment for approved Gallery rows.

## Build 208 — connected workflow command center

Build 208 moves the app from scattered feature foundations toward the main lifecycle: **lead / quote → booking → proof of work → invoice/payment → review → repeat maintenance**.

Completed in this pass:
- Added `/admin-workflow.html` and `/admin-workflow/` as the owner-facing workflow command center.
- Added `/api/admin/workflow_command_center_report` with DB-first reads from Build 206 tables and safe JSON fallback data.
- Added `data/workflow_connection_build208.json` as the structured workflow map, next 20 steps, visual enrichment slots, and competitor-aligned feature checklist.
- Added Admin Dashboard workflow diagnostics so owners can see open quote value, likely revenue, follow-ups, review queue, maintenance reminders, and fallback status.
- Expanded visual placeholders for quote, booking, proof-of-work, invoice/payment, review/public proof, and repeat-maintenance cards.
- Kept old Markdown as retained history while continuing to make `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` the main living docs.

Next build should connect `/admin-quotes.html` to real quote create/edit/save actions and add a one-click accepted-quote-to-booking conversion.

## Build 209 update — live detail interaction, privacy hardening, and Markdown retirement (2026-06-17)

### Completed 20 steps

1. Rebuilt the detailer job screen as a mobile-first live interaction workspace.
2. Added direct staff photo and video upload during a detail.
3. Added customer-now, admin-review-first, and staff-only audiences.
4. Added arrival, pre-existing, during, final, recommendation, issue, and general stages.
5. Added customer-action-required flags.
6. Added enhanced update/media review metadata with safe legacy fallback.
7. Added protected storage bucket/path metadata and signed preview support.
8. Added staff moderation for approve, hide/reject, staff-only, visible, and pinned items.
9. Added live-feed health counts and migration warnings.
10. Combined approved notes/photos/videos into the customer progress timeline.
11. Added automatic/manual customer timeline refresh.
12. Added customer comments with privacy-safe booking event logging.
13. Filtered internal booking-event notes and payloads from public progress responses.
14. Removed private detailer response reasons from customer payloads.
15. Added progress last-viewed/customer-message/staff-update timestamps.
16. Added Admin Dashboard live interaction diagnostics.
17. Added responsive live-media CSS and mobile sticky actions.
18. Added live-update/private-note/video visual placeholder types.
19. Added route-copy sync coverage for detailer jobs and admin progress.
20. Moved twenty redundant planning/handoff Markdown files into `docs/archive/` and refreshed the two canonical living docs.

### Next 20 steps

1. Notify customers and staff of new live updates/replies.
2. Add unread counters per booking.
3. Add media upload progress/retry/cancel/offline recovery.
4. Add video size/duration guardrails and compression guidance.
5. Add media retention/archive policies.
6. Connect proof checklist steps to required live media.
7. Add vehicle walkaround condition templates.
8. Convert issue updates into linked incident reports.
9. Add in-job customer approval for recommendations.
10. Add price-change/deposit requests from approved recommendations.
11. Generate completed-job customer summaries.
12. Gate review requests on payment/completion/no unresolved incident.
13. Send approved final media to Gallery Approvals without re-upload.
14. Add approved media to vehicle history.
15. Generate maintenance recommendations from completed work.
16. Add owner Today-needs-attention grouping.
17. Add storage usage/orphan/broken-path diagnostics.
18. Add live-update audit export.
19. Add video captions/transcript/accessibility support.
20. Complete live Cloudflare/Supabase/R2 mobile and desktop acceptance testing.


## Build 210 update — connected live workflow (2026-06-17)

Build 210 completed the first connected pass for the twelve highest-value live-workflow items: notifications, unread state, resilient uploads, video/retention guardrails, proof-media completion gates, issue-to-incident conversion, customer recommendation decisions, payment-request handoff, completed-job summaries, Gallery/vehicle-history reuse, safe review gating, and Today Needs Attention. The next 20 steps are maintained in `MASTER_VALUE_ROADMAP.md`.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

## Build 212 documentation sync

Build 212 adds a guided production acceptance process at `/admin-test-centre.html`, a detailed written test guide at `docs/PRODUCTION_TEST_GUIDE.md`, DB-backed test-result history, production/readiness test counts, and owner queue escalation for failed/blocked tests. Run `sql/2026-06-20_build212_guided_production_testing.sql` before expecting persistent results. Use internal test records only.

## Build 213 documentation sync

Build 213 adds owner action controls in Today Needs Attention, customer price/summary acknowledgements, secure payment-link handoff, summary revision history, and booking-scoped safe interaction audit export. Active direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; use `docs/PRODUCTION_TEST_GUIDE.md` for hands-on testing.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

## Build 215 — public asset compatibility and DAIP integration planning (2026-06-30)

Build 215 resolves a public-media format mismatch without requiring image recreation: verified Rosie-owned service/local images can remain JPG files even when historic fallback data expected WebP. The public renderer, booking/service cards, and Admin Media Health scanner now try approved same-key JPG/JPEG/WebP/PNG variants before showing a fallback visual. Canonical Local Hero data uses `landing-pages/<slug>.jpg`; the matching migration is `sql/2026-06-30_build215_media_asset_format_alignment.sql`.

The Digital Asset Intelligence Platform documentation under `docs/digital-asset-intelligence-platform/` is now connected to the active plan through `10_Rosie_Dazzlers_Integration_Plan.md`. This build is documentation-only for DAIP: no DAIP worker, table, bucket, AI pipeline, queue, export, or auto-publication code is included.

### Immediate operational next steps

1. Deploy Build 215.
2. Confirm Cloudflare publishes both assets and Functions.
3. Run the Build 215 media task alignment migration after RLS containment is confirmed.
4. Scan `/admin-media-health.html` and verify the exact resolved public Local Hero URLs.
5. Test `/services` and every Local Hero page in an incognito browser.
6. Record exact failing R2 keys/HTTP statuses rather than guessing or re-uploading duplicates.
7. Complete DAIP-0 cost, privacy, storage, consent, retention, and worker-hosting decisions before approving DAIP Phase 1.

> **Build 207 update — retained historical marker:** Build 207 created the canonical-doc/visual-placeholder baseline. It remains retained for the historical release guard; Build 215 now carries the active asset and DAIP planning updates.

## Build 216 development sync — public media reliability and DAIP governance

Completed Build 216 implementation: bounded compatible-format public asset checks, protected media-health observations and recurring alert state, staff acknowledgement UI, RLS/server-only persistence migration, updated public resolver timeouts, and DAIP decision/Phase 1 acceptance planning documents. DAIP remains planning only; no production DAIP code or schema was added.

Primary migration: `sql/2026-07-01_build216_media_reliability_daip_governance.sql`.
Primary data record: `data/build216_media_reliability_daip_governance.json`.
Primary user-facing admin surface: `/admin-media-health.html`.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

## Build 217 synchronization — secure final-balance flow (2026-06-30)

The active payment next step has moved from “customer page missing” to a controlled launch: apply the Build 217 migration, deploy Pages/Functions together, run one Stripe test-mode final-balance checkout and signed webhook, test invalid/expired/cancelled links, and test notification delivery with a controlled mailbox. Active strategy remains only in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


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


## Build 229 — completed
- Added a dual-path workflow: standard jobs remain standard; creative projects are explicit opt-in.
- Added optional booking-to-project linking and audit history.
- Added mobile-safe booking controls explaining the difference.
- Added a project source-mode field and canonical schema migration.

## Next 20
1. Structured project material rows.
2. Inventory reservation preview.
3. Session labour rollups.
4. Overhead and waste costing.
5. Therapeutic/non-commercial classification.
6. Before/after applicability control.
7. Consent gate summary.
8. Project template library.
9. Story-outline drafts.
10. Long-form video outline.
11. Short-form clip plans.
12. Platform caption variants.
13. Pinterest plans.
14. Etsy draft.
15. Website page draft.
16. Blog and educational drafts.
17. Archive export.
18. Lessons approval.
19. Future-project ranking.
20. Unified output approval dashboard.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 implementation

Completed the next project-interface pass: reversible line controls, profitability/classification, reviewed consumption ledger, read-only booking comparison, template management, consent reminders, shot plans, approved-session draft planning, platform metadata, archive manifests, lessons and recommendation scoring. See the master roadmap for the next 20.


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


## Build 235 completed
1. Inventory JSON field/value table editor.
2. Individual-field and full-row updates.
3. Bulk inventory edits and CSV export.
4. Seven-image ordered product/inventory galleries.
5. Featured image retained separately.
6. Launch Readiness Command Center.
7. Automatic inventory/name/image/cost/category/stock audits.
8. Manual booking/payment/email/environment/backup/legal/mobile/accessibility/security confirmations.
9. Controlled soft-launch guidance.
10. Build 235 migration and route-copy synchronization.

### Next 20 execution steps
1. Apply and verify the Build 235 gallery migration.
2. Correct suspicious inventory names.
3. Add featured images to active sellable rows.
4. Add ordered gallery images to priority products.
5. Complete missing costs and categories.
6. Confirm first-week low-stock and purchase-order needs.
7. Run a production booking end to end.
8. Run and refund a small live Stripe payment.
9. Verify payment and booking webhooks.
10. Verify customer and staff email delivery.
11. Verify Cloudflare production variables, bindings and branch.
12. Confirm database backups and test/document restore.
13. Review privacy, terms, cancellation, refund and media-consent wording.
14. Test customer and staff workflows on real mobile devices.
15. Complete keyboard/focus/contrast/error accessibility checks.
16. Verify analytics and conversion events.
17. Verify sitemap, robots, canonicals and Search Console.
18. Verify Google Business Profile service area, hours, categories and contact data.
19. Verify permissions, protected endpoints, sessions and security headers.
20. Begin an invite-only soft launch and monitor every first-week transaction.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 current development cycle

Use `/admin-startup-guide.html#roadmap` as the active next-20 queue. The Build 239 migration seeds the database cycle. Development should now close launch evidence and reliability gaps before adding unrelated modules. Key code follow-ups include live browser acceptance, migration execution, transaction rollback tests, notification retry visibility, upload recovery, retention/incident safety, image derivatives, monitoring, and guarded Markdown retirement.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->


## Build 242 update

- Repaired `/admin-daip-intake-dry-run` contrast and card styling.
- Replaced many SVG-only visual placeholders with reusable local raster photo-style placeholders.
- Advanced Startup Command Center cache-busting and service-worker references to Build 242.
- No new database migration was introduced in this build.

## Build 244 update

- Bundled the new AI-generated raster placeholder images directly into the application zip so the site no longer depends on missing SVG photo fallbacks for common empty-image states.
- Replaced review, add-on, catalog, booking, workflow, and admin placeholder-photo references from SVG files to real PNG/JPG files.
- Preserved instructional SVG graphics, such as framing guides and charts, where SVG is still the correct format.
- Sanity check: the remaining strongest live-readiness work is acceptance testing, content completion, operational policy confirmation, and production credential/provider validation rather than placeholder-media cleanup.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

# Development Roadmap — Build 247

## Completed in source
- Private R2-bound DAIP Creative Project media intake with 32 MiB multipart upload, resumable parts, duplicate protection, safe abort and immutable completed masters.
- Shared Supabase metadata for project assets, sessions, parts and downstream processing jobs.
- Optional `DAIP_PROCESSING_QUEUE` dispatch, while preserving queued DB work if queue delivery fails.
- `/admin-daip-media.html` linked from Creative Projects, Admin Menu, Startup Command Center and production-readiness reporting.
- Build 218 metadata-only Test Lab table preserved; real project masters use `daip_project_media_assets`.

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

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

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
