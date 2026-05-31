# Build 181 roadmap update — verified provider deposits

**Updated:** 2026-05-26

Build 181 completes the next requested workflow step: accepted quote deposits can now be settled automatically by verified Stripe/PayPal provider events instead of staff-only manual confirmation. Stripe Checkout metadata, PayPal webhook verification, and the private quote-payment PayPal return capture all update the same `quote_deposit_payment_requests` table.

## Completed in Build 181

1. Added shared quote deposit settlement helper at `functions/api/_lib/quote-deposit-payments.js`.
2. Updated `/api/stripe/webhook` to verify raw Stripe signatures and mark matching quote deposit requests paid when `quote_deposit_payment_request_id` metadata is present.
3. Added `/api/paypal/webhook` to verify PayPal webhook signatures using `PAYPAL_WEBHOOK_ID` and settle completed capture/sale events.
4. Added `/api/paypal/capture-quote-deposit` so the private customer payment page can capture approved PayPal orders and settle the same deposit request.
5. Extended quote deposit request creation so staff can choose `stripe`, `paypal`, or `manual`.
6. Added Build 181 SQL/schema tracking for provider audit fields and PayPal provider support.

## Next roadmap items

1. Add provider webhook event history with retry/replay and failure reason display.
2. Add customer receipt/booking-confirmation delivery after verified deposit.
3. Add refund/partial refund tracking connected to quote deposit requests.
4. Add final-balance invoice/payment request after job completion.
5. Add accounting journal candidates for deposits, HST, processor fees, and revenue recognition.

# Build 178 update — Status Saves, Saved Price Reviews, Public Content Rendering & Privacy Badges

**Current build:** Build 178  
**Date:** 2026-05-25

Build 178 closes the next operational gaps after Build 177 by adding conversion-draft status saving, saved final price reviews, live rendering of Admin Content Center blocks on public pages, media privacy readiness badges in the Social Queue/App Management flow, and deeper local SEO proof recommendations. No new DDL is required; this pass depends on the Build 175 content/conversion tables and Build 177 final-price review fields.

## Completed in Build 178

1. Added `/api/admin/lead_conversion_status_save` so staff can move conversion drafts through `draft_booking`, `needs_review`, `ready_to_book`, `converted`, and `closed`.
2. Added `/api/admin/lead_conversion_price_review_save` so catalog reconciliation results can be saved before booking creation.
3. Updated `/admin-conversions.html` with Save Status and Save Price Review controls.
4. Added `/assets/public-content-blocks.js` and live public content mounts on Home, Services, Specials, Fleet, Maintenance, and Help pages.
5. Added Social Queue media privacy readiness badges using the existing media privacy summary endpoint.
6. Expanded local SEO proof reporting with concrete next-proof recommendations by town/service.
7. Added a Build 178 release guard and no-DDL SQL note.

## Updated completion status after Build 178

| Area | Status | Build 178 notes |
| --- | --- | --- |
| Conversion draft status workflow | Stronger foundation | Status can now be saved without creating a booking. |
| Final price reconciliation | Stronger foundation | Reconciliation can be saved before booking creation. |
| Admin Content public rendering | Added foundation | DB/fallback content blocks can now render on public pages. |
| Media privacy before reuse | Stronger foundation | Social/Admin flows now show privacy readiness reminders. |
| Local SEO proof reporting | Stronger foundation | Report now recommends next town/service proof to create. |

## Remaining priority after Build 178

1. Add a fuller conversion-draft detail page with audit history.
2. Render saved content blocks into exact page sections rather than only generic cards.
3. Add admin approval gates that block publish/API actions unless consent and privacy statuses are approved.
4. Turn proof recommendations into assignable content/media tasks.
5. Add quote/proposal email delivery and customer acceptance tracking.

---

# Build 177 update — Conversion Review Queue, Price Reconciliation & Local Proof Reporting

**Updated:** 2026-05-25  
**Current build:** Build 177  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 177 closes the next workflow gap after Build 176 by adding a dedicated `/admin-conversions.html` review queue. Staff can now review all lead conversion drafts in one place, reconcile final package/add-on/travel/HST pricing from the pricing catalog, confirm the required booking fields, and create a live booking only after the draft is ready. Build 177 also adds local SEO proof reporting that counts only privacy-approved before/after examples by town and service.

## Completed in Build 177

1. Added `/admin-conversions.html` and `/admin-conversions/` as a protected conversion-draft review queue.
2. Added `/api/admin/lead_conversion_price_reconcile` for catalog-backed package/add-on/travel/HST/deposit review before booking creation.
3. Added `/api/admin/local_seo_proof_report` for privacy-approved town/service proof coverage reporting.
4. Updated Admin Analytics with a **Local SEO proof coverage** card.
5. Updated public Gallery cards with clearer consent/privacy badges.
6. Added optional final-price review fields to `public.lead_conversion_drafts` via `sql/2026-05-25_build177_conversion_review_price_local_proof.sql`.
7. Updated Admin Dashboard, Admin Menu, Admin Shell, and Admin Leads access paths so the Conversion Queue is easy to find.
8. Updated `SUPABASE_SCHEMA.sql`, `DATABASE_STRUCTURE_CURRENT.md`, and release guards.

## Updated completion status after Build 177

| COMPETETIVE.md area | Current status | Build 177 notes |
| --- | --- | --- |
| Lead → booking workflow | Stronger foundation | Dedicated review queue now separates draft review from the lead card UI. |
| Final price reconciliation | Added foundation | Catalog-backed package/add-on/travel/HST review is available before creating a real booking. |
| Quote/booking status workflow | Improved | Conversion drafts can be filtered/reviewed before becoming live booking rows. |
| Admin-managed content | Partial but improved | FAQ and reusable content blocks exist; page-specific live rendering remains next. |
| Service/town proof reporting | Added foundation | Analytics now reports approved proof coverage by target town/service. |
| Media privacy enforcement | Improved | Public Gallery shows consent/privacy badges and still filters non-approved media. |
| Conversion analytics | Improved | Lead/quote summary exists and local proof coverage was added to Admin Analytics. |

## Remaining competitive gap priority after Build 177

1. Save final price reconciliation payloads directly from `/admin-conversions.html` before booking creation.
2. Add a dedicated conversion-draft status update endpoint for `needs_review`, `ready_to_book`, `converted`, and `closed`.
3. Add visible privacy badges beside every admin gallery/social publish action, not only public gallery and App Management warnings.
4. Render Admin Content Center blocks live on public Specials, service, homepage, fleet, maintenance, and Help pages.
5. Add town/service proof dashboards that recommend the next local page or gallery item to create.
6. Add customer-facing quote/proposal send and acceptance tracking.

---

# Build 174 update — Admin Leads quote/proposal drafts

**Updated:** 2026-05-24  
**Current build:** Build 174  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 174 completes the next open competitive-matrix item after the quote starter: staff can now save generated quote starter text as a persistent quote/proposal draft from `/admin-leads.html`. This moves the workflow from copy-only follow-up toward a real quote pipeline while staying fallback-safe if the new table has not been applied yet.

## Completed in Build 174

1. Added `/api/admin/quote_proposal_drafts_save` for staff-protected quote/proposal draft creation and updates.
2. Added `/api/admin/quote_proposal_drafts_list` for staff-protected draft lookup by lead, booking, status, search, or id.
3. Updated `/admin-leads.html` and `/admin-leads/index.html` with **Save quote draft** and **Load drafts** actions on each public lead.
4. Added persistent draft display directly under the lead card so staff can see saved follow-up text before contacting a customer.
5. Added migration-safe fallback messages when the new draft table has not been applied yet.
6. Added SQL migration `sql/2026-05-24_build174_quote_proposal_drafts.sql`.
7. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the quote/proposal draft table plan.
8. Added release guard `scripts/quote_proposal_drafts_build174_check.py` and wired it into `scripts/release_check.py`.
9. Re-ran Cloudflare Functions checks, one-H1 validation, and release checks.

## Active next steps after Build 174

1. Apply `sql/2026-05-24_build174_quote_proposal_drafts.sql` after the Build 167/168 lead SQL.
2. Browser-test `/admin-leads.html` by building a quote starter, saving it as a draft, and loading it again.
3. Add draft status controls for `needs_review`, `ready_to_send`, `sent`, `accepted`, and `declined`.
4. Add one-click lead → draft booking/quote conversion.
5. Add package/add-on price suggestions from the live pricing catalog.
6. Extend Admin Content Center to specials, service blurbs, homepage cards, and help articles.
7. Add service/town-aware proof filtering and media privacy enforcement before public gallery/social use.

---
# Build 173 update — Admin Content Center and Help Articles access pass

**Updated:** 2026-05-24  
**Current build:** Build 173  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 173 continues from the Build 172 FAQ/content-access foundation by adding a protected Admin Content Center and expanding the public Help Articles page. FAQ entries now have an admin editor path (`/admin-content.html`) using the existing Build 172 `public_faq_entries` table, and the public site now exposes Help Articles from the main navigation, footer, FAQ access section, and homepage CTA path.

## Completed in Build 173

1. Added `/admin-content.html` and `/admin-content/index.html`.
2. Added protected FAQ editor APIs: `/api/admin/content_faqs_list` and `/api/admin/content_faqs_save`.
3. Updated Admin Dashboard, shared admin menu, and staff page-access helpers so Content Center is accessible to admins, promo managers, and staff managers.
4. Expanded `/blog` and `/blog/index.html` from a thin placeholder into a Help Articles hub with article cards, quick paths, ItemList schema, and customer-facing guidance.
5. Added public Help link to the main navigation and footer through `assets/chrome.js`.
6. Added homepage and FAQ access links to Help Articles.
7. Added `sql/2026-05-24_build173_admin_content_faq_editor_no_ddl_note.sql`.
8. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with the Build 173 no-DDL schema bridge.
9. Added `scripts/admin_content_build173_check.py` and wired it into `scripts/release_check.py`.
10. Re-ran the one-H1 check and release checks.

## Active next steps after Build 173

