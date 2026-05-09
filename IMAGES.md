
## Build 134 — Admin add-on save, local SEO, and populated-editor pass (2026-05-08)
- Added a dedicated **Update / save add-on** action beside **Delete add-on** in Admin App so one add-on can be edited and saved without scrolling to the global catalog save button.
- Extended the add-on editor with populated suggestions for category, type, and existing image URLs while preserving PNG/JPG/R2 images ahead of SVG fallbacks.
- Extended the landing-page editor with hero image URL, gallery image URLs, and related product/media fields so service and town pages can be improved without editing raw JSON.
- Kept location landing pages populated in Admin App by merging saved landing-page settings with the public fallback pages from `/api/landing_pages_public`.
- Preserved new landing media fields through the public landing-page API normalization path.
- Strengthened search visibility groundwork by replacing placeholder static landing-page titles/descriptions, adding richer Service structured data, adding dynamic FAQ/Breadcrumb/Service JSON-LD, and expanding `sitemap.xml` with lastmod/changefreq/priority plus missing service routes.
- Improved Admin Catalog editing by adding populated datalist suggestions for inventory keys, names, categories, subcategories, vendors, SKUs, units, purchase URLs, and image URLs; colour/finish words are now included in subcategory suggestions for supplies and visual items.
- CSS/search hygiene remains in scope: no public page should have more than one H1, local town/service wording should stay prominent, and links should remain crawlable anchors.

# Rosie Dazzlers Image and Media Guide

Last synchronized: Build 132, May 8, 2026.

## Add-on service images

Add-on service images are used on the public Services/Pricing surfaces, booking add-on cards, and the Admin App add-on editor.

Recommended size:
- 1200 x 900 px minimum for add-on cards.
- 1600 x 1200 px preferred for future landing pages.
- PNG or JPG for detailed artwork.
- SVG is acceptable for simple fallback illustrations.
- Keep important text/logos away from the outer 10% edge so mobile cards do not crop key details.

Where the current default URLs live:
- Main static fallback catalog: `data/rosie_services_pricing_and_packages.json`
- Functions/API fallback catalog: `functions/api/data/rosie_services_pricing_and_packages.json`
- Saved live catalog, when edited in Admin App: `app_management_settings` key `pricing_catalog`

Fields to use per add-on:
- `image_url`: the preferred/current image. This can be an R2 URL such as `https://assets.rosiedazzlers.ca/packages/example.png` or a local bundled path such as `/assets/addons/example.png`.
- `image_fallback_url`: backup image used if the primary image is blank or fails.

How to keep the existing image:
1. Open Admin App.
2. Go to Pricing source of truth > Add-ons.
3. Select one add-on.
4. Confirm the **Current image loaded** preview is correct.
5. Leave `Primary image URL` and `Fallback image URL` unchanged.
6. Save the pricing catalog.

How to switch out an add-on image:
1. Upload the new image to the correct Cloudflare R2 folder, preferably the public packages/add-ons area already used by the site.
2. Copy the final public URL.
3. In Admin App > Add-ons, select the add-on.
4. Paste the new URL into `Primary image URL`.
5. Keep the older image in `Fallback image URL` until the new image is confirmed live.
6. Save the pricing catalog.
7. Check Services, Pricing, and Book add-on cards.

Build 132 fix note:
- If a saved add-on has prices but blank image fields, Admin App now pulls the image URLs back in from the bundled default catalog by matching the add-on `code`.
- The public pricing catalog merge also prevents blank saved media values from hiding default fallback media.

## Before/after gallery media

Recommended size:
- 1600 x 1200 px preferred.
- 1200 x 900 px minimum.
- Use matched before/after framing when possible.
- Video clips should be short, compressed, and hosted through the same public asset system.

Example with multiple gallery entries:

```json
{
  "items": [
    {
      "title": "Engine Cleaner",
      "location": "Tillsonburg, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/MitsubishiLancerEngineDirty.PNG",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/MitsubishiLancerEngineClean.PNG",
      "note": "We love to clean engines.",
      "consent_status": "Engines",
      "customer_name": "",
      "vehicle_label": "2015 Mitsubishi"
    },
    {
      "title": "Interior Refresh",
      "location": "Ingersoll, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/interior-before.jpg",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/interior-after.jpg",
      "note": "Interior cleanup proof photo.",
      "consent_status": "Approved",
      "customer_name": "",
      "vehicle_label": "SUV interior"
    }
  ]
}
```

To add a second or third gallery item, add another object inside the same `items` array and separate entries with commas. Do not create `items2` or a second top-level section.

<!-- Build 132 sync 2026-05-08: admin add-on image hydration, current-image preview, fallback media merge, no-DDL schema note, SEO/H1/CSS/media discipline reviewed. -->
- Restored missing `assets/landing-page.js` because landing pages were still referencing it during the static link check.
<!-- Build 133 sync 2026-05-08: fixed Admin App add-on image hydration to prefer real PNG/R2 photos over SVG outlines, restored landingLinksToText helper, kept dev-branch workflow, and recorded no-DDL schema note. -->

## Build 133 add-on image editor note
- The Admin App add-on editor should show the real photo-style PNG/JPG/R2 image in **Current image loaded** whenever one exists.
- Keep `image_url` as the preferred customer-facing image. This should normally be the R2/package PNG or JPG, for example `https://assets.rosiedazzlers.ca/packages/Engine%20Cleaning%20add%20on%20service.png`.
- Keep `image_fallback_url` as the backup image. SVG outline files are acceptable here, but they should not replace the original service PNG in the primary image field.
- To switch an add-on picture: open Admin App → Add-ons → select the add-on → replace **Primary image URL** with the new R2/public image URL → leave fallback in place → save pricing catalog.
<!-- Build 134 sync 2026-05-08: admin add-on save button, populated editor suggestions, landing-page media fields, local SEO metadata/structured-data, sitemap refresh, and no-DDL schema handoff reviewed. -->
