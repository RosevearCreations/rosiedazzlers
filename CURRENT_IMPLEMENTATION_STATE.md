# Current Implementation State — Build 153

**Updated:** 2026-05-18

## Current baseline

Build 153 continues from Build 151 and keeps `rosiedazzlers-dev` as the working dev branch baseline.

The current focus is the Admin Catalog inventory workflow plus deploy stability. Build 150 repaired fallback image hydration for saved DB rows with blank `image_url`. Build 151 extended that into a stronger image workflow with a media-library read endpoint, selected-row image repair, duplicate-image diagnostics, and browser image health scanning. Build 153 repairs the Cloudflare Pages Functions deploy blocker and adds release checks to catch that class of issue before upload.

## What is working now

- Public pages continue to follow the one-H1 release discipline and local SEO checks.
- Admin Catalog lists saved DB inventory rows over bundled consumables/tools fallback rows.
- Blank saved DB image fields hydrate from matching bundled consumables/tools images.
- The inventory editor has image preview, matching bundled image restore, existing-image picker, and clear-image controls.
- The existing-image picker now includes media-library rows when available.
- Selected rows can be repaired/imported so fallback-matched images are saved back to DB.
- Visible inventory images can be browser-scanned for failed loads.
- Duplicate image groups are counted and flagged.
- Release checks include Cloudflare Pages Functions deploy-safety checks, static checks, local SEO/H1 audit, catalog fallback checks, Amazon matching, mobile nav, Admin App editor, inventory picker, and media-library picker guards.

## Current schema state

- `catalog_inventory_items` is the DB source of truth for saved tools/consumables.
- Bundled JSON remains the fallback source for public and admin continuity.
- `app_media_library` is now documented as the DB-backed shared image source for inventory images, landing-page proof, add-ons, and future R2 uploads.
- Build 151 adds/guards indexes for media-library group, usage contexts, status, and image lookup.

## Deploy caution

Apply migrations in order and smoke-test Admin Catalog after deploy. If `app_media_library` is not present or not seeded yet, the UI should continue to work from app settings and bundled JSON/R2 fallbacks.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 deployment hotfix status

Build 153 is a Cloudflare deploy-repair pass. It keeps the Build 151/152 inventory media workflow intact, fixes unresolved `_lib` imports reported by Cloudflare Pages Functions, keeps the `media_library_list` regex repair, and keeps `landing_pages_public.js` normalized without duplicate keys. No data workflow or database shape changed.

## Build 154 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 154 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 154 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.

