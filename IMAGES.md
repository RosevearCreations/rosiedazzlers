# Rosie Dazzlers Image and Video Requirements — Build 183

Critical missing local add-on fallback photos are still tracked below. Gallery proof still needed remains part of the public media checklist.

# Build 184 Admin Media Health

Admin Media Health scans the public R2 asset list before review.

# IMAGES.md — Build 185 media requirements and upload plan

Build 185 clears the older image notes into an actionable media-health checklist. The application now has three ways to review missing media:

1. `/admin-media-health.html` scans public R2 URLs and checks PNG/JPEG/WebP dimensions.
2. `/api/admin/media_asset_health_scan` returns missing, undersized, and public-ready rows.
3. `public.media_asset_tasks` stores assignable upload/review/approve tasks after the Build 185 SQL is applied. The JSON files remain fallback sources.

## Required public image sizes

| Area | Folder/key pattern | Minimum | Preferred | Notes |
|---|---:|---:|---:|---|
| Add-on cards | `packages/<addon>.png` | 1200×800 | 1600×1067 | Landscape, bright, service-specific. |
| Package cards | `packages/<package>.png` | 1200×800 | 1600×900 | Use consistent vehicle angle/background. |
| Regional landing heroes | `landing-pages/<town>-auto-detailing.webp` | 1600×900 | 1920×1080 | Rosie-owned local proof only. |
| Before/after gallery | `gallery/<town>-<service>-before.webp` and `...after.webp` | 1200×900 | 1600×1200 | Requires approved public consent/privacy status. |
| Public videos | `videos/<name>.mp4` or `.webm` | 720p | 1080p | Keep short, compressed, and owned by Rosie Dazzlers. |

## Critical missing add-on image keys

Upload these first because customer package/add-on pages look unfinished without them:

```text
packages/pet_hair_removal.png
packages/odor_treatment.png
packages/seat_shampoo.png
packages/carpet_shampoo.png
packages/salt_stain_treatment.png
packages/headlight_restoration.png
packages/windshield_ceramic_coating.png
packages/ceramic_spray_wax.png
packages/trim_restoration.png
packages/bug_tar_removal.png
packages/truck_box_wash.png
packages/fleet_vehicle_add_on.png
```

## Regional photos to replace

```text
landing-pages/tillsonburg-auto-detailing.webp
landing-pages/woodstock-ingersoll-auto-detailing.webp
landing-pages/simcoe-delhi-auto-detailing.webp
landing-pages/port-dover-auto-detailing.webp
landing-pages/norwich-otterville-auto-detailing.webp
landing-pages/zorra-thamesford-embro-auto-detailing.webp
landing-pages/waterford-vittoria-auto-detailing.webp
landing-pages/port-rowan-turkey-point-auto-detailing.webp
```

## Upload methods

### Method A — Cloudflare R2 Dashboard

1. Open Cloudflare Dashboard → R2.
2. Open the Rosie Dazzlers public assets bucket.
3. Upload the file using the exact key, for example `packages/pet_hair_removal.png`.
4. Confirm it loads at `https://assets.rosiedazzlers.ca/packages/pet_hair_removal.png`.
5. Open `/admin-media-health.html` and run the scan again.

### Method B — Admin Media Health uploader

Use `/admin-media-health.html` after a Pages R2 binding is configured:

```text
ROSIE_PUBLIC_ASSETS_BUCKET
PUBLIC_ASSETS_BUCKET
R2_PUBLIC_ASSETS_BUCKET
ASSETS_BUCKET
```

Submit:

```text
file = image/video file
r2_key = packages/pet_hair_removal.png
required_width = 1200
required_height = 800
```

The endpoint validates image dimensions before upload when the file is PNG/JPEG/WebP.

### Method C — DB task workflow

After applying Build 185 SQL, use `/admin-media-health.html` to create or review tasks in:

```text
public.media_asset_tasks
```

Suggested statuses:

```text
needed
assigned
uploaded
reviewed
approved_public
archived
```

## Post-upload checklist

- URL loads in a private/incognito browser.
- Image is not stretched, blurry, or too dark.
- Image meets the minimum dimensions.
- Alt text/page copy matches the service and town.
- Customer media has `consent_status=approved_public` and `media_privacy_status=approved_public` before public gallery/social reuse.


## Build 185 — Next 20 completed foundations

1. Added real image dimension validation to Media Health for PNG/JPEG/WebP files.
2. Added admin R2 upload endpoint with size validation and safe allowed folders.
3. Added DB-backed media task workflow with JSON fallback.
4. Added `public.media_asset_tasks` SQL foundation.
5. Added refund retry scan endpoint for pending/failed provider refunds.
6. Added payment variance warning summary.
7. Added processor-fee capture endpoint and Admin Payments fee field.
8. Added HST/GST review screen and tax summary endpoint.
9. Added receipt retry queue endpoint.
10. Added customer receipt HTML/download endpoint.
11. Added final-balance payment request tables and APIs.
12. Added payment application tables and APIs for deposits/invoices/refunds.
13. Added month-end close checklist table/API/screen.
14. Added dashboard warnings for missing media, undersized media, payment variances, and receipt retries.
15. Added Search Console/local SEO task card table/APIs/screen.
16. Added consolidated full accountant export endpoint.
17. Added processor-fee fields to `quote_deposit_payment_requests`.
18. Added `data/image_requirements_build185.json` for scan/task fallback.
19. Rebuilt `IMAGES.md` with exact upload keys, sizes, requirements, and methods.
20. Added Build 185 release guard and schema/docs synchronization.

## Next 20 recommended steps after Build 185

1. Deploy Build 185.
2. Apply `sql/2026-06-02_build185_next_twenty_ops_foundations.sql`.
3. Configure the Cloudflare Pages R2 bucket binding for admin uploads.
4. Upload the 12 missing add-on images listed in `IMAGES.md`.
5. Replace the eight regional placeholder hero images with Rosie-owned photos.
6. Test `/admin-media-health.html` upload, scan, and task creation.
7. Add R2 signed/direct browser upload support for larger video files.
8. Add media approval status transitions: assigned → uploaded → reviewed → approved_public.
9. Add automatic image alt-text suggestions from the media task label/category/town.
10. Add a public-page missing-media warning badge beside affected page links.
11. Test processor-fee capture on real Stripe and PayPal sandbox transactions.
12. Add automatic processor-fee import from Stripe balance transactions and PayPal captures.
13. Test `/admin-tax-review.html` and confirm HST assumptions with the accountant.
14. Test `/admin-close.html` for a month-end payment close dry run.
15. Add final-balance payment checkout links for Stripe and PayPal.
16. Add customer-facing final invoice/receipt PDF generation.
17. Add payment application posting into journal candidates.
18. Add variance approvals so resolved warnings stop showing on the dashboard.
19. Add Search Console API import for query/page data if credentials are configured.
20. Build the full accountant package zip with separate CSVs, PDF receipts, close checklist, HST summary, and journal candidates.
