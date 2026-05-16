# Sanity Check — Build 142

**Package base:** `rosiedazzlers-dev(138).zip`  
**Updated:** 2026-05-15

## Completed checks planned for this package

- Zip integrity.
- JSON parsing.
- XML sitemap parsing.
- JavaScript syntax checks for patched public/admin/API files.
- Static stress checks.
- Local SEO audit.
- Release check.
- Confirm no exposed public HTML page has more than one H1.
- Confirm root `.js` files only contain `service-worker.js`.

## Manual checks after deploy

1. Open `/book` and click **Show all towns** in Service Area.
2. Type a town such as `Norwich`, `Waterford`, or `Port Rowan` and confirm county/water-rule notes appear.
3. Enter a city and postal code and confirm warnings behave sensibly.
4. Check `/pricing#booking-planner` and `/services` embedded booking panels.
5. Open new town pages and confirm each has one clear H1 and booking links.
6. Run the new Supabase migration in dev before relying on DB-first service-area rules.
