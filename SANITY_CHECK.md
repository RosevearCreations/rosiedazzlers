> **Build 248 documentation status:** Historical/compatibility reference. Current state is `AI_PROJECT_HANDOFF.md`; current direction is `MASTER_VALUE_ROADMAP.md`. Retained to preserve audit/release history and old references.

# Sanity Check — Build 245

## Healthy in source

- All exposed HTML files have one H1.
- Indexable public pages have title, description and canonical coverage within project guardrails.
- Protected admin pages include noindex.
- Deprecated SVG photo fallbacks are not referenced by runtime content.
- UI Health root and clean routes match.
- Startup cache controls and Build 245 asset versions are wired.
- Service-worker cache installation is isolated and offline failures are type-safe.

## Not proven by source

Live deployment, service-worker activation, connected APIs, payment/email providers, mobile devices, accessibility, database migrations and recovery still require Startup evidence.

---

# Sanity Check — Build 241

## Healthy in source

- `updateSummary()` uses `const rows = getEvidenceRows()` and contains no temporal-dead-zone collision.
- Startup clean routes use the Build 241 asset token.
- Service-worker cache version is Build 241.
- Refresh uses all-settled isolation and visible fallback status.
- No database migration is required.
- Historical release evidence, one-H1 rules, CSS references, and Build 240 functions remain intact.

## Required preview confirmation

Open `/admin-startup-guide.html`, reload with developer tools open, select **Refresh all**, and confirm no uncaught promise error appears.

---

# Sanity Check — Build 240

## Healthy in source

- Existing inventory editor, Workbench, JSON tools and seven-image galleries remain intact.
- Booking and project usage are previewed and committed atomically rather than through split browser writes.
- Shortages and invalid reservations fail the complete transaction.
- Idempotency prevents the same request from deducting stock twice.
- Reversal adds compensating movements and never deletes original history.
- History fallback is clearly labelled read-only.
- New admin route is responsive, protected, noindex and has one H1.
- Startup instructions, roadmap, canonical schema, migration and all Markdown markers are synchronized.

## Not yet proven

Connected-database migration, live acceptance, accounting reversal handling and the broader go-live blockers still require operator evidence.

---

# Sanity Check — Build 238

## Healthy in source

- Existing manual and detailed inventory editors remain available.
- Bulk inventory changes no longer rely on a browser loop for authoritative writes.
- Duplicate rows are previewed, transferred and archived—not hard deleted.
- Known inventory references, quantity movements and before/after evidence are retained and available through a read-only history dialog/CSV export.
- Cached API failure mode is read-only.
- Public pages retain one H1 and improved title/description lengths.
- Roadmap/Startup fallback data and clean routes are synchronized.
- Canonical schema contains the complete Build 238 function/table definitions.

## Not yet proven by source inspection

- Supabase migration execution and PostgREST schema refresh.
- Real data reference-transfer acceptance.
- Live booking/payment/refund/email/backup/mobile/accessibility/search/GBP behaviour.
- Real Core Web Vitals and deployed CSS/cache behaviour.

## Release decision

Do not announce a broad public launch solely because the source checks pass. Proceed to an invite-only soft launch only after every launch-blocker item in `STARTUP_GO_LIVE_BLOCKERS.md` has evidence or an explicitly reviewed waiver.

---

# Build 237 sanity check

- Roadmap page CSS root cause identified: missing stylesheet files and missing AdminShell dependency.
- All HTML stylesheet references now resolve; compatibility shims and emergency admin fallback are included.
- Roadmap, Startup Guide and Launch Readiness have desktop/mobile layouts and safe outage/migration fallbacks.
- Internal admin pages remain one-H1 and are noindex.
- Homepage now includes WebSite structured data alongside the existing local business schema.
- Shared launch evidence is DB-first after the included migration.
- No claim of first-page ranking is made; local SEO work remains evidence-led.
- Unrestricted public launch is not recommended until the critical items in `STARTUP_GO_LIVE_BLOCKERS.md` are verified.

---

# Build 236 sanity check

The root Block Calendar regression was a truncated shared stylesheet plus obsolete schedule-column reads. Build 236 restores the complete shared CSS/admin/public-shell baseline, repairs `blocked_date`/`slot` compatibility, adds calendar health/quick actions, expands preflight, and keeps one-H1/mobile/route-copy safeguards. No DDL is required. The complete static release suite passes through Build 236 before packaging; live schedule, booking, payment, email and recovery evidence remains required before public launch.

---

# Build 207 pointer

Current planning now lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This historical file is retained for context and release history.

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

# Build 181 handoff note — verified provider quote deposits

