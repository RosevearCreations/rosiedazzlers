> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

# Editable Content and Hard-Coding Sanity Check — Build 188

## Result

This audit identifies **40 content/configuration domains**. **35 should be editable** through a database table, an Admin App setting, or a stable fallback file. **5 should remain controlled** by environment secrets, reviewed code, schema migrations, or append-only records.

Build 188 fixes the immediate water-rule deployment problem by making water restrictions DB-first with one stable JSON fallback. Mutable municipal wording is no longer stored in `landing_pages_public.js`.

## Editable status summary

| Status | Count | Meaning |
|---|---:|---|
| `db_with_file_fallback` | 10 | Database/app setting is preferred with a deploy-safe file fallback. |
| `partial_hardcoded` | 16 | Some content is still repeated in HTML or JavaScript and should be migrated. |
| `db_managed` | 7 | A database-managed foundation already exists. |
| `file_managed` | 2 | Editable file exists, but a DB/admin workflow is still recommended. |

## Highest-priority remaining migrations

1. Move the large default landing-page content objects out of JavaScript into a stable JSON fallback plus `app_management_settings.landing_pages`.
2. Move business identity, contact details, service-area summary, structured-data values, and social links into one business-profile setting.
3. Finish editable policy copy for deposits, cancellations, refunds, driveway access, water/power, and customer requirements.
4. Finish editable notification, receipt, refund, quote, proposal, invoice, and social caption templates.
5. Consolidate navigation/footer links, admin dropdown option libraries, analytics event definitions, and intake options.
6. Replace build-specific media requirement files with a stable fallback file plus DB-managed media tasks.

## Domains that should be editable

| # | Domain | Current status | Recommended authority | Priority |
|---:|---|---|---|---|
| 1 | Water restriction rules | `db_with_file_fallback` | `public.water_restriction_rules` | critical |
| 2 | Service area, travel tier, parking, noise, and access rules | `db_with_file_fallback` | `public.service_area_rules` | critical |
| 3 | Pricing packages | `db_with_file_fallback` | `app_management_settings.pricing_catalog` | critical |
| 4 | Add-ons and package dependencies | `db_with_file_fallback` | `app_management_settings.pricing_catalog` | critical |
| 5 | Booking availability rules and slot labels | `db_with_file_fallback` | `booking_rules / app_management_settings` | high |
| 6 | Public booking requirements | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules` | high |
| 7 | Travel pricing and callout controls | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules.travel_pricing` | high |
| 8 | Tax rate, fuel surcharge, material surcharge, and minimum callout | `db_with_file_fallback` | `app_management_settings.pricing_catalog.booking_rules.price_controls` | high |
| 9 | Deposit, cancellation, rescheduling, and refund policy copy | `partial_hardcoded` | `site_content_blocks / app_management_settings` | high |
| 10 | Landing page content | `partial_hardcoded` | `app_management_settings.landing_pages` | critical |
| 11 | Town/local SEO page content | `partial_hardcoded` | `app_management_settings.landing_pages / local_seo_task_cards` | critical |
| 12 | Page titles, meta descriptions, canonical and schema content | `partial_hardcoded` | `landing_pages / content blocks / page SEO settings` | high |
| 13 | FAQ entries | `db_with_file_fallback` | `public.public_faq_entries` | high |
| 14 | Help articles and education content | `partial_hardcoded` | `public.site_content_blocks` | high |
| 15 | Homepage cards and calls to action | `db_managed` | `public.site_content_blocks` | medium |
| 16 | Service blurbs | `db_managed` | `public.site_content_blocks` | medium |
| 17 | Specials and promotions | `db_managed` | `public.site_content_blocks / promotions table` | high |
| 18 | Gift card content and settings | `partial_hardcoded` | `public.site_content_blocks / app_management_settings` | medium |
| 19 | Fleet and maintenance plan content | `db_managed` | `public.site_content_blocks` | medium |
| 20 | Trust, review, and testimonial blocks | `db_managed` | `trust_block_items / approved review records` | high |
| 21 | Gallery and local proof media | `db_with_file_fallback` | `before_after_gallery / media records` | high |
| 22 | Media privacy and consent status | `db_managed` | `media consent records / gallery records` | critical |
| 23 | Image and video requirements | `file_managed` | `media_asset_tasks / app management settings` | medium |
| 24 | Notification templates | `partial_hardcoded` | `notification_templates` | high |
| 25 | Receipt and refund email templates | `partial_hardcoded` | `notification_templates` | high |
| 26 | Social caption templates | `partial_hardcoded` | `social_caption_templates` | medium |
| 27 | Business identity, contact details, service area summary, and social links | `partial_hardcoded` | `app_management_settings.business_profile` | critical |
| 28 | Business hours, holiday closures, and seasonal availability | `partial_hardcoded` | `app_management_settings.business_hours` | high |
| 29 | Navigation and footer labels/links | `partial_hardcoded` | `app_management_settings.site_navigation` | medium |
| 30 | Admin dropdown option libraries | `partial_hardcoded` | `app_management_settings.option_libraries` | medium |
| 31 | Accounting mappings and HST/GST review settings | `db_managed` | `accounting mapping tables / app settings` | high |
| 32 | Customer quote, proposal, invoice, and receipt templates | `partial_hardcoded` | `notification_templates / document_templates` | high |
| 33 | Lead intake topics, condition options, and recommendation copy | `partial_hardcoded` | `app_management_settings.intake_options` | medium |
| 34 | Analytics event definitions and conversion labels | `partial_hardcoded` | `app_management_settings.analytics_event_definitions` | medium |
| 35 | Vendor directory and service/product reference links | `file_managed` | `vendor_directory / product catalog` | low |

