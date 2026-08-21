> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.


## Build 259 — vehicle-size review fields

`public.bookings` now supports staff verification when a vehicle cannot be confidently matched to the size catalog. The additive fields are `vehicle_size_review_status`, `vehicle_size_original`, `vehicle_size_catalog_expected`, `vehicle_size_review_reason`, `vehicle_size_reviewed_size`, `vehicle_size_reviewed_price_cents`, review actor/timestamps, a SHA-256 review-token hash/expiry, and the customer response/timestamp. Apply `sql/2026-08-13_build259_vehicle_size_review.sql` before using the staff correction/secure customer confirmation workflow.
# Database Structure — Build 245 Status

Build 245 requires no DDL. It adds browser/static acceptance tooling and content hardening only. Build 240 remains the latest functional database migration.

---

# Database Structure — Build 241 Status

Build 241 requires no DDL. The latest functional database migration remains `sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql`. The hotfix record is `sql/2026-08-05_build241_startup_command_center_initialization_hotfix_no_ddl.sql`.

---

# Database Structure — Build 240 Current Additions

Apply `sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql` after prerequisite migrations.

## New tables

- `catalog_inventory_posting_batches` — source, status, reason, idempotency, row totals, accounting state and reversal evidence.
- `catalog_inventory_posting_rows` — immutable item-level before/after quantities, source movement and reversal movement links.

## Extended records

- `catalog_inventory_movements` gains source, batch, reversal and reversed-status evidence.
- `creative_project_inventory_reservations` gains posting/reversal linkage and may now move from reviewed/reserved to posted, then back to reviewed after reversal.

## Security-definer RPCs

- `admin_catalog_inventory_post(...)`
- `admin_catalog_inventory_post_reverse(...)`

Both are service-role only and are called through protected Cloudflare Functions.

---

# Database Structure — Build 238 Current Additions

Apply `sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql` after prerequisite migrations.

## New tables

- `catalog_inventory_change_batches` — transactional bulk operation header, reason, actor and row count.
- `catalog_inventory_change_batch_rows` — immutable per-row before/after evidence and changed fields.
- `catalog_inventory_merge_audit` — survivor/duplicate snapshots, transferred-reference counts, reason and actor.

## New security-definer RPCs

- `admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean)` — complete-batch validation, dry-run preview, all-or-nothing commit and audits.
- `admin_catalog_inventory_merge(text,text,text,text,boolean)` — reviewed preview/commit, known-reference transfer, compensating movements, survivor consolidation and duplicate soft archive.

Tables and functions are revoked from public/anon/authenticated and granted only to `service_role`; protected Cloudflare Functions are the browser boundary. `SUPABASE_SCHEMA.sql` contains the complete Build 238 executable mirror.

---

# Build 237 database synchronization — shared launch evidence and current roadmap cycle

Apply `sql/2026-07-28_build237_css_startup_evidence_roadmap.sql`. It adds `app_launch_readiness_evidence`, `app_launch_readiness_evidence_audit`, and `cycle_key` / `is_current_cycle` / `action_path` on `app_roadmap_execution_items`. Direct browser table access remains revoked; Cloudflare Functions use the service-role boundary. Browser localStorage is now a fallback only for launch evidence during migration/outage.

---

# Build 236 schema compatibility note

No DDL is added. Schedule reads and writes use the retained `date_blocks.blocked_date` and `slot_blocks.blocked_date/slot` columns while returning compatibility aliases to older consumers. See `sql/2026-07-26_build236_calendar_css_schedule_compatibility_no_ddl.sql`.

---

# Build 207 Markdown consolidation and visual placeholder note

Build 207 adds no new database tables. Documentation sanity and visual placeholder reporting use bundled JSON files: `data/markdown_sanity_build207.json`, `data/build207_enhancement_sweep.json`, and `data/visual_placeholder_registry.json`. The admin report APIs use existing staff authentication and do not require Supabase schema changes.

---

# Build 205 schema note — sanity report/backlog only

Build 205 does not add database tables. It adds a static/admin value-added sanity report, a JSON backlog file, documentation, and dashboard/page UI for current-state review. Future database work should focus on quote pipeline metrics, Meta campaign ROI records, membership recurring plan records, vehicle history timeline records, proof-of-work checklist records, and fleet account records.

# Build 204 database update — No new DDL

Build 204 does not add database tables or columns. The gallery repair uses the existing `app_management_settings.before_after_gallery` editable-setting row, the bundled `data/before_after_gallery.json` fallback, and new application-level media URL normalization/fallback logic.

