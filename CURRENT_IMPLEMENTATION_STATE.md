# Current Implementation State — Build 149

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

- Service areas and travel tiers are now edited one row at a time through a dropdown editor.
- Admin App save actions now show visible green `Saved ✓` feedback plus the existing status message.
- Landing page builder can edit hero image URL, gallery URLs, captions, source names, and source URLs.
- Add-on, dropdown option, pricing, landing page, and catalog workflows remain JSON-backed with DB/API foundations growing in parallel.

## Backend/catalog/accounting

- Catalog import/matching foundations exist for bundled inventory and Amazon CSV enrichment.
- Service-area DB/API foundations exist but need Supabase migration testing.
- Accounting foundations exist, but month-end close, reconciliation, and accountant export workflows remain a major roadmap focus.

<!-- Build 149 sync 2026-05-17: reviewed during Admin App service-area dropdown editor, save-feedback, Tillsonburg image fallback, local SEO/H1/CSS/release-check pass. -->
