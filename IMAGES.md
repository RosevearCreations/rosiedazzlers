# IMAGES

This file lists the main image slots now used across the Rosie Dazzlers site, what kind of image each slot needs, and where to update it in Admin App.

## Where images are currently editable

### 1. Admin App → App Management → Packages and size pricing → Add-ons
Use the single add-on dropdown editor.

Fields already used by the live site:
- **Primary image URL** → main add-on card image for Services, Pricing, and add-on landing pages
- **Fallback image URL** → backup if the main image fails
- **Requirement note** → shown when an add-on depends on a base package

Best image type here:
- one clean branded add-on promo image
- landscape or near-landscape
- about 1600×1000 or larger
- should clearly show the service or result, not just text

### 2. Admin App → Landing pages → Add-on landing pages
Use the add-on landing page dropdown editor.

Fields already used by the live site:
- **Hero image URL** → top image for that add-on landing page
- **Gallery image URLs** → supporting visuals lower on the page
- **Related products** → product image cards under “Products we use for this service”
- **Official links** → local / source references when needed

Best image type here:
- hero image: one strong landscape result image
- gallery images: before/after, process photos, close-up result images

### 3. Admin App → Landing pages → Location landing pages
Use the location landing page dropdown editor.

Fields already used by the live site:
- **Hero image URL**
- **Gallery image URLs**
- **Official links**

Best image type here:
- local service photo
- driveway / on-location detail setup
- branded before/after or review proof

## Image needs by page type

### Global / site-wide
- Logo image
- Main Rosie banner image
- Reviews / proof image

### Package pages / services / pricing
- Package images by vehicle size:
  - small
  - mid
  - oversize / exotic
- price chart image
- details chart image
- size chart image

### Add-on images that should exist
These are now used on the add-on buttons and add-on landing pages. Keep the existing branded service images unless you deliberately replace them.

- Full Clay Treatment
- Two Stage Polish
- High Grade Paint Sealant
- UV Protectant Applied on Interior Panels
- De-Ionizing Treatment
- De-Badging
- Engine Cleaning
- External Ceramic Coating
- External Graphene Fine Finish
- External Wax
- Vinyl Wrapping
- Window Tinting

### Add-on landing page gallery needs
Each add-on money page should eventually have:
- 1 hero result image
- 1 before/after image
- 2–4 process images
- 1 product-in-use or setup image if available

### Town landing page image needs
Each town page should eventually have:
- 1 location hero image or on-site service image
- 1 recent local job photo
- 1 branded trust / review / proof image

## Best next image priorities
1. Real result photos for every add-on landing page
2. Before/after pairs for the highest-value add-ons
3. Real on-location photos for each town page
4. More polished proof / review blocks

## Interfaces to use
- **Add-on image** → Admin App → Packages and size pricing → Add-ons
- **Add-on landing hero/gallery** → Admin App → Landing pages → Add-on landing pages
- **Location landing hero/gallery** → Admin App → Landing pages → Location landing pages

## 2026-05-01 Build 124 pass — booking embed, media sizing, and CSS/link hardening

- Repaired the Services and Pricing embedded booking planner cutoff by compacting the embedded Step 1 calendar layout, raising the dynamic iframe resize ceiling, and adding a timed resize fallback if the postMessage height event is delayed.
- Availability now has a stronger startup path because vehicle make/model API failures fall back to manual-entry datalists instead of stopping the date-window render.
- Reset add-on and consumable image presentation to `object-fit: contain` with centered positioning so uploaded product/add-on art is not cropped or zoomed inside cards.
- Added global CSS guards for tables, cards, panels, and media so long labels/links wrap instead of pushing outside their boxes.
- Corrected the Services page title/canonical/schema wording so `/services` is treated as a services page, not a duplicate pricing page.
- Added shared media-base support through `window.RD_ASSET_BASES` and continued migration away from page-specific hard-coded image URL constants.
- Internal HTML link scan completed with no missing root-relative page links found in this build.
- H1 check completed for exposed HTML pages; pages remain within the one-H1 rule.
- Schema note added: no new DDL in this pass; keep the 2026-04-30 job time entries minutes compatibility SQL applied for payroll/manual-minute completeness.

