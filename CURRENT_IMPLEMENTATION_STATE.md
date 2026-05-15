# Current Implementation State — Build 141

**Updated:** 2026-05-14

## Public site

The site remains a Cloudflare Pages + Supabase + R2 mobile auto-detailing platform for Oxford County and Norfolk County. Build 141 expands the service-area model so booking and local SEO can work with Norfolk/Oxford counties, their municipalities/communities, and county-level water-rule fallbacks.

## Booking

The booking service-area field is now typeable. Customers can choose from the datalist or type a town/service zone. Exact matches load town rules; Oxford/Norfolk county matches load county defaults; unknown towns prompt staff confirmation before dispatch.

## Admin App

Admin App pricing/service-area editing now includes editable county, town/label, booking value, municipality, zone, travel tier, by-law note, water reminder, parking/access reminder, and noise reminder fields.

## Data

Important service-area files:

- `data/service_area_rules.json` — shared service-area/water-rule seed and source notes.
- `data/rosie_services_pricing_and_packages.json` — active public pricing/booking fallback catalog.
- `data/admin_option_libraries.json` — dropdown/typeahead libraries for towns, tiers, categories, vendors, units, and sorting options.
- `data/local_seo_targets.json` — local SEO targets and future town-page suggestions.

## Next focus

Move the service-area/rules seed into Supabase, complete the option-library editor, build the next town landing pages, and connect dispatch/checkout validation to postal code or address resolution.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->


## Build 141 cleanup note

Root-level duplicate API JavaScript files were removed again; valid API handlers remain under `functions/api/` and `functions/api/admin/`, while `service-worker.js` remains at the public root.
