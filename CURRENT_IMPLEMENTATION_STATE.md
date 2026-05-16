# Current Implementation State — Build 145

**Updated:** 2026-05-15

## Public website

- Booking, services, pricing, review proof, service-area rules, town landing pages, consumables, and gear pages are active.
- Consumables and gear merge bundled fallback JSON with DB rows so partial DB imports do not hide unedited rows.
- Service-area selection supports Oxford/Norfolk towns, typeable custom towns, and county fallback water-rule reminders.
- Local SEO checks validate page titles, H1 count, sitemap, and target town/service routes.

## Admin/backend

- Admin Catalog now includes import preview, selected import, quality scoring, public/private batch controls, and mobile stock adjustment.
- Inventory save supports receipt URL, assigned station, service tags, and compatibility fallback when optional DB columns are missing.
- New optional APIs: `catalog_bulk_import` and `catalog_bulk_visibility`.
- New optional SQL foundation adds import batches, vendor directory, receipts, gear assignments, and service-product links.

## Current source-of-truth status

- DB rows override bundled rows when item keys match.
- Bundled JSON remains required fallback until the import workflow is proven.
- Markdown has been refreshed for Build 145 and older root Markdown was archived into `archive/2026-05-15-build145-markdown-snapshot`.
