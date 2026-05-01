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