The new admin Gallery image health diagnostic endpoint reads the public gallery response and does not require a migration. Future work may move gallery rows into a dedicated DB table with first-class booking/customer-consent links, but that is not part of this pass.

---

# Build 203 database update — No new DDL

Build 203 does not add database tables or columns. It adds a bundled responsive/visual registry at `data/responsive_visual_registry.json` and a dashboard diagnostic API that reads the registry and sampled pages. Future work may move this registry into `app_management_settings` once a friendly editor is added.

---

# Build 202 database update — Incident reports

**Updated:** 2026-06-12  
**Build:** 202

Build 202 adds `public.incident_reports` through `sql/2026-06-12_build202_incident_reports_and_marketing.sql`. The table stores private detailer/admin incident reports separately from customer-visible approved summaries and selected public evidence. Required routine fields include `booking_id`, `incident_type`, `severity`, `status`, `decision_status`, `title`, `private_report`, and `evidence_items`. Customer-facing output uses only `approved_customer_summary`, `approved_customer_discussion`, `public_evidence_items`, `public_visible`, and `customer_visible_at`.

---

# Build 201 schema status — Friendly validation and route-copy sync

**Updated:** 2026-06-09  
**Build:** 201

No database schema migration is required for Build 201. The work remains UI/release-guard focused and continues to use the existing DB-backed editable settings model:

- `app_management_settings.pricing_catalog`
- `app_management_settings.landing_pages`
- `app_management_settings.social_feeds`
- `app_management_settings.before_after_gallery`
- existing bundled JSON fallbacks for emergency recovery

The new inline validation, media picker, schema preview, and save-review helpers operate on the existing editor state before saving back to the same editable-setting rows. `scripts/sync_route_copies.py` is a repository packaging helper and does not require a table or column change.

---

# Build 200 schema status — friendly pricing editor completion

**Updated:** 2026-06-09  
**Build:** 200

Build 200 adds no new tables or columns. The package detail editor, chart helper state bridge, and remaining-advanced-JSON dashboard card reuse the existing `app_management_settings` row for `pricing_catalog` and the existing bundled JSON fallback. Friendly package rows are applied back into the same pricing catalog payload before save, so the public booking/pricing/landing/chart code continues using one DB-first source with bundled fallback.

---

# Build 199 schema status — friendly Site Settings editor pass

**Updated:** 2026-06-07  
**Build:** 199

Build 199 adds no new tables or columns. It reuses the existing `app_management_settings` and `app_management_setting_history` rows for the newly friendly Admin Site Settings editors. The UI converts row/card edits back into the same JSON payload before saving, so bundled JSON fallbacks and DB-first rendering continue to work without a migration. Admin Recovery delivery rules also reuse the existing recovery-template `rules` payload.

---

# Build 197 schema status — no-DDL self-healing admin pass

**Updated:** 2026-06-06  
**Build:** 197

Build 197 does not require new tables or columns. The new pricing diagnostics and repair endpoints read and update the existing `app_management_settings` row with `key = 'pricing_catalog'`. Route-copy parity, dashboard guarded loading, and landing SEO/readiness checks are code/UI features only.

Operational note: if `/api/admin/pricing_catalog_diagnostics` reports missing groups or rows, staff can use `/api/admin/pricing_catalog_repair` through the Admin Dashboard. The repair action preserves existing DB values and adds only missing bundled fallback groups/rows.

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

# Build 181 schema update — verified quote deposit webhooks

Build 181 adds provider-verification audit fields to `public.quote_deposit_payment_requests` so Stripe and PayPal events can settle accepted quote deposits automatically. Apply `sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql` after Build 180.

## Updated table: `public.quote_deposit_payment_requests`

New optional fields:

- `webhook_verified_at timestamptz`
- `webhook_processed_at timestamptz`
- `provider_event_id text`
- `provider_event_type text`
- `provider_payment_intent_id text`
- `provider_order_id text`
- `provider_capture_id text`
- `provider_payload jsonb`

The provider check is updated to allow:

- `manual`
- `stripe`
- `paypal`

Runtime behavior:

- Stripe `checkout.session.completed` with `quote_deposit_payment_request_id` metadata marks the matching request paid.
- PayPal verified `PAYMENT.CAPTURE.COMPLETED` or `PAYMENT.SALE.COMPLETED` events mark the matching request paid.
- When a linked booking exists, settlement confirms the booking and writes a booking finance deposit event.

# Build 178 update — Status Saves, Saved Price Reviews, Public Content Rendering & Privacy Badges

