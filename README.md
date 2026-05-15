# Rosie Dazzlers — Mobile Auto Detailing Platform

**Active branch:** `dev`  
**Build pass:** 140  
**Updated:** 2026-05-14

Rosie Dazzlers is a Cloudflare Pages + Supabase + R2 mobile auto-detailing website and operations app for Oxford County and Norfolk County, Ontario.

## Build 140 highlight

This pass completed the prior 20-step roadmap as a foundation pass: shared dropdown option contracts, media-library seed data, review-proof API fallback, local SEO target/audit scripts, release checklist script, schema foundations, duplicate-root-file cleanup, wrapper sync, and fresh Markdown documentation.

## Main customer flows

- Home: `/`
- Services: `/services`
- Pricing and booking planner: `/pricing`
- Booking: `/book`
- Gallery: `/gallery`
- Gifts: `/gifts`
- Gear and consumables: `/gear`, `/consumables`
- Town landing pages: Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover
- Service landing pages: ceramic coating, pet hair removal, odor removal, headlight restoration, paint correction

## Main admin flows

- Admin App: `/admin-app`
- Admin Catalog: `/admin-catalog`
- Admin Accounting: `/admin-accounting`
- Admin Booking/Blocks/Assign/Payroll/Analytics/Customers/Staff

## Source-of-truth docs

Read these first:

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_CHECK.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `PROJECT_BRAIN.md`
- `REPO_GUIDE.md`
- `IMAGES.md`
- `SUPABASE_SCHEMA.sql`

## Release check

Before deployment, run:

```bash
python scripts/release_check.py
```

## Branch rule

Use `dev` as the active source of truth. Do not merge to `main` unless explicitly requested.
