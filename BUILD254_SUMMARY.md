# Build 254 — Photo Preservation & Photo Studio Performance Hotfix

**Build date:** 2026-08-12

## Why this hotfix exists
Build 252/253 allowed automatic R2 filename matching to outrank images that were already deliberately configured in package, add-on and landing-page data. That could make a correct existing card appear to have been reassigned even though the original URL still existed. Build 254 restores the intended safety boundary.

## Image precedence after Build 254
1. A deliberately saved Photo Studio assignment may override one exact target.
2. Otherwise the existing configured/catalog image stays authoritative.
3. Automatic R2 filename matching is fallback-only when that established image is absent or cannot load.
4. Generic placeholders remain last-resort fallbacks.

In short, automatic R2 filename matching is fallback-only.

This means **Sync approved R2 photos**, editing alt text, renaming metadata, or merely uploading another descriptively named R2 image does not reassign an existing package/product/service image.

## Public-page repairs
- Principal service package cards restore `images_by_size` ahead of automatic R2 matches.
- Add-on cards restore `addonPrimaryImage` / established package artwork ahead of automatic R2 matches.
- Dynamic landing pages restore `local_hero_image_url`, `hero_image_url`, add-on imagery and existing product imagery ahead of automatic R2 matches.
- Explicit Photo Studio hero/gallery assignments remain available when an owner intentionally wants to replace or add imagery.
- Existing home cards that had no image remain eligible for additive R2 hydration.

## Photo Management Studio performance
- Removed the synchronous `scrollIntoView()` after each image selection.
- Selecting a photo no longer rebuilds the entire thumbnail grid.
- Library reload renders the grid once rather than twice.
- Search/filter rerenders are coalesced with `requestAnimationFrame()`.
- Photo cards use CSS containment/content visibility and image `decoding="async"` to reduce layout work.
- The page now states clearly that R2 sync/metadata editing cannot replace established site images.

The Chrome `Forced reflow` messages are performance warnings rather than application errors; Build 254 removes the known synchronous layout churn in Photo Studio that was causing them to be much easier to trigger.

## Database
No new SQL migration is required. Build 253's existing `app_media_library` / `app_media_assignments` schema remains in use.

## Safety rule going forward
Automatic discovery may fill an empty/broken image slot, but it must never silently replace a working authored/catalog image. Explicit target assignment is the only admin-managed override path.
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->
<!-- BUILD250_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD251_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD252_SYNC: compatibility marker retained for cumulative Markdown guard. -->
<!-- BUILD253_SYNC: compatibility marker retained for cumulative Markdown guard. -->