**Current build:** Build 178  
**Date:** 2026-05-25

Build 178 saved price review foundation closes the next operational gaps after Build 177 by adding conversion-draft status saving, saved final price reviews, live rendering of Admin Content Center blocks on public pages, media privacy readiness badges in the Social Queue/App Management flow, and deeper local SEO proof recommendations. No new DDL is required; this pass depends on the Build 175 content/conversion tables and Build 177 final-price review fields.

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

> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

# Build 173 database/schema sync — Admin Content Center FAQ editor bridge

**Updated:** 2026-05-24

Build 173 does not create a new table. It adds a protected Admin Content Center at `/admin-content.html` that edits the existing Build 172 table `public.public_faq_entries` through `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save`.

Live editing requires this migration first:

1. `sql/2026-05-24_build172_public_faq_content_foundation.sql`
2. `sql/2026-05-24_build173_admin_content_faq_editor_no_ddl_note.sql` — documentation/sync note only

The editor remains fallback-aware: if Supabase configuration or the FAQ table is unavailable, staff can still load and review the static public FAQ fallback, but saving requires the Build 172 table.

---
> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 database/schema sync — public FAQ content foundation

**Updated:** 2026-05-24

Build 172 adds `sql/2026-05-24_build172_public_faq_content_foundation.sql`, which creates `public.public_faq_entries` as the future DB-managed source for the new `/faq` page and `/api/public_faqs` endpoint.

The page and endpoint remain fallback-safe before migration: static FAQ content is embedded in `/faq` and mirrored in `data/site_faqs.json`, while `/api/public_faqs` returns a `static_fallback` payload if Supabase config, the table, or rows are unavailable.

Apply after any pending Build 167/168 lead/upload migrations if the project is ready to move FAQ/help content into Supabase.

---
# Build 171 database/schema sync — Admin Leads quote preview

**Updated:** 2026-05-24

Build 171 does not add tables or columns. The new quote-starter endpoint reads existing `public.public_inquiry_leads` and linked `public.photo_estimate_uploads` rows created by Build 167/168. A no-DDL note was added at `sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql`, and `SUPABASE_SCHEMA.sql` now includes Build 169, Build 170, and Build 171 sync notes.

Required live-data order remains:

1. `sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql`
2. `sql/2026-05-23_build168_admin_leads_photo_review.sql`
3. `sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql` — documentation note only

---
# Build 165 sync — Booking photo-estimate link capture

**Updated:** 2026-05-22

Build 165 adds optional `public.bookings.photo_estimate_links` jsonb storage plus a public Booking Step 4 photo-estimate link field, sends the links through checkout, stores them in notes as a fallback, writes to optional `bookings.photo_estimate_links` when migrated, and shows clickable links in Admin Booking intake review. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 164 sync — booking intake review fields

**Updated:** 2026-05-22

Build 164 adds optional booking review fields through `sql/2026-05-22_build164_booking_intake_review_actions.sql`: `intake_review_note`, `intake_reviewed_at`, and `intake_reviewed_by`. These support the Admin Booking photo-estimate, condition-review, and media/privacy review action controls. The workflow remains fallback-safe before migration by appending staff review status to booking notes.

---

# Build 163 sync — booking intake admin review

**Updated:** 2026-05-21

Build 163 adds fallback-safe direct booking intake field storage and a staff-facing Admin Booking panel for estimate intake, condition-helper recommendations, media-consent preference, and privacy-review status hints. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 161 database/schema note

**Updated:** 2026-05-21

No DDL was added in Build 161. The package aliases and recommendation fields are content metadata in the pricing catalog. When the DB-first catalog is refreshed, carry these fields into `app_management_settings.pricing_catalog`; no table migration is required for this pass.

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

# Database Structure Current — Build 157


**Build 157 update — 2026-05-19:** Social progress publishing bridge added. Admin Progress can automatically create social drafts and optionally attempt approved API/webhook posting. Admin Social Queue now supports Publish/API, Send webhook, Copy text/media, Ready, Mark posted, and Skip. No DDL is required beyond Build 156; Build 157 adds `sql/2026-05-19_build157_social_api_publish_bridge_no_ddl_note.sql`.


**Updated:** 2026-05-18

## Inventory/media tables in active use

### `catalog_inventory_items`

Current inventory source of truth for saved tools and consumables. Important fields include:

- `item_key`, `item_type`, `name`, `category`, `subcategory`
- `image_url`, `amazon_url`, Amazon match enrichment fields
- `qty_on_hand`, `reorder_point`, `reorder_qty`, `unit_label`, `cost_cents`
- `preferred_vendor`, `vendor_sku`, `receipt_url`, `assigned_station`
- `service_tags`, `reuse_policy`, `is_public`, `is_active`

