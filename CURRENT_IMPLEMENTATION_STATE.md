# Current Implementation State

**Date:** 2026-05-10

## Public site

The public site includes home, services, pricing, booking, contact, gallery, gifts, gear, consumables, maintenance plan, service landing pages, and town landing pages. Local SEO work should continue on titles, descriptions, one clear H1, schema, sitemap, internal links, proof blocks, reviews, and before/after media.

## Booking

The booking flow is the main customer conversion path. Services/Pricing can embed the booking planner. Keep Step 1 compact and ensure checkout has schema-compatible fallbacks when live DB migrations lag.

## Admin App

Admin App controls pricing/add-ons, landing pages, growth settings, maintenance reminders, and other app configuration. Dropdowns and image fields should continue moving toward customizable reusable option libraries.

## Admin Catalog

Admin Catalog manages gear, consumables, systems, inventory, low stock, vendor data, usage, and reorder workflow. It should always show saved DB rows plus bundled fallback rows so editing one item does not hide everything else.

## Accounting

Accounting includes GL-style records, payables, remittance/report screens, monthly checklist concepts, payroll/time entry support, and export paths. It still needs stronger reconciliation, close locks, payment application, journal validation, and accountant export packaging.

## Data direction

Move stable business data into Supabase/app settings once admin editors are reliable. Keep JSON bundled as fallback for public resilience.