1. Apply the Build 172 FAQ SQL before using live FAQ saves from Admin Content Center.
2. Browser-test `/admin-content.html` after staff login.
3. Add persistent quote/proposal drafts from the Build 171 quote starter.
4. Add one-click lead → draft booking/quote conversion.
5. Extend Admin Content Center to Specials, service blurbs, education/help articles, and homepage support blocks.
6. Add service/town-aware proof filtering for gallery and recent work.
7. Enforce media privacy approval before any gallery/social use.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 172 update — Public FAQ content and page-access cleanup

**Updated:** 2026-05-24  
**Current build:** Build 172  
**Primary source of truth:** `DEVELOPMENT_ROADMAP.md`

Build 172 answers the open question about new pages: `/faq` is now a real public help page with content, FAQPage/Breadcrumb schema, search/filter behaviour, clear CTA paths, and links from the top navigation, footer, homepage, Services, Pricing, Contact, and sitemap. This pass also starts moving duplicated FAQ/help copy toward DB-managed content through `public_faq_entries` and `/api/public_faqs`, while keeping static fallback content so the page works before the SQL is applied.

## Completed in Build 172

1. Added `/faq.html` and `/faq/index.html` with mobile-detailing FAQ content for booking, service areas, pricing, photos, privacy, gift cards, fleet, and maintenance.
2. Added visible explanation of how FAQ and newer public pages are accessed.
3. Added FAQPage JSON-LD and BreadcrumbList JSON-LD to the FAQ page.
4. Added `/api/public_faqs` with DB-first read and static fallback.
5. Added `data/site_faqs.json` as the static FAQ seed/fallback dataset.
6. Added SQL migration `sql/2026-05-24_build172_public_faq_content_foundation.sql` for `public.public_faq_entries`.
7. Added `/faq` to the public top navigation and footer, plus access links from homepage, Services, Pricing, and Contact.
8. Added FAQ/access CSS helpers to `assets/site.css`.
9. Added `/faq/` to `sitemap.xml`.
10. Updated schema notes in `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
11. Added release guard `scripts/public_faq_content_build172_check.py` and wired it into `scripts/release_check.py`.
12. Continued one-H1, local wording, title/meta clarity, fallback handling, and public conversion-path discipline.

## Next several steps after Build 172

1. Deploy Build 172 and open `/faq`, `/services`, `/pricing`, `/contact`, and `/` to confirm the new FAQ links are visible.
2. Apply `sql/2026-05-24_build172_public_faq_content_foundation.sql` after Build 167/168 lead migrations if FAQ content should be DB-managed.
3. Add an Admin Content screen for FAQ, specials, service blurbs, and education snippets.
4. Add persistent quote/proposal drafts from the Build 171 quote starter.
5. Add one-click lead → draft booking/quote conversion.
6. Add service/town proof filtering for Gallery and Recent Work.
7. Add media privacy eligibility enforcement for gallery/social publishing.
8. Keep updating `COMPETETIVE_COMPLETION_MATRIX.md` until the remaining items are admin-managed rather than static.

---
# Build 171 update — Admin lead quote starter and service-key fallback polish

**Updated:** 2026-05-24  
**Current build:** Build 171  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 171 completes the next practical step after Admin Leads: staff can now generate a copy-ready quote starter from a public lead without waiting for the full quote-builder/booking-conversion system. This helps turn fleet, maintenance, specials, gift-card, general, and photo-estimate leads into consistent staff-reviewed follow-up text while keeping privacy warnings visible.

## Completed in Build 171

1. Added staff-protected `/api/admin/lead_quote_preview`.
2. Added **Build quote starter** action to `/admin-leads.html` and `/admin-leads/index.html`.
3. Quote starter reads `public_inquiry_leads` plus linked `photo_estimate_uploads`.
4. Quote starter includes contact details, vehicle/cadence clues, customer message, photo links, linked upload summaries, privacy warnings, suggested next step, and staff checklist.
5. Added copy-to-clipboard support with a manual Ctrl+C fallback.
6. Added topic-aware recommendations for fleet, maintenance, gift cards, specials, photo estimates, condition-heavy interiors, and paint/coating work.
7. Kept the workflow no-DDL and fallback-safe before optional Build 168 upload note columns are present.
8. Tightened Admin Leads/upload API configuration checks so Supabase service-key aliases match the Build 169 auth/session fallback work.
9. Added `sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql`.
10. Added `scripts/lead_quote_preview_build171_check.py` and wired it into `scripts/release_check.py`.
11. Re-ran Cloudflare Functions syntax/static checks, Build 160–171 release guards, and one-H1 validation.
12. Updated all Markdown handoff/planning files and `SUPABASE_SCHEMA.sql`.

## Next several steps after Build 171

1. Deploy this build and test `/admin-leads.html` with one lead that has no upload and one lead with linked uploads.
2. Apply Build 167 SQL and Build 168 SQL if not already applied.
3. Add one-click **lead → draft booking** creation.
4. Add persistent quote/proposal drafts so the quote starter can be saved, revised, and sent later.
5. Add package/add-on price suggestions from the live pricing catalog into the quote starter.
6. Add analytics events for quote starter generation, copy action, lead status change, and lead conversion.
7. Add service/town-aware proof filtering for gallery and recent work.
8. Move specials, FAQs, service copy, and education snippets into DB-managed admin content.
9. Enforce gallery/social eligibility from consent + privacy review + blur/crop completion.
10. Continue CSS drift, one-H1, title/meta, local wording, Cloudflare import, schema, and fallback checks every pass.

---
# Build 168 update — Admin Leads and photo estimate review

**Updated:** 2026-05-23  
**Current build:** Build 168  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 168 completes the next immediately-actionable items from `COMPETETIVE_COMPLETION_MATRIX.md`: the public lead and direct-upload foundations from Build 167 now have an internal Admin Leads screen, staff review endpoints, privacy-status controls, and release checks. This closes the largest remaining “capture exists but staff cannot triage it” gap without waiting for a full CMS or quote-builder rebuild.

## Completed in Build 168

1. Added protected `/admin-leads.html` and `/admin-leads/index.html`.
2. Added a dashboard card and top-nav link for Leads & Photo Estimates.
3. Added `admin-leads` permission handling to `assets/admin-auth.js` using the existing booking-management permission model.
4. Added `Leads & Estimates` to the shared admin menu.
5. Added `/api/admin/public_inquiry_leads_list` to search/filter structured public leads.
6. Added `/api/admin/public_inquiry_leads_save` to update lead status, staff notes, and converted booking UUID.
7. Added `/api/admin/photo_estimate_uploads_list` to search/filter direct quote-photo/video uploads.
8. Added `/api/admin/photo_estimate_uploads_save` to update upload status, privacy status, lead/booking links, and staff/privacy notes.
9. Added fallback-safe migration hints when Build 167/168 SQL has not been applied.
10. Added SQL migration `2026-05-23_build168_admin_leads_photo_review.sql`.
11. Extended `photo_estimate_uploads` planning schema with `staff_note`, `privacy_note`, `reviewed_at`, and `reviewed_by_staff_user_id`.
12. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` with Build 168 schema notes.
13. Updated `COMPETETIVE_COMPLETION_MATRIX.md` so Admin Leads, lead conversion notes, and photo upload review are no longer listed as completely missing.
14. Added release guard `scripts/admin_leads_build168_check.py`.
15. Wired the Build 168 guard into `scripts/release_check.py`.
16. Re-ran Cloudflare Functions static checks, Build 160-168 release guards, and one-H1 validation.

## Next several steps after Build 168

1. Apply Build 167 SQL, then apply Build 168 SQL in Supabase.
2. Open `/admin-leads.html` after deploy and confirm public leads load for staff with booking-management access.
3. Submit one test fleet form and one maintenance form, then mark each through new → contacted → quoted/converted.
4. If enabling direct uploads, configure `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`, bucket env vars, public media base URL, and upload-size limits.
5. Add a true quote-builder action that creates a quote/package recommendation from lead details, photo links/uploads, condition flags, and add-ons.
6. Add a one-click conversion action from public lead → draft booking or draft quote.
7. Add service/town-aware proof filtering for gallery and recent work.
8. Move specials, service FAQ, education snippets, and service/package public copy into DB-managed admin content.
9. Enforce gallery/social publishing eligibility from customer consent + upload/media privacy status + blur/crop completion.
10. Add analytics events for public lead submit, Admin Leads status changes, upload review actions, and quote conversion.
11. Continue CSS drift, one-H1, title/meta, local wording, Cloudflare imports, and fallback checks every pass.

---

# Build 167 update — COMPETETIVE completion matrix follow-up

**Updated:** 2026-05-23  
**Current build:** Build 167  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 167 attempts to complete the remaining immediately-actionable items in `COMPETETIVE_COMPLETION_MATRIX.md`. The pass adds a direct photo/video estimate upload foundation, structured public lead capture for fleet and maintenance, FAQPage/Breadcrumb schema foundations, and a formal release guard so these competitor-matrix improvements stay visible.

## Completed in Build 167

1. Re-read `COMPETETIVE_COMPLETION_MATRIX.md`, `DEVELOPMENT_ROADMAP.md`, and `KNOWN_GAPS_AND_RISKS.md`.
2. Kept this file as the source of truth.
3. Added public endpoint `/api/public_lead_submit`.
4. Added public endpoint `/api/public_photo_estimate_upload_url`.
5. Added optional direct upload UI to Booking Step 4.
6. Added upload status/fallback messaging when direct upload is not enabled.
7. Added automatic append of uploaded estimate media links into `photo_estimate_links`.
8. Added structured fleet quote form to `/fleet`.
9. Added structured fleet quote form to `/fleet/index.html`.
10. Added structured maintenance interest form to `/maintenance`.
11. Added structured maintenance interest form to `/maintenance/index.html`.
12. Added FAQPage schema foundations to competitor-route public pages.
13. Added BreadcrumbList schema foundations to competitor-route public pages and starter education articles.
14. Added SQL migration `2026-05-23_build167_competetive_matrix_leads_upload_schema.sql`.
15. Added `public_inquiry_leads` schema for fleet/maintenance/public lead capture.
16. Added `photo_estimate_uploads` schema for optional public estimate-upload auditing.
17. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with new completion status.
18. Updated `KNOWN_GAPS_AND_RISKS.md` with Build 167 risks and reduced gaps.
19. Updated schema documentation and handoff docs.
20. Added `scripts/competetive_matrix_build167_check.py` and wired it into release checks.
21. Re-ran release checks, Cloudflare Functions checks, inline-script checks, and one-H1 validation.

