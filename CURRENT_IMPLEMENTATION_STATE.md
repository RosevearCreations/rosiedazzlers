# Current Implementation State — Build 148

**Updated:** 2026-05-16

The current dev build is a Cloudflare Pages + Pages Functions + Supabase + R2-backed Rosie Dazzlers platform. Public pages still use JSON fallback files so the website works even when DB settings are incomplete.

## Public site state

- Public pages use one-H1 checks and static release checks.
- Mobile navigation is compact and expandable.
- Booking supports a typeable service-area picker with Oxford/Norfolk fallback rules.
- Services/pricing/catalog pages use fallback merging so partial DB edits do not hide bundled content.
- Location landing pages now include regional photos, photo captions/source fields, and static `og:image` values.
- Add-on landing pages now support photo, gallery, detailed process, equipment/workflow, reasons, highlights, FAQ, and related product references.

## Admin App state

- Admin App can edit pricing, add-ons, landing pages, dropdown option libraries, service areas, and media URLs.
- Add-on landing editors support hero image, gallery URLs, related products, page reasons, process, and source/credit metadata.
- Location landing editors support regional photo fields and local-service reasons.
- Full DB-backed media management is still a next-step item.

## Backend/accounting/catalog state

- Catalog import/matching foundations exist for bundled inventory and Amazon CSV enrichment.
- Consumables/gear public pages merge DB rows with bundled fallback rows.
- Accounting foundations exist, but month-end/export/reconciliation flows still need further hardening.
- Service-area rules have JSON fallback plus API/DB migration foundations.

## Current release-check expectations

Run `scripts/release_check.py` before deploy. It validates JSON/XML, static checks, local SEO, catalog fallback counts, service-area rules, Amazon matching, mobile nav, and landing regional photos.