### `catalog_inventory_movements`

Tracks stock usage, manual adjustments, waste/write-off actions, and booking-linked inventory movement.

### `catalog_purchase_orders`

Tracks reorder requests, ordered/received status, reminder dates, purchase URL, vendor, quantity, and receive lifecycle.

### `app_media_library`

Build 151 DB-backed shared media-library target. Used by `/api/admin/media_library_list` and Admin Catalog image picker when available.

Important fields:

- `media_key`, `label`, `media_type`, `media_url`, `fallback_url`
- `alt_text`, `caption`, `group_key`, `usage_contexts`
- `recommended_size`, `source_status`, `sort_order`, `updated_at`, `updated_by`

## Fallback order

1. Saved DB rows in `catalog_inventory_items`.
2. `app_media_library` rows for picker/search if available.
3. `app_management_settings.media_library` rows if the table is not populated yet.
4. Bundled JSON product/tool rows from `data/rosie_products_catalog.json` and `data/systems_catalog.json`.
5. Browser-local helper image URLs.

## Build 151 migration

Apply:

```sql
sql/2026-05-18_build151_media_library_inventory_image_workflow.sql
```

This migration is non-destructive and safe to apply before the media library is populated.

## Build 155 schema note

Build 155 is a deploy hotfix and release-check hardening pass. It does not add or change database tables. The current schema remains Build 151 plus the Build 150 inventory image indexes.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 schema note

Build 155 has no database DDL. The schema remains the Build 151 media-library baseline plus Build 150 inventory image indexes. This pass only repairs Cloudflare Pages Functions import resolution and deploy checks.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

No database shape changed in Build 155. Active DB baseline remains Build 150 inventory image indexes plus Build 151 `app_media_library`.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

Database note: run `sql/2026-05-19_build156_social_progress_dispatch_queue.sql` before relying on live social queue writes.

## Build 159 sync — social queue usability and release discipline

- Added caption/hashtag DB picker support for Admin Social Queue.
- Added planned publish time for manual drafts and schedule filtering.
- Added duplicate draft warnings using `duplicate_signature`.
- Added manual posted URL and platform post ID capture.
- Added `social_post_metrics_snapshots` schema support for future reporting.
- Release checks now require the Build 159 social template/schedule markers.

## Build 168 sync — Admin Leads and Photo Estimate Review

Build 168 adds an internal review layer over the Build 167 public lead and upload tables.

Apply:

```sql
sql/2026-05-23_build168_admin_leads_photo_review.sql
```

This migration extends `photo_estimate_uploads` with `staff_note`, `privacy_note`, `reviewed_at`, and `reviewed_by_staff_user_id`. These fields support the new `/admin-leads` screen, where staff can review public quote-photo uploads, mark privacy status, link media to a lead or booking UUID, and keep internal follow-up notes.

The screen and endpoints are fallback-safe: if Build 167/168 SQL has not been applied, staff see a migration hint rather than a broken page.

## Build 170 schema note — no DDL

Build 170 did not add or change tables. The schema handoff was updated with `sql/2026-05-24_build170_customer_dashboard_signed_out_fallback_no_ddl_note.sql` to document that the customer dashboard signed-out fallback is an API behavior change only.

---

## Build 174 — quote/proposal drafts

Build 174 adds the planning/live schema target `public.quote_proposal_drafts` through `sql/2026-05-24_build174_quote_proposal_drafts.sql`.

Purpose:

- Save generated Admin Leads quote starters as persistent drafts.
- Tie a draft to `lead_id`, `booking_id`, or both.
- Track status such as `draft`, `needs_review`, `ready_to_send`, `sent`, `accepted`, `declined`, and `archived`.
- Preserve body text, pricing notes, staff/internal notes, follow-up date, sent date, customer name/email, and staff creator/updater ids.

Fallback behavior:

- `/admin-leads.html` can still build and copy quote starter text before this SQL is applied.
- Saving/loading persistent quote drafts returns a migration hint until the table exists.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.

## Build 175 — lead conversion/content/gallery/analytics schema sync

Build 175 adds two DB-managed foundations:

- `public.lead_conversion_drafts` — stores safe lead → draft booking/quote conversion records before staff creates a real scheduled booking.
- `public.site_content_blocks` — stores reusable admin-managed content for specials, service blurbs, homepage cards, help articles, trust/proof blocks, fleet copy, and maintenance copy.

