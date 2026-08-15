# Images and Visual Health — Build 245 Update

The bundled raster fallback set remains in place. `/admin-ui-health.html` now confirms whether critical pages reference missing local images or deprecated SVG photo fallbacks after deployment. Generic AI-generated images remain temporary professional fallbacks; replace high-visibility public areas with approved Rosie-owned local work as it becomes available.

---

# Images and Visual Placeholders — Build 240 Update

New internal placeholder: `inventory_transactional_posting_reversal`, showing review → validation → posting → audited reversal. It is operator guidance and must not be mistaken for public proof.

Public replacement priority remains homepage/local proof, high-intent service pages, town pages, gallery/booking trust areas and sellable-product galleries. Use Rosie-owned or explicitly licensed/consented media with alt text, role, caption and provenance.

---

# Images and Visual Placeholders — Build 238 Update

New operational placeholder types support `inventory_merge`, `inventory_audit`, `transactional_batch` and `seo_preflight`. They explain workflows only and do not replace real public proof.

Priority real-image replacement order remains: homepage hero/local proof, ceramic coating, paint correction, interior transformation, town/service-area pages, gallery, booking trust areas, sellable product featured images and up to seven gallery images. Use Rosie-owned or explicitly licensed/consented media; complete descriptive alt text, caption, role and provenance/consent notes before publishing.

---

# Build 237 image synchronization

New internal placeholder: `startup_go_live_command_path` for `/admin-startup-guide.html`. Public priority remains replacing homepage, high-intent service, local town, gallery and booking placeholders with approved Rosie-owned proof. Product media should use one featured image plus up to seven ordered gallery images with descriptive alt text, role, caption and provenance/consent notes.

---

# Build 236 visual-placeholder and launch-image note

Build 236 adds placeholder types for Block Calendar, Inventory Workbench, Launch Readiness, product galleries, and local-service proof. Placeholders are temporary orientation aids, not publishable evidence. Replace the highest-visibility placeholders with approved Rosie-owned imagery, then complete filename, dimensions, alt text, caption, role, order, consent, and provenance. Product records support a featured image plus up to seven ordered gallery images after the Build 235 migration is applied.

---

# Rosie Dazzlers Image and Video Requirements — Build 183

Critical missing local add-on fallback photos are still tracked below. Gallery proof still needed remains part of the public media checklist.

# Build 184 Admin Media Health

Admin Media Health scans the public R2 asset list before review.

# IMAGES.md — Build 185 media requirements and upload plan

Build 185 clears the older image notes into an actionable media-health checklist. The application now has three ways to review missing media:

1. `/admin-media-health.html` scans public R2 URLs and checks PNG/JPEG/WebP dimensions.
2. `/api/admin/media_asset_health_scan` returns missing, undersized, and public-ready rows.
3. `public.media_asset_tasks` stores assignable upload/review/approve tasks after the Build 185 SQL is applied. The JSON files remain fallback sources.

## Required public image sizes

| Area | Folder/key pattern | Minimum | Preferred | Notes |
|---|---:|---:|---:|---|
| Add-on cards | `packages/<addon>.png` | 1200×800 | 1600×1067 | Landscape, bright, service-specific. |
| Package cards | `packages/<package>.png` | 1200×800 | 1600×900 | Use consistent vehicle angle/background. |
| Regional landing heroes | `landing-pages/<town>-auto-detailing.jpg` | 1600×900 | 1920×1080 | Rosie-owned local proof only. |
| Before/after gallery | `gallery/<town>-<service>-before.jpg` and `...after.jpg` | 1200×900 | 1600×1200 | Requires approved public consent/privacy status. |
| Public videos | `videos/<name>.mp4` or `.webm` | 720p | 1080p | Keep short, compressed, and owned by Rosie Dazzlers. |

## Critical missing add-on image keys

Upload these first because customer package/add-on pages look unfinished without them:

```text
packages/pet_hair_removal.png
packages/odor_treatment.png
packages/seat_shampoo.png
packages/carpet_shampoo.png
packages/salt_stain_treatment.png
packages/headlight_restoration.png
packages/windshield_ceramic_coating.png
packages/ceramic_spray_wax.png
packages/trim_restoration.png
packages/bug_tar_removal.png
packages/truck_box_wash.png
packages/fleet_vehicle_add_on.png
```

## Regional photos to replace

```text
landing-pages/tillsonburg-auto-detailing.jpg
landing-pages/woodstock-ingersoll-auto-detailing.jpg
landing-pages/simcoe-delhi-auto-detailing.jpg
landing-pages/port-dover-auto-detailing.jpg
landing-pages/norwich-otterville-auto-detailing.jpg
landing-pages/zorra-thamesford-embro-auto-detailing.jpg
landing-pages/waterford-vittoria-auto-detailing.jpg
landing-pages/port-rowan-turkey-point-auto-detailing.jpg
```

## Upload methods

### Method A — Cloudflare R2 Dashboard

1. Open Cloudflare Dashboard → R2.
2. Open the Rosie Dazzlers public assets bucket.
3. Upload the file using the exact key, for example `packages/pet_hair_removal.png`.
4. Confirm it loads at `https://assets.rosiedazzlers.ca/packages/pet_hair_removal.png`.
5. Open `/admin-media-health.html` and run the scan again.

### Method B — Admin Media Health uploader

Use `/admin-media-health.html` after a Pages R2 binding is configured:

```text
ROSIE_PUBLIC_ASSETS_BUCKET
PUBLIC_ASSETS_BUCKET
R2_PUBLIC_ASSETS_BUCKET
ASSETS_BUCKET
```

Submit:

```text
file = image/video file
r2_key = packages/pet_hair_removal.png
required_width = 1200
required_height = 800
```

