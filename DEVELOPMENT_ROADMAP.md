# Development Roadmap — Build 145

**Updated:** 2026-05-15  
**Target branch:** `dev`  
**Pass focus:** catalog DB migration, admin workflow depth, local SEO support, and backend-app maturity.

## Build 145 completed 20-step pass

1. Added Admin Catalog DB import preview for bundled consumables and gear.
2. Added create/review/skip decision logic before catalog import.
3. Added duplicate warning logic using normalized name and image URL.
4. Added selected-row import flow from bundled fallback rows into saved DB rows.
5. Added bulk visibility controls for selected inventory rows.
6. Added bulk active/inactive controls for selected inventory rows.
7. Added public/saved source badges and public/private status badges.
8. Added item quality/completeness scoring in Admin Catalog.
9. Added image/cost/category completeness summary in the catalog workbench.
10. Added generated catalog quality report data.
11. Added generated import preview/profile data.
12. Added mobile quick stock adjustment workflow using the existing stock-action endpoint.
13. Added receipt/bill URL field to the inventory editor.
14. Added assigned station/vehicle/bin field to the inventory editor.
15. Added service tags field to support service-to-product linking.
16. Added compatibility-safe inventory save fallbacks for optional newer DB columns.
17. Added bulk visibility API endpoint.
18. Added bulk import API endpoint for future DB-first migration.
19. Added vendor directory seed data from catalog sources.
20. Added service-to-product link seed data and release checks.

## Next logical 20 steps

1. Run the Build 145 SQL in Supabase dev, then test catalog import on a small selected batch first.
2. Create an Admin Catalog import-history screen backed by catalog_import_batches and catalog_import_batch_rows.
3. Add a real vendor directory editor with vendor contact/payment fields and linkage from inventory rows.
4. Add receipt upload/storage through R2 instead of only receipt URL entry.
5. Add a one-click 'attach receipt to item' action from purchase order receive flow.
6. Add product cost history per item so price changes do not overwrite older purchase costs.
7. Add service-product public sections on service landing pages using service_product_links.
8. Add job-completion product usage presets by service package.
9. Add gear assignment dashboard by detailer, vehicle, bin, or trailer.
10. Add mobile stock count mode with barcode/QR-friendly item lookup.
11. Add low-stock notifications for selected vendors/categories.
12. Add reorder forecast based on products used per booking and estimated jobs per unit.
13. Add admin option-library database endpoint for categories, colours, vendors, units, and service tags.
14. Add sortable admin dropdown manager for inventory and landing-page option libraries.
15. Add missing-image work queue with upload/replace links.
16. Add public catalog 'used by this service' cross-links for SEO and trust.
17. Add Search Console reporting placeholders for top local queries and town landing pages.
18. Add review-proof manager so sample reviews can be replaced by API reviews safely.
19. Add release check that confirms active Markdown docs are fresh and archived docs are not accidentally used.
20. After DB import is proven, mark JSON catalogs as fallback-only and document the retirement path.

## SEO discipline to keep every pass

- Keep one clear H1 on each exposed public page.
- Keep local terms in page titles, meta descriptions, H1s, service copy, and internal links.
- Keep town/service landing pages crawlable with static fallback content before JavaScript runs.
- Keep sitemap, canonical links, and structured data aligned.
- Keep Google Business Profile, reviews, prominence signals, and visible proof work separate from code-only SEO.