Build 175 also documents the public gallery privacy rule: before/after media should only be returned publicly when consent/privacy status is `approved_public`, `customer_approved_public`, `public`, `approved`, or when the item is explicitly marked `sample`. Pending, private, rejected, or needs-blur media is filtered out before public reuse.

Apply `sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql` after the Build 174 quote draft migration.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 — conversion-to-booking/schema sync

Build 176 extends `public.lead_conversion_drafts` with:

- `converted_booking_id uuid null references public.bookings(id) on delete set null`
- `converted_at timestamptz null`

This lets `/api/admin/lead_conversion_create_booking` trace a reviewed lead conversion draft to the final live booking row. The endpoint still requires staff confirmation for service date, AM/PM slot, address, package, vehicle size, customer name, and customer email before inserting into `public.bookings`.

## Build 177 — conversion review queue, price reconciliation, and local proof reporting

Build 177 adds a dedicated `/admin-conversions.html` review queue for lead conversion drafts. Staff can load all draft booking/quote conversions, reconcile package/add-on/travel/HST pricing from the pricing catalog, confirm booking-ready fields, and then create a live booking through the existing reviewed conversion workflow.

Apply `sql/2026-05-25_build177_conversion_review_price_local_proof.sql` after Build 175 and Build 176 SQL. It extends `public.lead_conversion_drafts` with optional final price review fields:

- `final_price_review jsonb`
- `final_price_status text`
- `final_price_total_cents integer`
- `final_deposit_cents integer`
- `final_price_reviewed_at timestamptz`

Build 177 also adds `/api/admin/local_seo_proof_report`, which counts only privacy-approved before/after proof by service and town for local SEO planning. This report is surfaced on Admin Analytics and does not require a new table.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

## Build 179 — Publish Privacy Blocking, Proof Tasks, Quote Delivery Tracking

Build 179 adds `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`.

New/extended data targets:

- `public.local_seo_proof_tasks` for assignable town/service local proof tasks created from local SEO proof recommendations.
- `public.quote_proposal_drafts.delivery_status`, `delivery_to_email`, `delivery_subject`, `delivery_message`, `delivered_at`.
- `public.quote_proposal_drafts.acceptance_token_hash`, `acceptance_status`, `accepted_at`, `declined_at`, `responded_at`, and `customer_response_note`.

Runtime behavior:

- Social Queue webhook/API/manual posted actions now hard-block unless the draft is ready and privacy/consent review is confirmed.
- Admin Analytics can turn local proof recommendations into tasks.
- Admin Leads can prepare/send a quote/proposal delivery and create a customer acceptance/decline link.
- `/quote-response.html` records accepted/declined responses through `/api/quote_proposal_respond`.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 schema update

New table:

- `public.quote_deposit_payment_requests` — tracks accepted quote deposit/payment requests, secure public payment URLs, optional checkout links, payment status, paid timestamp, and final booking confirmation link.

Extended tables:

- `public.quote_proposal_drafts` — adds deposit request status/timestamps, latest deposit request id, and final booking confirmation fields.
- `public.lead_conversion_drafts` — adds `latest_deposit_payment_request_id` for quote/conversion traceability.

Migration file:

- `sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql`
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

## Build 182 — Webhook history, replay, receipt emails, and refunds

Build 182 adds `sql/2026-05-26_build182_webhook_history_receipts_refunds.sql`.

New tables:

- `public.quote_payment_webhook_events` — stores verified, ignored, failed, settled, refund-recorded, and replayed Stripe/PayPal quote-deposit webhook events.
- `public.quote_deposit_refund_records` — stores manual/provider refund and partial-refund records tied back to `quote_deposit_payment_requests`.

Extended tables:

- `public.quote_deposit_payment_requests` — adds refund totals/status, latest refund link, and receipt email queue tracking.
- `public.quote_proposal_drafts` — adds receipt/refund summary fields for quote/proposal visibility.

Runtime additions:

- `/api/admin/payment_webhook_events_list`
- `/api/admin/payment_webhook_event_replay`
- `/api/admin/quote_deposit_refunds_list`
- `/api/admin/quote_deposit_refund_save`
- `/admin-payments.html`

Stripe and PayPal webhooks now record event history, queue customer receipt emails after verified settlement, and track refund/partial-refund events when provider refund webhooks arrive. Staff can also record manual refund tracking from the Payments page.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

## Build 183 schema note

