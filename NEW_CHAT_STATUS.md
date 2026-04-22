# NEW CHAT STATUS

This pass keeps the build on the non-Google path and upgrades the vehicle-media system from a simpler rule-only score into a stronger local merchandising score.

## What changed

- customer vehicle photo uploads now use EXIF-aware local image analysis before upload and at save time
- `my-account.html` now previews local background, subject-fill, sharpness, brightness, contrast, duplicate-angle hints, and a preview merchandising score before upload
- `functions/api/_lib/vehicle-media-scoring.js` now blends the existing metadata checks with local image-analysis inputs and duplicate-angle penalties
- `functions/api/client/vehicle_media_save.js` now stores `media_analysis` for each photo row and reuses existing vehicle rows to penalize near-duplicate angles
- videos remain supported and continue through a manual-review path instead of being scored like photos
- `functions/api/_lib/booking-location.js` now supports explicit latitude/longitude in service-area metadata before falling back to local lookup tables and county centroids
- key public pages had another SEO/local-search pass while keeping one H1 per exposed page
- schema sync for this pass is in `sql/2026-04-22_vehicle_media_merchandising_score.sql` and `SUPABASE_SCHEMA.sql`

## Current image scoring direction

The score is now built from:
- image URL presence
- alt text length
- image size
- orientation
- crop history
- caption/title support
- background consistency
- subject fill in frame
- sharpness / blur checks
- brightness / contrast checks
- duplicate-angle penalty
- small lifestyle-shot bonus for non-lead images

Lead-image checks are still stricter:
- square or landscape
- at least 1200×1200
- alt text at least 12 characters
- first image score must still reach the save threshold

## Still open / next-best direction

- manual crop editing is still guide-led rather than a full in-browser crop editor
- server-side image parsing is still not in place, so analysis depends on browser-side upload inspection
- optional future cloud assist should stay optional and be limited to smart help only, not basic scoring or validation
