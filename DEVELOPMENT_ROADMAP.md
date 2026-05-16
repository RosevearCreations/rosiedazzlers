# Development Roadmap — Build 146

**Updated:** 2026-05-15  
**Target branch:** `dev`  
**Pass focus:** Amazon Business CSV matching, catalog enrichment, DB-first inventory maturity, and local SEO discipline.

## Build 146 completed 20-step pass

1. Processed the Amazon Business CSV against the bundled consumables and gear catalogs.
2. Added `scripts/amazon_catalog_match.py` so the match can be regenerated from a private CSV without hand-editing.
3. Generated `data/amazon_catalog_matches.json` with sanitized match suggestions for each catalog item.
4. Generated `data/amazon_inventory_enrichment_preview.json` for DB import/edit workflows.
5. Generated `data/amazon_inventory_match_review.csv` for easier manual review outside the app.
6. Pulled ASIN-derived Amazon links for matched rows.
7. Pulled unit purchase price, quantity total, net total, seller, brand, category, UNSPSC, model, and part-number fields where available.
8. Added match confidence statuses: strong, review, and unmatched/manual.
9. Added top Amazon suggestions for each catalog row so weaker matches are still reviewable instead of discarded.
10. Added privacy trimming so generated data excludes payment identifiers, account emails, receiver emails, and full seller addresses.
11. Added an Admin Catalog Amazon CSV match review panel.
12. Added Admin Catalog filters for strong, review, unmatched, and all Amazon matches.
13. Added one-click load into the inventory editor from an Amazon match.
14. Added selected-match save into the existing inventory save endpoint.
15. Extended inventory save/import payload support for optional Amazon enrichment columns.
16. Added schema migration for optional `amazon_*` catalog inventory fields.
17. Added release check coverage for Amazon match outputs and privacy guardrails.
18. Kept the public consumables/gear fallback merge intact so DB-only rows cannot hide bundled inventory again.
19. Updated schema and Markdown handoff files for the Amazon CSV enrichment workflow.
20. Preserved local SEO/H1/release-check discipline while adding the backend catalog data pipeline.

## Next logical 20 steps

1. Run `sql/2026-05-15_build145_catalog_db_import_admin_workflows.sql` in Supabase dev if not already applied.
2. Run `sql/2026-05-15_build146_amazon_csv_catalog_matching.sql` in Supabase dev.
3. In Admin Catalog, load Amazon matches and import only the strong matches first.
4. Review the `review` matches one at a time, comparing item name, image, ASIN title, and seller before saving.
5. Build an Amazon match override table so corrected manual matches are remembered instead of recalculated every import.
6. Add an Admin Catalog button to upload the Amazon CSV privately instead of generating the match JSON outside the browser.
7. Move Amazon match output out of static `/data` and behind an authenticated admin API once private upload exists.
8. Add import-batch history for Amazon CSV saves so every bulk save can be traced and rolled back.
9. Add per-item cost history so current unit cost does not overwrite older purchase costs.
10. Add receipt/invoice attachment upload to R2 and link it to matched Amazon rows.
11. Link vendor directory entries to Amazon sellers and non-Amazon suppliers.
12. Add duplicate resolution for rows with the same ASIN but different catalog names.
13. Add item quantity reconciliation so catalog stock counts can be adjusted independently from historical purchased quantity.
14. Add service usage presets that consume matched consumables by package/service type.
15. Add low-stock forecast based on matched purchase sizes and estimated jobs per unit.
16. Add public “products we use” proof blocks to relevant service landing pages using service-product links.
17. Add Google Search Console / Business Profile reporting placeholders for town and service landing performance.
18. Continue replacing sample reviews with real review API data while keeping sample fallback content.
19. Keep cleaning admin CSS/table overflow after every new workflow because Admin Catalog is now dense.
20. Once the DB import path is stable, document JSON catalogs as fallback-only and begin retiring manual JSON edits.

## SEO discipline to keep every pass

- Keep one clear H1 on each exposed public page.
- Use real local search phrases in titles, descriptions, H1s, static fallback copy, and internal links.
- Keep Oxford County, Norfolk County, and municipality names visible where they help relevance.
- Keep public proof visible: reviews, before/after work, service pages, and product/process transparency.
- Keep sitemap, canonical links, structured data, and release checks aligned.
- Remember that SEO improves clarity and relevance, but search engines do not guarantee first-place placement.
