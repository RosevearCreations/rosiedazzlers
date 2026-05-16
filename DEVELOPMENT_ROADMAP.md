# Development Roadmap — Build 143

**Updated:** 2026-05-15  
**Target branch:** `dev`

## Build 143 completed pass

1. Fixed public Consumables showing only two items when the DB feed had only two saved rows.
2. Changed Consumables to merge bundled JSON fallback rows with Supabase catalog rows.
3. Changed Gear to use the same merge pattern.
4. Made DB rows override matching bundled fallback rows instead of replacing the whole catalog.
5. Added a public catalog fallback release check.
6. Wired the new catalog check into the release checklist.
7. Updated schema notes as a no-DDL compatibility pass.
8. Refreshed active Markdown for the catalog fallback issue.

## Next logical 20 steps

1. Build an Admin Catalog “import bundled consumables to DB” tool.
2. Build an Admin Catalog “import bundled gear/tools to DB” tool.
3. Add duplicate matching by item key, name, filename/path, and image URL.
4. Add a review screen before import that shows create/update/skip decisions.
5. Add an “edited in DB” badge on Admin Catalog rows.
6. Add a “bundled fallback only” badge on Admin Catalog rows.
7. Add a public catalog source badge that can be hidden later.
8. Move reusable category/type/colour/vendor/unit options into DB/app settings.
9. Add admin controls to customize and sort consumable/gear dropdown values.
10. Add image completeness scoring to catalog items.
11. Add missing image report for products/tools.
12. Add bulk public/private toggles for catalog items.
13. Add consumable usage logging from job completion.
14. Add gear assignment tracking for detailers/vehicles.
15. Add purchase/receipt attachment support for catalog items.
16. Add vendor directory linkage from inventory records.
17. Add reorder threshold dashboard.
18. Add mobile inventory adjustment screen.
19. Add service-to-product linking for SEO and customer trust pages.
20. Retire JSON only after DB import, admin editing, and release checks prove complete.
