# Images and Media — Build 148

**Updated:** 2026-05-16

## Landing-page image requirements

### Location landing pages

Each location landing page should have:

- **Hero/regional image:** 1600×900 preferred, 1200px wide minimum.
- **Shape:** landscape is preferred so the image works on desktop and mobile.
- **Alt/caption:** describe the town/region, not just “photo.”
- **Source:** store where the photo came from.
- **Replacement plan:** external regional placeholders should be replaced with Rosie-owned/R2-hosted local photos when we have them.

Current seeded file:

- `data/landing_regional_photos.json`

Current editable fields used by Admin App and landing-page API:

- `hero_image_url`
- `gallery_image_urls`
- `region_photo_caption`
- `region_photo_source`
- `region_photo_source_url`

Current location photo placeholders are credited external regional photos. They are useful for layout and local relevance now, but Rosie-owned photos should replace them before heavy marketing.

### Add-on landing pages

Each add-on landing page should have:

- **Hero image:** current add-on PNG/JPG/WebP from the pricing catalog where possible.
- **Gallery images:** optional process/detail images, one URL per line.
- **Process section:** at least 3–4 plain-language steps.
- **Why this page exists:** explain why the service deserves its own page instead of only appearing as an add-on row.
- **Things to know:** quote requirements, package requirements, limits, and aftercare.
- **Related products/tools:** product name, role, note, and optional image URL.

Recommended add-on image size:

- 1200×900 or 1200×1200 preferred.
- Use `object-fit: contain` where showing the whole product/tool matters.
- Use `object-fit: cover` only for regional/lifestyle hero photos.

## Updating or switching out an image

1. Upload the image to the correct R2/public asset folder.
2. Copy the public image URL.
3. Open Admin App → Landing pages.
4. Select the location or add-on page.
5. Paste the URL into **Hero / regional image URL**.
6. Add/update the caption and source fields.
7. Add optional gallery URLs, one per line.
8. Save the landing-page settings.
9. Test the public route and mobile view.
10. Run `python scripts/release_check.py`.

## Future media-library direction

Move image records into DB with:

- file URL
- owner/source
- license/source status
- alt text
- caption
- consent status
- related location/service
- upload/replacement history
- image score


## Build 149 landing image reliability update

- Tillsonburg now uses a direct Wikimedia upload URL instead of the fragile `Special:FilePath` URL that could show as a missing image.
- Landing-page dynamic images now include a browser fallback to `/assets/brand/rosie-reviews-fallback.svg` when an external image fails.
- Recommended long-term fix: replace all external regional placeholders with Rosie-owned photos in R2 and enter those URLs in Admin App → Landing page builder.
- Location hero/regional images should remain landscape, ideally 1600×900 or at least 1200px wide.

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->

## Build 150 inventory product-image picker update

Admin Catalog now supports product/tool image picking inside **Inventory Workflow → Edit inventory item**.

Current behavior:

- Saved DB inventory rows with blank `image_url` are hydrated in the UI from the matching bundled consumables/tools image.
- The editor shows a selected-image preview.
- **Use matching bundled image** fills the product image from `data/rosie_products_catalog.json` or `data/systems_catalog.json` when the item key/name matches.
- **Pick existing image** opens a searchable thumbnail picker from existing consumables/tools images and saved helper URLs.
- Saving the item persists the selected image URL to the DB row when the deployed schema supports `image_url`.

Recommended product/tool image direction:

- Keep using Rosie-owned/R2-hosted product images where possible.
- Use descriptive filenames and alt/source metadata when the future DB media library is added.
- Next DB media step: migrate image records into a searchable media table with source, consent, title, alt text, caption, and replacement history.

<!-- Build 150 sync 2026-05-17: Admin Catalog image picker/fallback repair. -->
