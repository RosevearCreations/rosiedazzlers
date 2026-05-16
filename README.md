# Rosie Dazzlers — Mobile Auto Detailing Platform

**Active branch:** `dev`  
**Build pass:** 142  
**Updated:** 2026-05-15

Rosie Dazzlers is a Cloudflare Pages + Supabase + R2 mobile auto-detailing website and operations app for Oxford County and Norfolk County, Ontario.

## Build 142 highlight

Build 142 moves service-area handling closer to a real app workflow. The booking form now keeps the service area typeable while also offering a full town picker, city/postal validation, county fallback rules, and clearer water/power setup handling. Service-area rules now have a DB-first migration and public/admin API foundation while bundled JSON remains the safe fallback.

## Main customer flows

- Home: `/`
- Services: `/services`
- Pricing and booking planner: `/pricing`
- Booking: `/book`
- Gallery/reviews/proof: `/gallery` plus homepage review proof
- Gifts: `/gifts`
- Gear and consumables: `/gear`, `/consumables`
- Service landing pages: ceramic coating, pet hair removal, odor removal, headlight restoration, paint correction
- Town/area landing pages: Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, Zorra/Thamesford/Embro, Waterford/Vittoria, Port Rowan/Turkey Point

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
- `data/local_seo_targets.json`

## Branch rule

Use `dev` as the active source of truth unless explicitly told otherwise.