### 2026-05-01 media upload and sizing rule

Use the R2 custom domain plus shared media-base helpers for new public images. Add-on, consumable, package, and gallery cards should display images with contained fit first, not cover fit, unless the image is intentionally photographic proof where cropping is acceptable. This avoids the zoomed-in add-on/consumable card effect and keeps text-overlay or product-label images readable.

Current practical upload targets:

- Brand and review proof: `brand/`
- Package and add-on service art: `packages/`
- Consumables and product-use references: `products/`
- System/workflow diagrams and app images: `systems/`

Next migration target: move remaining page-level filename maps into a DB/media table or generated JSON manifest so public pages only request media by code/slug and receive the current approved asset URL from one source.

---

## Build 124 Documentation Sync — 2026-05-01

This documentation file was reviewed during the Build 124 pass. The current patch focuses on Services/Pricing booking embed clipping, embedded calendar/date-box rendering, add-on and consumable image containment, table/card overflow guards, internal link checks, one-H1 verification, shared media-base migration, and compatibility fallbacks for older `job_time_entries` tables without `minutes`.


---

## Build 125 console repair sync — 2026-05-01

This file was reviewed during the Build 125 Services/Pricing booking embed repair pass. The active fix removes the `/book?embed=1` console error `groups.index is not a function` by replacing the invalid array call with guarded `indexOf(...)` logic in both `book.html` and `book/index.html`. The booking embed layout helper now fails safely and still triggers a height postback, so a layout helper issue should not prevent the Step 1 calendar/date boxes from rendering on Services or Pricing.

No new database DDL was required in this pass. Schema tracking was updated with `sql/2026-05-01_build125_booking_embed_indexof_no_ddl_note.sql`; the existing payroll compatibility migration `sql/2026-04-30_job_time_entries_minutes_compatibility.sql` remains the required DDL patch for older live databases.

## Build 126 compact vehicle embed repair — 2026-05-01

This file was reviewed during the Build 126 Services/Pricing booking embed repair pass. The active fix gives the embedded `/book?embed=1` planner full-width space on Services and Pricing, removes the embed-only override that stacked every vehicle field one-per-line, and restores compact two/three-column vehicle rows similar to the full Book page. The vehicle inputs/selects now use smaller embedded padding, the login/garage prompt is hidden inside the embed to save height, and the iframe default/fallback height was retuned so the full Step 1 vehicle section is visible without reintroducing the long empty scrollbar.

No database DDL was required. Schema tracking was updated with `sql/2026-05-01_build126_embed_vehicle_compact_no_ddl_note.sql`. Continue to keep Services/Pricing as booking-led local SEO pages with one clear H1, Oxford/Norfolk wording, compact card/table overflow guards, and shared media-base handling instead of page-level hardcoded image/video URLs.

## Build 127 image requirements, sizes, update paths, and switch-out steps

Use this section as the working image checklist for Rosie Dazzlers. The public site should prefer the admin/catalog JSON values first, then fall back to bundled `/assets/...` images only when the DB/R2 image is missing.

### General upload rules

