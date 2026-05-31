# Rosie Dazzlers Image and Video Requirements — Build 183

**Updated:** 2026-05-30  
**Purpose:** This file was cleared and rebuilt to show exactly which images/videos still need to be supplied so the public site, booking flow, admin review screens, gallery, and local SEO pages can be reviewed with real media instead of placeholders.

## Current media source rules

- Public asset base: `https://assets.rosiedazzlers.ca/`
- Cloudflare R2 folders currently expected by the app: `brand/`, `packages/`, `CarPhotos/`, `landing-pages/`, `videos/`, `products/`, and `Systems/`.
- Add-on and package images should be Rosie-owned, AI-created for Rosie Dazzlers, or properly licensed.
- Customer vehicle photos/videos must not be reused publicly until `consent_status` and `media_privacy_status` are approved for public use.
- Avoid visible license plates, house numbers, faces, children, private addresses, or customer-identifying details unless they are blurred and approved.

## Upload methods

### Method A — Cloudflare R2 direct upload for public site assets

Use this for package images, add-on images, service-page images, local landing images, gallery proof images, and videos.

1. Open Cloudflare dashboard.
2. Go to **R2** → the Rosie Dazzlers public assets bucket.
3. Upload the file into the exact folder/key listed below, such as `packages/pet_hair_removal.png`.
4. Confirm the public URL loads at `https://assets.rosiedazzlers.ca/<folder>/<filename>`.
5. If the filename changes, update `data/rosie_services_pricing_and_packages.json`, `functions/api/data/rosie_services_pricing_and_packages.json`, or the Admin App pricing catalog row.
6. Redeploy Pages after JSON changes. R2-only uploads do not require a redeploy if the URL path stays the same.

### Method B — Admin App / Content Center URL update

Use this when the image already exists at a public URL and the app only needs to point to it.

1. Open `/admin-app.html` or `/admin-content.html`.
2. Paste the public R2 image URL into the matching service/add-on/content block image field.
3. Save.
4. Refresh the public page and confirm the preview loads.

### Method C — Job/customer media upload

Use this for customer proof photos/videos that need consent/privacy review.

1. Use the booking/progress/photo-estimate upload flow.
2. Review the media in Admin Leads, App Management, or the gallery workflow.
3. Set consent/privacy to public-ready only after approval.
4. Only approved-public/sample media appears in public gallery and social workflows.

## Required image/video standards

| Use | Minimum size | Preferred size | Format | Notes |
|---|---:|---:|---|---|
| Add-on cards | 1200×800 | 1600×1067 | PNG/WebP/JPG | Landscape; clear service concept; no private customer data. |
| Package cards | 1200×800 | 1600×900 | PNG/WebP/JPG | Match vehicle size where possible: small/mid/oversize. |
| Before/after gallery | 1200×900 each | 1600×1200 each | WebP/JPG | Same angle, same vehicle area, approved-public consent. |
| Regional landing hero | 1200×675 | 1600×900 | WebP/JPG | Local scenery, service vehicle, or recognizable service-area image. |
| Homepage hero | 1600×900 | 1920×1080 | WebP/JPG | Rosie Dazzlers branded/service image. |
| Social preview | 1200×630 | 1200×630 | WebP/JPG/PNG | Good for Facebook/Google/social cards. |
| Video proof | 720p | 1080p | MP4/WebM | Keep short clips; blur plates/faces/addresses. |

## Critical missing local add-on fallback photos

These are referenced as local fallback paths in the pricing catalog but the files are not currently present in the zip. Upload the R2 image to the listed `packages/` key and optionally add the same image to the matching local fallback path before packaging.

| Missing local fallback | Add-on/service | Expected public R2 key | Required size | Action |
|---|---|---|---|---|
| `assets/addons/pet_hair_removal.png` | Pet Hair Removal | `https://assets.rosiedazzlers.ca/packages/pet_hair_removal.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/odor_treatment.png` | Odor Treatment | `https://assets.rosiedazzlers.ca/packages/odor_treatment.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/seat_shampoo.png` | Seat Shampoo | `https://assets.rosiedazzlers.ca/packages/seat_shampoo.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/carpet_shampoo.png` | Carpet Shampoo | `https://assets.rosiedazzlers.ca/packages/carpet_shampoo.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/salt_stain_treatment.png` | Salt Stain Treatment | `https://assets.rosiedazzlers.ca/packages/salt_stain_treatment.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/headlight_restoration.png` | Headlight Restoration | `https://assets.rosiedazzlers.ca/packages/headlight_restoration.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/windshield_ceramic_coating.png` | Windshield Ceramic Coating | `https://assets.rosiedazzlers.ca/packages/windshield_ceramic_coating.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/ceramic_spray_wax.png` | Ceramic Spray Protection | `https://assets.rosiedazzlers.ca/packages/ceramic_spray_wax.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/trim_restoration.png` | Trim Restoration | `https://assets.rosiedazzlers.ca/packages/trim_restoration.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/bug_tar_removal.png` | Bug and Tar Removal | `https://assets.rosiedazzlers.ca/packages/bug_tar_removal.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/truck_box_wash.png` | Truck Box Wash | `https://assets.rosiedazzlers.ca/packages/truck_box_wash.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |
| `assets/addons/fleet_vehicle_add_on.png` | Fleet Vehicle Add-On | `https://assets.rosiedazzlers.ca/packages/fleet_vehicle_add_on.png` | 1200×800 landscape PNG/WebP/JPG | Missing local fallback; upload real photo/art and update Admin App pricing catalog if filename changes. |

