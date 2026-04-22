# NEW_CHAT_STATUS

## Build handoff summary
This pass removes the Google Vision and Google geocoding path and replaces it with local rule-based vehicle-media scoring plus local service-area booking coordinate lookup.

## What was completed
- Customer vehicle media uploads now support:
  - photos
  - videos
  - front/back outline guidance on the customer screen
  - local upload-time validation for image size and orientation
  - local save-time validation for the first image rules
  - `media_score`, `media_score_label`, and `media_score_status` in customer and admin views
- Added generic front/rear SVG framing guides:
  - `/assets/vehicles/outline_front.svg`
  - `/assets/vehicles/outline_back.svg`
- Reworked the vehicle-media scoring helper:
  - `functions/api/_lib/vehicle-media-scoring.js`
  - used by `functions/api/client/vehicle_media_save.js`
  - score is now based on image URL, alt text, size, orientation, crop history, caption, and image title
- Public gallery is now admin-manageable:
  - new endpoint: `functions/api/before_after_gallery_public.js`
  - new admin app setting key: `before_after_gallery`
  - `gallery.html` now reads the public endpoint instead of static sample JSON
  - `admin-app.html` now includes a Before / After Gallery manager card
- Booking trusted-location flow is now local-only:
  - helper: `functions/api/_lib/booking-location.js`
  - checkout stores trusted booking coordinates using local service-area lookup first
  - county fallback coordinates are used when a service-area match is not found
  - detailer arrival compares device location against the stored trusted coordinate
  - result fields are stored on `bookings`
- SQL/schema sync completed:
  - `sql/2026-04-21_vehicle_media_gallery_geofence.sql`
  - `SUPABASE_SCHEMA.sql`

## Environment variables
- No Google Vision key is needed.
- No Google geocoding key is needed.

## Important behavior notes
- Photo uploads:
  - are validated locally before upload
  - are checked again during save using the rule-based media score
  - first image rules are stricter: square/landscape, at least 1200×1200, alt text at least 12 characters, score at least 70
- Video uploads:
  - still upload and display correctly
  - are marked for manual review instead of image scoring
- Trusted booking coordinates:
  - first try explicit/manual stored booking coordinates
  - then use local service-area lookup data
  - then use county fallback coordinates
  - otherwise stay unresolved

## Main files touched
- `functions/api/client/vehicle_media_save.js`
- `functions/api/_lib/vehicle-media-scoring.js`
- `functions/api/_lib/booking-location.js`
- `functions/api/checkout.js`
- `functions/api/detailer/job_action.js`
- `functions/api/detailer/jobs.js`
- `functions/api/admin/bookings.js`
- `functions/api/admin/app_settings_get.js`
- `functions/api/before_after_gallery_public.js`
- `admin-app.html`
- `gallery.html`
- `my-account.html`
- `admin-customers.html`
- `detailer-jobs.html`
- `sql/2026-04-21_vehicle_media_gallery_geofence.sql`
- `SUPABASE_SCHEMA.sql`

## Next deployment checklist
1. Run the updated SQL migration.
2. Redeploy.
3. Test:
   - first customer photo upload for a vehicle
   - later photo upload for the same vehicle
   - customer video upload
   - admin gallery save/load
   - public gallery page
   - booking creation with several service areas
   - detailer “Arrived” action with device geolocation
