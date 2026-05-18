# Current Implementation State — Build 150

**Updated:** 2026-05-17

The current dev build is a Cloudflare Pages + Pages Functions + Supabase + R2-backed Rosie Dazzlers platform with JSON fallbacks for public pages and admin workflows.

## Public site

- Public pages are checked for one H1 per exposed page.
- Mobile navigation is compact and expandable.
- Booking supports a typeable service-area picker with Oxford/Norfolk county fallback rules.
- Consumables and gear pages merge DB rows with bundled fallback catalog rows.
- Location landing pages support regional photos, captions, sources, `og:image`, and missing-image fallback handling.
- Add-on landing pages support hero photos, gallery images, detailed process sections, equipment/workflow sections, reasons, highlights, FAQ, and related products.

## Admin App

- Service areas and travel tiers are edited one row at a time through a dropdown editor.
- Admin App save actions show visible green `Saved ✓` feedback plus the existing status message.
- Landing page builder can edit hero image URL, gallery URLs, captions, source names, and source URLs.
- Add-on, dropdown option, pricing, landing page, and catalog workflows remain fallback-safe while DB/API foundations grow in parallel.

## Admin Catalog / Inventory Workflow

- Inventory rows merge saved DB data with bundled consumables/tools fallback rows.
- Saved DB rows with blank `image_url` now inherit the matching bundled image for display and quality scoring.
- The inventory editor includes a product-image preview, matching-image restore button, and searchable existing-image picker.
- Image suggestions include saved helper URLs plus bundled consumables/tools image URLs.
- A new release check validates image picker markers and bundled fallback image coverage.

## Backend/catalog/accounting

- Catalog import/matching foundations exist for bundled inventory and Amazon CSV enrichment.
- Build 150 schema tracking includes inventory receipt URLs, assigned station, service tags, public badge, count timestamp, and Amazon match fields.
- Service-area DB/API foundations exist but need Supabase migration testing.
- Accounting foundations exist, but month-end close, reconciliation, inventory valuation, and accountant export workflows remain major roadmap focus.

<!-- Build 150 sync 2026-05-17: reviewed during Admin Catalog image picker/fallback repair, schema synchronization, release checks, and local SEO/H1 discipline pass. -->
