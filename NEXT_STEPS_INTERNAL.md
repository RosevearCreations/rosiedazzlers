# Development Roadmap — Build 147

**Updated:** 2026-05-16  
**Target branch:** `dev`  
**Pass focus:** Admin App stability, reusable dropdown options, compact mobile navigation, release checks, and continued local SEO discipline.

## Build 147 completed 20-step pass

1. Fixed the Admin App runtime error `mergeServiceAreaRows is not defined`.
2. Added a safe `mergeServiceAreaRows()` helper that merges DB/app-setting service areas with bundled fallback service areas.
3. Preserved saved service-area edits while filling missing water-rule, county, tier, and by-law fields from fallback data.
4. Added a visible **Dropdown option library** panel to Admin App.
5. Added the missing `saveCatalogDropdownOptionsBtn` element so the console no longer reports a missing event target.
6. Added editable dropdown textareas for add-on categories, add-on types, inventory categories, inventory subcategories/colours, vendors, units, service tiers, service zones, and service counties.
7. Updated Admin App dropdown option reading so `service_counties` is saved along with the other option lists.
8. Kept dropdown options DB/app-setting first with bundled defaults as fallback.
9. Reworked the public mobile navigation into a compact expandable menu instead of a long always-visible list.
10. Added outside-click, Escape-key, link-click, and desktop-resize closing behavior for the mobile menu.
11. Added two-column compact mobile menu cards, with a one-column fallback for very narrow screens.
12. Added mobile handling for the account widget so it scrolls horizontally instead of forcing a tall page header.
13. Kept the public Book button full-width on mobile for clearer conversion flow.
14. Added `scripts/mobile_nav_check.py` to protect the compact menu behavior in future releases.
15. Wired the mobile navigation check into `scripts/release_check.py`.
16. Removed root-level duplicate API JavaScript files again; the real API handlers remain under `functions/api/`.
17. Left `service-worker.js` at root because it is a valid public browser asset.
18. Continued SEO/H1 discipline by running static public-page checks.
19. Updated schema notes and Markdown handoff files for the Admin App/mobile navigation pass.
20. Replaced the roadmap with the next logical 20 steps below.

## Next logical 20 steps

1. Apply the pending Supabase migrations in dev in order: Build 140 foundations, Build 142 service-area rules, Build 145 catalog import workflows, and Build 146 Amazon matching.
2. Test Admin App on phone width after deploy: open/close menu, save dropdown options, edit service areas, and reload pricing catalog.
3. Test public mobile navigation on Home, Services, Pricing, Book, Gear, Consumables, Gallery, and Contact.
4. Create an Admin App service-area rules screen backed by `service_area_rules`, not only the pricing catalog JSON.
5. Move catalog dropdown options from app-setting JSON into a DB table once the editing flow is stable.
6. Add a reusable admin dropdown-options API so Admin App and Admin Catalog share the same options without duplicating JS.
7. Add validation to prevent empty dropdown option saves from wiping useful bundled defaults.
8. Add an Admin Catalog private Amazon CSV upload endpoint so future Amazon files do not need to be committed into `/data`.
9. Move Amazon match review data behind authenticated admin APIs after the upload endpoint exists.
10. Import strong Amazon matches in small batches and review medium-confidence matches manually.
11. Add cost-history records so new Amazon purchases do not overwrite older item costs.
12. Add receipt/statement upload to R2 and link receipts to Amazon/cost-history rows.
13. Build vendor directory links for Amazon sellers and non-Amazon suppliers.
14. Add service usage presets that estimate consumables used by package, add-on, vehicle size, and condition.
15. Add low-stock forecasts using estimated jobs per unit and recent booking/service usage.
16. Add public service/product proof blocks to landing pages using `data/service_product_links.json`.
17. Replace sample reviews with live review API data when the external review source is ready.
18. Add Search Console / Business Profile metric placeholders for town/service landing pages.
19. Continue reducing static JSON to fallback-only once DB workflows are proven.
20. Keep release checks strict: one H1, no broken internal links, local SEO target coverage, catalog fallback counts, service-area rules, and mobile menu guardrails.

## SEO discipline to keep every pass

- Keep one clear H1 on every exposed public page.
- Use search phrases people actually type in page titles, descriptions, headings, static fallback text, and internal links.
- Keep Oxford County, Norfolk County, and municipality names visible where they support relevance.
- Keep proof visible: reviews, before/after work, real products/process notes, service pages, and town pages.
- Keep sitemap, canonical links, structured data, and release checks aligned.
- SEO work improves crawlability, relevance, and trust signals; it cannot guarantee first-place ranking.

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->

<!-- Build 148 sync 2026-05-16: reviewed during landing photo/add-on page process/local SEO pass. Active details are in DEVELOPMENT_ROADMAP.md, KNOWN_GAPS_AND_RISKS.md, CURRENT_IMPLEMENTATION_STATE.md, SANITY_CHECK.md, and IMAGES.md. -->

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->