The endpoint validates image dimensions before upload when the file is PNG/JPEG/WebP.

### Method C — DB task workflow

After applying Build 185 SQL, use `/admin-media-health.html` to create or review tasks in:

```text
public.media_asset_tasks
```

Suggested statuses:

```text
needed
assigned
uploaded
reviewed
approved_public
archived
```

## Post-upload checklist

- URL loads in a private/incognito browser.
- Image is not stretched, blurry, or too dark.
- Image meets the minimum dimensions.
- Alt text/page copy matches the service and town.
- Customer media has `consent_status=approved_public` and `media_privacy_status=approved_public` before public gallery/social reuse.


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

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.



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

<!-- Build 192 documentation sync: editable-domain editors, restore-from-history UI, business-hours booking warnings, dynamic policies/templates, analytics registry warnings, media requirement sync/restore, and fallback diagnostics were reviewed on 2026-06-05. -->

---

## Build 193 documentation sync — 2026-06-05

This Markdown file was included in the Build 193 documentation sync. Build 193 fixes the Admin Social template-list 500, adds social-template fallback UI handling, strengthens editable-setting validation schemas, preserves the one-H1 SEO guard, and records that no new Supabase DDL is required for this pass.

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

## Build 195 documentation sync — 2026-06-06

Reviewed for Build 195. Current source of truth is the Build 195 section in `DEVELOPMENT_ROADMAP.md`, the gap update in `KNOWN_GAPS_AND_RISKS.md`, and the no-DDL schema note in `sql/2026-06-06_build195_schema_history_template_export_no_ddl_note.sql`.

> Build 196 documentation sync (2026-06-06): repaired the live Admin Dashboard local SEO proof 405, Admin App `esc` helper crash, and Landing Page Builder add-on fallback hydration. Schema status remains no-DDL; see `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_STRUCTURE_CURRENT.md`, `SUPABASE_SCHEMA.sql`, and `sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql`.

---

## Build 197 documentation sync

Build 197 was reviewed during the self-healing admin diagnostics pass. Relevant implementation notes now point toward pricing catalog source/repair diagnostics, route-copy parity, independent dashboard fallback handling, landing-page SEO/readiness warnings, and continued one-H1/local-search discipline. No database DDL is required for this pass.

## Build 209 live media note — 2026-06-17

Live job media now supports photos and videos with an explicit audience and job stage. Customer-visible media may appear immediately; review-pending and staff-only media must remain protected. Prefer protected storage bucket/path metadata with short-lived signed URLs instead of public links for private evidence. Added placeholder types: `live_customer_update`, `private_staff_note`, and `video_update`. Placeholders must inherit visibility and must never expose private evidence.


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

## Build 215 — JPG Local Hero compatibility and verification (2026-06-30)

The Local Hero images may remain JPG files. They do **not** need to be converted to WebP merely to render in Rosie Dazzlers.

Canonical Local Hero key pattern:

```text
landing-pages/<town-or-area>-auto-detailing.jpg
```

The current public renderer and Admin Media Health verifier accept the same approved base key with:

```text
.jpg
.jpeg
.webp
.png
```

The original URL is always tried first. A format variant is tried only before the page uses a fallback visual. This is a compatibility layer, not a filename repair tool: folder name, base filename, and case-sensitive R2 key must still be correct.

### Required verification after Build 215 deployment

1. Open `/admin-media-health.html` while signed in.
2. Click **Run image health scan**.
3. For each Local Hero, confirm:
   - status is public;
   - measured dimensions are at least 1600×900;
   - **Resolved URL** points to the approved JPG/JPEG/WebP/PNG object;
   - no missing/not-public badge appears.
4. In an incognito/private browser, open the exact resolved URL from the card.
5. Open the matching public Local Hero page and confirm the hero image appears instead of the default fallback.
6. If an item still fails, record the exact expected key, resolved URL, HTTP status, and measured dimensions. Do not rename assets blindly.

Build 215 migration for existing DB task rows:

```text
sql/2026-06-30_build215_media_asset_format_alignment.sql
```

## Build 216 public-media recovery note

Use `/admin-media-health.html` after a public asset upload. It now reports the expected R2 key, resolved public URL, HTTP status, compatible format result, dimensions, and failure type. Do not rename an uploaded asset by guesswork. Record the exact key and resolved URL first.

After the Build 216 migration, the first failed scan is only monitoring. A second consecutive failure creates an active staff alert; one passing scan resolves it. These alerts are for public site assets only and must not be used for private job media or incident evidence.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 visual priorities

New placeholder roles: `startup_command_center_unified_path` and `local_seo_proof_review_cadence`. Replace them only with approved Rosie-owned visuals. Public priority remains real before/after proof for the homepage, booking trust areas, specialty services, town pages, gallery, and Google Business Profile.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

## Build 244 update

- Bundled the new AI-generated raster placeholder images directly into the application zip so the site no longer depends on missing SVG photo fallbacks for common empty-image states.
- Replaced review, add-on, catalog, booking, workflow, and admin placeholder-photo references from SVG files to real PNG/JPG files.
- Preserved instructional SVG graphics, such as framing guides and charts, where SVG is still the correct format.
- Sanity check: the remaining strongest live-readiness work is acceptance testing, content completion, operational policy confirmation, and production credential/provider validation rather than placeholder-media cleanup.

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

## Build 247 raw-media and image note

Real customer/project source media belongs in the private `rosie-daip-media` bucket through `/admin-daip-media.html`, not in public placeholder folders. `rosie-assets/CarPhotos/` may continue to supply already-public/approved visual resources, but raw MOV/MP4/JPG masters should remain private. Existing raster fallback photos remain bundled so broken/missing public images do not fall back to SVG photo placeholders.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

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