## Next several steps after Build 167

1. Run the Build 167 SQL migration in Supabase.
2. Decide whether to enable direct uploads by setting `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`.
3. Configure `PHOTO_ESTIMATE_BUCKET` / `JOB_MEDIA_BUCKET` and a safe public media base URL if direct uploads should return public links.
4. Add an Admin Leads screen for `public_inquiry_leads`.
5. Add staff actions to convert a public lead into a booking, quote, or follow-up task.
6. Add Admin Photo Estimate Uploads review for `photo_estimate_uploads`.
7. Link direct uploaded media to booking intake after checkout when customer details match.
8. Add DB-managed editing for services, specials, FAQs, and education snippets.
9. Add service/town-aware proof filtering for gallery and recent work.
10. Add quote-builder workflow from booking intake, photo links/uploads, condition flags, package recommendation, and add-ons.
11. Add media-level privacy records for every uploaded or progress photo/video.
12. Enforce gallery/social publishing eligibility from consent, privacy approval, and blur/crop completion.
13. Add analytics for lead form submit, upload start, upload success/failure, and quote conversion.
14. Add more local education pages from the competitor roadmap.
15. Continue CSS drift, one-H1, title/meta, Cloudflare import, and fallback checks every pass.

---

# Build 166 update — COMPETETIVE.md completion pass

**Updated:** 2026-05-23  
**Current build:** Build 166  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 166 completes a broad public-facing pass against `COMPETETIVE.md`. It adds missing customer entry routes for specials, gift cards, fleet/commercial work, maintenance plans, and education articles; expands the add-on catalog; adds a global sticky conversion CTA; updates the Services hub and homepage route choices; and documents the remaining backend/admin work in `COMPETETIVE_COMPLETION_MATRIX.md`.

## Completed in Build 166

1. Re-read `COMPETETIVE.md`, `DEVELOPMENT_ROADMAP.md`, and `KNOWN_GAPS_AND_RISKS.md`.
2. Kept this file as the implementation source of truth.
3. Added `COMPETETIVE_COMPLETION_MATRIX.md`.
4. Updated `COMPETETIVE.md` with a Build 166 completion-pass note.
5. Synced `COMPETITOR.md` and `COMPETETOR.md` aliases.
6. Added a global sticky conversion CTA bar through `assets/chrome.js`.
7. Updated default nav links to include Specials, Gift Cards, and Fleet.
8. Added public `/specials` and `/specials/index.html`.
9. Added public `/gift-cards` and `/gift-cards/index.html`.
10. Added public `/fleet` and `/fleet/index.html`.
11. Added public `/maintenance` and `/maintenance/index.html`.
12. Added public `/blog` help hub.
13. Added education pages for Ontario road salt cleanup, pet hair removal, ceramic coating vs wax, paint correction basics, and preparing for mobile detailing.
14. Expanded bundled add-ons in the pricing catalog and Functions fallback catalog.
15. Synced catalog JSON in `/data` and `/functions/api/data`.
16. Updated Services with a full competitor-aligned service hub.
17. Updated Homepage with a clearer choose-the-easiest-path CTA section.
18. Updated sitemap entries for the new public routes.
19. Added `scripts/competetive_completion_check.py`.
20. Added the new guard to `scripts/release_check.py`.
21. Added Build 166 no-DDL SQL note and schema documentation.
22. Re-ran release checks and one-H1 validation.

## Next several steps after Build 166

1. Deploy Build 166 and verify the new routes: `/specials`, `/gift-cards`, `/fleet`, `/maintenance`, and `/blog`.
2. Add direct customer file upload to complement photo/media share links.
3. Add a quote-builder screen that turns reviewed photo estimates into package/add-on proposals.
4. Add service/town-aware proof filters for gallery and recent work.
5. Add media-level privacy records for each job photo/video.
6. Enforce gallery/social eligibility from consent, privacy status, and blur/crop completion.
7. Move specials, gift cards, service FAQs, and education snippets into DB/admin-managed content.
8. Add FAQPage and BreadcrumbList schema generation for public service/help pages.
9. Add structured fleet and maintenance lead forms.
10. Add analytics for sticky CTA clicks, photo-estimate starts, special-page visits, and quote-first conversion.
11. Add more education articles from `COMPETETIVE.md`, including coffee stains, UV protection, and how often to detail.
12. Add real review/proof mapping when service/town proof items are approved.
13. Continue CSS drift checks on Services, Booking, Contact, Admin Booking, Admin Social, and new public pages.
14. Continue one-H1/title/meta/local wording checks every pass.
15. Continue Cloudflare deploy safety checks to avoid stale function/import problems.


---

# Build 165 update — Booking photo-estimate link capture

**Updated:** 2026-05-22  
**Current build:** Build 165  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 165 continues the conversion-path work from Builds 160–164. The public booking flow now lets customers paste photo/media share links before checkout, marks the booking as photo-estimate reviewable when links are present, stores the links directly when the Build 165 migration is applied, and still falls back to booking notes if the optional database column is not live yet. Admin Booking now surfaces the submitted links in the intake/media consent panel so staff can open them while quoting or privacy-reviewing the job.

## Completed in Build 165

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added a customer-facing `Photo estimate links` field to Booking Step 4.
4. Added duplicate-safe parsing for pasted Google Drive, Dropbox, iCloud, Facebook, or other media links.
5. Auto-checks the photo-estimate request flag when customers paste photo/media links.
6. Added photo-estimate link count to the final booking summary.
7. Sends `photo_estimate_links` through checkout.
8. Checkout now treats link submissions as photo-estimate requests even when the checkbox was missed.
9. Checkout stores the links in booking notes for fallback-safe staff review.
10. Checkout writes `photo_estimate_links` directly when the optional Build 165 column is live.
11. Added `photo_estimate_links` to the optional booking-field fallback list so checkout does not break before migration.
12. Added `photo_estimate_links` to admin booking-list optional selects.
13. Admin Booking intake review panel now shows submitted photo/media links as clickable staff review links.
14. Added Build 165 SQL migration for `bookings.photo_estimate_links`.
15. Added a GIN index for future reporting/filtering of photo-estimate link data.
16. Updated `SUPABASE_SCHEMA.sql`.
17. Added release guard `scripts/booking_photo_estimate_links_check.py`.
18. Added the new guard to `scripts/release_check.py`.
19. Re-ran SEO/H1, Cloudflare, social, conversion, booking-intake, and release checks.
20. Updated active Markdown files so Build 165 status and next steps are documented.

## Next several value-added steps after Build 165

1. Deploy Build 165 and apply SQL migrations in order: Build 162, Build 163, Build 164, then Build 165.
2. Confirm public booking saves photo-estimate links into notes before migration and into `photo_estimate_links` after migration.
3. Add a direct public upload flow for customers who do not want to use third-party share links.
4. Add staff quote-building actions that convert photo-estimate review into a proposed package/add-on set.
5. Add media-level privacy review records for each uploaded or linked job photo/video.
6. Enforce gallery/social eligibility from booking consent plus media-level privacy status.
7. Add Admin Booking filters for photo-estimate links present, quote needed, media review needed, and blur/crop needed.
8. Add customer notification templates for photo estimate received, quote ready, and media/privacy approval request.
9. Add approved-photo proof blocks to town/service landing pages.
10. Move more service FAQ/proof content into DB-managed admin content where possible.
11. Add analytics for photo-estimate link submissions and quote-first conversion rate.
12. Add abandoned booking recovery that references the selected package and quote-first intent without exposing private details.
13. Add optional customer portal upload/edit for estimate media after booking is created.
14. Add reminder workflow for staff when a photo-estimate request has not been reviewed within the target window.
15. Continue CSS drift checks on Booking, Admin Booking, Services, Contact, and Admin Social.
16. Continue one-H1 and local title/meta checks every pass.
17. Continue Cloudflare Pages Function import/syntax checks every pass.
18. Plan a clean/orphan branch refresh after deploy stability is confirmed so stale GitHub files cannot keep reappearing.
19. Keep `COMPETITOR_SANITY_CHECK.md` aligned with this roadmap after each conversion-path pass.
20. Keep `KNOWN_GAPS_AND_RISKS.md` focused on active risks and next decisions, not old completed build notes.

---

# Build 164 update — Admin booking intake review actions

**Updated:** 2026-05-22  
**Current build:** Build 164  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 164 continues the competitor/conversion-path work after Builds 160–163. Build 163 made booking condition, photo-estimate, and media-consent details visible to staff; Build 164 adds staff action controls so those details can be reviewed, marked, and documented from Admin Booking. The workflow is fallback-safe: if the optional direct columns are not migrated yet, the action is appended to booking notes instead of breaking the admin screen.

## Completed in Build 164

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added Admin Booking intake review controls for photo-estimate status.
4. Added Admin Booking intake review controls for condition-review status.
5. Added Admin Booking intake review controls for media/privacy status.
6. Added staff checkboxes for license plate review, face review, address/private-identifier review, blur/crop needed, and blur/crop complete.
7. Added a staff intake-review note field.
8. Added `set_intake_review` support to `/api/admin/booking_update`.
9. Synced the root compatibility route `/api/booking_update`.
10. Added allowed-value validation for photo, condition, and media/privacy statuses.
11. Added direct booking updates for review statuses and privacy flags when the Build 162/163/164 migrations are live.
12. Added direct booking updates for `intake_review_note`, `intake_reviewed_at`, and `intake_reviewed_by` when Build 164 migration is live.
13. Added fallback behavior that appends the review action to booking notes if optional intake columns are missing.
14. Added booking-event logging for staff intake review changes.
15. Added optional fields to the Admin Booking list select so saved review notes and review timestamps can display.
16. Synced `/admin-booking.html` and `/admin-booking/index.html`.
17. Added `sql/2026-05-22_build164_booking_intake_review_actions.sql`.
18. Updated `SUPABASE_SCHEMA.sql` with the Build 164 schema note.
19. Added `scripts/booking_intake_review_actions_check.py`.
20. Wired the Build 164 guard into `scripts/release_check.py`.

## Next several value-added steps after Build 164

