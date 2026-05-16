# Current Implementation State — Build 142

**Updated:** 2026-05-15

## Public website

- Booking, pricing, services, review proof, add-on imagery, and local landing pages are active.
- Booking service areas support typeable towns plus a full picker for Oxford and Norfolk communities.
- Public service-area rules load through `/api/service_area_rules_public` when available and fall back to bundled JSON.
- Local SEO targets and sitemap now include the newest town pages.

## Admin/app backend

- Admin App remains the main settings/editor surface.
- Admin Catalog supports DB rows merged with bundled fallback inventory.
- Admin Accounting has operational bookkeeping/reporting coverage but still needs final close/export polish.
- New service-area admin endpoint exists at `/api/admin/service_area_rules`, but the UI still needs to be wired directly to it.

## Data/source-of-truth direction

- JSON remains the safe deploy fallback.
- Supabase should become canonical for service-area rules, option libraries, media library, reviews, inventory usage, and accounting workflows as each migration is verified.