## Domains that should not be normal content edits

| Domain | Required authority | Reason |
|---|---|---|
| API keys, payment secrets, session secrets, and R2 credentials | `Cloudflare environment variables / secrets` | Secrets must never be stored in public JSON or editable content tables. |
| Authentication and authorization enforcement | `code plus staff capability records` | Role labels may be editable, but permission enforcement must remain code/schema controlled. |
| Database schema and migrations | `version-controlled SQL migrations` | Schema changes require review and deployment, not content editing. |
| Webhook signature verification and payment settlement logic | `code plus environment secrets` | Security-critical payment logic must not be content editable. |
| Append-only audit history and financial event records | `append-only database records` | Corrections should be new events, not edits that erase history. |

## Build 188 water-rule authority

Water restrictions now use this authority order:

1. `public.water_restriction_rules`
2. `app_management_settings.water_restriction_rules`
3. `data/water_restriction_rules.json`

Service-area rows store only `water_rule_key`; runtime APIs derive the current water-rule wording. The fallback JSON remains necessary so public pages and booking guidance still work before SQL is applied or during a database outage.

## Editing rules

- Use the database/Admin App for routine edits after the Build 188 SQL is applied.
- Keep the stable JSON fallback synchronized after a verified rule change so deployments remain safe during outages.
- Do not place mutable municipal rule text back into JavaScript, HTML, or pricing-catalog inline objects.
- Keep secrets and security-critical logic out of editable content stores.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.


## Build 189 editable-site-settings follow-up

Build 189 moved the next high-priority mutable domains into DB-first / JSON-fallback settings:

1. Landing-page fallback content was extracted from `functions/api/landing_pages_public.js` into `data/landing_pages_content.json` and `functions/api/data/landing_pages_content.json`.
2. Business identity, contact details, social links, and structured-data values now have `data/business_profile.json` and the `business_profile` app setting.
3. Deposit, cancellation, refund, driveway, water, power, and media privacy copy now have `data/site_policies.json` and the `site_policies` app setting.
4. Notification, receipt, refund, quote, proposal, invoice, and confirmation templates now have `data/document_templates.json` and the `document_templates` app setting.
5. Business hours and holiday closures now have `data/business_hours_holidays.json` and the `business_hours_holidays` app setting.
6. Navigation and footer links now have `data/navigation_footer.json` and the `navigation_footer` app setting.
7. Dropdown/option libraries are now exposed through `option_libraries`.
8. Analytics event labels are now exposed through `data/analytics_event_registry.json` and the `analytics_event_registry` app setting.
9. Media requirements now use stable `data/media_requirements.json` instead of build-specific files as the long-term fallback path.
10. `/admin-site-settings.html` provides the protected editor bridge for these JSON payloads.

Controlled items that should remain code or append-only data are unchanged: secrets, auth/permission enforcement, migrations, webhook verification/payment settlement logic, and audit/financial history.


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

## Build 192 editable-content sanity update — 2026-06-05

Editable content now covers structured editor helpers, direct history restore, media requirement sync/restore, dynamic policy copy on booking/payment pages, rendered invoice and appointment confirmation templates, analytics registry warnings, and dashboard fallback diagnostics. Remaining editable-content work should focus on per-field schema validation, preview/diff tools, and wider option-library dropdown adoption.

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

## Build 209 editable-content sync note — 2026-06-17

Live job notes/media are operational records, not general site-settings JSON. They are DB-backed through `job_updates` and `job_media`, with friendly mobile/admin screens and explicit moderation. No raw JSON editor is introduced for customer job content. Existing friendly site/content editors and emergency JSON recovery rules remain unchanged.


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

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

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
