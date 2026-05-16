# Rosie Dazzlers — Mobile Auto Detailing Platform

**Active branch:** `dev`  
**Last synchronized:** 2026-05-15 — Build 145

Rosie Dazzlers is a Cloudflare Pages + Supabase + R2 site/app for mobile auto detailing in Oxford County and Norfolk County, Ontario.

## Build 145 focus

- Admin Catalog DB import workflow for bundled consumables and gear.
- Catalog quality scoring and missing-data reporting.
- Bulk public/private and active/inactive inventory controls.
- Mobile quick stock adjustment.
- Optional DB foundations for vendor directory, receipts, assignments, and service-product links.
- Continued one-H1, local SEO, sitemap, and fallback discipline.

## Core docs

- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `SANITY_CHECK.md`
- `IMAGES.md`
- `SUPABASE_SCHEMA.sql`

## Release check

```bash
python scripts/release_check.py
```