## Package images to verify in R2

These package images are referenced from `data/rosie_services_pricing_and_packages.json`. They are not bundled in the local zip, so verify each one exists under the R2 custom domain before reviewing the booking/package UI.

| R2 key | Package card | Required size | Action |
|---|---|---|---|
| `packages/PremiumExternalWash.png` | Premium Wash small | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/PremiumExternalWashMidSize.png` | Premium Wash mid-size | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/PremiumExternalWashLargeSizeExotic.png` | Premium Wash oversize/exotic | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/BasicInteriorDetailSmallSize.png` | Basic Detail small | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/BasicInteriorDetailMidSize.png` | Basic Detail mid-size | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/BasicInteriorDetailExotics.png` | Basic Detail oversize/exotic | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/CompleteDetailSmallCars.png` | Complete Detail small | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/CompleteDetailMidSizelCars.png` | Complete Detail mid-size | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/CompleteDetailOverSizeExoticCars.png` | Complete Detail oversize/exotic | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullInteriorDetailSmallCars.png` | Interior Detail small | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullInteriorDetailMidSuvCars.png` | Interior Detail mid-size/SUV | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullInteriorDetailLargeExoticCars.png` | Interior Detail oversize/exotic | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullExteriorDetailSmallSizeCars.png` | Exterior Detail small | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullExteriorDetailMidSizeCars.png` | Exterior Detail mid-size | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |
| `packages/FullExteriorDetailLargeExoticCars.png` | Exterior Detail oversize/exotic | 1600×900 or 1200×800 landscape | Verify in R2; these are referenced by package cards and chooser imagery. |

## Regional landing images to replace

`data/landing_regional_photos.json` still uses external/Wikimedia placeholder URLs. Replace these with Rosie-owned or properly licensed images so local pages are not dependent on external files and look like our own brand.

| Recommended R2 key | Page | Required size | Action |
|---|---|---|---|
| `landing-pages/tillsonburg-auto-detailing-hero.webp` | Tillsonburg service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/woodstock-ingersoll-auto-detailing-hero.webp` | Woodstock/Ingersoll service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/simcoe-delhi-auto-detailing-hero.webp` | Simcoe/Delhi service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/port-dover-auto-detailing-hero.webp` | Port Dover service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/norwich-otterville-auto-detailing-hero.webp` | Norwich/Otterville service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/zorra-thamesford-embro-auto-detailing-hero.webp` | Zorra/Thamesford/Embro service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/waterford-vittoria-auto-detailing-hero.webp` | Waterford/Vittoria service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |
| `landing-pages/port-rowan-turkey-point-auto-detailing-hero.webp` | Port Rowan/Turkey Point service-area hero | 1600×900 landscape WebP/JPG | Replace current external placeholder with Rosie-owned or properly licensed local image. |

## Gallery proof still needed

The current bundled `data/before_after_gallery.json` contains sample/placeholder image pairs based on pricing-chart assets. Add real approved-public proof pairs for:

| Town/service proof | Needed media | Upload path suggestion | Privacy requirement |
|---|---|---|---|
| Tillsonburg interior detailing | Before and after same angle | `CarPhotos/tillsonburg-interior-before.webp` and `CarPhotos/tillsonburg-interior-after.webp` | `consent_status=approved_public`, `media_privacy_status=approved_public` |
| Woodstock/Ingersoll exterior detailing | Before and after same angle | `CarPhotos/woodstock-exterior-before.webp` and `CarPhotos/woodstock-exterior-after.webp` | Approved public use |
| Simcoe/Delhi pet hair removal | Before and after same seat/cargo area | `CarPhotos/simcoe-pet-hair-before.webp` and `CarPhotos/simcoe-pet-hair-after.webp` | Approved public use |
| Port Dover ceramic/exterior protection | Paint/gloss/protection proof | `CarPhotos/port-dover-ceramic-before.webp` and `CarPhotos/port-dover-ceramic-after.webp` | Approved public use |

## Video assets still needed

No public proof videos are currently bundled for the app review. Recommended first videos:

| Video | Suggested R2 key | Size/format | Use |
|---|---|---|---|
| Mobile setup/water/power overview | `videos/mobile-detailing-setup.mp4` | 1080p MP4, under 25 MB preferred | Homepage/help/booking trust block |
| Interior detailing short clip | `videos/interior-detailing-process.mp4` | 1080p MP4 | Help article/social proof |
| Exterior wash/protection short clip | `videos/exterior-wash-protection.mp4` | 1080p MP4 | Services/gallery/social |
| Pet hair removal proof clip | `videos/pet-hair-removal-proof.mp4` | 1080p MP4 | Add-on page/help/social |

## After upload checklist

1. Open the public URL for each uploaded file and confirm it loads.
2. Open `/pricing`, `/services`, `/gallery`, `/faq`, `/blog`, `/admin-app.html`, and `/admin-content.html`.
3. Confirm images do not stretch, crop badly, or disappear on mobile.
4. Check that every customer media item has consent/privacy status before public reuse.
5. Run the release H1/SEO check before packaging.

## Build 183 data file

The machine-readable version of this list is stored at:

`data/image_requirements_build183.json`
