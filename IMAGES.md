# Rosie Dazzlers Image and Media Guide

_Last updated: Build 137 — May 9, 2026_

This file is the working checklist for image sizes, where each image is used, and how to replace it without hardcoding new URLs into individual pages.

## General rules

- Prefer Cloudflare R2 URLs for production media: `https://assets.rosiedazzlers.ca/...`.
- Keep bundled local files only as fallbacks, examples, or emergency offline assets.
- Use PNG or JPG for real service/product photos. SVG is useful for simple placeholders or diagrams, but it should not be the primary add-on image when a real PNG/JPG exists.
- Use descriptive alt text that says what the customer sees, for example: `Clean engine bay after Rosie Dazzlers engine cleaning`.
- Avoid stretched or cropped service images by using `object-fit: contain` for add-on/product windows and `object-fit: cover` only for hero/proof cards where cropping is acceptable.

## Required public image groups

| Image group | Recommended size | Source of truth | How to update |
| --- | ---: | --- | --- |
| Brand/logo images | 512×512 or larger PNG/SVG | `assets/brand/` and shared chrome | Replace the file or update the shared brand reference in `assets/chrome.js`/site config. |
| Package images | 1200×900 or 1600×1200 PNG/JPG | `data/rosie_services_pricing_and_packages.json` package `images_by_size` | Edit in Admin App pricing catalog, then save. Keep small/mid/oversize paths complete. |
| Add-on images | 1200×900 PNG/JPG preferred | pricing catalog add-on `image_url`; fallback in `image_fallback_url` | Admin App → Add-ons → select add-on → keep or replace the primary/fallback URL → Update / save add-on → Save pricing catalog. |
| Before/after gallery | 1200×900 minimum; same aspect pair | `data/before_after_gallery.json` until DB/admin-managed gallery is finished | Add more objects inside the same `items` array; each object needs `before_url` and `after_url`. |
| Recent work proof | 1200×900 or larger | before/after gallery and future review/media API | Add approved gallery items and keep customer consent notes filled. |
| Inventory/product images | 1000×1000 square preferred | Admin Catalog item `image_url` / bundled product JSON fallback | Admin Catalog → click item name → update Image URL → save item. |
| Town/service landing media | 1200×900 hero; optional gallery images | Admin App landing page editor | Select landing page, edit hero/gallery URLs, save landing pages. |

## Switching an add-on image

1. Upload the new PNG/JPG to R2, ideally under `packages/` or a clear `addons/` folder.
2. Open Admin App → Add-ons.
3. Select the add-on to edit.
4. Confirm the **Current image loaded** preview.
5. Paste the new primary image URL into **Primary image URL**.
6. Leave the fallback URL in place unless the bundled fallback also needs replacing.
7. Click **Update / save add-on**.
8. Click the pricing catalog save button for the whole catalog.
9. Check `/services`, `/pricing`, and the related landing page.

## Before/after gallery format

Add each new gallery entry as another object inside the same `items` array:

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
      "title": "Pet Hair Interior Reset",
      "location": "Ingersoll, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/example-before-2.jpg",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/example-after-2.jpg",
      "note": "Embedded cargo-area hair removal and interior refresh.",
      "consent_status": "Approved for website",
      "customer_name": "",
      "vehicle_label": "Family SUV"
    }
  ]
}
```

Do not create `items2`, `gallery2`, or a second JSON root. Just add another comma-separated object inside `items`.

## Open improvements

- Replace temporary sample reviews with verified review API content.
- Finish DB/admin-managed gallery storage so `data/before_after_gallery.json` becomes fallback only.
- Add upload helpers so staff can send media straight to R2 without pasting URLs manually.
- Use the image completeness score for gallery and first-image checks before publishing.

<!-- Build 137 sync 2026-05-09: local SEO targets, inventory fallback, media/image documentation, CSS/H1/static-link checks, and schema handoff were reviewed. -->