1. Deploy Build 164 and confirm Admin Booking can save intake review status fields.
2. Apply SQL migrations in order: Build 162, Build 163, then Build 164.
3. Add real customer photo upload/lead capture before checkout so photo estimates can include customer images.
4. Add media-level privacy review actions on each uploaded job photo/video, not only at the booking level.
5. Enforce gallery/social eligibility from consent + media privacy status + blur/crop completion.
6. Add a staff “quote from photos” workflow that can convert a photo-estimate booking into a proposed package/add-on set.
7. Add customer notification templates for photo-estimate received, quote ready, and privacy/media approval request.
8. Move public service FAQs/proof blocks from scattered JSON/HTML into DB-managed admin content where possible.
9. Add proof filtering by service type, town, vehicle type, and consent/privacy status.
10. Add a gift-card/specials merchandising path after the booking conversion path is stable.
11. Add town/service landing-page proof blocks using only approved public media.
12. Add analytics for service chooser usage, condition-helper selections, quote-first starts, and booking conversions.
13. Add abandoned booking recovery that references the chosen package/condition flags without exposing private details.
14. Add booking-intake dashboard filters: photo estimate requested, needs condition review, needs media review, ready for quote.
15. Continue CSS drift checks on Booking, Admin Booking, Services, Contact, and Admin Social.
16. Continue one-H1 and local title/meta checks every pass.
17. Continue Cloudflare Pages Function import/syntax checks every pass.
18. Plan a clean/orphan branch refresh after deploy stability is confirmed so stale files cannot remain in GitHub.
19. Keep `COMPETITOR_SANITY_CHECK.md` aligned with this roadmap after each conversion-path pass.
20. Keep `KNOWN_GAPS_AND_RISKS.md` focused on active risks, not historical build notes.

---

# Build 163 update — Admin booking intake review and optional direct field storage

**Updated:** 2026-05-21  
**Current build:** Build 163  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 163 continues the Build 160–162 competitor conversion path. Build 162 helped customers explain vehicle condition and media-use preference during booking; Build 163 makes that information easier for staff to see and prepares direct database storage when the optional migrations are applied. The admin booking screen now has a dedicated estimate-intake and media-consent review panel instead of forcing staff to hunt through general booking notes.

## Completed in Build 163

1. Reviewed `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Updated checkout to write condition helper flags into `bookings.condition_flags` when the Build 162 migration is available.
4. Updated checkout to write `condition_recommendation` when the field is available.
5. Updated checkout to write `photo_estimate_requested` when the field is available.
6. Updated checkout to write `media_consent_preference` when the field is available.
7. Added checkout-safe fallback so bookings still succeed if the optional intake columns have not been migrated yet.
8. Added `photo_estimate_status`, `condition_review_status`, and `media_privacy_status` planning fields.
9. Added privacy-review planning fields for plate, face, address, blur/crop needed, and blur/crop complete.
10. Added `sql/2026-05-21_build163_booking_intake_admin_review.sql`.
11. Updated the admin bookings API to try the new intake/privacy fields first.
12. Added admin bookings API fallback to the older select list if the optional columns are not deployed yet.
13. Added a new Admin Booking panel: `Estimate intake & media consent`.
14. The new panel displays photo-estimate request status.
15. The new panel displays condition-helper flags and recommendation summary.
16. The new panel displays customer media-use preference.
17. The new panel displays privacy-review status hints for plates, faces, addresses, and blur/crop.
18. The admin panel can read either direct DB fields or the Build 162 note fallback.
19. Added `scripts/booking_intake_admin_review_check.py`.
20. Wired the Build 163 guard into `scripts/release_check.py`.

## Next several value-added steps after Build 163

1. Deploy Build 163 and confirm Admin Booking shows the estimate-intake panel on mobile and desktop.
2. Run the Build 162 migration, then run `sql/2026-05-21_build163_booking_intake_admin_review.sql`.
3. Add admin edit controls so staff can update photo-estimate status, condition-review status, and media-privacy status.
4. Add true customer photo upload/lead capture before checkout, using Supabase Storage signed upload URLs.
5. Add media privacy review actions directly to each job photo/video: plate reviewed, face reviewed, address reviewed, blur/crop needed, blur/crop complete.
6. Add a gallery/social eligibility filter that only shows media with customer permission and completed privacy review.
7. Add a photo-estimate lead inbox so incomplete bookings with uploaded media can become quotes or draft bookings.
8. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, Services, and Pricing.
9. Add town/service-aware proof filtering for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Oxford County, and Norfolk County.
10. Add admin-managed specials/promos for salt cleanup, multi-vehicle, senior-friendly, work truck/fleet, and headlight refresh.
11. Add stronger service-specific gift card cards for Interior Detail, Full Detail, and custom amounts.
12. Move high-change service, add-on, specials, FAQ, proof, and testimonial content toward DB-first admin-managed records.
13. Add Search Console and Google Business Profile tracking notes into admin analytics.
14. Add social-platform preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and manual copy/paste.
15. Add scheduled social publish worker/retry controls after platform credentials and approvals are ready.
16. Add caption/media scoring for Google Business Profile-style local proof posts.
17. Add accessibility review for the booking condition helper and Admin Booking intake panel.
18. Add conversion tracking events for photo-estimate requests, condition-helper use, and booking completion.
19. Prepare a clean/orphan branch replacement after deploy stability so old GitHub web-upload leftovers are removed.
20. Keep this roadmap as the source of truth and keep older roadmap/gap files as historical support only.

---

# Build 162 update — Condition-based booking helper, photo-estimate intent, and media-consent preference

**Updated:** 2026-05-21  
**Current build:** Build 162  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 162 continues the Build 160/161 competitor sanity direction. The public booking flow now moves beyond static package aliases by adding a condition-based booking helper. Customers can select what they see — pet hair, salt, odour, stains, paint swirls, protection questions, headlights, work trucks, or photo-quote needs — and the page suggests a package, eligible add-ons, and staff-review notes. The same pass adds photo-estimate intent capture and a clear media-consent preference so estimate photos do not become public/social proof without permission and staff privacy review.

## Completed in Build 162

1. Reviewed `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and the Build 160/161 competitor conversion priorities before implementation.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Added a Booking Step 2 condition-based booking helper beneath the quick service chooser.
4. Added condition flags for maintained interior, maintained exterior, pet hair, salt stains, odour, stains/shampoo, paint swirls, protection, headlights, full reset, work truck/fleet, and photo quote.
5. Added `Recommend package` and `Clear helper` controls.
6. Added recommendation logic that maps interior-heavy conditions to Interior Detail, exterior/paint concerns to Exterior Detail, maintained-only cases to Basic Detail or Premium Wash, and full-reset cases to Complete Detail.
7. Added optional add-on suggestions for paint/protection conditions where existing add-ons allow it.
8. Added recommendation output explaining the selected flags, package, add-ons, and staff-review notes.
9. Appended condition helper details into the customer notes field so staff can see why a package was suggested.
10. Added photo-estimate intent capture in Booking Step 4.
11. Added customer media-consent preference options: estimate only, ask first, or possible public use after staff privacy review.
12. Added booking analytics events for condition helper apply/clear, photo-estimate request, and media-consent preference.
13. Updated checkout payload handling to preserve customer notes, condition flags, condition recommendation, photo-estimate request, and media-consent preference in booking notes.
14. Kept checkout backwards-compatible by writing the new public-intake details into existing notes even before the optional SQL migration is applied.
15. Added optional DB planning fields for direct storage of condition flags, recommendation, photo-estimate request, and media-consent preference.
16. Added `sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql`.
17. Updated `SUPABASE_SCHEMA.sql` with Build 162 schema-sync notes.
18. Added `scripts/booking_condition_recommender_check.py`.
19. Wired the new Build 162 guard into `scripts/release_check.py`.
20. Synced `/book.html` and `/book/index.html`, and updated Markdown docs and handoff notes.

## Next several value-added steps after Build 162

1. Deploy Build 162 and smoke-test the Booking Step 2 condition helper on mobile and desktop.
2. Run `sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql` after confirming prior migrations are applied.
3. Update checkout/booking insert logic to write the new condition and media-consent fields directly once the migration is live.
4. Add an admin booking-detail panel that displays condition helper flags, recommendation summary, photo-estimate status, and media-consent preference separately from general notes.
5. Add a customer-facing photo upload/lead form that stores estimate media before checkout, not just a photo link.
6. Add staff privacy workflow fields for plate reviewed, face reviewed, address reviewed, blur/crop needed, and blur/crop complete.
7. Add public gallery/social eligibility filters that only allow consented and privacy-reviewed media.
8. Add service-page FAQ blocks for Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
9. Add proof/recent-work filtering by town and service so Oxford/Norfolk pages can show more relevant examples.
10. Add admin-managed specials cards for seasonal salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
11. Add service-specific gift-card merchandising for Interior Detail, Full Detail, and custom amounts.
12. Move high-change service, add-on, specials, FAQ, and proof content toward DB-first admin-managed records.
13. Add Search Console and Google Business Profile reporting notes to admin analytics.
14. Add social performance entry/reporting using `social_post_metrics_snapshots`.
15. Add platform preview cards in Admin Social Queue for Facebook, Instagram, X, TikTok, Google Business Profile, and manual copy/paste.
16. Add scheduled publish worker/retry rules for planned social posts once platform credentials and approvals are ready.
17. Improve Contact page estimate handling so photo-estimate inquiries can become draft bookings or leads.
18. Add accessibility review for the new recommender chips and booking step controls.
19. Prepare a clean/orphan branch replacement after deploy stability so stale GitHub web-upload leftovers are removed permanently.
20. Keep `DEVELOPMENT_ROADMAP.md` as the source of truth and keep older roadmap files as history/reference only.

---

# Build 161 update — Conversion path service chooser and photo-estimate guidance

