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
# Build 173 documentation update note

**Updated:** 2026-05-24

All Markdown files were synchronized for Build 173. The important operational change is that FAQ/help content now has an admin editing bridge, and the public Help Articles route has fuller content and clearer access paths.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation index update

**Updated:** 2026-05-24

Primary current docs after Build 171:

- `DEVELOPMENT_ROADMAP.md` — source of truth and next steps.
- `KNOWN_GAPS_AND_RISKS.md` — current risks and reduced risks.
- `COMPETETIVE_COMPLETION_MATRIX.md` — competitor/completion matrix, now updated through Build 171.
- `CURRENT_IMPLEMENTATION_STATE.md` — active files and implementation state.
- `DATABASE_STRUCTURE_CURRENT.md` and `SUPABASE_SCHEMA.sql` — schema/SQL sync notes.
- `HANDOFF_NEXT_CHAT.md` and `NEW_CHAT_STATUS.md` — fresh-chat continuation notes.

---
# Build 168 docs index update

**Updated:** 2026-05-23

Build 168 docs: see `DEVELOPMENT_ROADMAP.md` and `COMPETETIVE_COMPLETION_MATRIX.md` for the Admin Leads/photo-estimate review status; see `sql/2026-05-23_build168_admin_leads_photo_review.sql` for schema additions. Main new route: `/admin-leads`.

---

# Build 167 update

Build 167 docs: see DEVELOPMENT_ROADMAP.md and COMPETETIVE_COMPLETION_MATRIX.md for the competitor-matrix completion status; see sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql for schema additions.

---

# Build 166 docs index update

**Updated:** 2026-05-23

Build 166 attempts to complete the public-facing items from `COMPETETIVE.md` by adding public routes for specials, gift cards, fleet, maintenance, and education, expanding the add-on catalog, adding sticky CTAs, updating Services/Homepage routing, and documenting status in `COMPETETIVE_COMPLETION_MATRIX.md`. `DEVELOPMENT_ROADMAP.md` remains the source of truth.

- `COMPETETIVE_COMPLETION_MATRIX.md` — new status matrix for the competitor roadmap.


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

# Build 162 document index note

Primary planning source: `DEVELOPMENT_ROADMAP.md`. Build 162 also touches `KNOWN_GAPS_AND_RISKS.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `SANITY_CHECK.md`, `SUPABASE_SCHEMA.sql`, and `sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql`.

---

# Build 161 sync — DOC_INDEX.md

**Updated:** 2026-05-21

The current website/app now has competitor-aligned service chooser coverage on Services and Booking, clearer public package aliases, and a Contact-page photo-estimate path. Build 161 is a no-DDL pass; the new package metadata is JSON/catalog content and should be copied into the DB-managed pricing catalog when the live catalog is refreshed.

---

# Build 160 doc-index note

**Updated:** 2026-05-21

Planning source of truth: `DEVELOPMENT_ROADMAP.md`. Competitor/service reference: `COMPETETIVE.md`. Build 160 audit: `COMPETITOR_SANITY_CHECK.md`. Aliases were added as `COMPETITOR.md` and `COMPETETOR.md` so future chats can find the file even if the name is typed differently.

---

# Documentation Index — Build 153

**Updated:** 2026-05-18

## Active handoff docs

- `README.md` — current build summary and release command.
- `DEVELOPMENT_ROADMAP.md` / `ROADMAP.md` — completed Build 151/152 work and next 20 steps.
- `KNOWN_GAPS_AND_RISKS.md` — current open risks.
- `CURRENT_IMPLEMENTATION_STATE.md` — current app state.
- `DATABASE_STRUCTURE_CURRENT.md` — current schema notes.
- `SANITY_CHECK.md` — release and manual smoke checks.
- `IMAGES.md` — current image/media workflow.
- `HANDOFF_NEXT_CHAT.md` / `NEW_CHAT_STATUS.md` — compact continuation notes.
- `NEXT_STEPS_INTERNAL.md` — next implementation checklist.

## Current Build 153 implementation files

- `admin-catalog.html`
- `admin-catalog/index.html`
- `functions/api/admin/media_library_list.js`
- `scripts/media_library_picker_check.py`
- `scripts/cloudflare_pages_functions_check.py`
- `sql/2026-05-18_build151_media_library_inventory_image_workflow.sql`
- `sql/2026-05-18_build152_cloudflare_deploy_hotfix_no_ddl_note.sql`

<!-- Build 153 sync 2026-05-18 -->

## Build 153 documentation note

Build 153 documentation updates are focused on Cloudflare deploy repair: import-path hotfix, no-DDL schema note, deploy-safety checks, and next-step handoff after clean deployment.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

New document: `SOCIAL_PLATFORM_PUBLISHING.md`.
- Build 169 auth/API fallback repair is documented across README, DEVELOPMENT_ROADMAP, KNOWN_GAPS_AND_RISKS, CURRENT_IMPLEMENTATION_STATE, NEW_CHAT_STATUS, HANDOFF_NEXT_CHAT, SANITY_CHECK, and `sql/2026-05-23_build169_auth_analytics_fallback_no_ddl_note.sql`.

- Build 170 customer dashboard signed-out fallback is documented across README, DEVELOPMENT_ROADMAP, KNOWN_GAPS_AND_RISKS, CURRENT_IMPLEMENTATION_STATE, NEW_CHAT_STATUS, HANDOFF_NEXT_CHAT, SANITY_CHECK, and `sql/2026-05-24_build170_customer_dashboard_signed_out_fallback_no_ddl_note.sql`.

## Build 172 handoff note

- New customer FAQ/help route: `/faq` and `/faq/index.html`.
- Access paths: top nav, footer, homepage, Services, Pricing, Contact, and sitemap.
- New FAQ DB/API foundation: `public_faq_entries`, `/api/public_faqs`, `data/site_faqs.json`.
- Next recommended build: Admin Content editor for FAQ/special/service/education copy, then persistent quotes and lead conversion.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.