Build 181 adds verified Stripe/PayPal webhook settlement for accepted quote deposit/payment requests. Apply `sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql` after Build 180, then test Stripe Checkout metadata settlement and PayPal verified capture settlement through `quote_deposit_payment_requests`.

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
# Build 173 sanity check

**Updated:** 2026-05-24

## Passed locally this pass

- `/admin-content.html` and `/admin-content/index.html` were added with one H1 each.
- Admin Content Center is linked from Admin Dashboard and shared admin menu.
- `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save` were added.
- Public `/blog` Help Articles page was expanded and linked from main navigation/footer.
- FAQ access section now points to Help Articles.
- `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` include the Build 173 no-DDL note.
- Release guard `scripts/admin_content_build173_check.py` was added and wired into `scripts/release_check.py`.

## Outstanding after this pass

1. Deploy and browser-test `/admin-content.html` after staff login.
2. Apply Build 172 FAQ SQL before expecting FAQ saves to persist.
3. Add Content Center editing for specials, service blurbs, education/help article content, and homepage support cards.
4. Build persistent quote/proposal drafts.
5. Build lead-to-booking conversion.
6. Add service/town proof filtering.
7. Enforce privacy review before public media reuse.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 sanity check

**Updated:** 2026-05-24

## Passed locally this pass

- `/faq.html` and `/faq/index.html` were added with one H1 each.
- FAQ links were added to global nav/footer and key public pages.
- FAQ schema, breadcrumb schema, sitemap, API fallback, JSON seed, SQL migration, and release guard are present.
- `COMPETETIVE_COMPLETION_MATRIX.md` now marks FAQ/help content as a complete public foundation.

## Outstanding after this pass

1. Deploy and browser-test `/faq` plus homepage, Services, Pricing, and Contact access paths.
2. Apply Build 172 SQL only when ready for DB-managed FAQ rows.
3. Build Admin Content editor next.
4. Build persistent quote/proposal draft workflow next.
5. Build lead conversion to draft booking/quote next.
6. Continue proof/gallery/privacy automation.

---
# Build 171 sanity check

**Updated:** 2026-05-24

Build 171 sanity result: Admin Leads now has a quote-starter bridge, the lead/upload endpoints share the service-key alias pattern from the auth fallback work, no new DDL is required, and release guards cover Cloudflare syntax, social workflow, competitor roadmap, Builds 160–171, and one-H1 validation.

Next sanity targets: test real staff login, real lead quote-starter generation, linked upload privacy warnings, and lead status transitions after deploy.

---
# Build 168 sanity check update

**Updated:** 2026-05-23

Build 168 sanity result: Cloudflare Pages Functions static check passed, Build 160-168 release guards passed, inline Admin Leads script syntax checked, and SEO/H1 validation passed with no HTML page containing more than one H1.

Manual smoke tests after deployment:

1. Apply Build 167 SQL and Build 168 SQL in Supabase.
2. Visit `/admin-leads.html` as an admin or booking manager.
3. Confirm leads list loads or shows a migration hint.
4. Submit a test fleet/maintenance lead and save a status/note from Admin Leads.
5. If direct uploads are enabled, upload one test image/video and mark privacy status before using it publicly.

---

# Build 167 update

Build 167 sanity check: competitor matrix public foundations now include direct upload foundation, structured lead forms, schema foundations, and one-H1/Cloudflare/release guards.

---

# Build 166 sanity check update

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

# Build 162 sync — condition helper and consent path

**Updated:** 2026-05-21

The public conversion path now has the next competitor-aligned layer: customers can use a condition helper instead of guessing package names. Checkout remains backwards-compatible by preserving condition helper details and media-consent preference in booking notes. A Build 162 SQL migration prepares optional direct DB fields for a later admin/reporting pass.

---

# Build 161 sync — SANITY_CHECK.md

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

## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.

## Build 169 sanity check

- Verify `/login` loads with no raw 500s from `api/admin/auth_me`, `api/client/auth_me`, or `api/analytics/ingest`.
- Verify `/favicon.ico` returns a file.
- Attempt staff login. If it fails, read the JSON error and check Cloudflare Supabase variables, auth/session tables, and password hash mode.
- Re-test `/admin-leads.html` after staff login succeeds.
Build 169 adds `scripts/auth_analytics_build169_check.py` and wires it into `scripts/release_check.py`.

## Build 170 sanity check