| Image type | Recommended size | Minimum useful size | Format | Notes |
|---|---:|---:|---|---|
| Add-on/service card image | 1600 x 1000 px | 1200 x 750 px | PNG, JPG, WebP, SVG | 16:10 works best. Leave safe padding around the subject so it does not look zoomed in. |
| Booking package/add-on thumbnail | 1200 x 900 px | 900 x 675 px | PNG, JPG, WebP, SVG | 4:3 works well inside the booking cards. The site uses `object-fit: contain` so the full image should show. |
| Before/after gallery pair | 1600 x 1000 px each | 1200 x 750 px each | JPG, PNG, WebP, MP4 for video | Before and after should be the same angle, same crop, same orientation. This gives the slider a clean 50/50 split. |
| Home recent-work slider | Uses the first 1-3 gallery entries | Same as gallery | JPG, PNG, WebP, MP4 | Pulled from the same `before_after_gallery` setting used by `/gallery`. |
| Vehicle/chart images | 1600 px wide or larger | 1200 px wide | PNG preferred | Keep text large enough for phones. Charts can still open in a larger modal. |
| Consumable/product images | 1200 x 900 px | 900 x 675 px | JPG, PNG, WebP | Use product-on-clean-background photos when possible. |
| Logo/brand marks | SVG or 1000 x 1000 px PNG | 512 x 512 px | SVG/PNG | Transparent background preferred. |
| Videos | 1080p landscape | 720p landscape | MP4 | Keep short and compressed for page speed. Use poster images later if needed. |

### Where each image is controlled

| Area | Main control location | Fallback file location | How to switch out |
|---|---|---|---|
| Add-on cards on Services/Pricing | Admin App → Pricing Catalog → Add-ons → `Primary image URL` | `/assets/addons/*.png` or SVG | Upload image to R2, paste the public URL into `image_url`, save pricing catalog. |
| Booking add-on thumbnails | Same add-on `image_url` and `image_fallback_url` | `/assets/addons/generic_addon.svg` | Same as above. The booking page now contains the image instead of cropping/zooming it. |
| Dedicated add-on landing page hero | Admin App → Landing Page Builder → `Hero image URL` | Add-on image from pricing catalog | Paste the page-specific hero URL if the landing page needs a different image than the add-on card. |
| Landing page gallery images | Admin App → Landing Page Builder → `Gallery images`, one URL per line | None | Add one image URL per line. Keep images same ratio where possible. |
| Home “Recent work and visible proof” | Admin App → Before/After Gallery JSON | `/data/before_after_gallery.json` | Add approved paired before/after images. The home page uses a 50% slider by default. |
| Public `/gallery` page | Same Before/After Gallery JSON | `/data/before_after_gallery.json` | Same entries as home page; this page shows the full list. |
| Vehicle price/detail/size charts | Pricing catalog `charts` or generated live chart fallback | `/assets/brand/CarPrice2025.PNG`, `/assets/brand/CarPriceDetails2025.PNG`, `/assets/brand/CarSizeChart.PNG` | Replace chart assets or update chart URLs in the catalog when the generated chart is not enough. |
| Consumables page images | Catalog/admin inventory item `img` field | None | Add/update the consumable item image URL in the catalog source. |

### Add-on image fields

Each add-on can carry both a primary image and a local fallback:

```json
{
  "code": "full_clay_treatment",
  "name": "Full Clay Treatment",
  "prices_cad": { "small": 79, "mid": 99, "oversize": 129 },
  "quote_required": false,
  "standalone_allowed": false,
  "requires_package_codes_any": ["complete_detail", "exterior_detail"],
  "requirement_note": "Best added to an exterior or complete detail.",
  "image_url": "https://assets.rosiedazzlers.ca/packages/full_clay_treatment.png",
  "image_fallback_url": "/assets/addons/full_clay_treatment.png",
  "notes": ["Removes bonded contamination before protection."]
}
```

Use `image_url` for the public R2 image. Use `image_fallback_url` for a bundled local file that still works if the R2 image is missing or renamed.

### Before/after gallery JSON format

