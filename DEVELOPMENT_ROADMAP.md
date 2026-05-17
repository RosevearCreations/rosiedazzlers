# Development Roadmap — Build 148

**Updated:** 2026-05-16  
**Target branch:** `dev`  
**Pass focus:** Location landing photos, add-on landing-page media/process completeness, local SEO clarity, and release checks.

## Build 148 completed 20-step pass

1. Added a regional-photo source map for every current location landing page.
2. Added region photo URLs, captions, source names, and source URLs to `data/landing_regional_photos.json`.
3. Added region photo references into `data/local_seo_targets.json` so local SEO and landing media stay aligned.
4. Updated town/location landing defaults so each location page has a hero/regional image.
5. Added static `og:image` metadata to location landing pages.
6. Added static regional-photo fallback markup to location pages so crawlers and no-JS visitors still see the region photo.
7. Updated `assets/landing-page.js` so dynamic landing pages render a credited regional/service figure.
8. Changed the landing-page heading from a generic reason block to page-specific wording: location pages explain why that location has its own page, and add-on pages explain why that service has its own page.
9. Added fallback reason/process copy so landing pages do not render empty explanation sections.
10. Updated generated add-on landing pages so every add-on can have a photo, gallery seed, process, equipment/workflow, highlights, and things-to-know even when no hand-written template exists.
11. Made generated add-on landing pages prefer the add-on PNG/JPG/R2 image as the page photo.
12. Added Admin App fields for landing-page photo caption, photo credit/source, and source URL.
13. Kept existing Admin App hero image and gallery fields so add-on pages can keep or replace the current add-on photo.
14. Extended Admin App known direct landing-page paths to include the newer town pages.
15. Added CSS for credited landing-page regional photos.
16. Added `scripts/landing_photo_check.py`.
17. Wired landing-photo validation into `scripts/release_check.py`.
18. Removed the recurring invalid root-level duplicate API files again while keeping `service-worker.js`.
19. Updated schema/docs to record that landing media is currently stored in landing-page JSON/app settings, with DB media-library migration still planned.
20. Kept the local SEO habit: one H1, region wording, crawlable town pages, structured data, and clear customer reasons for each location/add-on page.

## Next logical 20 steps

1. Move landing-page definitions out of app-setting JSON into a DB-backed `landing_pages` table with versioning and publish/draft status.
2. Create an Admin App media picker that reads from the future media library instead of pasting URLs manually.
3. Add upload/replace buttons for landing hero image, regional image, gallery images, and add-on process photos.
4. Replace external regional-photo placeholders with Rosie-owned or properly licensed R2-hosted photos for each town route.
5. Add per-location photo alt text, consent/source status, and replacement history.
6. Add a location landing page preview button in Admin App that opens the exact route in a new tab.
7. Add a landing-page completeness score covering title, description, H1, photo, caption, reasons, process, FAQ, links, and CTA.
8. Add DB-backed review proof by service area so town pages can show relevant local reviews automatically.
9. Add before/after gallery filtering by town, county, service type, and consent status.
10. Add automatic internal links from service pages to the most relevant town pages.
11. Add automatic internal links from town pages to the best matching special-service landing pages.
12. Add Google Business Profile tracking fields to distinguish website local pages from GBP-driven traffic.
13. Add Search Console import/reporting fields when API access is ready.
14. Add structured-data validation script for Service, FAQ, Breadcrumb, ImageObject, and LocalBusiness JSON-LD.
15. Add per-page canonical/slug collision checks for all generated and static landing pages.
16. Add a no-index safeguard for unpublished landing pages and admin preview routes.
17. Add mobile screenshot/layout smoke tests for landing pages, booking, services, pricing, and admin app.
18. Finish service-area DB admin CRUD so county water rules can be edited without changing JSON.
19. Add booking dispatch checklist prompts based on selected town water rule, access rule, and parking note.
20. Create a monthly local SEO review workflow: ranking terms, page freshness, photos needing replacement, reviews, and service proof updates.

## SEO operating rule

We keep improving the items we can control: useful page titles, one clear H1 per exposed page, locally specific wording, crawlable internal links, visible proof/reviews, properly described photos, and structured data where it fits. Search placement is still not guaranteed because local ranking also depends on distance, relevance, prominence, reviews, competition, and searcher location.

## DB/source-of-truth direction

Landing-page media is now supported in JSON/app-setting fields and checked by release scripts. The next larger migration should move landing pages, media records, photo sources, and publish status into DB tables after the editing workflow is stable.
