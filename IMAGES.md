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

---

## Build 186 - verified water restrictions and next-20 planning sync (2026-06-02)

Build 186 corrected the service-area water-use guidance after source verification. Oxford County / Tillsonburg now uses the May 1-September 30 rule under Oxford County By-law No. 4193-2002: outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity, with residential hours of 6:00-9:00 a.m. or 6:00-9:00 p.m. and commercial/industrial hours of 8:00-10:00 a.m. or 3:00-5:00 p.m. Norfolk County now uses the May 15-September 15 Water Restriction By-law rule: 9:00-11:00 a.m. and 7:00-10:00 p.m., with odd/even house-number days and the first-24-hours sod exemption note.

Updated runtime/content areas: `data/service_area_rules.json`, `data/water_restriction_rules_build186.json`, booking fallbacks, Admin App service-area defaults, landing page content, `functions/api/water_restrictions_public.js`, `functions/api/admin/water_restrictions_audit.js`, and the Build 186 release guard.

Completed next-20 items for this pass:
1. Verified Tillsonburg/Oxford County water restrictions from the official Tillsonburg and Oxford pages.
2. Verified Norfolk County watering restrictions from the official Norfolk County page.
3. Corrected all Oxford County service-area rows in `data/service_area_rules.json`.
4. Corrected all Norfolk County service-area rows in `data/service_area_rules.json`.
5. Added the Tillsonburg water-restriction page as an official source for Tillsonburg rows.
6. Added `data/water_restriction_rules_build186.json` as a compact verified rule source.
7. Corrected booking fallback water rules in `book.html`.
8. Synced the `/book/` mirror.
9. Corrected Admin App default service-area water rules in `admin-app.html`.
10. Synced the `/admin-app/` mirror.
11. Corrected water wording in root landing-page public content.
12. Corrected water wording in the Functions landing-page public content copy.
13. Added `/api/water_restrictions_public` as a public safe fallback endpoint.
14. Added `/api/admin/water_restrictions_audit` as a staff DB audit endpoint.
15. Added a no-DDL SQL note for Build 186.
16. Updated `SUPABASE_SCHEMA.sql` with the Build 186 schema/data note.
17. Updated `DATABASE_STRUCTURE_CURRENT.md` with the water-rule data dependency note.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with water-rule accuracy progress.
19. Added `scripts/build186_verified_water_restrictions_check.py`.
20. Wired the Build 186 guard into `scripts/release_check.py`.

Next 20 steps to move toward:
1. Deploy Build 186.
2. Re-import/resave `data/service_area_rules.json` into Supabase if the `service_area_rules` table is live.
3. Test `/api/water_restrictions_public` for Oxford County and Norfolk County.
4. Test `/api/admin/water_restrictions_audit` while signed in as admin.
5. Check `/book` and confirm the selected service-area rules show the corrected wording.
6. Check `/admin-app` and confirm service-area defaults show the corrected wording.
7. Add an Admin App button to import bundled service-area rules into Supabase.
8. Add a visual warning when the DB service-area rules are older than bundled fallback rules.
9. Add a scheduled or manual source-verification checklist for municipal rule pages.
10. Add a public FAQ item explaining water-use timing for mobile detailing.
11. Add booking-time validation that reminds staff when a requested appointment conflicts with local water-use windows.
12. Add a customer-facing note that Rosie Dazzlers can bring water/power when needed, but municipal rules still need checking.
13. Add per-town temporary notice overrides for drought/emergency restrictions.
14. Add a service-area rule version field in Supabase.
15. Add admin change history for service-area rule edits.
16. Add local SEO copy snippets that mention the accurate county rules without over-promising availability.
17. Add a quick “Can we do exterior work at this time?” helper for staff dispatch.
18. Continue payment/tax work from Build 185: processor-fee imports and HST/GST review.
19. Continue media work from Build 185: R2 direct uploads, media approval transitions, and missing-media warnings.
20. Continue accountant export work: HST summary, journal candidates, receipts, and close checklist packaging.


## Build 187 Sync — Verified Local Page Water Rules (2026-06-03)

- Reverified Oxford/Tillsonburg, Woodstock/Oxford, and Norfolk water-use restrictions from official public sources.
- Corrected the static town landing-page shell so `/tillsonburg-auto-detailing/` and every other local page shows the water-use note even before client-side rendering.
- Added server-side landing-page enforcement so stale Admin App/DB landing-page rows cannot hide the corrected water-rule note.
- Added `data/water_restriction_rules_build187.json`, updated service-area/local SEO data, and added a no-DDL SQL note.
- Added a Build 187 release guard to check every local page for the correct Oxford/Norfolk water-rule language.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

