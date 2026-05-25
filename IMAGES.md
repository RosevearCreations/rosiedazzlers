> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
# Images and Media Workflow — Build 153

**Updated:** 2026-05-18

## Inventory product/tool images

Admin Catalog now has a layered image workflow:

1. Saved `catalog_inventory_items.image_url` is preferred when present.
2. If a saved DB row has a blank image, Admin Catalog hydrates from the matching bundled consumables/tools row.
3. The editor shows a selected image preview.
4. **Use matching bundled image** restores the best bundled fallback image.
5. **Pick existing image** searches DB media-library rows, app-setting media rows, bundled product/tool rows, saved DB rows, and helper image URLs.
6. **Repair selected images** can persist fallback-matched images onto selected inventory rows.
7. **Scan visible images** browser-checks visible image URLs and flags failed loads.
8. Duplicate image groups are counted and flagged for review.

## Media-library direction

Build 151/152 uses `/api/admin/media_library_list`, which reads from:

1. `app_media_library` when available.
2. `app_management_settings.media_library` as compatibility fallback.
3. Bundled/R2 product-tool JSON images in Admin Catalog as the final fallback.

Recommended inventory image records should use:

- `group_key`: `products`
- `usage_contexts`: include `inventory_item`
- `media_type`: `image`
- `media_url`: public R2 URL
- `alt_text`: plain description of the item
- `caption`: optional staff/public note
- `source_status`: `active`

## Current image scoring habit

Keep using practical image standards:

- Prefer square or landscape product images.
- Use clear alt text.
- Prefer Rosie-owned/R2-hosted images.
- Avoid broken URLs and huge uncompressed files.
- Track source/consent where images are used for public proof or customer work.

## Next image work

- Seed `app_media_library` from R2 folders.
- Add direct upload-to-R2 from Admin Catalog.
- Add editable alt/caption/source/preferred-public-image metadata.
- Add server-side image health reports.
- Add duplicate-image approval for intentional multipacks/shared tool images.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 media workflow note

No image workflow behavior changed in Build 153. The Build 151/152 media-library picker, fallback image hydration, selected-row image repair, duplicate-image warnings, and visible image scan remain the active design. This pass only repairs deploy packaging/import stability around those endpoints.

## Build 156 sync note - social progress publishing

Build 156 adds a reviewable social publishing foundation. Admin Progress can now create internal social drafts from job updates/media, Admin Social Queue can review and mark those drafts, and the schema now includes `social_channels`, `social_post_queue`, and `social_dispatch_attempts`. Direct posting to X, Facebook, Instagram, TikTok, Google Business Profile, and other platforms is possible later after the required platform credentials, app approvals, and consent/compliance checks are in place.

---

## Build 161 sync note

Build 161 keeps `DEVELOPMENT_ROADMAP.md` as the source of truth and advances the competitor-aligned conversion path with Booking service chooser guidance, package aliases, and photo-estimate CTAs.