**Updated:** 2026-05-21  
**Current build:** Build 161  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`

Build 161 continues the competitor sanity-check direction from Build 160. The focus is not a new back-office module; it is the public conversion path. Visitors now get clearer package aliases, a Booking Step 2 service chooser, and stronger photo-estimate guidance on Booking and Contact while the existing pricing codes remain stable for admin, checkout, and data compatibility.

## Completed in Build 161

1. Reviewed `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETITOR_SANITY_CHECK.md` before continuing.
2. Kept `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
3. Recreated `COMPETITOR.md` and `COMPETETOR.md` aliases that were missing from the uploaded ZIP.
4. Added customer-facing package aliases to the pricing catalog without changing stable package codes.
5. Added `display_alias`, `customer_goal`, `service_level`, `best_for`, `recommendation_tags`, `photo_estimate_recommended`, and `chooser_prompt` metadata to each package.
6. Synced enriched package metadata into `data/rosie_services_pricing_and_packages.json`.
7. Synced enriched package metadata into `functions/api/data/rosie_services_pricing_and_packages.json`.
8. Regenerated the inline `FALLBACK_CATALOG` in `functions/api/_lib/pricing-catalog.js` so DB fallback responses include the new metadata.
9. Added a booking-page service chooser to Step 2.
10. Added quick buttons for exterior wash, interior refresh, interior detail, full detail, exterior detail, and photo-estimate notes.
11. Added package-card display of aliases and customer goals in the booking flow.
12. Added a Step 4 photo-estimate checklist for condition photos.
13. Added analytics events for package recommendation clicks and photo-estimate jumps.
14. Added a Contact-page photo-estimate panel with an email CTA and booking CTA.
15. Synced root and folder copies for `/book`, `/contact`, and `/services`.
16. Added `scripts/conversion_path_check.py` to protect the competitor-aligned conversion path.
17. Wired the new conversion-path check into `scripts/release_check.py`.
18. Added a Build 161 no-DDL SQL note.
19. Updated `SUPABASE_SCHEMA.sql` with Build 161 no-schema-change notes.
20. Re-ran release, Cloudflare, social workflow, competitor roadmap, conversion path, inline script, and SEO/H1 checks.


## Next 20 value-added steps after Build 161

1. Deploy Build 161 and confirm the Cloudflare Pages build stays clean.
2. Smoke-test Booking Step 2 on mobile and desktop to confirm the chooser buttons select the expected packages.
3. Smoke-test Booking Step 4 to confirm the photo-estimate checklist reads well on mobile.
4. Apply any pending SQL migrations through Build 159 if they are not already applied.
5. Copy the enriched package metadata into the DB-managed `app_management_settings.pricing_catalog` once the live DB catalog is updated.
6. Add a condition-based recommendation engine using vehicle size, interior/exterior concern, pet hair, odour, salt, paint condition, and quote/photo flags.
7. Add a small public “send photos” form or uploader that can attach estimate media to a lead or draft booking.
8. Add customer-facing consent capture for public gallery and social before/after use.
9. Add media privacy fields for plate reviewed, face reviewed, address reviewed, blur/crop required, and blur/crop complete.
10. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
11. Add admin-managed specials cards for salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
12. Improve gift-card merchandising with Interior Detail, Full Detail, and custom amount gift-card cards.
13. Add proof/recent-work filtering by service and town.
14. Add admin placement controls for reviews and recent work on service/town pages.
15. Start moving high-change service/add-on/specials/FAQ/proof content toward DB-first admin-managed records.
16. Add Search Console and Google Business Profile reporting notes to admin analytics.
17. Add social performance entry and reporting using `social_post_metrics_snapshots`.
18. Add platform preview cards in Admin Social Queue.
19. Prepare a clean/orphan branch replacement after deploy stability so old GitHub web-upload leftovers are removed.
20. Keep using `DEVELOPMENT_ROADMAP.md` as the source of truth and keep older roadmap files as history/reference only.


---

# Build 160 update — Competitor sanity check and roadmap reset

**Updated:** 2026-05-21  
**Current build:** Build 160  
**Primary source of truth:** This file, `DEVELOPMENT_ROADMAP.md`  
**Competitor/service source reviewed:** `COMPETETIVE.md`

Build 160 pauses feature expansion long enough to sanity-check the current Rosie Dazzlers website/app against the competitor/service roadmap. The conclusion is that the project already has a strong technical foundation — local pages, service pages, booking/pricing, gallery/recent work, admin workflows, social queue, accounting/admin systems, image/media tooling, and release checks — but the public conversion path still needs to be simplified so visitors can choose the right detail, send photos, see proof, and book or request a quote with less confusion.

## Build 160 competitor sanity check — current state vs target

| Competitor roadmap target | Current website/app state | Status | Next action |
| --- | --- | --- | --- |
| Clear local homepage hero and local wording | Homepage targets Oxford/Norfolk and major towns. | Strong | Keep tuning local wording and proof placement each pass. |
| Sticky CTAs: Book, Quote, Call/Text, Send Photos | Book CTAs exist; photo-estimate and call/text CTAs need stronger repeated placement. | Partial | Add a consistent CTA strip to Services, Booking, Contact, and landing pages. |
| Strong service hub | Services page has packages, add-ons, proof, town pages, and links to special pages. | Partial | Add a decision guide and package recommender. Build 160 adds the Services decision guide. |
| Package selector | Pricing/booking has vehicle size, packages, add-ons, and availability. | Partial | Add condition-based recommendations and public photo estimate prompts. |
| Service package cards | Existing package codes are Premium Wash, Basic Detail, Complete Detail, Interior Detail, Exterior Detail. | Partial | Add customer-facing aliases/tier labels without breaking existing pricing codes. |
| Add-ons | Add-ons exist and many have dedicated pages/images. | Strong/partial | Add compatibility rules, FAQ, and stronger admin-managed copy. |
| Specials | Admin promos exist, but public specials are not yet competitor-level. | Partial | Add specials/promos content blocks for salt cleanup, multi-vehicle, senior-friendly, fleet, and headlight offers. |
| Gift cards | Gift system exists. | Partial | Add service-specific gift-card merchandising. |
| Reviews/proof/before-after | Gallery, recent work, review fallback, and local pages exist. | Partial | Filter proof by town/service and make placements admin-managed. |
| Ceramic coating education | Dedicated ceramic page exists. | Partial | Add richer FAQ, maintenance instructions, and prep expectations. |
| Paint correction education | Dedicated paint correction page exists. | Partial | Add staged service tier details, before/after proof, and FAQ. |
| Interior vs deep interior clarity | Packages exist, but public distinction can be clearer. | Partial | Add plain-language service chooser and booking recommender logic. |
| Admin service controls | Admin app controls exist across services/catalog/settings/social. | Partial | Move more static page copy and specials into DB-first admin-managed content. |
| Social proof/publishing | Social Queue has drafts, review gates, templates, scheduling, duplicate warnings, and API/webhook attempts. | Strong/partial | Add consent capture, media privacy status, platform previews, and metrics. |
| Local SEO reporting | SEO/H1 checks exist; Search Console/GBP reporting not connected. | Partial | Add reporting notes and future dashboard hooks. |

## Completed in Build 160

1. Reviewed `COMPETETIVE.md` end-to-end as the desired website/app direction.
2. Compared the competitor/service roadmap against the current public pages, admin pages, data files, and social workflow.
3. Classified each major competitor target as strong, partial, or missing.
4. Identified the highest-conversion gap: visitors need a simpler “which service should we choose?” path before package cards.
5. Identified the highest-local-SEO gap: reviews/recent work/proof should become town- and service-aware.
6. Identified the highest-admin gap: high-change service/add-on/specials copy still needs DB-first management.
7. Identified the highest-safety gap: consent capture and media privacy/blur status must be completed before public/social automation scales.
8. Identified the highest-repo-cleanup gap: GitHub web uploads can leave stale files, so a clean/orphan branch replacement remains important.
9. Added `COMPETITOR_SANITY_CHECK.md` as the full current-vs-target audit.
10. Added `COMPETITOR.md` and `COMPETETOR.md` aliases so future chats can find the competitor roadmap despite spelling variations.
11. Updated this `DEVELOPMENT_ROADMAP.md` as the implementation source of truth.
12. Updated `KNOWN_GAPS_AND_RISKS.md` with competitor-aligned remaining risks.
13. Updated `CURRENT_IMPLEMENTATION_STATE.md`, `SANITY_CHECK.md`, `README.md`, `NEW_CHAT_STATUS.md`, and `HANDOFF_NEXT_CHAT.md` with Build 160 status.
14. Added a no-DDL SQL note for Build 160.
15. Added `scripts/competitor_roadmap_check.py`.
16. Added the competitor roadmap check to `scripts/release_check.py`.
17. Added a Services-page decision guide with practical package direction for maintenance, daily-use interiors, exterior gloss, paint correction/ceramic, fleet, and gifts.
18. Added stronger Services-page photo-estimate and quote CTAs.
19. Synced root `/services.html` and folder `/services/index.html`.
20. Re-ran release checks including Cloudflare, social workflow, competitor roadmap, and SEO/H1 checks.

## Next 20 value-added steps after Build 160

1. Deploy Build 160 and confirm the Cloudflare Pages build stays clean.
2. Apply pending SQL migrations through Build 159 if any are still missing.
3. Smoke-test Services page on desktop and mobile to confirm the new decision guide improves clarity.
4. Add the same decision guidance to Booking as a step-by-step recommendation panel.
5. Add package display aliases: Express Interior Refresh, Full Interior Detail, Interior Detail Pro, Exterior Wash & Protect, Full Detail, Paint Enhancement, Paint Correction Quote, Ceramic Protection Quote.
6. Add a photo-estimate prompt to Booking and Contact with examples of the 2–6 photos customers should send.
7. Build a simple recommendation engine using vehicle type, service type, condition, add-ons, and photos.
8. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
9. Add admin-managed specials/promos blocks for seasonal salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
10. Improve gift-card merchandising with Interior Detail, Full Detail, and custom amount gift cards.
11. Add customer-facing consent capture for public/social before-and-after use.
12. Add media privacy fields for plate/face/address review and blur/crop completion.
13. Add admin proof-placement controls so staff can choose which reviews/recent work appear on each town/service page.
14. Filter gallery/recent work by town, service, add-on, and vehicle type where data is available.
15. Move high-change service, add-on, specials, FAQ, and proof content toward DB-first admin management.
16. Add Search Console and Google Business Profile reporting notes to admin analytics.
17. Add social performance entry and dashboard rollups using `social_post_metrics_snapshots`.
18. Add social platform preview cards before publishing.
19. Prepare a clean/orphan branch replacement plan once deploy stability is confirmed.
20. Keep this file as the top implementation source of truth; use older roadmap files only as history.