Build 183 adds no new tables or columns. It uses existing Build 180–182 payment structures: `quote_deposit_payment_requests`, `quote_payment_webhook_events`, and `quote_deposit_refund_records`. SQL note: `sql/2026-05-30_build183_direct_refunds_reconciliation_images_no_ddl_note.sql`.


-- ---------------------------------------------------------------------------
-- Build 185 note — next 20 operational foundations
-- ---------------------------------------------------------------------------
-- See sql/2026-06-02_build185_next_twenty_ops_foundations.sql.
-- Adds DB-backed media_asset_tasks, processor-fee capture fields, final_balance_payment_requests,
-- payment_applications, month_end_close_checklists, and local_seo_task_cards.
-- Build 185 also upgrades Media Health to validate PNG/JPEG/WebP dimensions, adds an admin R2 upload endpoint,
-- adds HST/GST review and month-end close screens, and expands accountant/payment exports.


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


## Build 187 Schema/Data Note

No new database table is required. The data sync requirement is operational: after deployment, re-import the bundled `data/service_area_rules.json` and landing-page settings if Supabase rows are used so DB content does not override the corrected static/API fallback water rules.

Relevant bundled data:
- `data/water_restriction_rules_build187.json`
- `data/service_area_rules.json`
- `data/local_seo_targets.json`

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

## Build 188 database/content authority update

New preferred table: `public.water_restriction_rules`

New service-area reference column: `public.service_area_rules.water_rule_key`

Authority order:

1. `public.water_restriction_rules`
2. `app_management_settings.water_restriction_rules`
3. `data/water_restriction_rules.json`

The Build 188 migration seeds Oxford County and Norfolk County rules as editable rows and updates existing Oxford/Norfolk service-area rows with the appropriate key. Full mutable rule text should not be stored in `service_area_rules.water_rule` going forward.


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

## Build 192 schema status — 2026-06-05

No new database tables or columns are required for Build 192. The pass deliberately reuses the existing `app_management_settings` and `app_management_setting_history` schema for structured editable-domain editors, direct restore-from-history controls, media requirement sync/restore controls, analytics registry warning checks, dynamic policy/template rendering, and business-hours/holiday booking warnings. See `sql/2026-06-05_build192_editable_operations_completion_no_ddl_note.sql` for the release note.

---

## Build 193 schema status — 2026-06-05

No new database tables or columns are required for Build 193. The pass reuses the existing `app_management_settings` and `app_management_setting_history` tables for editable-setting validation, history, restore, sync, and force-sync workflows. The optional social template tables from earlier builds, `social_caption_templates` and `social_hashtag_presets`, remain DB-first sources when present; built-in fallbacks remain available when those tables are not applied yet.

New fallback/schema-support file:

- `data/editable_setting_validation_schemas.json` — bundled field-level validation rules for editable settings.

New release note:

- `sql/2026-06-05_build193_social_templates_validation_no_ddl_note.sql` — no-DDL note for the social-template hotfix and validation pass.

---

## Build 194 schema note — 2026-06-06

Build 194 adds no new DDL. It reuses `app_management_settings`, `app_management_setting_history`, and `site_activity_events` for editable-setting diff/preview tools and analytics registry quick-add. The no-DDL note is recorded at `sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql`.

---

## Build 195 schema status — 2026-06-06

Build 195 adds no new database tables or columns. It reuses `app_management_settings` and `app_management_setting_history` for field-level validation markers, selected-history diffs, audit exports, fallback-backed setting reports, and media-requirement compare previews. It also reuses `booking_events` for business-hours/holiday override reason logging and the existing booking/document helpers for policy version stamps and template preview/export payloads. The no-DDL note is recorded at `sql/2026-06-06_build195_schema_history_template_export_no_ddl_note.sql`.


## Build 196 schema status — 2026-06-06

Build 196 adds no new tables or columns. It reuses `app_management_settings` and bundled JSON fallbacks for pricing/landing-page recovery, and updates `/api/admin/local_seo_proof_report` method compatibility without schema changes. The no-DDL note is recorded at `sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql`.


---

## Build 198 documentation sync — Friendly editors for formerly raw JSON areas

Build 198 converts routine owner/admin updates for social feeds, before/after gallery rows, and water-use rules into friendly row-based screens. The underlying JSON remains available only as an Advanced/emergency repair and fallback-sync view. No database schema changes are required for this pass; the existing `app_management_settings` and water-rule settings flow remain the source of truth with bundled JSON fallback support.

## Build 206 schema update — value-added operations foundations