- Confirmed the remaining reported console error was `/api/client/dashboard` returning 401 for signed-out optional context.
- Updated customer dashboard endpoint to return signed-out/degraded JSON with HTTP 200.
- Added a Build 170 release guard and a no-DDL SQL note.
- Next live test: `/login`, `/book`, and `/my-account` with DevTools open.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 sanity check — conversion_content_gallery_analytics

Build 175 adds a broad but safe foundation pass: quote/pricing/conversion tools in Admin Leads, expanded content-block editing in Admin Content, privacy-enforced gallery filtering by service/town, and admin conversion analytics. The release guard is `scripts/build175_conversion_content_gallery_analytics_check.py` and it is included in `scripts/release_check.py`.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 sanity check

- Admin Leads now supports lead → quote starter → quote draft → conversion draft → real booking.
- Admin Analytics now surfaces FAQ/help/lead/quote conversion summary.
- Admin App now includes a media privacy readiness check before public gallery/social reuse.
- Exposed pages still pass the one-H1 rule.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

### Build 179 sanity check

Verify Social Queue publish/webhook/manual posted actions refuse unapproved media drafts, Admin Analytics can create local proof tasks, Admin Leads can prepare quote delivery links, and `/quote-response.html` records accepted/declined responses after Build 179 SQL is applied.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 sanity check

The customer quote chain now has these stages:

1. Staff prepares quote/proposal draft.
2. Customer accepts or declines through `/quote-response.html`.
3. Staff creates a deposit/payment request from the accepted draft.
4. Customer reviews the private `/quote-payment.html` request.
5. Staff records/links paid deposit and confirms the final booking when a booking exists.

Still outstanding: automate provider-confirmed paid status through payment webhooks.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

## Build 182 sanity check

Payment flow now covers accepted quote → deposit request → provider verified paid status → receipt email queue → booking confirmation link when a booking exists. It also covers webhook history, verified replay, and refund/partial-refund tracking. Remaining payment work is direct provider refund initiation, payment reconciliation export, and delivery-status dashboards for queued receipt/refund emails.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

## Build 183 sanity check

Payment operations now cover accepted quote deposit requests, provider webhooks, receipt/refund email queueing, provider refund initiation, refund records, replay controls, warning summaries, and CSV reconciliation export. Media readiness is clearer because `IMAGES.md` now lists missing add-on fallback images, package images to verify, regional placeholders to replace, gallery proof pairs needed, and first proof videos to capture/upload.


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

## Build 188 sanity check

### What was wrong

`functions/api/landing_pages_public.js` attempted to apply a hard-coded water-rule object during module initialization before that object was ready. More importantly, municipal rules were duplicated across JavaScript, HTML, booking fallbacks, service-area data, and pricing-catalog fallbacks.

### What is now correct

- One editable DB-first water-rule authority exists.
- One stable JSON fallback exists.
- JavaScript contains loader/merging logic, not mutable municipal wording.
- Service-area rows reference rule keys instead of copying full rule text.
- The Cloudflare Pages Functions build succeeds.
- The invalid `_redirects` loop rule is removed.

### Hard-coding audit result

40 domains were audited. 35 should be editable; 5 should remain controlled by secrets, reviewed code, schema migrations, or append-only records.


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

## Build 192 sanity check — 2026-06-05

Build 192 keeps the one-H1 rule intact, adds no new public page headings, and focuses on wiring existing editable-setting data into visible UI behavior. Release validation now includes `scripts/build192_editable_operations_completion_check.py`, the existing H1 guard, and the broader `scripts/release_check.py` chain.

---

## Build 193 sanity check

- `/api/admin/social_templates_list` now guards all optional filter values before calling `.toLowerCase()`.
- Admin Social no longer depends on template options loading successfully before the rest of the queue loads.
- Editable setting validation now uses the Build 193 bundled schema file and reports non-blocking warnings.
- One-H1-per-page checks remain part of `scripts/release_check.py`.

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

## Build 195 gap update — 2026-06-06

### Resolved or reduced

- Editable-setting validation now returns field-level results and the editor can display schema markers instead of only plain text errors.
- Restore-from-history workflows now have selected-history diffs so staff can compare a saved row against the current editor JSON before restoring.
- Document templates now have sample preview and dry-run test-send payload controls for invoice, appointment confirmation, deposit receipt, refund notice, quote, and proposal wording.
- Navigation/footer links, sitemap/robots previews, and structured-data previews now have admin-side checks before public copy is treated as ready.
- Dashboard diagnostics now include a fallback-backed settings report and local SEO proof-gap reminders.
- Booking documents now carry a policy version stamp so customer-facing documents can identify which editable policy set was in use.
- Admin booking saves now return and attempt to log override reasons when staff keep a booking on a closed/holiday date.
- Media requirements can be diffed before restore/force-sync, reducing the risk of overwriting required image lists blindly.