The gallery is an object with an `items` array. To add a 2nd or 3rd gallery comparison, add another object inside the same `items` array, separated by commas. Do **not** create `items2` or another top-level block.

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
      "title": "Interior Before and After",
      "location": "Woodstock, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/interior-before.jpg",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/interior-after.jpg",
      "note": "Matched angle interior cleanup with customer-approved photos.",
      "consent_status": "Approved for public gallery",
      "customer_name": "",
      "vehicle_label": "SUV interior"
    },
    {
      "title": "Exterior Gloss Refresh",
      "location": "Simcoe, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/exterior-before.jpg",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/exterior-after.jpg",
      "note": "Use the same camera angle for the cleanest 50% slider comparison.",
      "consent_status": "Approved for public gallery",
      "customer_name": "",
      "vehicle_label": "Sedan exterior"
    }
  ]
}
```

For video comparisons, set `before_kind` or `after_kind` to `video` and use an MP4 URL:

```json
{
  "title": "Pet Hair Removal Clip",
  "location": "Norfolk County, ON",
  "before_kind": "video",
  "before_url": "https://assets.rosiedazzlers.ca/gallery/pet-hair-before.mp4",
  "after_kind": "video",
  "after_url": "https://assets.rosiedazzlers.ca/gallery/pet-hair-after.mp4",
  "note": "Short customer-approved clips work in the same slider area.",
  "consent_status": "Approved for public gallery",
  "customer_name": "",
  "vehicle_label": "Rear seat fabric"
}
```

### Best practice for before/after pairs

1. Take the before and after from the same distance and angle.
2. Keep both files the same width/height and orientation.
3. Avoid mixing portrait and landscape in the same comparison.
4. Use clear file names, for example `mitsubishi-engine-before.png` and `mitsubishi-engine-after.png`.
5. Confirm customer approval before adding identifiable vehicles, plates, faces, homes, or addresses.
6. Use `customer_name` as blank unless the customer specifically wants their name shown later.

### R2 switch-out workflow

1. Upload the new image/video to the correct R2 folder.
2. Copy the public URL from the R2 custom domain, preferably `https://assets.rosiedazzlers.ca/...`.
3. Paste the URL into the correct admin field or JSON value.
4. Save in Admin App.
5. Open the public page in a private/incognito window and hard refresh.
6. Confirm the image is contained inside the card and does not appear zoomed/cropped.
7. If the R2 file name changes, update both the admin value and any fallback documentation notes.

### Current Build 127 image/CSS behaviour

- Add-on, service-card, landing-button, and consumable images are forced to `object-fit: contain` to stop the blown-up zoom effect.
- Home recent work now uses the same before/after slider style as the gallery, with the default split set to 50%.
- Services and Pricing add-on cards show default prices and include both **Add to booking** and **Open page** actions.
- The add-on editor now shows the saved image URL fields, fallback image, package relationship, standalone setting, and rule summary when an existing add-on is selected.



## Build 128 image/content admin notes

- Location landing-page images can be edited in **Admin App → Landing pages → Location landing pages**. If the saved setting is empty, the editor now seeds Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, and Port Dover drafts so the dropdown is not blank.
- For a location hero image, use a 1600×1000 JPG/PNG/WebP where possible. Paste the final R2/public URL into **Hero image URL**.
- For gallery/proof images, use one URL per line in **Gallery images**. A good default is 1200×800 or larger, landscape or square.
- Add-on cards now treat missing or zero prices as **Quote required** instead of showing `$0.00`. Update the actual catalog price in the pricing catalog when an add-on should be charged online.


## Build 128 admin/catalog/checkout/local SEO pass - 2026-05-01

- Fixed Admin App location landing-page dropdowns by seeding editable town/location drafts when the saved `landing_pages` setting is empty. This keeps local SEO pages visible in the builder and ready for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, and Port Dover edits.
- Compact Admin Catalog inventory tables and pinned the Edit inventory item form to the top of its panel so long inventory lists do not stretch the editor down the page.
- Updated booking checkout to retry safely when optional modern booking columns are missing in Supabase, reducing customer-facing 500 failures while preserving full data when the latest migrations are present.
- Adjusted Step 2 service-card title contrast so package names stay readable on dark cards.
- Normalized zero/missing add-on prices to show Quote required instead of $0.00.
- Stabilized Admin Accounting date inputs so P&L, Balance Sheet, and other date filters appear as consistent rectangular fields.
- SEO hygiene kept: local town wording remains prominent, public pages should keep one clear H1, and future content updates should continue building proof/review/gallery blocks around Norfolk and Oxford County searches.
