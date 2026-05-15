# Current Implementation State — Build 140

**Updated:** 2026-05-14

## Public site

The public site includes home, services, pricing, booking, contact, gallery, gifts, gear, consumables, maintenance-plan, service landing pages, and town landing pages. Build 140 added a formal local SEO target file, a local SEO audit script, and dynamic review-proof loading with safe sample fallback.

## Booking

The booking flow remains the main conversion path. Services and Pricing can embed the booking planner. Keep Step 1 compact, keep the bottom next-step action, and keep checkout schema fallbacks until all Supabase migrations are confirmed.

## Admin App

Admin App controls pricing/add-ons, landing pages, growth settings, document templates, membership settings, dropdown option libraries, and media-related fields. The next major step is a real media-library and option-library editor backed by Supabase/app settings.

## Admin Catalog

Admin Catalog manages gear, consumables, systems, inventory, low stock, vendor data, usage, reorder actions, and receiving. It must keep showing saved DB rows plus bundled fallback rows so editing one item does not hide unsaved catalog items.

## Media and proof

Build 140 added media-library seed data, review fallback JSON, a public reviews API, and `assets/reviews.js`. The next step is replacing sample reviews and gallery JSON with admin-managed DB content.

## Accounting

Accounting includes GL-style records, payables, remittance/report screens, monthly checklist concepts, payroll/time entry support, and export paths. It still needs payment application, reconciliation matching, journal validation, close locks, and accountant export packaging.

## Data direction

Move stable business data into Supabase/app settings once admin editors are reliable. Keep JSON bundled as fallback for public resilience.
