# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
# Build 164 sync — booking intake review fields

**Updated:** 2026-05-22

Build 164 adds optional booking review fields through `sql/2026-05-22_build164_booking_intake_review_actions.sql`: `intake_review_note`, `intake_reviewed_at`, and `intake_reviewed_by`. These support the Admin Booking photo-estimate, condition-review, and media/privacy review action controls. The workflow remains fallback-safe before migration by appending staff review status to booking notes.

---

# Repo Rules — Build 155

**Updated:** 2026-05-18

1. Keep public pages to one clear H1.
2. Keep local SEO wording in titles, meta descriptions, headings, and visible copy.
3. Do not remove JSON fallbacks until the matching DB editor/import/rollback flow is stable.
4. Keep root and folder-backed route copies synchronized.
5. Update Markdown and schema files on every build pass.
6. Prefer robust fallbacks and visible staff-facing errors over silent failures.
7. Run `python scripts/release_check.py` before packaging a ZIP; this now includes Cloudflare Pages Functions deploy-safety checks.
8. For inventory media, prefer `app_media_library` plus R2 URLs, but keep bundled image fallback working.

<!-- Build 155 sync 2026-05-18 -->

## Build 155 repo rule update

Cloudflare Pages Functions route files must use relative helper imports that resolve from their actual folder. Root `/functions/api/*.js` files must use `./_lib/...`; nested route files may use the correct relative path for their folder. The deploy-safety script now checks this before packaging.


## Build 155 Cloudflare root import release-check hotfix - 2026-05-18

Build 155 repairs the remaining root Cloudflare Pages Function import paths that could still break deployment after Build 154. Four root `/functions/api/*.js` files still used `../_lib/...`; root routes must use `./_lib/...`. Build 155 fixes those files, keeps the stale-route shims, wires the stale-root import guard into the release checklist, and updates the release runner so the full check can complete in this sandbox.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