---

# Build 159 update — Social templates, scheduling, duplicate warnings, and manual posted-link capture

**Updated:** 2026-05-20  
**Current build:** Build 159

Build 159 continues the social publishing workflow by making Admin Social Queue easier to use day-to-day. It adds reusable caption/hashtag pickers, planned publish timing, duplicate draft warnings, posted-link capture, and schema support for future social metrics snapshots while keeping the Build 158 human review gates in place.

## Completed in Build 159

1. Reviewed Build 158 Development Roadmap and Known Gaps before selecting the next social workflow items.
2. Added `functions/api/admin/social_templates_list.js` as a staff-protected template/preset endpoint.
3. Added root shim `functions/api/social_templates_list.js` for compatibility with flat Cloudflare routes.
4. Added DB-first reading from `social_caption_templates`.
5. Added DB-first reading from `social_hashtag_presets`.
6. Added built-in fallback caption templates when the DB tables are not migrated yet.
7. Added built-in fallback hashtag presets when the DB tables are not migrated yet.
8. Added a caption template picker to Admin Social Queue.
9. Added a hashtag preset picker to Admin Social Queue.
10. Added a planned publish time input for manual social drafts.
11. Passed `scheduled_for` into new manual social drafts.
12. Added planned/unscheduled queue filters.
13. Added visible planned-time badges on draft cards.
14. Added duplicate draft grouping in the visible queue using `duplicate_signature`.
15. Added duplicate warning cards so repeated platform/caption/first-media drafts are easier to spot.
16. Added posted URL and platform post ID prompts when staff use **Mark posted**.
17. Kept **Publish/API** blocked by the Build 158 consent/privacy review gate.
18. Added `sql/2026-05-20_build159_social_templates_schedule_duplicate_metrics.sql`.
19. Added schema support for duplicate review status, social metrics JSON, and `social_post_metrics_snapshots`.
20. Updated release checks, Markdown, schema notes, and the social publishing guide for Build 159.

## Next 20 value-added steps after Build 159

1. Apply Build 156, Build 158, and Build 159 SQL migrations in order if they are not already applied.
2. Smoke-test manual draft creation with a caption template and hashtag preset.
3. Smoke-test planned publish time filtering in Admin Social Queue.
4. Smoke-test duplicate warnings by creating two similar draft rows.
5. Add editable draft text inside Admin Social Queue before approval.
6. Add an approval role so detailers can draft while owners approve/publish.
7. Add customer-facing consent capture on booking/progress pages.
8. Add license-plate/face/address blur status to each media row.
9. Add a crop/blur reminder panel before drafts with vehicle photos can be approved.
10. Add a calendar view for scheduled social posts.
11. Add retry scheduling for failed API/webhook attempts.
12. Add a social performance entry form using `social_post_metrics_snapshots`.
13. Add dashboard rollups for posted count, failed count, and platform coverage.
14. Add town-specific caption templates for Woodstock, Ingersoll, Simcoe, Delhi, and Port Dover.
15. Add platform preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, LinkedIn, and YouTube Shorts.
16. Add automatic public-gallery promotion only from approved/posted rows.
17. Add webhook signing verification examples for Make, Zapier, and n8n.
18. Add a clean-branch/orphan upload plan after Cloudflare deploy is stable.
19. Add Search Console and Google Business Profile reporting notes into the admin analytics roadmap.
20. Continue SEO/H1/CSS drift checks on every release pass.

---

# Build 158 update — Social review gates and local caption templates

**Updated:** 2026-05-20  
**Current build:** Build 158

Build 158 continues the Build 156/157 social publishing workflow and makes it safer before any job/crafting-progress photo or summary is pushed to X, Facebook, Instagram, TikTok, Google Business Profile, or manual/webhook channels.

## Completed in Build 158

1. Added `functions/api/_lib/social-compliance.js`.
2. Added customer/public-use consent checks for social drafts.
3. Added license plate, face, address, and private-identifier review checks.
4. Added no-private-customer-info caption review.
5. Added platform warning generation for X length, Instagram media requirements, TikTok media requirements, Facebook media recommendations, and Google Business Profile local wording hints.
6. Added `Approve & ready` review action in Admin Social Queue.
7. Blocked direct `Publish/API` unless a draft is marked ready and the review gate passes.
8. Added fallback-safe inserts if the Build 158 SQL migration has not been applied yet.
9. Added fallback-safe social queue reads when new review columns do not exist yet.
10. Added review checklist controls to Admin Social Queue manual draft creation.
11. Added review checklist controls to Admin Progress social draft creation.
12. Updated immediate push workflow to approve-ready first, then publish only if the review gate passes.
13. Added review badges and platform warning display to Admin Social Queue cards.
14. Added `social_caption_templates` table.
15. Added `social_hashtag_presets` table.
16. Seeded local caption templates for Southern Ontario, Oxford County, Norfolk County, and Tillsonburg-style posts.
17. Seeded local hashtag presets for Rosie Dazzlers local discovery.
18. Added `duplicate_signature` on queued posts to support future duplicate-content warnings.
19. Updated social workflow release checks for Build 158 markers.
20. Updated Markdown and schema notes for the new social review gate.

## Next 20 value-added steps after Build 158

1. Apply the Build 156 social queue migration if it has not already been run.
2. Apply `sql/2026-05-20_build158_social_review_gates_and_templates.sql`.
3. Test Admin Progress with one internal job update and one media URL.
4. Confirm a draft is created with platform warnings in Admin Social Queue.
5. Confirm `Publish/API` is blocked until `Approve & ready` is clicked.
6. Add a duplicate-content warning in the Admin Social Queue UI using `duplicate_signature`.
7. Add a template picker that loads `social_caption_templates` from the DB.
8. Add a hashtag preset picker that loads `social_hashtag_presets` from the DB.
9. Add a scheduler calendar for planned posting times.
10. Add a posted URL capture form for manual posts.
11. Add customer-facing consent capture on the booking/progress flow.
12. Add media-crop/blur status fields for license plates and private identifiers.
13. Add staff training notes explaining that drafts are not public until approved/published.
14. Add platform-specific preview cards for Facebook, Instagram, X, TikTok, Google Business Profile, and manual.
15. Add basic post analytics fields: clicks, views, likes, comments, shares, and last checked time.
16. Add webhook payload signing/verification documentation for Make/Zapier/n8n bridges.
17. Add scheduled retry rules for failed webhook/API attempts.
18. Add a public gallery promotion workflow that only uses approved social media rows.
19. Add Google Business Profile post/manual workflow notes once the account flow is finalized.
20. After deploy is stable, consider a clean-branch/orphan upload to remove stale GitHub files that web upload does not delete.

---

# Development Roadmap — Build 157


**Updated:** 2026-05-19  
**Target branch:** `dev`  
**Pass focus:** Social publishing bridge for job/crafting progress posts, safer API/webhook dispatch, Admin Progress immediate social draft/publish controls, Admin Social Queue copy/API buttons, schema/doc synchronization, and continued SEO/H1/CSS release discipline.

## Build 157 completed — social progress publishing bridge

1. Kept the Build 156 social queue as the base instead of bypassing review controls.
2. Added a platform publish helper at `functions/api/_lib/social-platform-dispatch.js`.
3. Added approved API publish attempts for X text posts using the X v2 create-post endpoint.
4. Added Facebook Page API publish attempts for text posts and public image URLs.
5. Added Instagram Business publish attempts using media container creation plus publish.
6. Kept TikTok, Google Business Profile, LinkedIn, YouTube Shorts, and unsupported networks on webhook/manual fallback until each platform OAuth/app review is complete.
7. Added optional `SOCIAL_DISPATCH_WEBHOOK_SECRET` header support for automation tools.
8. Added `Publish/API` action inside Admin Social Queue.
9. Kept `Send webhook`, `Copy text/media`, `Mark posted`, `Ready`, and `Skip` fallbacks.
10. Expanded readiness display for X, Facebook Page, Instagram Business, TikTok, LinkedIn, YouTube/Google, queue DB, and webhook bridge.
11. Added copy-to-clipboard support for draft captions and media URLs.
12. Added Admin Progress checkbox to create social drafts automatically after progress updates/media.
13. Added Admin Progress checkbox to attempt approved API/webhook push immediately after draft creation.
14. Synced `/admin-progress.html` with `/admin-progress/index.html` so the public route is not stale.
15. Synced `/admin-social.html` with `/admin-social/index.html`.
16. Updated release checks so Build 157 social markers are required.
17. Updated Cloudflare Pages Functions check to syntax-check the new publish helper.
18. Added Build 157 SQL no-DDL note documenting required environment variables.
19. Updated `SUPABASE_SCHEMA.sql` with the Build 157 no-DDL note.
20. Kept local SEO/H1 guard active so exposed pages continue to have one clear main heading.

## Next 20 value-added steps after Build 157

1. Add a secure Admin Settings screen for platform connection status without showing secrets.
2. Add per-platform caption templates, including short X text and longer Facebook/Instagram text.
3. Add per-platform image/video requirements and warnings before publishing.
4. Add a draft preview mode that shows how the post will look on each platform.
5. Add batch-publish selected drafts from the Social Queue.
6. Add scheduled publishing windows by platform and local audience timing.
7. Add a reusable hashtag library for towns, services, and seasonal campaigns.
8. Add before/after carousel support for Facebook and Instagram where supported.
9. Add a Make/Zapier/webhook recipe guide for TikTok, Google Business Profile, LinkedIn, and YouTube Shorts.
10. Add platform response permalink repair when APIs return IDs but not URLs.
11. Add automatic retry rules for temporary API errors and rate limits.
12. Add an approval role so staff can draft while owners approve/publish.
13. Add customer privacy flags so license plates, faces, and addresses are blocked before posting.
14. Add media scoring checks for social-safe size, format, and orientation.
15. Add alt text/caption fields for accessibility and local SEO.
16. Add social performance tracking fields for reach, clicks, and conversions.
17. Add a recent-work public gallery fed from approved social/job posts.
18. Add town-specific posting templates for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Oxford County, and Norfolk County.
19. Add a rollback/unpublish checklist for posts published by mistake.
20. Add a monthly content calendar tied to bookings, seasonal services, and local promotions.