Added additive schema destinations in `sql/2026-06-14_build206_value_added_operations_foundations.sql` for gallery approval queue, quote pipeline, Meta ads ROI reports, customer maintenance plans, vehicle history events, proof-of-work checklists, fleet accounts, review request queue, seasonal campaigns, and route cluster hints. The current UI reads seeded JSON/API report data for first-pass dashboards while these DB tables provide the migration target for persistent CRUD workflows.

## Build 209 live-detail interaction database update — 2026-06-17

Migration: `sql/2026-06-17_build209_live_detail_interaction.sql`

Authoritative additions:

- `bookings.progress_last_viewed_at`
- `bookings.progress_last_customer_message_at`
- `bookings.progress_last_staff_update_at`
- `job_updates.stage`
- `job_updates.source_channel`
- `job_updates.review_status`
- `job_updates.requires_admin_review`
- `job_updates.customer_action_required`
- `job_updates.customer_visible_at`
- `job_updates.approved_by_staff_user_id`
- `job_updates.approved_by_staff_name`
- equivalent review/stage/approval columns on `job_media`
- `job_media.storage_bucket`
- `job_media.storage_path`
- `job_media.content_type`
- `job_media.file_size_bytes`

The database is the authority for live notes/media. Bundled files do not contain customer job content. Legacy-schema API fallback is intentionally conservative and must not be treated as a replacement for running the migration.

## Build 210 — connected live workflow (2026-06-17)

Build 210 connects live detail interaction to notifications, proof-of-work completion, customer recommendation decisions, payment requests, completed-job summaries, Gallery/vehicle-history reuse, safe review requests, and the owner attention queue.

### New/extended records

- `bookings`: staff/customer read timestamps, notification timestamps, completed-summary state, and review-request blocking reason.
- `job_updates`: recommendation title/price, customer decision, linked incident, and linked payment-request identifiers.
- `job_media`: duration, upload-session state, retention policy/expiry, and Gallery/vehicle-history reuse state.
- `proof_of_work_checklists`: required stages, per-stage media counts, ready-to-complete state, and controlled override audit.
- `live_upload_sessions`: prepared/uploading/failed/cancelled/completed upload attempts, retry count, errors, and storage destination.
- `completed_job_summaries`: customer-safe proof, products used, care advice, maintenance recommendations, invoice reference, and payment state.
- `gallery_media_candidates`: approved final media queued for before/after pairing without re-uploading.
- `incident_reports`: source job update/media links for issue-to-incident conversion.

Apply `sql/2026-06-17_build210_connected_live_workflow.sql` before testing these paths.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

## Build 211 — production reliability schema sync (2026-06-18)

Apply `sql/2026-06-18_build211_production_reliability.sql` after Build 210. It adds provider/checkout metadata to `final_balance_payment_requests`, reliability fields to `live_upload_sessions`, retention status to `job_media`, and three audit tables: `notification_provider_test_logs`, `storage_retention_audit`, and `production_reliability_audits`.

These changes support `/admin-production.html`, `/api/admin/production_reliability_report`, notification provider tests, hosted Stripe final-balance checkout creation, and safe dry-run storage retention review.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

## Build 212 schema sync

`sql/2026-06-20_build212_guided_production_testing.sql` adds `public.production_test_runs` for protected acceptance-test outcomes. It stores test key/name, status, safe notes/evidence link, environment, build number, staff attribution, timestamps, and non-secret payload metadata. It must not store API keys, payment card data, customer addresses, VINs, or private evidence URLs.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 schema sync (2026-06-22)

Apply `sql/2026-06-22_build213_owner_action_customer_trust.sql` after Build 212. It adds `owner_attention_tasks`, `live_interaction_audit_events`, `recommendation_price_acknowledgements`, and `completed_job_summary_revisions`; it also extends `job_updates`, `job_media`, and `completed_job_summaries` for acknowledgement, vehicle walkaround, media annotation, and revision state.

These changes support `/admin-today.html` owner actions, `/api/admin/live_interaction_audit_export`, customer recommendation acknowledgement, secure payment-link display, and completed-job summary acknowledgement/versioning. Keep audit export free of secrets, signed private URLs, payment details, addresses, VINs, and private incident evidence.

> **Build 213 documentation sync:** Canonical direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; detailed tests are in `docs/PRODUCTION_TEST_GUIDE.md`.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.


## Build 214 schema sync — Supabase RLS and owner task orchestration

Primary migration: `sql/2026-06-23_build214_security_task_orchestration.sql`.

