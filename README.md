# Rosie Dazzlers — Mobile Auto Detailing Platform

**Active branch:** `dev`  
**Build pass:** 143  
**Updated:** 2026-05-15

Rosie Dazzlers is a Cloudflare Pages + Supabase + R2 mobile auto-detailing website and operations app for Oxford County and Norfolk County, Ontario.

## Build 143 highlight

Build 143 fixes the public Consumables catalog so partial DB edits no longer hide the bundled fallback catalog. Public Consumables and Gear now merge Supabase catalog rows over their JSON fallback sources, which lets saved DB edits appear while the rest of the default catalog remains visible.

## Current working rules

- Keep `dev` as the active working branch.
- Keep public pages crawlable, local, and simple.
- Keep only one H1 on exposed public pages.
- Keep Cloudflare Pages Functions under `functions/api/`.
- Keep JSON as a deploy-safe fallback until each area is fully DB-backed.
- Move business-editable data into Supabase/app settings when the workflow is mature enough.

## Key folders

- `functions/api/` — Cloudflare Pages Functions.
- `assets/` — shared browser JavaScript and CSS helpers.
- `data/` — fallback JSON catalogs and local SEO/service-area data.
- `scripts/` — release, SEO, static, and catalog checks.
- `sql/` — Supabase migrations and no-DDL tracking notes.
- `archive/` — older snapshots and retired docs.

## Checks for this pass

- Public catalog fallback check.
- Static stress checks.
- Local SEO audit.
- JSON/XML parsing.
- JavaScript syntax checks.
- One-H1 public page check.
- Root-level duplicate API JavaScript was removed again; valid handlers remain under `functions/api/`.
