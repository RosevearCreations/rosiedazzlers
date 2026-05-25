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
