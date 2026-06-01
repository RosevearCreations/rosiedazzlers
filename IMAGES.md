## Build 184 — Admin Media Health scan and upload review

Build 184 adds `/admin-media-health.html`, a protected staff page that calls `/api/admin/media_asset_health_scan`. The scan checks required R2/public image URLs from `data/image_requirements_build184.json` and reports which files are missing or not public.

### How to use it

1. Deploy Build 184.
2. Open `/admin-media-health.html`.
3. Click **Run image health scan**.
4. For each missing item, upload the file to the exact R2 key shown by the page.
5. Confirm the public URL loads under `https://assets.rosiedazzlers.ca/`.
6. Re-run the scan until the missing count is zero or only intentionally deferred proof media remains.

### Build 184 upload priority

1. Add-on card images under `packages/`.
2. Regional local landing heroes under `landing-pages/`.
3. Before/after proof pairs under `CarPhotos/`.
4. Short service proof videos under `videos/`.
5. Social preview assets under `brand/` or page-specific R2 folders.

### Reminder

Customer vehicle photos/videos must stay private until both `consent_status` and `media_privacy_status` are approved for public use.


# Build 184 update — 20-step operations, media, and payment hardening

**Updated:** 2026-06-01  
**Build:** 184

Build 184 completes the requested next-20 pass by tightening the payment/refund operations, improving image/media readiness review, and documenting the next operational bundle. This pass is intentionally no-DDL: it uses the existing Build 180–182 payment tables and the Build 183 image requirements foundation.

## Build 184 — 20 completed items

1. Added `/admin-media-health.html` and `/admin-media-health/` so staff can review missing required photos/videos from a protected admin page.
2. Added `/api/admin/media_asset_health_scan` to scan required public R2/media URLs and return missing/not-public files with upload keys.
3. Added `data/image_requirements_build184.json` as the machine-readable source for required app, add-on, landing, gallery, and proof images.
4. Added the Media Health page to the shared Admin Menu.
5. Added Media Health access rules to `assets/admin-auth.js`.
6. Added a Media Health card to the Admin Dashboard.
7. Added `/api/admin/payment_refund_status_poll` so staff can poll Stripe/PayPal refund status and refresh local refund rows.
8. Added `/api/admin/payment_receipt_resend` so staff can requeue a customer quote-deposit receipt email from a payment request.
9. Added `/api/admin/payment_accountant_package_export` for an accountant-style payment CSV with Ontario HST allocation estimates.
10. Added an **Export accountant package** button to Admin Payments.
11. Added **Resend receipt** controls to quote deposit/payment request cards.
12. Added **Poll provider status** controls to refund record cards.
13. Kept manual refund records, provider refund initiation, webhook settlement, and replay controls on one Payments page for easier review.
14. Added `sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql` to document the no-DDL Build 184 schema status.
15. Updated `SUPABASE_SCHEMA.sql` with Build 184 operational notes.
16. Updated `DATABASE_STRUCTURE_CURRENT.md` with the Build 184 no-DDL dependency summary.
17. Updated `IMAGES.md` with the Admin Media Health scan workflow and upload review method.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` to reflect Build 184 media/payment/accounting hardening.
19. Added `scripts/build184_twenty_step_ops_media_payment_check.py` and wired it into the release check chain.
20. Re-ran the one-H1 and release guard path so exposed public pages still use one clear H1.

## Next 20 steps after Build 184

1. Deploy Build 184 and test `/admin-media-health.html` against live R2 assets.
2. Upload the missing add-on images listed in `IMAGES.md`, then re-run the Media Health scan.
3. Replace regional landing placeholders with Rosie-owned images for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria.
4. Capture the first four approved-public before/after gallery proof sets by town/service.
5. Add real image dimension validation instead of URL-only health checks.
6. Add R2 signed upload URLs for admin media replacement so uploads can happen from the app instead of the Cloudflare dashboard only.
7. Add a media task status table so missing-image items can be assigned, marked uploaded, reviewed, and approved.
8. Add provider refund polling for payment requests without refund rows, not only existing refund records.
9. Add scheduled retry checks for pending Stripe/PayPal refunds.
10. Add payment reconciliation variance warnings for paid amount vs. quote/deposit amount.
11. Add processor fee capture and estimated net payout fields to the payment export.
12. Add HST/GST allocation review screens before accountant export is considered final.
13. Add failed receipt email retry controls and visible notification-event status on Admin Payments.
14. Add customer-facing receipt PDF/download links.
15. Add final-balance invoice/payment requests after job completion.
16. Add payment application to final invoices, deposits, refunds, and tips.
17. Add month-end payment close checklist tied to reconciled provider exports.
18. Add dashboard warnings for missing images on high-traffic public pages.
19. Add Search Console/local SEO task cards tied to missing service/town proof content.
20. Add a consolidated accountant export package that bundles payment CSV, refund CSV, journal candidates, HST summary, and close checklist.

---

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