### Still open

- Editable-setting save enforcement is still mostly capability-level plus guidance; per-domain role scopes remain a future staff-role-model enhancement.
- Template test-send is intentionally dry-run only until the final provider, recipient confirmation, and notification logging rules are approved.
- Invoice PDF/export packaging is still simple HTML/JSON; a true PDF generator or final export bundle remains future work.
- Business-hours protection still warns/logs rather than hard-blocking closed/holiday overrides without a reason.
- Link and sitemap checks are static previews; live route-response crawling should be added after deployment.

> Build 196 documentation sync (2026-06-06): repaired the live Admin Dashboard local SEO proof 405, Admin App `esc` helper crash, and Landing Page Builder add-on fallback hydration. Schema status remains no-DDL; see `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_STRUCTURE_CURRENT.md`, `SUPABASE_SCHEMA.sql`, and `sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql`.

---

## Build 197 documentation sync

Build 197 was reviewed during the self-healing admin diagnostics pass. Relevant implementation notes now point toward pricing catalog source/repair diagnostics, route-copy parity, independent dashboard fallback handling, landing-page SEO/readiness warnings, and continued one-H1/local-search discipline. No database DDL is required for this pass.

## Build 209 sanity sync — 2026-06-17

The app now supports the intended during-detail interaction model with protected private discussion and customer-safe publication. The main risk has shifted from missing capability to operational hardening: migrations, mobile network recovery, video/storage controls, notifications, unread state, and live deployment testing.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 documentation sync

Build 213 adds owner action controls in Today Needs Attention, customer price/summary acknowledgements, secure payment-link handoff, summary revision history, and booking-scoped safe interaction audit export. Active direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; use `docs/PRODUCTION_TEST_GUIDE.md` for hands-on testing.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

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


## Build 229 sanity result
The standard booking path remains intact and is the default. A linked creative project is created only through an explicit staff confirmation. The booking remains the source for customer, scheduling, payment and completion data; the project owns documentary notes and governed content outputs.


## Build 230 — Creative project costs, templates, drafts and controls (2026-07-13)

Build 230 extends only the opt-in Creative Project Intelligence path. Ordinary customer bookings remain standard jobs and retain their existing inventory, service, payment and completion workflow.

Added: structured project-only material, labour and other-cost lines; optional project templates; before/after applicability; consent status and summary; story/platform/commerce/report drafts; unified batch output review; reversible booking unlink, archive and restore; and a project-to-DAIP metadata association that is denied until Gate C is accepted and technical capability is explicitly enabled. Nothing publishes automatically.

Primary workspace: `/admin-creative-projects.html`. Migration: `sql/2026-07-13_build230_project_costs_templates_outputs.sql`.

## Build 231 sanity check

Ordinary bookings remain operationally separate. Project profitability excludes soft-deleted lines. Project consumption posting cannot mutate inventory. Content planning requires approved sessions. Archive exports contain metadata only. DAIP Gate C remains enforced.


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


## Build 235 sanity check
- Existing inventory editor retained.
- Separate Inventory Workbench enhanced rather than replacing existing workflows.
- JSON row editing no longer requires raw syntax changes.
- `image_url` remains featured; gallery is additive and capped at seven.
- Archive/restore remains history-safe.
- Launch dashboard distinguishes automatic evidence from manual confirmation.
- Public launch should remain controlled until booking, live payment/refund, email, environment, backup, legal, mobile and security confirmations are complete.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 sanity check

The application now has one clear launch operating interface and three current authority documents. CSS, one-H1, route-copy, API syntax, schema, fallback, and historical release guards must pass before packaging. Go-live confidence still depends on real environment and business evidence listed in the Startup Command Center.

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

## Build 246 catalog-readiness synchronization

- Shared product/inventory publishing readiness now blocks placeholder names, missing required classification/image fields, inactive rows and zero-stock consumables.
- Public catalog results are filtered at the server boundary.
- The Build 246 migration adds protected audit evidence, an all-or-nothing publish RPC, Startup process 37 and the current 20-step cycle.
- Staging acceptance remains required.

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

## Build 247 sanity check

The raw-media storage architecture is now correct for large historical project footage: private R2 for masters, Supabase for metadata, optional queue for downstream work and reviewed promotion only. The strongest remaining DAIP risk is execution of the queued processing pipeline, not ingestion. Operational launch risks remain migrations, real payment/email/calendar testing, recovery rehearsals, accessibility/mobile acceptance and soft-launch evidence.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->
<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->
