# Current Implementation State — Build 151

**Updated:** 2026-05-18

## Current baseline

Build 151 continues from Build 150 and keeps `rosiedazzlers-dev` as the working dev branch baseline.

The current focus is the Admin Catalog inventory workflow. Build 150 repaired fallback image hydration for saved DB rows with blank `image_url`. Build 151 extends that into a stronger image workflow with a media-library read endpoint, selected-row image repair, duplicate-image diagnostics, and browser image health scanning.

## What is working now

- Public pages continue to follow the one-H1 release discipline and local SEO checks.
- Admin Catalog lists saved DB inventory rows over bundled consumables/tools fallback rows.
- Blank saved DB image fields hydrate from matching bundled consumables/tools images.
- The inventory editor has image preview, matching bundled image restore, existing-image picker, and clear-image controls.
- The existing-image picker now includes media-library rows when available.
- Selected rows can be repaired/imported so fallback-matched images are saved back to DB.
- Visible inventory images can be browser-scanned for failed loads.
- Duplicate image groups are counted and flagged.
- Release checks include static checks, local SEO/H1 audit, catalog fallback checks, Amazon matching, mobile nav, Admin App editor, inventory picker, and media-library picker guards.

## Current schema state

- `catalog_inventory_items` is the DB source of truth for saved tools/consumables.
- Bundled JSON remains the fallback source for public and admin continuity.
- `app_media_library` is now documented as the DB-backed shared image source for inventory images, landing-page proof, add-ons, and future R2 uploads.
- Build 151 adds/guards indexes for media-library group, usage contexts, status, and image lookup.

## Deploy caution

Apply migrations in order and smoke-test Admin Catalog after deploy. If `app_media_library` is not present or not seeded yet, the UI should continue to work from app settings and bundled JSON/R2 fallbacks.

<!-- Build 151 sync 2026-05-18 -->
