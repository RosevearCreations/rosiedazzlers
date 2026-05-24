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
