# Project Brain — Build 145

Rosie Dazzlers is moving from static/catalog JSON toward a DB-first operational app while keeping JSON fallback safety.

## Current principle

Do not retire bundled JSON until:

1. DB import is complete.
2. Admin editing is proven.
3. Public catalog pages still show full content.
4. Release checks pass.
5. The fallback/retirement path is documented.

## Build 145 app direction

- Catalog import, quality scoring, bulk toggles, receipt fields, assigned station fields, service tags, vendor seed, and service-product links are now the main operational path.
- SEO work stays tied to useful local content, static crawlable pages, visible proof, reviews, and Google Business Profile prominence.

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->
