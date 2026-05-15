# Rosie Dazzlers — Mobile Auto Detailing Platform

**Active branch:** `dev`  
**Build pass:** 141  
**Updated:** 2026-05-14

Rosie Dazzlers is a Cloudflare Pages + Supabase + R2 mobile auto-detailing website and operations app for Oxford County and Norfolk County, Ontario.

## Build 141 highlight

Build 141 restores and expands service-area support for Norfolk and Oxford counties. The booking service-area field is now typeable, the public pricing catalog includes county/town service-area rows, and Admin App can edit water-rule/by-law reminders per location.

## Main customer flows

- Home: `/`
- Services: `/services`
- Pricing and booking planner: `/pricing`
- Booking: `/book`
- Gallery: `/gallery`
- Gifts: `/gifts`
- Gear and consumables: `/gear`, `/consumables`
- Service landing pages: ceramic coating, pet hair removal, odor removal, headlight restoration, paint correction
- Town/area landing pages: Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, with more planned

## Main admin flows

- Admin App: `/admin-app`
- Admin Catalog: `/admin-catalog`
- Admin Accounting: `/admin-accounting`
- Admin Booking/Blocks/Assign/Payroll/Analytics/Customers/Staff

## Source-of-truth files

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `SANITY_CHECK.md`
- `SUPABASE_SCHEMA.sql`
- `data/service_area_rules.json`
- `data/rosie_services_pricing_and_packages.json`
- `data/admin_option_libraries.json`

## Branch rule

Use `dev` as the active source of truth unless explicitly told otherwise.

<!-- Build 141 sync 2026-05-14: reviewed during Norfolk/Oxford service-area, water-rule fallback, typeable booking location, local SEO, and docs/schema pass. -->


## Build 141 cleanup note

Root-level duplicate API JavaScript files were removed again; valid API handlers remain under `functions/api/` and `functions/api/admin/`, while `service-worker.js` remains at the public root.
