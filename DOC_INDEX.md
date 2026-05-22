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