- `owner_attention_tasks` now supports `due_at`, `escalation_at`, `escalation_status`, and `last_notified_at`.
- Public-schema tables are intended to be RLS-enabled with direct `anon`/`authenticated`/`PUBLIC` table grants removed.
- `public.rosie_security_posture_report()` is a service-role-only SQL function used by `/api/admin/security_posture_report`.
- No browser page should query public tables directly; Cloudflare Functions remain the server-side authorization boundary.

## Build 215 — media asset format alignment and DAIP planning note (2026-06-30)

Build 215 adds `sql/2026-06-30_build215_media_asset_format_alignment.sql` to align legacy `public.media_asset_tasks` Local Hero rows from stale `.webp` assumptions to canonical JPG keys/URLs where safe. It does not add new application tables.

DAIP is documentation/planning only in Build 215. No `daip_*` tables, storage buckets, queue records, RLS policies, worker jobs, AI records, export records, or publication tables are created until a separate reviewed Phase 1 migration is approved.

## Build 216 — public media reliability tables

Apply `sql/2026-07-01_build216_media_reliability_daip_governance.sql` after Build 214 RLS containment.

### `public.media_asset_health_observations`

Staff-only audit history for public static/site asset checks. Stores the public R2 key, expected/resolved public URL, response status, public image dimensions/type, compatible-format outcome, failure category, scan time, and staff actor. It must never store customer media, signed URLs, incident evidence, customer identifiers, payment data, or secrets.

### `public.media_asset_alerts`

Staff-only recurring issue state keyed by public asset key. First failure is `monitoring`; a second consecutive failure becomes `active`; a passing scan changes it to `resolved`. `acknowledged` means a staff member reviewed the continuing issue, not that the asset is healthy.

Both tables have RLS enabled and direct `anon`, `authenticated`, and `PUBLIC` privileges revoked. Cloudflare Functions use the service-role boundary to record and read them.

### DAIP status

Build 216 adds no `daip_*` table. DAIP schema work is blocked until DAIP-0 decisions and the Phase 1 security acceptance template are approved.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

# Build 217 schema note — secure final-balance links (2026-06-30)

Apply `sql/2026-06-30_build217_secure_final_balance_links.sql` after the existing final-balance and security migrations. It adds lifecycle columns to `public.final_balance_payment_requests`: `expires_at`, `access_token_rotated_at`, notification audit fields, cancellation audit fields, `paid_amount_cents`, and provider payment-intent/event references. `token_hash` stores only SHA-256 hashes of opaque public tokens and must never be returned to a browser. No direct browser grants are added.



## Build 218 DAIP internal-test tables

Build 218 adds these internal-only, RLS-enabled and service-role-only tables after the Build 214 security model:

- `daip_test_control` — singleton hard stop: internal test/no storage/no worker/no public export/no automatic publishing.
- `daip_test_daily_sequences` — safe `RD-TEST-YYYYMMDD-###` sequence support.
- `daip_media_jobs` — test-only job registry tied to an internal booking with no customer-data/public-export/processor permissions.
- `daip_media_assets` — metadata-only harmless test assets. No public URL, signed URL, bucket, object key, path, or Drive ID columns exist.
- `daip_processing_tasks` — non-executing test planning tasks; `execution_blocked` is hard true.
- `daip_privacy_reviews` — internal-only review state; public export remains hard blocked.
- `daip_audit_events` — safe actor/time/action metadata; do not store secrets, customer information, private media details, or signed URLs.

Apply `sql/2026-07-02_build218_daip_test_mode_foundation.sql` only in development/staging for the first controlled DAIP tests.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.
## Build 239 startup-process catalog

- `app_startup_process_items`: canonical ordered blocker/instruction catalog used by the Startup Command Center.
- `app_startup_process_audit`: protected audit history for controlled catalog changes.
- `app_launch_readiness_evidence`: expanded shared completion evidence linked by `evidence_key`.
- `app_roadmap_execution_items`: Build 239 current-cycle next-20 execution queue.

The database is primary after migration; packaged JSON/JavaScript remains a complete read-only fallback.

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

## Build 247 database synchronization

Production Creative Project raw-media ingestion uses `daip_project_media_assets`, `daip_media_upload_sessions`, `daip_media_upload_parts`, and `daip_media_processing_jobs`. This intentionally does not repurpose Build 218 `daip_media_assets`, which remains the metadata-only Test Lab table. Raw bytes stay in private R2; only metadata/recovery/audit state is stored in Postgres. Migration: `sql/2026-08-07_build247_daip_private_media_ingestion.sql`.

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

## Build 246 catalog-readiness synchronization
Historical Build 246 catalog readiness tables/RPCs remain part of the current schema and are preserved under Build 247.

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

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
