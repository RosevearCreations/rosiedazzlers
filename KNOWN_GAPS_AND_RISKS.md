# Known Gaps and Risks — Build 146

**Updated:** 2026-05-15

## Reduced in this pass

- Amazon Business CSV rows are now matched against bundled consumables and gear.
- Matching pulls ASIN links, unit cost, quantity, seller, brand, category, UNSPSC, and related purchase metadata into review files.
- Admin Catalog now has an Amazon CSV match review panel so strong matches can be saved and review matches can be checked one at a time.
- Inventory save and bulk import APIs accept optional Amazon enrichment fields with compatibility fallbacks.
- Release checks now validate Amazon match outputs and check that generated public files do not include obvious private payment/account fields.
- Public catalog fallback merging remains in place, so partial DB imports will not hide unedited bundled gear/consumables.

## Still open

1. Run the Build 145 and Build 146 SQL migrations in Supabase dev.
2. Import strong Amazon matches in small batches first.
3. Manually review medium-confidence matches before saving.
4. Build an authenticated private CSV upload flow so the Amazon source CSV never needs to live in the deploy package.
5. Move generated Amazon match outputs behind an admin API once private upload exists.
6. Add cost history and receipt attachments so accounting has stronger audit support.
7. Add match override memory for corrected manual matches.
8. Add vendor directory linking for Amazon sellers and other suppliers.
9. Add duplicate ASIN resolution for cases where multiple catalog items point at one Amazon product.
10. Continue testing CSS/table overflow on Admin Catalog because it is now a dense app-like workflow.
11. Continue validating local SEO/H1/sitemap/structured data during every build pass.
12. Search ranking is not guaranteed; code can improve relevance, crawlability, proof, and prominence support, but not force first place.
