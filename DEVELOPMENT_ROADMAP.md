# Development Roadmap — Next Logical 20 Steps

**Reset date:** 2026-05-10  
**Target branch:** `dev`

These are the next practical steps to move Rosie Dazzlers from a powerful prototype into a cleaner real app.

## Next 20 value-added steps

1. **Finish Admin App dropdown libraries** — make category, type, colour, vendor, unit, service zone, and service tier option lists editable from one admin settings panel.
2. **DB-first dropdown storage** — store option libraries in Supabase/app settings, with JSON fallback only when the API fails.
3. **Admin Catalog inventory polish** — keep item names clickable for edit, preserve compact rows, and add filters for gear, consumables, systems, low stock, vendor, and colour/finish.
4. **Inventory edit reliability** — after saving one item, reload the full merged inventory list so saved DB rows do not hide bundled fallback rows.
5. **Media library foundation** — connect images/videos used by services, add-ons, landing pages, reviews, galleries, gear, and consumables to a shared media library.
6. **Image replacement workflow** — each admin image field should show current image, fallback image, preview, alt text, recommended size, and “keep/replace” controls.
7. **Admin-managed before/after gallery** — move gallery entries from sample JSON into a DB/admin-managed content set.
8. **Homepage proof block** — keep the review section and before/after slider visible on the home page, then replace samples with live review/gallery API data when ready.
9. **Town landing pages** — complete admin-editable landing pages for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, Courtland/Langton, and nearby service zones.
10. **Service landing pages** — strengthen ceramic coating, pet hair removal, odor removal, headlight restoration, paint correction, engine cleaning, clay treatment, and sealant pages.
11. **Structured data pass** — add/validate LocalBusiness, AutoDetailing/Service, FAQ, Breadcrumb, Review, and ImageObject schema where appropriate.
12. **Sitemap and crawl check** — keep sitemap synced after every route/content change; avoid indexing private/admin screens.
13. **Booking embed polish** — keep Services/Pricing booking embeds compact, with Step 1 bottom navigation and no oversized internal scrollbars.
14. **Checkout reliability** — keep schema-compatible checkout fallbacks and log clear diagnostics when Supabase columns/migrations are missing.
15. **Error handling layer** — standardize friendly UI messages, API error codes, console-safe diagnostics, and fallback content for every public/admin workflow.
16. **Accounting close workflow** — finish payment application, journal-line validation, reconciliation matching, tax/remittance review, month-end locks, and accountant export packages.
17. **Payroll/time compatibility** — keep `job_time_entries.minutes` compatibility documented and remove fallback-only logic after migration is confirmed live.
18. **Customer account maturity** — improve garage, history, saved vehicles, membership status, gift balances, next-service reminders, and booking reuse.
19. **Review API integration** — replace sample reviews with Google/approved review source once credentials and policy-compliant flow are ready.
20. **Release checklist automation** — add one command/script to run static checks, JSON/XML validation, H1 checks, local SEO checks, and zip packaging.

## SEO direction for every pass

Search ranking cannot be guaranteed, but every pass should improve relevance, clarity, crawlability, and local proof. Use customer-search language in titles, H1s, meta descriptions, first paragraphs, internal links, gallery captions, alt text, and service-area wording.

## Backend/app direction

Move duplicated or business-critical data from scattered JSON into DB/app settings when the admin editor is ready. Keep JSON as fallback until the DB path is tested and reliable.