**Updated:** 2026-05-18  
**Target branch:** `dev`  
**Pass focus:** Cloudflare Pages Functions deploy hotfix, media-library endpoint syntax repair, duplicate landing-page key cleanup, release-check hardening, schema/docs synchronization, and continued SEO/H1/CSS release discipline.


## Build 155 completed deployment hotfix pass

1. Reviewed the Cloudflare Pages deploy log and confirmed the blocking error was an unterminated regular expression in `functions/api/admin/media_library_list.js`.
2. Repaired `normalizeList()` so comma/newline splitting uses an esbuild-safe `/[\n,]/` expression instead of a literal newline inside the regex character class.
3. Reviewed Cloudflare warnings in `functions/api/landing_pages_public.js`.
4. Removed duplicate `related_products` normalization from `normalizePage()` while keeping the richer image-capable product normalization.
5. Removed duplicate `hero_image_url`, `region_photo_caption`, `region_photo_source`, and `region_photo_source_url` keys from the same object literal.
6. Removed the now-unused `normalizeProductRefs()` helper to avoid future confusion between two product reference shapes.
7. Added `scripts/cloudflare_pages_functions_check.py` to catch deploy-only JavaScript issues before upload.
8. The new checker runs `node --check` across project JavaScript files and also catches literal-newline regex character classes that Cloudflare/esbuild can reject.
9. The new checker guards `landing_pages_public.js` against duplicate `normalizePage()` object keys.
10. Wired the new Cloudflare Pages Functions deploy-safety checker into `scripts/release_check.py`.
11. Re-ran the full release checklist after the deploy hotfix.
12. Updated Markdown and schema tracking notes so Build 155 is documented as the current baseline.

## Build 151 completed 20-step pass

1. Reviewed the Build 150 roadmap and known gaps before selecting the next inventory/media workflow items.
2. Added `/api/admin/media_library_list` as a staff-protected media-library read endpoint for Admin Catalog.
3. Made the new media-library endpoint DB-first against `app_media_library`.
4. Added fallback reading from `app_management_settings.media_library` if the DB media table is not available yet.
5. Kept the endpoint deploy-safe by returning warnings instead of breaking the page when optional media-library storage is missing.
6. Updated Admin Catalog image candidate collection so media rows can use `media_url`, `fallback_url`, `public_url`, or `url` in addition to existing inventory image fields.
7. Updated the existing image picker so it now searches media-library rows, bundled consumables/tools rows, saved DB rows, and saved helper URLs together.
8. Added media-library count visibility to the Admin Catalog image completeness summary.
9. Added **Repair selected images** to persist matched fallback images onto selected saved/fallback inventory rows.
10. Made selected image repair import selected bundled fallback rows when they are not yet saved to DB.
11. Protected existing deliberate DB images by skipping saved rows that already have a non-fallback image.
12. Added **Scan visible images** to browser-check up to 100 visible inventory image URLs.
13. Added per-row image health messages after a scan, showing whether an image passed or failed browser loading.
14. Added duplicate-image group detection to the inventory quality summary.
15. Added per-row duplicate-image warnings where multiple inventory rows use the same image URL.
16. Preserved the Build 150 fallback merge fix so blank DB `image_url` values still hydrate from matching bundled consumables/tools images.
17. Added `scripts/media_library_picker_check.py` to guard the new media picker, image repair, duplicate diagnostics, and image health markers.
18. Wired the new checker into `scripts/release_check.py` and expanded the inventory picker guard markers.
19. Added `sql/2026-05-18_build151_media_library_inventory_image_workflow.sql` and synchronized `SUPABASE_SCHEMA.sql`.
20. Updated the active Markdown handoff, roadmap, gaps, schema, image, and sanity documents for Build 151.

## Next logical 20 steps

1. Apply the Build 150 and Build 151 SQL migrations in Supabase dev, then confirm `catalog_inventory_items` and `app_media_library` are present.
2. Smoke-test `/api/admin/media_library_list?usage_context=inventory_item` on the deployed dev URL while signed in as admin/staff.
3. Seed `app_media_library` from the current R2 product/tool image folders with `group_key='products'` and `usage_contexts` containing `inventory_item`.
4. Add an Admin Catalog **Upload image to R2** flow so new product/tool images do not require manual URL pasting.
5. Add editable image metadata in the picker: alt text, caption, source/consent, preferred public image, and recommended size.
6. Add a **Repair all fallback-matched images** review screen so staff can persist safe image fixes without selecting rows one by one.
7. Add a server-side image URL health report so 404/timeout checks can run without depending on browser scans.
8. Add a duplicate-image review screen where staff can mark duplicates as intentional multipack/shared-image cases.
9. Connect media rows to towns, services, reviews, and before/after gallery proof for stronger local landing pages.
10. Convert the before/after gallery from sample JSON into an admin-managed `app_content_entries` or dedicated DB content set.
11. Add receipt/bill attachment workflows to inventory purchases and accounting entries.
12. Link booking completion consumable usage to inventory movement and accounting COGS posting.
13. Add monthly inventory count sessions with variance approval and lock/reopen controls.
14. Connect vendor directory editing between Admin Catalog and Accounting so purchases, receipts, and reorders share one source.
15. Add Search Console and Google Business Profile reporting panels once credentials/API access are ready.
16. Continue town/service page improvements for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, and Norfolk/Oxford searches.
17. Replace remaining external/location placeholder photos with Rosie-owned R2-hosted local proof images.
18. Expand API fallback/error banners so staff can tell when the UI is using DB, app-setting, or bundled JSON fallbacks.
19. Add mobile detailer job closeout that records consumables/tools used, photos/videos, customer sign-off, and follow-up notes.
20. Keep every release pass checking one H1 per exposed page, local title/meta clarity, structured data, CSS drift, and stable redirects.

<!-- Build 155 sync 2026-05-18: Cloudflare Pages Functions deploy hotfix, media-library endpoint regex repair, landing-page duplicate-key cleanup, release-check hardening, schema sync, and local SEO/H1 discipline pass. -->

## Build 155 completed deployment repair pass

1. Repaired root `/functions/api/*.js` import paths from `../_lib/...` to `./_lib/...` so Cloudflare Pages Functions can resolve helpers.
2. Preserved valid nested admin imports and mirrored helper libraries as a defensive fallback for legacy flat route files.
3. Confirmed `functions/api/admin/media_library_list.js` no longer contains the esbuild-breaking regex newline issue.
4. Confirmed `functions/api/landing_pages_public.js` normalizePage no longer has duplicate object keys.
5. Added a no-DDL migration note for Build 155.
6. Hardened `scripts/cloudflare_pages_functions_check.py` to check relative import resolution before packaging.
7. Ran the Cloudflare deploy-safety check successfully across 499 JavaScript files.
8. Ran Node syntax checks successfully across 384 Functions JavaScript files.
9. Kept the Build 151 inventory media picker/fallback workflow unchanged.
10. Updated active Markdown and schema notes for Build 155.

## Next 20 recommended steps after Build 155

1. Deploy Build 155 to Cloudflare Pages and confirm the Functions compile finishes cleanly.
2. If any Cloudflare log remains, fix only the exact named file before starting new features.
3. Apply Build 150 and Build 151 SQL migrations in Supabase dev if not already applied.
4. Seed `app_media_library` from current R2 tool, consumable, add-on, and service-image folders.
5. Add an Admin Media Library screen to edit label, alt text, usage context, source status, and sort order.
6. Add direct R2 upload from Admin Catalog image picker.
7. Add bulk image repair for all inventory rows, not only visible selected rows.
8. Add a missing/duplicate/broken image dashboard for catalog, services, add-ons, and landing pages.
9. Add image alt-text quality scoring to Admin Catalog save validation.
10. Add local-service landing page smoke tests for title, meta, H1, locality terms, and canonical links.
11. Add deployed smoke checks for `/api/admin/media_library_list` and key Admin Catalog endpoints.
12. Move legacy flat root API JavaScript copies out of the live root once Cloudflare deploy is stable.
13. Keep `service-worker.js` as the only intentional root JavaScript file unless a page explicitly loads another root script.
14. Add a repo-cleanliness check that flags duplicate API route files outside `/functions`.
15. Add admin UI messaging when media library DB tables are unavailable and fallbacks are being used.
16. Add inventory/product image history so changed images can be reverted.
17. Add service-area/town page image assignment from the shared media library.
18. Continue one-H1 checks on every exposed page.
19. Continue CSS drift checks on public and admin pages after each feature pass.
20. Re-run the full release check after the deploy hotfix is confirmed.

## Build 155 Cloudflare stale root function shim hotfix - 2026-05-19

Cloudflare still saw older flat `/functions/api/*.js` route files after GitHub web uploads, because uploading ZIP contents does not reliably delete older files from the branch. Build 155 intentionally includes compatibility shim files for the stale flat routes listed in the Cloudflare deploy log. Each shim re-exports the active `/functions/api/admin/*.js` implementation and prevents Pages Functions bundling failures while preserving the newer admin route implementation.

Next step: after Build 155 deploys cleanly, optionally remove the compatibility shims in a clean-branch/orphan rebuild so only the intended folder-backed route files remain.



## Build 155 completed 20-step pass - 2026-05-18

1. Used the latest uploaded Build 147 ZIP as the active baseline for this pass.
2. Rechecked the Cloudflare Pages Functions route tree before adding any new feature work.
3. Found four remaining root `/functions/api/*.js` files still importing `../_lib/...` from the wrong level.
4. Repaired `functions/api/blocks_range_save.js` to import helpers through `./_lib/...`.
5. Repaired `functions/api/catalog_amazon_matches.js` to import helpers through `./_lib/...`.
6. Repaired `functions/api/catalog_bulk_import.js` to import helpers through `./_lib/...`.
7. Repaired `functions/api/catalog_bulk_visibility.js` to import helpers through `./_lib/...`.
8. Confirmed nested `/functions/api/admin/*.js` imports were left alone because `../_lib/...` is correct from the admin folder.
9. Kept the Build 154 stale-route compatibility shims in place for older flat route files left behind by GitHub web uploads.
10. Added `scripts/stale_root_function_shims_check.py` into the normal `scripts/release_check.py` flow so bad root imports fail before upload.
11. Tightened `scripts/cloudflare_pages_functions_check.py` to focus on Cloudflare Functions JavaScript instead of every root/static JavaScript copy.
12. Added a per-file timeout guard around `node --check` inside the Cloudflare deploy-safety checker.
13. Updated `scripts/release_check.py` so Python check scripts can run in-process, avoiding nested subprocess hangs seen in the sandbox.
14. Re-ran the Cloudflare deploy-safety check and confirmed 405 Functions JavaScript files pass.
15. Re-ran the stale root function import guard and confirmed no root `/functions/api/*.js` file still imports parent `_lib` helpers.
16. Re-ran the local SEO/H1 audit to keep the one-H1 and local title/meta discipline active.
17. Re-ran inventory image picker checks and confirmed all 149 bundled fallback inventory rows still have image coverage.
18. Re-ran the media-library picker check to keep selected image repair, duplicate diagnostics, and health scan markers covered.
19. Added a Build 155 no-DDL SQL note and synchronized `SUPABASE_SCHEMA.sql`.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, and implementation-state docs for the next upload.


## Next 20 recommended steps after Build 155

1. Upload Build 155 to the `dev` branch and confirm Cloudflare Pages Functions compile cleanly.
2. If Cloudflare still fails, fix only the exact file named in the new deploy log before starting feature work.
3. After a clean deploy, use a clean/orphan branch upload to remove any stale GitHub web-upload leftovers permanently.
4. Apply Build 150 and Build 151 SQL migrations in Supabase dev if they have not already been applied.
5. Confirm `/api/admin/media_library_list?usage_context=inventory_item` returns either DB media rows or a safe warning fallback.
6. Seed `app_media_library` from existing R2 tool, consumable, add-on, landing, and service-image folders.
7. Add an Admin Media Library screen for label, alt text, caption, usage context, group key, source status, and sort order.
8. Add direct R2 image upload from the Admin Catalog image picker.
9. Add bulk image repair for all fallback-matched rows, not only selected/visible rows.
10. Add a server-side broken-image report for catalog, services, add-ons, gallery, and landing pages.
11. Add image alt-text quality scoring to Admin Catalog save validation.
12. Add service/town landing-page media assignment from the shared media library.
13. Convert before/after gallery sample JSON into an admin-managed DB content set.
14. Add receipt/bill attachment workflow for inventory purchases and accounting entries.
15. Link booking completion consumables/tools used to inventory movement and accounting COGS posting.
16. Add monthly inventory count sessions with variance approval and lock/reopen controls.
17. Connect vendor directory editing between Admin Catalog and Accounting.
18. Add Search Console and Google Business Profile reporting panels once credentials/API access are ready.
19. Continue town/service page improvements for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norfolk, and Oxford searches.
20. Keep every release pass checking Cloudflare Functions, one H1 per exposed page, local title/meta clarity, CSS drift, stable redirects, and inventory/media fallback safety.

## Build 156 completed work - social progress publishing foundation

1. Added a reviewable social queue for job progress photos and summaries.
2. Added Admin Progress controls to create social drafts after posting updates.
3. Added Admin Progress controls to create social drafts after attaching job media.
4. Added per-platform draft selection for Facebook, Instagram, X, TikTok, and Google Business Profile.
5. Added default local hashtags for Rosie Dazzlers job proof posts.
6. Added Admin Social Queue page for reviewing drafts.
7. Added manual social draft creation for content not tied to a booking.
8. Added social post status workflow: draft, ready, posted, failed, skipped.
9. Added optional webhook dispatch action for future automation bridge tools.
10. Added platform readiness display without exposing credentials.
11. Added `social_post_queue` schema for staged publishing.
12. Added `social_channels` schema for platform/channel setup.
13. Added `social_dispatch_attempts` schema for audit history.
14. Added booking event logging when drafts are created from job progress.
15. Added social draft loading into Admin Progress for the current booking.
16. Fixed missing `resolveBookingIdByToken` runtime helper in progress update routes.
17. Hardened progress media posting with consistent CORS and auth fallback handling.
18. Added social workflow release checks.
19. Added Cloudflare Pages Functions static/import checks for this pass.
20. Re-checked one-H1-per-page behavior after adding Admin Social Queue.


## Next 20 value-added steps after Build 156

1. Run the Build 156 social queue SQL migration in Supabase.
2. Add a Social Queue card to staff role training notes so detailers know drafts are not public posts yet.
3. Decide the first direct-post platform: recommended order is Facebook/Instagram, Google Business Profile, X, TikTok, then YouTube Shorts.
4. Add per-platform caption length warnings and media-count warnings.
5. Add a privacy checklist before any customer vehicle/photo can be marked ready.
6. Add license-plate blur/cover reminder fields to the media workflow.
7. Add customer consent flags for public before/after use.
8. Add a reusable caption template library for job type, vehicle size, service area, and upsell language.
9. Add platform-specific hashtag presets for local SEO and discovery.
10. Add OAuth setup notes and token rotation guidance for each social platform.
11. Add a direct Meta/Facebook Page adapter after the app permissions are approved.
12. Add an Instagram Business publishing adapter after Meta media-container requirements are confirmed.
13. Add a Google Business Profile recent-work publishing path after the Google account scope is finalized.
14. Add a TikTok direct-post adapter only after app review and creator authorization are confirmed.
15. Add a queue calendar so posts can be scheduled by day/time.
16. Add duplicate-content warnings when the same photo/caption is queued twice.
17. Add analytics fields for clicked progress links and posted platform URLs.
18. Add customer-friendly public gallery promotion rules from approved job media.
19. Add fallback export buttons: copy caption, download media list, and open platform composer.
20. Add social performance notes back into the booking/customer history for future marketing decisions.

## Build 169 — Auth/API 500 fallback repair (2026-05-23)

Completed after live testing showed `/api/admin/auth_me`, `/api/client/auth_me`, `/api/analytics/ingest`, `/api/client/auth_login`, and `/api/admin/auth_login` returning browser-visible 500s on `/login` and `/admin-leads.html`. This pass hardened the shared auth/session endpoints so identity checks fail open as signed-out/degraded JSON instead of breaking page load, while actual login remains protected by Supabase staff/customer records. Analytics ingestion now skips safely when storage is unavailable. A root `favicon.ico` was added to remove the browser 404.

Next roadmap focus: apply/verify auth tables and environment variables in Cloudflare Pages, then add lead-to-quote conversion on top of the now-stable Admin Leads screen.

## Build 170 — Customer dashboard signed-out fallback repair (2026-05-24)

Live testing showed `/api/client/dashboard` still returned a browser-visible 401 when the booking/account UI checked for saved garage/customer data without a valid customer session. Build 170 changes the customer dashboard read endpoint to return a safe signed-out payload instead of a failed resource:

- `ok:false`, `authenticated:false`, `signed_out:true`, `code:"not_authenticated"` for normal signed-out visitors.
- Safe degraded JSON for missing Supabase dashboard/session storage.
- Empty arrays for bookings, vehicles, media, gift certificates, redemptions, and reviews so public helpers can stop quietly.
- Existing customer write endpoints remain protected and can still reject unauthenticated writes.

Next roadmap action: once login/session creation is confirmed on Preview and Production, continue lead-to-draft-quote conversion from the Build 168 Admin Leads screen.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — next roadmap items moved forward

Completed foundations for the listed outstanding items: lead → draft booking/quote conversion, catalog-backed package/add-on price suggestions, quote draft status workflow, Admin Content expansion beyond FAQ, gallery service/town proof filtering, media privacy enforcement before public reuse, and FAQ/help/lead/quote conversion analytics. Next work should turn conversion drafts into one-click real booking creation once staff confirms date, address, access, vehicle size, and final price.

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 update

Completed the next step after Build 175: reviewed conversion drafts can now become real booking rows from Admin Leads, but only after required final booking details are confirmed. Admin Analytics now shows lead/quote conversion summary cards, and App Management now warns when gallery or uploaded media is not public-ready.

Next roadmap focus: add a fuller booking review screen for conversion drafts, improve pricing-to-final-total reconciliation, and add visible admin badges wherever content/media is blocked by privacy state.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

### Build 179 roadmap movement

Completed foundations for hard social publish blocking, local proof task assignment, and quote/proposal delivery acceptance tracking. Next roadmap priority is turning accepted quotes into deposit/payment and customer booking confirmation steps.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 roadmap progress

Completed foundation: accepted quote → deposit/payment request → final booking confirmation tracking.

New/changed pieces:
- `/api/admin/quote_deposit_request_create` creates a deposit/payment request from an accepted quote draft.
- `/quote-payment.html` gives the customer a private, noindex review/payment page.
- `/api/admin/quote_deposit_request_mark_paid` lets staff record manual/verified deposit payment and confirm a linked booking when available.
- `/api/admin/quote_deposit_requests_list` lets Admin Leads reload deposit/payment request history per quote.

Next roadmap item: connect provider webhooks or return verification into the same request table so Stripe/PayPal payments can mark requests paid automatically instead of staff-only confirmation.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

## Build 182 completed — payment reliability pass

Completed the next payment-system reliability step: provider webhook event history, replay controls for verified events, queued customer receipt emails, and refund/partial-refund tracking. This gives the quote-deposit workflow an audit trail instead of only relying on the current payment request row.

Next best payment steps:

1. Add direct Stripe/PayPal refund initiation from Admin Payments with staff confirmation and reason codes.
2. Add receipt/refund delivery status cards that read from `notification_events`.
3. Add payment reconciliation export rows for accountant review.
4. Add dashboard warnings for unverified/failed webhook events that need staff review.

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

### Build 183 completed

- Added direct provider refund initiation for quote deposit/payment requests using Stripe Refunds and PayPal captured-payment refunds.
- Added payment reconciliation CSV export from deposit requests, refunds, and webhook events.
- Added dashboard warnings for failed/unverified webhook events so payment issues surface outside the Payments page.
- Cleared and rebuilt `IMAGES.md` with missing add-on, package, regional, gallery, and video media requirements plus upload methods.

### Next payment/media direction

1. Add provider refund status polling so pending refunds can refresh automatically.
2. Add accountant-ready payment export packaging with HST/GST allocation.
3. Add image-health scanning against the R2 public asset domain and show missing-image warnings in Admin App.
