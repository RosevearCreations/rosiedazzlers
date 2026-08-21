> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.


# Build 184 update — 20-step operations, media, and payment hardening

**Updated:** 2026-06-01  
**Build:** 184

Build 184 completes the requested next-20 pass by tightening the payment/refund operations, improving image/media readiness review, and documenting the next operational bundle. This pass is intentionally no-DDL: it uses the existing Build 180–182 payment tables and the Build 183 image requirements foundation.

## Build 184 — 20 completed items

1. Added `/admin-media-health.html` and `/admin-media-health/` so staff can review missing required photos/videos from a protected admin page.
2. Added `/api/admin/media_asset_health_scan` to scan required public R2/media URLs and return missing/not-public files with upload keys.
3. Added `data/image_requirements_build184.json` as the machine-readable source for required app, add-on, landing, gallery, and proof images.
4. Added the Media Health page to the shared Admin Menu.
5. Added Media Health access rules to `assets/admin-auth.js`.
6. Added a Media Health card to the Admin Dashboard.
7. Added `/api/admin/payment_refund_status_poll` so staff can poll Stripe/PayPal refund status and refresh local refund rows.
8. Added `/api/admin/payment_receipt_resend` so staff can requeue a customer quote-deposit receipt email from a payment request.
9. Added `/api/admin/payment_accountant_package_export` for an accountant-style payment CSV with Ontario HST allocation estimates.
10. Added an **Export accountant package** button to Admin Payments.
11. Added **Resend receipt** controls to quote deposit/payment request cards.
12. Added **Poll provider status** controls to refund record cards.
13. Kept manual refund records, provider refund initiation, webhook settlement, and replay controls on one Payments page for easier review.
14. Added `sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql` to document the no-DDL Build 184 schema status.
15. Updated `SUPABASE_SCHEMA.sql` with Build 184 operational notes.
16. Updated `DATABASE_STRUCTURE_CURRENT.md` with the Build 184 no-DDL dependency summary.
17. Updated `IMAGES.md` with the Admin Media Health scan workflow and upload review method.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` to reflect Build 184 media/payment/accounting hardening.
19. Added `scripts/build184_twenty_step_ops_media_payment_check.py` and wired it into the release check chain.
20. Re-ran the one-H1 and release guard path so exposed public pages still use one clear H1.

## Next 20 steps after Build 184

1. Deploy Build 184 and test `/admin-media-health.html` against live R2 assets.
2. Upload the missing add-on images listed in `IMAGES.md`, then re-run the Media Health scan.
3. Replace regional landing placeholders with Rosie-owned images for Tillsonburg, Woodstock/Ingersoll, Simcoe/Delhi, Port Dover, Norwich/Otterville, and Waterford/Vittoria.
4. Capture the first four approved-public before/after gallery proof sets by town/service.
5. Add real image dimension validation instead of URL-only health checks.
6. Add R2 signed upload URLs for admin media replacement so uploads can happen from the app instead of the Cloudflare dashboard only.
7. Add a media task status table so missing-image items can be assigned, marked uploaded, reviewed, and approved.
8. Add provider refund polling for payment requests without refund rows, not only existing refund records.
9. Add scheduled retry checks for pending Stripe/PayPal refunds.
10. Add payment reconciliation variance warnings for paid amount vs. quote/deposit amount.
11. Add processor fee capture and estimated net payout fields to the payment export.
12. Add HST/GST allocation review screens before accountant export is considered final.
13. Add failed receipt email retry controls and visible notification-event status on Admin Payments.
14. Add customer-facing receipt PDF/download links.
15. Add final-balance invoice/payment requests after job completion.
16. Add payment application to final invoices, deposits, refunds, and tips.
17. Add month-end payment close checklist tied to reconciled provider exports.
18. Add dashboard warnings for missing images on high-traffic public pages.
19. Add Search Console/local SEO task cards tied to missing service/town proof content.
20. Add a consolidated accountant export package that bundles payment CSV, refund CSV, journal candidates, HST summary, and close checklist.

---

# Build 181 update — Stripe/PayPal verified payment webhooks for quote deposits

**Current build:** Build 181  
**Date:** 2026-05-26

Build 181 connects provider-verified payments directly to `quote_deposit_payment_requests`. Stripe `checkout.session.completed` events and PayPal verified capture/sale webhooks can now settle accepted quote deposits automatically, update quote/conversion status, and confirm/link the final booking when a booking is already connected. PayPal is now a first-class quote-deposit provider alongside Stripe and manual payment.

## Completed in Build 181

| Area | Status | Build 181 notes |
| --- | --- | --- |
| Stripe webhook settlement | Added foundation | `/api/stripe/webhook` now detects `quote_deposit_payment_request_id` metadata and marks the matching deposit request paid after signature verification. |
| PayPal webhook settlement | Added foundation | `/api/paypal/webhook` verifies PayPal webhook signatures and settles quote deposits for completed capture/sale events. |
| PayPal quote-deposit checkout | Added foundation | `/api/admin/quote_deposit_request_create` can create PayPal quote-deposit orders when PayPal credentials are configured. |
| Customer PayPal return capture | Added foundation | `/api/paypal/capture-quote-deposit` lets the private quote-payment page capture an approved PayPal order and settle the same deposit request. |
| Deposit → booking confirmation | Improved | Shared settlement logic updates `quote_deposit_payment_requests`, quote drafts, conversion drafts, booking deposit events, and final booking confirmation links. |
| Provider audit fields | Added schema foundation | Build 181 SQL adds provider event, capture/order/payment-intent, payload, and webhook timestamp fields. |

## Remaining competitive gap priority after Build 181

1. Add admin-visible webhook event history and retry/replay controls for failed provider settlements.
2. Add customer-facing receipt/confirmation email after provider-verified deposit.
3. Add deposit refund/partial refund tracking.
4. Add final invoice/payment balance request after booking completion.
5. Add automated accounting journal candidates for verified deposits and processor fees.

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
| Admin Content public rendering | Added foundation | public content blocks and DB/fallback content blocks can now render on public pages. |
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

# COMPETETIVE.md Completion Matrix — Build 174

**Updated:** 2026-05-24  
**Baseline:** latest uploaded `rosiedazzlers-dev(169).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 174 closes the copy-only quote-starter gap by adding persistent quote/proposal drafts to Admin Leads. Public lead capture, photo-estimate review, quote starter generation, FAQ/help content, and FAQ admin editing are now connected to a stronger follow-up workflow.

## Updated completion status after Build 174

| COMPETETIVE.md area | Current status | Build 174 notes |
| --- | --- | --- |
| FAQ/help content | Complete public foundation + admin FAQ editor | `/faq`, `/api/public_faqs`, and `/admin-content.html` FAQ editing are present after Build 172 SQL. |
| Help articles / education | Improved public foundation | `/blog` Help Articles hub and starter article routes exist. Admin editing remains next. |
| New-page access paths | Improved | FAQ, Help, Specials, Gift Cards, Fleet, Maintenance, and key services are linked through nav/footer/sitemap/relevant cards. |
| Lead capture pages | Complete public foundation | Fleet, maintenance, specials, gift-card, and photo-estimate lead paths exist. |
| Admin Leads / triage | Improved | Staff can list, search, update, and note public leads and uploads. |
| Quote starter | Improved | Build 171 copy-ready quote starter remains available from each public lead. |
| Persistent quote/proposal drafts | Added foundation | Build 174 adds save/load APIs, SQL table, and Admin Leads UI actions. Full send/approval workflow remains next. |
| Admin-managed content | Partial | FAQ editor exists; specials, services, homepage blocks, and help article editors remain open. |
| Proof sections | Partial | Gallery/recent-work filtering by service and town remains open. |
| Media privacy | Partial | Review statuses exist; public gallery/social enforcement still needs automation. |
| Analytics | Partial | Analytics fallback exists; FAQ/help/lead/quote conversion reporting remains open. |

## Remaining competitive gap priority after Build 174

1. Add one-click lead → draft booking/quote conversion.
2. Add catalog-backed package/add-on price suggestions inside saved quote drafts.
3. Add quote draft status controls, sent/accepted/declined tracking, and follow-up reminders.
4. Extend Admin Content Center to specials, service blurbs, help articles, and homepage support cards.
5. Add gallery/recent-work proof filtering by town and service.
6. Enforce privacy-approved media pipeline before public gallery/social use.
7. Add analytics for FAQ searches, quote draft saves, quote follow-ups, and lead conversions.

---
# COMPETETIVE.md Completion Matrix — Build 173

**Updated:** 2026-05-24  
**Baseline:** latest uploaded `rosiedazzlers-dev(168).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 173 closes more of the content/access gap by adding an Admin Content Center for FAQ rows and expanding the public Help Articles hub.

## Updated completion status after Build 173

| COMPETETIVE.md area | Current status | Build 173 notes |
| --- | --- | --- |
| FAQ/help content | Complete public foundation + admin FAQ editor | `/faq` exists, `/api/public_faqs` exists, and `/admin-content.html` can manage DB FAQ entries after Build 172 SQL. |
| Help articles / education | Improved public foundation | `/blog` is now a real Help Articles hub with article cards and quick paths. Individual article routes already exist. |
| New-page access paths | Improved | FAQ, Help, Specials, Gift Cards, Fleet, Maintenance, and key service/town pages are exposed through nav/footer/sitemap/relevant cards. |
| Admin-managed content | Partial | FAQ editor is complete as a first step. Specials, services, homepage blocks, and help article editors remain open. |
| Lead capture pages | Complete public foundation | Fleet, maintenance, specials, gift-card, and photo-estimate paths exist. |
| Quote starter | Partial workflow | Build 171 quote starter exists, but persistent proposal drafts remain open. |
| Proof sections | Partial | Gallery/recent-work filtering by service and town remains open. |
| Media privacy | Partial | Admin review flags exist, but public gallery/social enforcement still needs full automation. |
| Analytics | Partial | Analytics fallback exists, but FAQ/help/lead/quote conversion reporting remains open. |

## Remaining competitive gap priority

1. Persistent quote/proposal drafts.
2. Lead → draft booking/quote conversion.
3. Admin Content expansion to specials, service blurbs, help articles, and homepage support cards.
4. Gallery/recent-work proof filtering by town and service.
5. Privacy-approved media pipeline before public gallery/social use.

---
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# COMPETETIVE.md Completion Matrix — Build 172

**Updated:** 2026-05-24  
**Baseline:** latest uploaded `rosiedazzlers-dev(167).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 172 focuses on the customer help/content-access gap that remained after the lead and quote-starter work. The site now has a full FAQ/help route, schema, access links, sitemap inclusion, and a DB-managed content foundation.

## Updated completion status after Build 172

| COMPETETIVE.md area | Current status | Build 172 notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Homepage now links customers to FAQ for objections/questions before booking. |
| Sticky CTA buttons | Complete | Existing sticky CTA remains active. |
| Better service/package selector | Mostly complete | FAQ supports package decision-making and quote-first guidance. |
| Service package cards | Mostly complete | Still needs admin-managed public copy. |
| Add-on cards | Improved | FAQ explains heavy-condition add-ons and photo-estimate triggers. |
| Specials | Complete public foundation | Static page exists; admin-managed specials remain next. |
| Gift cards | Complete public foundation | FAQ answers gift-card use and links to gift-card path. |
| Proof sections | Partial | Service/town-aware proof filtering remains open. |
| Ceramic coating page | Mostly complete | FAQ links to coating/paint review expectations; deeper proof remains next. |
| Paint correction page | Mostly complete | FAQ reinforces inspection-led quoting. |
| Interior/basic vs deep distinction | Mostly complete | FAQ now explains standard vs heavy interior work. |
| High-value add-ons | Improved | FAQ covers pet hair, odour, salt, work trucks, coating, correction, and estimates. |
| Booking flow | Mostly complete | FAQ is linked from the public flow and helps decide direct booking vs photo estimate. |
| Admin service controls | Partial | Build 172 adds DB target for FAQ entries; editor is still outstanding. |
| Schema/local SEO support | Improved | `/faq` has FAQPage and BreadcrumbList schema, one H1, sitemap entry, title/meta, and local wording. |
| Conversion blocks | Improved | FAQ is linked from homepage, nav, footer, Services, Pricing, Contact, and booking/photo CTAs. |
| Maintenance plans | Complete public foundation | FAQ includes maintenance/fleet quote expectations. |
| Fleet/commercial | Complete public foundation | FAQ includes fleet quote expectations. |
| Gallery system | Partial | Needs filtering and media privacy enforcement. |
| Customer education content | Improved | FAQ joins the blog/help article foundation. |
| FAQ/help content | Complete public foundation | New `/faq` route, content, schema, API fallback, JSON seed, and DB table migration added. |
| Pricing display strategy | Mostly complete | FAQ explains why final price may require condition review. |

## Still open after Build 172

1. Admin-managed FAQ/special/service/education content editor.
2. Persistent quote/proposal drafts from the Build 171 quote starter.
3. One-click public lead → booking/quote conversion.
4. Price suggestions from live package/add-on catalog inside quote preview.
5. Gallery/recent-work proof filtering by town and service.
6. Media privacy approval enforcement before public gallery/social reuse.
7. Analytics for FAQ views/searches, lead status changes, quote copy, and conversion.
8. Continued CSS drift and release-check coverage as pages grow.

---
# COMPETETIVE.md Completion Matrix — Build 171

**Updated:** 2026-05-24  
**Baseline:** `rosiedazzlers-dev(166).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 171 moves the competitor-completion matrix one step past capture/review and into quote follow-up. The public pages and lead tables already exist; this pass gives staff a practical quote-starter bridge so public inquiries, photo-estimate requests, fleet requests, maintenance plans, specials, and gift-card questions can become consistent staff-reviewed quote copy.

## Build 171 completion changes

| Matrix area | Build 171 status | Details |
| --- | --- | --- |
| Lead-to-quote workflow | Improved | Admin Leads now has a **Build quote starter** action for each public lead. |
| Quote-builder foundation | Added starter | New `/api/admin/lead_quote_preview` returns copy-ready internal quote text without adding new DDL. |
| Photo-estimate review | Improved | Linked uploads are summarized in the quote starter with privacy status warnings. |
| Fleet/maintenance lead handling | Improved | Topic-aware quote next steps now mention cadence, vehicle count, logistics, and first-visit/test-detail review. |
| Privacy/compliance workflow | Improved | Quote starter repeats pending/needs-blur/rejected media warnings before staff reuse customer media. |
| Fallback/error handling | Improved | Lead/upload admin endpoints now accept the same Supabase service-key aliases as the auth/session fallback helpers. |
| Release enforcement | Improved | Added a Build 171 guard to keep the quote endpoint, UI action, SQL note, schema note, and docs markers present. |

## Updated completion status after Build 171

| COMPETETIVE.md area | Current status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Homepage route choices and sticky CTA exist; keep measuring conversion. |
| Sticky CTA buttons | Complete | Global sticky CTA remains active. |
| Better service/package selector | Mostly complete | Booking chooser, condition helper, photo links/uploads, admin intake/review, and quote-starter handoff are present. |
| Service package cards | Mostly complete | Package aliases and add-on guidance are improved; next step is DB-managed editing and quote-aware pricing suggestions. |
| Add-on cards | Improved | Catalog coverage is broad; proof/examples and quote-starter price suggestions remain next. |
| Specials | Complete public foundation | Static `/specials` exists and can create leads; admin-managed specials remain next. |
| Gift cards | Complete public foundation | Static guide exists and links to gift workflow; quote starter now handles gift-card leads. |
| Proof sections | Partial | Recent work/gallery exist; service/town-aware proof filtering remains open. |
| Ceramic coating page | Mostly complete | Existing page plus education support; deeper FAQ/proof/schema automation remains next. |
| Paint correction page | Mostly complete | Existing page plus education support; real proof/result examples remain next. |
| Interior/basic vs deep distinction | Mostly complete | Service chooser, condition helper, and quote starter explain condition-heavy paths. |
| High-value add-ons | Improved | More competitor-aligned add-ons are bundled; quote-required add-on pricing still needs staff validation. |
| Booking flow | Mostly complete | Direct upload foundation, share links, condition helper, consent, admin review, and quote starter are present. |
| Admin service controls | Partial | Admin catalog/media workflows exist; public service/special/FAQ content still needs a DB-managed editor. |
| Schema/local SEO support | Improved | One-H1 checks continue; FAQPage/Breadcrumb foundations exist on competitor routes. |
| Conversion blocks | Improved | Homepage, Services, sticky CTA, specials, gifts, fleet, maintenance, education, leads, and quote starter now interlink. |
| Maintenance plans | Complete public foundation | Public route, structured lead form, and quote starter support exist. |
| Fleet/commercial | Complete public foundation | Public route, structured lead form, and quote starter support exist. |
| Gallery system | Partial | Needs service/town filtering, proof approval, and media privacy eligibility. |
| Customer education content | Complete starter foundation | Blog hub and starter articles exist; add more practical local guides over time. |
| Pricing display strategy | Mostly complete | Quote-safe language is present; analytics-driven tuning and catalog-backed quote suggestions remain next. |

## Still open after Build 171

1. Add one-click lead → draft booking creation.
2. Add persistent quote/proposal drafts and quote revision history.
3. Add catalog-backed package/add-on price suggestions to quote starter.
4. Add service/town-aware proof filtering for gallery and recent work.
5. Add DB-managed service, special, FAQ, and education editing.
6. Enforce gallery/social eligibility from consent + privacy review + blur/crop completion.
7. Add analytics for quote starter generated, copied, status changed, and converted.
8. Add automated FAQPage/Breadcrumb generation from DB content once the CMS layer is live.
9. Keep direct uploads disabled until storage, limits, and privacy workflow are confirmed live.
10. Continue one-H1, title/meta, local wording, fallback, and CSS drift checks every pass.

---
# COMPETETIVE.md Completion Matrix — Build 168

**Updated:** 2026-05-23  
**Baseline:** `rosiedazzlers-dev(165).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 168 focuses on completing the operational side of the Build 167 public lead/upload work. The competitor roadmap is now represented across the public journey and has a staff review path for the most important quote-first handoffs. The matrix is not “done forever,” but the urgent missing pieces are now mostly admin workflow depth rather than missing public pages.

## Build 168 completion changes

| Matrix area | Build 168 status | Details |
| --- | --- | --- |
| Admin Leads | Added | New `/admin-leads` screen lets staff search/filter public leads and update status, notes, and converted booking UUID. |
| Lead conversion notes | Improved | Public leads can now be marked contacted, quoted, converted, closed, or spam instead of sitting as raw database rows. |
| Photo upload review | Added | New upload review panel lists `photo_estimate_uploads`, links media, and tracks status/privacy review. |
| Lead/photo review endpoints | Added | Four protected admin endpoints now list/save public leads and photo estimate uploads. |
| Media privacy workflow | Improved | Upload rows can be marked pending review, approved private, approved public, needs blur, or rejected. |
| Photo review schema | Added | Build 168 SQL adds `staff_note`, `privacy_note`, `reviewed_at`, and `reviewed_by_staff_user_id` to `photo_estimate_uploads`. |
| Fallback/error handling | Improved | Admin pages and endpoints provide migration hints if the Build 167/168 SQL is not live yet. |
| Matrix/release enforcement | Improved | Added a Build 168 release guard so Admin Leads, endpoints, SQL, docs, and schema markers stay present. |

## Updated completion status after Build 168

| COMPETETIVE.md area | Current status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Homepage route choices and sticky CTA exist; keep measuring conversion. |
| Sticky CTA buttons | Complete | Global sticky CTA remains active. |
| Better service/package selector | Mostly complete | Booking chooser, condition helper, photo links/uploads, and admin intake/review paths are present. |
| Service package cards | Mostly complete | Package aliases and add-on guidance are improved; next step is DB-managed content editing. |
| Add-on cards | Improved | Catalog coverage is broad; next step is real proof/examples per add-on. |
| Specials | Complete public foundation | Static `/specials` exists; admin-managed specials remain next. |
| Gift cards | Complete public foundation | Static guide exists and links to gift workflow. |
| Proof sections | Partial | Recent work/gallery exist; service/town-aware proof filtering remains open. |
| Ceramic coating page | Mostly complete | Existing page plus education support; deeper FAQ/proof automation remains next. |
| Paint correction page | Mostly complete | Existing page plus education support; real proof/result examples remain next. |
| Interior/basic vs deep distinction | Mostly complete | Service chooser and condition helper explain the difference. |
| High-value add-ons | Improved | More competitor-aligned add-ons are bundled. |
| Booking flow | Mostly complete | Direct upload foundation, share links, condition helper, consent, and admin review are present. |
| Admin service controls | Partial | Admin catalog/media workflows exist; public service/special/FAQ content still needs a DB-managed editor. |
| Schema/local SEO support | Improved | One-H1 checks continue; FAQPage/Breadcrumb foundations exist on competitor routes. |
| Conversion blocks | Improved | Homepage, Services, sticky CTA, specials, gifts, fleet, maintenance, and education interlink. |
| Maintenance plans | Complete public foundation | Public route, lead form, and staff triage path now exist. |
| Fleet/commercial | Complete public foundation | Public route, lead form, and staff triage path now exist. |
| Gallery system | Partial | Needs service/town filtering, proof approval, and media privacy eligibility. |
| Customer education content | Complete starter foundation | Blog hub and starter articles exist; add more practical local guides over time. |
| Pricing display strategy | Mostly complete | Quote-safe language and add-on expansion exist; analytics-driven improvements remain next. |

## Still open after Build 168

1. Apply Build 167 and Build 168 SQL before relying on live Admin Leads data.
2. Add one-click conversion from public lead to draft booking or draft quote.
3. Add a quote-builder screen that turns lead details, photo links/uploads, and condition flags into package/add-on proposals.
4. Add DB-managed service, special, FAQ, and education content editing.
5. Add service/town-aware proof filtering for gallery and recent work.
6. Enforce gallery/social publishing eligibility from consent + media privacy review + blur/crop completion.
7. Add automated FAQPage/Breadcrumb generation from DB content once the CMS layer is live.
8. Add analytics for public lead form submits, upload attempts/failures, Admin Leads status changes, and quote-first conversion.

## Build 168 decision

The `COMPETETIVE.md` roadmap is now substantially complete as a public/customer journey plus staff triage foundation. The next pass should shift from “complete the competitor matrix” to “turn captured leads/photos into quotes, bookings, proof, and measurable conversion reporting.”

<!-- Lead/photo review -->

---

# COMPETETIVE.md Completion Matrix — Build 167

**Updated:** 2026-05-23  
**Baseline:** `rosiedazzlers-dev(161).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 167 is a deeper completion pass against the remaining `COMPETETIVE_COMPLETION_MATRIX.md` items. It focuses on work that can be completed safely now without platform approvals or a full CMS rebuild: direct quote-photo upload foundation, structured fleet/maintenance inquiry forms, FAQ/Breadcrumb schema foundations, and clearer tracking of what is complete versus what still needs admin/database management.

## Build 167 completion changes

| Matrix area | Build 167 status | Details |
| --- | --- | --- |
| Direct customer upload | Foundation added | Booking Step 4 now includes optional estimate photo/video upload. The new `/api/public_photo_estimate_upload_url` endpoint signs storage uploads when `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`; if not enabled, the existing share-link path remains the fallback. |
| Structured fleet lead form | Complete public foundation | `/fleet` now includes a structured fleet quote request form that posts to `/api/public_lead_submit`. |
| Structured maintenance lead form | Complete public foundation | `/maintenance` now includes a maintenance-plan interest form that posts to `/api/public_lead_submit`. |
| Public lead database | Added | New `public_inquiry_leads` table captures topic, contact details, service area, vehicle count, cadence, message, source path, and photo links. |
| Photo upload audit database | Added | New `photo_estimate_uploads` table can audit signed public estimate uploads and keep privacy review status available for later admin tooling. |
| FAQPage schema | Improved | Public competitor-route pages now include FAQPage JSON-LD foundations. |
| BreadcrumbList schema | Improved | Public competitor-route pages and education articles now include BreadcrumbList JSON-LD foundations. |
| Booking quote-first path | Improved | Customers can now paste links or upload estimate media, and uploaded media is appended to the photo-estimate links used by checkout/staff intake. |
| Fallback/error handling | Improved | Direct upload is env-gated and gracefully tells customers to paste links when upload is not enabled. Public lead forms show direct-contact fallback messaging if storage fails. |
| Matrix/release enforcement | Improved | Added a Build 167 release guard to keep lead forms, upload endpoint, schema markers, SQL, and roadmap docs visible in every release check. |

## Updated completion status after Build 167

| COMPETETIVE.md area | Current status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Homepage route choices and sticky CTA already exist. Continue measuring conversion. |
| Sticky CTA buttons | Complete | Global sticky CTA remains active. |
| Better service/package selector | Mostly complete | Booking chooser, condition helper, photo links, upload foundation, and admin intake review are present. |
| Service package cards | Mostly complete | Package aliases and add-on guidance are improved; next step is DB-managed content editing. |
| Add-on cards | Improved | Catalog coverage is broad; next step is real proof/examples per add-on. |
| Specials | Complete public foundation | Static `/specials` exists; admin-managed specials remain next. |
| Gift cards | Complete public foundation | Static guide exists and links to gift workflow. |
| Proof sections | Partial | Recent work/gallery exist; service/town-aware proof filtering remains open. |
| Ceramic coating page | Mostly complete | Existing page plus education support. Needs deeper FAQ/proof/schema automation. |
| Paint correction page | Mostly complete | Existing page plus education support. Needs real proof/result examples. |
| Interior/basic vs deep distinction | Mostly complete | Service chooser and condition helper now explain the difference. |
| High-value add-ons | Improved | More competitor-aligned add-ons are bundled. |
| Booking flow | Mostly complete | Direct quote-photo upload foundation, share links, condition helper, consent, and admin intake are present. |
| Admin service controls | Partial | Admin catalog/media workflows exist; public service/special/FAQ content still needs a DB-managed editor. |
| Schema/local SEO support | Improved | One-H1 checks continue; FAQPage/Breadcrumb foundations now exist on competitor routes. |
| Conversion blocks | Improved | Homepage, Services, sticky CTA, specials, gifts, fleet, maintenance, and education now interlink. |
| Maintenance plans | Complete public foundation | Public route and structured lead form now exist. |
| Fleet/commercial | Complete public foundation | Public route and structured lead form now exist. |
| Gallery system | Partial | Needs service/town filtering, proof approval, and media privacy eligibility. |
| Customer education content | Complete starter foundation | Blog hub and starter articles exist; add more practical local guides over time. |
| Pricing display strategy | Mostly complete | Quote-safe language and add-on expansion exist; analytics-driven improvements remain next. |

## Still open after Build 167

1. Apply Build 167 SQL and set upload/storage environment variables before relying on direct public uploads.
2. Add an Admin Leads screen for `public_inquiry_leads`.
3. Connect public leads to bookings/quotes with a staff conversion action.
4. Add admin review for `photo_estimate_uploads` and link uploaded media to booking intake.
5. Add DB-managed service, special, FAQ, and education content editing.
6. Add service/town-aware proof filtering for gallery and recent work.
7. Add a quote-builder screen that turns photo links/uploads and condition flags into package/add-on proposals.
8. Enforce gallery/social publishing eligibility from consent + media privacy review + blur/crop completion.
9. Add automated FAQPage/Breadcrumb generation from DB content once the CMS layer is live.
10. Add analytics for public lead form submits, upload attempts, upload failures, and quote-first conversion.

## Build 167 decision

The competitor roadmap is now largely represented in the public customer journey. The remaining work has shifted from “missing pages” to “admin-managed content, quote workflow, direct media review, lead conversion, and proof automation.”

---

# COMPETETIVE.md Completion Matrix — Build 166

**Updated:** 2026-05-23  
**Baseline:** `rosiedazzlers-dev(160).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 166 is a competitor-roadmap completion pass. The goal was not to copy another site, but to turn the public customer path into the service hub described in `COMPETETIVE.md`: clear service categories, quote-first paths, proof, gifts, specials, fleet/maintenance routes, education pages, and safer social/gallery readiness.

## Completion status

| COMPETETIVE.md area | Build 166 status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Existing homepage already targets mobile detailing in Oxford/Norfolk. Build 166 adds a stronger quick-path CTA block. |
| Sticky CTA buttons | Complete | Global sticky CTA bar now offers Book now, Send photos for estimate, Call/text, and Specials. |
| Better service/package selector | Mostly complete | Builds 161–165 added service chooser, condition helper, photo-estimate link capture, and admin intake review. |
| Service package cards | Mostly complete | Existing pricing/catalog package cards remain; customer-facing aliases now map to simpler decision language. |
| Add-on cards | Improved | Build 166 expands the bundled add-on catalog with pet hair, odour, shampoo, salt, headlight, glass coating, ceramic spray, trim, bug/tar, truck box, and fleet add-on entries. |
| Specials | Complete public foundation | New `/specials` page covers spring salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh quote starters. |
| Gift cards | Complete public foundation | New `/gift-cards` page gives the competitor-requested gift-card entry route and links to the existing gift system. |
| Proof sections | Mostly complete | Services already includes recent work/reviews/service-area proof. Next step is service/town-aware proof filtering. |
| Ceramic coating page | Mostly complete | Existing `/ceramic-coating` page remains; next step is deeper FAQ/schema/proof expansion. |
| Paint correction page | Mostly complete | Existing `/paint-correction` page remains; Build 166 adds an education article that reinforces honest result expectations. |
| Interior/basic vs deep distinction | Mostly complete | Booking condition helper and service chooser handle this; next step is more public FAQ copy and admin-managed content. |
| High-value add-ons | Improved | Data catalog now includes more competitor-listed add-ons with quote-safe/starting-price wording. |
| Booking flow | Mostly complete | Vehicle, service, condition, add-ons, photo links, recommendation, and notes/consent capture are present. Direct upload is still next. |
| Admin service controls | Partial | Admin catalog/media workflows exist, but full DB-first public service editor remains open. |
| Schema/local SEO support | Partial | Core pages have schema and one-H1 checks. Build 166 adds schema-backed public pages, but deeper FAQPage/Breadcrumb automation remains next. |
| Conversion blocks | Improved | Services and homepage now connect booking, quote-first, specials, gifts, fleet, maintenance, and education paths. |
| Maintenance plans | Complete public foundation | New `/maintenance` route explains plan types and links to existing maintenance-plan interest flow. |
| Fleet/commercial | Complete public foundation | New `/fleet` route gives the competitor-requested fleet/commercial service hub and quote checklist. |
| Gallery system | Partial | Gallery exists, but category filters and admin proof approval remain next. |
| Customer education content | Complete starter foundation | New `/blog` hub plus local articles for road salt, pet hair, ceramic/wax, paint correction, and mobile-detail prep. |
| Pricing display strategy | Mostly complete | Existing pricing uses transparent package/add-on structure; Build 166 adds more quote-safe content. |

## Still open after Build 166

1. Add direct customer upload, not only shared photo links.
2. Add service/town-aware proof filtering for gallery and recent work.
3. Add FAQPage and Breadcrumb schema automation to service and help pages.
4. Add admin-managed service/add-on/special/FAQ content so public copy can move away from static HTML.
5. Add quote builder that turns photo-estimate review into proposed packages/add-ons.
6. Add per-media privacy review records for individual job photos/videos.
7. Add gallery/social publishing eligibility that requires consent + privacy approval + blur/crop completion.
8. Add public maintenance/fleet inquiry forms that create structured leads.
9. Add more education pages from the competitor list, then connect them to booking analytics.
10. Add service-specific review/proof blocks when real reviewed jobs are available.

## Build 166 decision

`COMPETETIVE.md` is now substantially represented in the website/app. Remaining work is no longer “add the missing public pages” as much as “make the public pages DB-managed, measurable, and tied into quoting, proof, and privacy workflows.”

## Build 169 matrix follow-up — Reliability polish

Reliability/customer-trust item added after live check: login, account widgets, Admin Leads, and analytics must not expose raw 500s to visitors or staff. Build 169 improves this by returning safe degraded JSON from session checks, skipping analytics when storage is unavailable, and adding a favicon so the login page no longer reports the root icon 404. This supports the competitive goal of a cleaner, more trustworthy booking/account experience before adding more public lead-conversion features.

## Build 170 matrix follow-up — Account trust cleanup

Reliability/customer-trust item continued: customer account and booking pages should not look broken to signed-out visitors. Build 170 removes the dashboard 401 console noise by treating dashboard reads as optional customer context while keeping protected customer write actions guarded. This supports a smoother booking funnel and a more professional competitor-facing account experience before expanding quotes, memberships, and photo-estimate conversion.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## COMPETETIVE.md Completion Matrix — Build 175

| Area | Build 175 status |
| --- | --- |
| Lead → draft booking/quote conversion | Added safe conversion draft table and Admin Leads button. |
| Catalog-backed package/add-on price suggestions | Added Admin Leads pricing suggestions from the live pricing catalog/fallback catalog. |
| Quote draft status workflow | Added status controls for saved quote/proposal drafts. |
| Admin Content expansion beyond FAQ | Added generic content blocks for specials, service blurbs, homepage cards, help articles, trust proof, fleet, and maintenance. |
| Service/town proof filtering | Added public gallery service and town filters. |
| Media privacy before public reuse | Public gallery now filters out pending/private/rejected/needs-blur media unless sample/approved-public. |
| FAQ/help/lead/quote conversion analytics | Added admin conversion funnel summary endpoint. |

## Build 176 Update — conversion-to-booking, dashboard cards, and privacy warnings

- Added a reviewed conversion draft → real booking workflow so Admin Leads can create a live booking only after staff confirms service date, AM/PM slot, address, package, vehicle size, customer name, and customer email.
- Added Admin Analytics cards for FAQ/help/lead/quote conversion summary using `/api/admin/conversion_funnel_summary`.
- Added App Management media privacy readiness warnings using `/api/admin/media_privacy_review_summary` so gallery/social reuse is checked before publishing.
- Preserved the one-H1 exposed-page rule and kept local SEO wording/access paths focused on Oxford/Norfolk service discovery.
- Added Build 176 SQL/schema notes for `lead_conversion_drafts.converted_booking_id` and `lead_conversion_drafts.converted_at`.

### Build 176 matrix update

- Reviewed conversion draft → real booking: added foundation.
- Conversion analytics dashboard cards: added foundation.
- App Management media privacy warning check: added foundation.
- Still needs polish: full conversion review queue, final price reconciliation, privacy badges beside every publish action, and deeper local proof reporting by town/service.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.


> Build 178 documentation sync (2026-05-25): added conversion status saving, saved final price reviews, public content block rendering, media privacy badges, proof recommendations, schema note, and release guard coverage.

---

## Build 179 documentation sync — publish blocking, proof tasks, quote acceptance

Build 179 adds hard social publish blocking before webhook/API/manual posted actions, assignable local SEO proof tasks from proof recommendations, and customer-facing quote/proposal delivery plus accept/decline tracking. Schema tracking now points to `sql/2026-05-26_build179_publish_block_tasks_quote_acceptance.sql`. The one-H1 SEO rule, local service/town wording, and fallback-safe API pattern remain required on every pass.

### Build 179 update — hard social publish, proof tasking, quote acceptance

- Hard social publish blocking: added a Build 179 privacy gate before webhook/API/manual posted actions so drafts cannot be published until ready status and media/privacy confirmations are present.
- Local proof recommendations: Admin Analytics can now create assignable local proof tasks for town/service gaps.
- Quote acceptance: Admin Leads can prepare/send quote proposals, create customer response links, and track accepted/declined responses.
- Still outstanding: hard blocking should be extended to any future social/provider endpoints, proof tasks should become calendar/work assignments, and quote acceptance should trigger booking deposit/final confirmation flows.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a safer payment-request foundation. Staff can create a tracked deposit/payment request from an accepted quote/proposal draft, share the private `/quote-payment.html` customer page, mark deposits paid from Admin Leads, and link or confirm the final booking when a booking row is available. Schema tracking was updated for `public.quote_deposit_payment_requests` and the quote/conversion deposit status fields.

## Build 180 competitive completion update

| Capability | Build 180 status | Notes |
| --- | --- | --- |
| Accepted quote → deposit/payment request | Foundation added | Admin Leads can create a tracked deposit/payment request after quote acceptance. |
| Customer payment-review page | Foundation added | `/quote-payment.html` is private/noindex and reads request details through a secure token. |
| Deposit paid → booking confirmation | Foundation added | Staff can mark the request paid and confirm/link a booking when a booking row is available. |
| Provider-verified payment automation | Still outstanding | Next build should connect Stripe/PayPal webhook verification to `quote_deposit_payment_requests`. |
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

## Build 182 matrix update — payment reliability and refund controls

| Capability | Build 182 status | Notes |
|---|---:|---|
| Webhook event history | Foundation complete | Stripe/PayPal quote-deposit events are stored in `quote_payment_webhook_events` with provider id, type, status, replay status, processed payload, and error trail. |
| Retry/replay controls | Foundation complete | `/admin-payments.html` can replay stored verified settlement/refund events through `/api/admin/payment_webhook_event_replay`; unverified/failed events are blocked from blind replay. |
| Customer receipt emails | Foundation complete | Verified deposit settlement and staff manual mark-paid now queue `quote_deposit_receipt_email` notification events. |
| Refund/partial-refund tracking | Foundation complete | Provider refund webhooks and staff manual refund records write to `quote_deposit_refund_records` and update quote deposit refund totals/status. |
| Payment operations page | Foundation complete | `/admin-payments.html` gives staff a central place to review events, replay verified events, inspect deposit requests, and record refunds. |
| Automatic provider refund creation | Still outstanding | Build 182 tracks refunds after provider events or manual staff entry; it does not yet initiate refunds directly through Stripe/PayPal APIs. |
| Customer receipt delivery provider | Still outstanding | Receipt/refund emails are queued in `notification_events`; delivery still depends on the configured notification provider dispatch workflow. |

---

## Build 183 documentation sync — direct refunds, reconciliation export, webhook warnings, and image requirements

Build 183 adds direct Stripe/PayPal refund initiation from Admin Payments, a payment reconciliation CSV export, dashboard/payment-page warnings for failed or unverified webhook events, and a cleared/rebuilt `IMAGES.md` with missing image/video requirements and upload methods. This build is no-DDL and depends on the Build 180–182 payment tables. SEO/H1, local service/town wording, fallback-safe APIs, schema tracking, and Markdown synchronization remain required on every pass.

## Build 183 matrix update — payment reliability and media readiness

| Capability | Build 183 status | Notes |
|---|---|---|
| Direct Stripe/PayPal refund initiation | Foundation added | Admin Payments can initiate provider refunds and records the refund locally. |
| Payment reconciliation export | Foundation added | CSV export covers deposit requests, refund records, and webhook audit rows. |
| Failed/unverified webhook dashboard warnings | Foundation added | Dashboard and Admin Payments can surface payment webhook warnings. |
| Image/video missing-media inventory | Updated | `IMAGES.md` was cleared/rebuilt with missing add-on, package, regional, gallery, and video requirements. |
| R2 image health automation | Outstanding | Next step: build public URL scanner and Admin App warning card. |
| Accountant-ready payment export package | Outstanding | Next step: tie payment export to HST/GST/accounting close package. |


## Build 185 — Next 20 completed foundations

1. Added real image dimension validation to Media Health for PNG/JPEG/WebP files.
2. Added admin R2 upload endpoint with size validation and safe allowed folders.
3. Added DB-backed media task workflow with JSON fallback.
4. Added `public.media_asset_tasks` SQL foundation.
5. Added refund retry scan endpoint for pending/failed provider refunds.
6. Added payment variance warning summary.
7. Added processor-fee capture endpoint and Admin Payments fee field.
8. Added HST/GST review screen and tax summary endpoint.
9. Added receipt retry queue endpoint.
10. Added customer receipt HTML/download endpoint.
11. Added final-balance payment request tables and APIs.
12. Added payment application tables and APIs for deposits/invoices/refunds.
13. Added month-end close checklist table/API/screen.
14. Added dashboard warnings for missing media, undersized media, payment variances, and receipt retries.
15. Added Search Console/local SEO task card table/APIs/screen.
16. Added consolidated full accountant export endpoint.
17. Added processor-fee fields to `quote_deposit_payment_requests`.
18. Added `data/image_requirements_build185.json` for scan/task fallback.
19. Rebuilt `IMAGES.md` with exact upload keys, sizes, requirements, and methods.
20. Added Build 185 release guard and schema/docs synchronization.

## Next 20 recommended steps after Build 185

1. Deploy Build 185.
2. Apply `sql/2026-06-02_build185_next_twenty_ops_foundations.sql`.
3. Configure the Cloudflare Pages R2 bucket binding for admin uploads.
4. Upload the 12 missing add-on images listed in `IMAGES.md`.
5. Replace the eight regional placeholder hero images with Rosie-owned photos.
6. Test `/admin-media-health.html` upload, scan, and task creation.
7. Add R2 signed/direct browser upload support for larger video files.
8. Add media approval status transitions: assigned → uploaded → reviewed → approved_public.
9. Add automatic image alt-text suggestions from the media task label/category/town.
10. Add a public-page missing-media warning badge beside affected page links.
11. Test processor-fee capture on real Stripe and PayPal sandbox transactions.
12. Add automatic processor-fee import from Stripe balance transactions and PayPal captures.
13. Test `/admin-tax-review.html` and confirm HST assumptions with the accountant.
14. Test `/admin-close.html` for a month-end payment close dry run.
15. Add final-balance payment checkout links for Stripe and PayPal.
16. Add customer-facing final invoice/receipt PDF generation.
17. Add payment application posting into journal candidates.
18. Add variance approvals so resolved warnings stop showing on the dashboard.
19. Add Search Console API import for query/page data if credentials are configured.
20. Build the full accountant package zip with separate CSVs, PDF receipts, close checklist, HST summary, and journal candidates.


## Build 185 matrix update

Marked next-20 operational foundations as added: media dimension validation, R2 upload foundation, media tasks, refund retry scanning, payment variance warnings, processor fees, HST/GST review, receipt retry queue, customer receipt download, final balance requests, payment applications, month-end close checklist, local SEO task cards, missing-media dashboard warnings, and consolidated accountant export.

---

## Build 186 - verified water restrictions and next-20 planning sync (2026-06-02)

Build 186 corrected the service-area water-use guidance after source verification. Oxford County / Tillsonburg now uses the May 1-September 30 rule under Oxford County By-law No. 4193-2002: outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity, with residential hours of 6:00-9:00 a.m. or 6:00-9:00 p.m. and commercial/industrial hours of 8:00-10:00 a.m. or 3:00-5:00 p.m. Norfolk County now uses the May 15-September 15 Water Restriction By-law rule: 9:00-11:00 a.m. and 7:00-10:00 p.m., with odd/even house-number days and the first-24-hours sod exemption note.

Updated runtime/content areas: `data/service_area_rules.json`, `data/water_restriction_rules_build186.json`, booking fallbacks, Admin App service-area defaults, landing page content, `functions/api/water_restrictions_public.js`, `functions/api/admin/water_restrictions_audit.js`, and the Build 186 release guard.

Completed next-20 items for this pass:
1. Verified Tillsonburg/Oxford County water restrictions from the official Tillsonburg and Oxford pages.
2. Verified Norfolk County watering restrictions from the official Norfolk County page.
3. Corrected all Oxford County service-area rows in `data/service_area_rules.json`.
4. Corrected all Norfolk County service-area rows in `data/service_area_rules.json`.
5. Added the Tillsonburg water-restriction page as an official source for Tillsonburg rows.
6. Added `data/water_restriction_rules_build186.json` as a compact verified rule source.
7. Corrected booking fallback water rules in `book.html`.
8. Synced the `/book/` mirror.
9. Corrected Admin App default service-area water rules in `admin-app.html`.
10. Synced the `/admin-app/` mirror.
11. Corrected water wording in root landing-page public content.
12. Corrected water wording in the Functions landing-page public content copy.
13. Added `/api/water_restrictions_public` as a public safe fallback endpoint.
14. Added `/api/admin/water_restrictions_audit` as a staff DB audit endpoint.
15. Added a no-DDL SQL note for Build 186.
16. Updated `SUPABASE_SCHEMA.sql` with the Build 186 schema/data note.
17. Updated `DATABASE_STRUCTURE_CURRENT.md` with the water-rule data dependency note.
18. Updated `COMPETETIVE_COMPLETION_MATRIX.md` with water-rule accuracy progress.
19. Added `scripts/build186_verified_water_restrictions_check.py`.
20. Wired the Build 186 guard into `scripts/release_check.py`.

Next 20 steps to move toward:
1. Deploy Build 186.
2. Re-import/resave `data/service_area_rules.json` into Supabase if the `service_area_rules` table is live.
3. Test `/api/water_restrictions_public` for Oxford County and Norfolk County.
4. Test `/api/admin/water_restrictions_audit` while signed in as admin.
5. Check `/book` and confirm the selected service-area rules show the corrected wording.
6. Check `/admin-app` and confirm service-area defaults show the corrected wording.
7. Add an Admin App button to import bundled service-area rules into Supabase.
8. Add a visual warning when the DB service-area rules are older than bundled fallback rules.
9. Add a scheduled or manual source-verification checklist for municipal rule pages.
10. Add a public FAQ item explaining water-use timing for mobile detailing.
11. Add booking-time validation that reminds staff when a requested appointment conflicts with local water-use windows.
12. Add a customer-facing note that Rosie Dazzlers can bring water/power when needed, but municipal rules still need checking.
13. Add per-town temporary notice overrides for drought/emergency restrictions.
14. Add a service-area rule version field in Supabase.
15. Add admin change history for service-area rule edits.
16. Add local SEO copy snippets that mention the accurate county rules without over-promising availability.
17. Add a quick “Can we do exterior work at this time?” helper for staff dispatch.
18. Continue payment/tax work from Build 185: processor-fee imports and HST/GST review.
19. Continue media work from Build 185: R2 direct uploads, media approval transitions, and missing-media warnings.
20. Continue accountant export work: HST summary, journal candidates, receipts, and close checklist packaging.


## Build 187 Sync — Verified Local Page Water Rules (2026-06-03)

- Reverified Oxford/Tillsonburg, Woodstock/Oxford, and Norfolk water-use restrictions from official public sources.
- Corrected the static town landing-page shell so `/tillsonburg-auto-detailing/` and every other local page shows the water-use note even before client-side rendering.
- Added server-side landing-page enforcement so stale Admin App/DB landing-page rows cannot hide the corrected water-rule note.
- Added `data/water_restriction_rules_build187.json`, updated service-area/local SEO data, and added a no-DDL SQL note.
- Added a Build 187 release guard to check every local page for the correct Oxford/Norfolk water-rule language.


## Build 187 Completed Next 20

1. Reverified Tillsonburg/Oxford water restrictions from the official Town of Tillsonburg page.
2. Reverified Oxford County water-conservation communities and hours from the official Oxford County page.
3. Reverified City of Woodstock outdoor water-use wording from the official Woodstock page.
4. Reverified Norfolk County watering restrictions from the official Norfolk County page.
5. Added `data/water_restriction_rules_build187.json`.
6. Synced `data/water_restriction_rules_build186.json` so older fallback references are not stale.
7. Added Zorra Township to `data/service_area_rules.json` with the verified Oxford County water rule.
8. Added verified water-rule summaries to `data/local_seo_targets.json`.
9. Added static visible water-rule sections to all eight local town landing pages.
10. Updated `/tillsonburg-auto-detailing/` so the corrected Tillsonburg/Oxford rule is visible without waiting for JavaScript.
11. Updated `/woodstock-ingersoll-auto-detailing/` with Woodstock/Oxford verified rule wording.
12. Updated `/norwich-otterville-auto-detailing/` with Oxford verified rule wording.
13. Updated `/zorra-thamesford-embro-auto-detailing/` with Oxford verified rule wording.
14. Updated all Norfolk local pages with Norfolk May 15–September 15 odd/even and time-window wording.
15. Updated `assets/landing-page.js` to render a dedicated local water-use reminder card.
16. Updated `landing_pages_public.js` and `functions/api/landing_pages_public.js` to enforce verified local water rules over stale DB landing-page values.
17. Updated `/api/water_restrictions_public` to Build 187 fallback data.
18. Added CSS for local water-rule cards.
19. Added `sql/2026-06-03_build187_local_page_water_rules_no_ddl_note.sql`.
20. Added and wired `scripts/build187_local_page_water_rules_check.py`.


## Build 187 Next 20 To Move Toward

1. Deploy Build 187.
2. Hard refresh `/tillsonburg-auto-detailing/` and confirm the static water-use note appears.
3. Test `/api/landing_pages_public` for `tillsonburg-auto-detailing`.
4. Test `/api/water_restrictions_public?slug=tillsonburg-auto-detailing`.
5. Re-import the bundled service-area rules into Supabase if live DB rows are used.
6. Add an Admin App “sync verified service-area rules” button.
7. Add DB row version warnings when DB service-area rules are older than bundled fallback rules.
8. Add booking-time warnings when exterior work conflicts with a customer’s local water-use window.
9. Add address parity helper: even/odd address + date = “allowed/not allowed.”
10. Add staff “Can we use customer water at this time?” helper.
11. Add emergency/drought override rows by county/town.
12. Add municipal-source recheck reminders before each May water-restriction season.
13. Add Search Console/local SEO task cards for all town pages.
14. Add local proof cards to each town page once real before/after photos are uploaded.
15. Replace Wikimedia/placeholder region photos with Rosie-owned local photos.
16. Add Admin Media Health warnings beside local pages that still use placeholder photos.
17. Continue R2 signed/direct uploads for larger video files.
18. Continue processor-fee imports and HST/GST review.
19. Continue final balance invoice/payment request work.
20. Continue accountant export packaging with HST summary, journal candidates, receipts, and close checklist.

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.

## Build 188 completion update

| Capability | Build 188 status | Remaining work |
|---|---|---|
| Editable municipal water rules | Complete foundation | Apply SQL, test editor, add emergency overrides and stale-review warnings |
| Service-area rule de-duplication | Complete foundation | Re-save live DB rows with `water_rule_key` |
| Deploy-safe fallback architecture | Complete for water rules and pricing catalog loader | Continue migrating landing-page and business-profile defaults |
| Hard-coded content audit | Complete audit | Work through the 35 editable domains in priority order |
| Local page accuracy | Improved | Add automated official-source review reminders and local proof |
| Admin content operations | Improved | Add content-authority dashboard and diff/sync tools |


---

## Build 189 — Editable site settings and hard-coding reduction (2026-06-04)

This pass moves the next high-priority mutable content/configuration domains out of hard-coded JavaScript and into DB-first app-management settings with stable JSON fallbacks. Completed items:

1. Extracted large default landing-page fallback content from `functions/api/landing_pages_public.js` into `data/landing_pages_content.json`.
2. Added `functions/api/data/landing_pages_content.json` so Cloudflare Functions can import the same stable fallback.
3. Moved add-on landing-page templates out of JavaScript into the landing-page content fallback.
4. Added editable `business_profile` fallback data for identity, contact, social links, and structured-data values.
5. Added editable `site_policies` fallback data for deposit, cancellation, refund, driveway, water, power, and media privacy copy.
6. Added editable `document_templates` fallback data for notification, receipt, refund, quote, proposal, invoice, and confirmation templates.
7. Added editable `business_hours_holidays` fallback data for hours, closure days, and availability notes.
8. Added editable `navigation_footer` fallback data for top navigation and footer links.
9. Exposed dropdown/option libraries through the editable settings registry.
10. Added editable `analytics_event_registry` fallback data for analytics event keys and display labels.
11. Added stable `data/media_requirements.json` as the long-term media requirement fallback.
12. Added shared `functions/api/_lib/editable-settings.js` for DB-first / JSON-fallback setting loading.
13. Added protected `/api/admin/editable_site_settings` for staff editing.
14. Added public `/api/site_settings_public` for safe front-end consumption.
15. Added `/admin-site-settings.html` and `/admin-site-settings/` as the protected editor bridge.
16. Added Admin Menu and Admin Auth access for the new editor page.
17. Added `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
18. Updated `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md`.
19. Updated `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json`.
20. Added `scripts/build189_editable_site_settings_check.py` and wired it into `scripts/release_check.py`.

Next 20 steps after Build 189:

1. Deploy Build 189.
2. Apply `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.
3. Open `/admin-site-settings.html` and verify all editable domains load.
4. Save one small test edit to `business_profile`.
5. Save one small test edit to `site_policies`.
6. Sync the full landing-page fallback payload into `app_management_settings.landing_pages_content` only after reviewing size/performance.
7. Move live landing-page editor controls from raw JSON into a structured form.
8. Render public business profile values into structured data and page footer from `/api/site_settings_public`.
9. Render editable navigation/footer links from `navigation_footer`.
10. Wire editable policies into booking, FAQ, quote, and payment pages.
11. Wire document templates into quote delivery, deposit receipts, refund notices, invoices, and final confirmations.
12. Add business-hours and holiday-closure checks to booking availability.
13. Replace scattered hard-coded dropdown values with `option_libraries`.
14. Add analytics event validation against `analytics_event_registry`.
15. Replace build-specific media requirement checks with stable `media_requirements`.
16. Add a one-click “sync bundled JSON into DB setting” control for each editable domain.
17. Add setting version history or audit events.
18. Add field-level validation for each editable setting.
19. Add a public settings cache/version badge in Admin Diagnostics.
20. Continue moving remaining large inline page/content objects into DB-managed content blocks.

## Build 190 - Editable settings live rendering and diagnostics

Build 190 continues the editable-content migration by rendering public business profile, contact details, social links, navigation/footer links, policy notes, LocalBusiness structured data, analytics labels, and media requirements from DB-first editable settings with bundled JSON fallback. It adds validation, sync-from-bundle controls, DB/fallback diagnostics, and setting history support through `/admin-site-settings.html` and the Build 190 SQL migration.

---

## Build 191 — Editable settings hardening and live-use pass

- Fixed `/admin-site-settings.html` crash by adding `AdminAuth.guardPage()` and `AdminAuth.fetchWithAuth()` compatibility helpers and by making the page initialization defensive.
- Added structured helper fields for business profile and navigation/footer settings while keeping raw JSON available.
- Added editable setting dependency map and restore-from-history API foundations.
- Wired editable policy copy into booking, FAQ, quote-response, and quote-payment customer pages with a static fallback.
- Wired editable document templates into quote/proposal delivery plus deposit receipt/refund email queue helpers.
- Added business-hours/holiday status API and booking-page helper.
- Added analytics ingest validation against the editable analytics event registry.
- Switched Media Health JSON fallback from build-specific image requirement files to stable `data/media_requirements.json`.
- Added Build 191 release guard.

<!-- Build 192 documentation sync: editable-domain editors, restore-from-history UI, business-hours booking warnings, dynamic policies/templates, analytics registry warnings, media requirement sync/restore, and fallback diagnostics were reviewed on 2026-06-05. -->

---

## Build 193 documentation sync — 2026-06-05

This Markdown file was included in the Build 193 documentation sync. Build 193 fixes the Admin Social template-list 500, adds social-template fallback UI handling, strengthens editable-setting validation schemas, preserves the one-H1 SEO guard, and records that no new Supabase DDL is required for this pass.

---

## Build 194 — diff, preview, analytics quick-add, and option-library expansion — 2026-06-06

### Completed 20-step pass

1. Added `/api/admin/editable_site_settings_compare` for DB/editor versus bundled fallback JSON diffs.
2. Added visual compare controls in Editable Site Settings before force-sync or restore actions.
3. Added per-domain preview panes showing where each editable setting is used.
4. Added domain permission guidance beside each structured editor.
5. Added SEO copy-length checks for title, meta-description, H1/headline, and description-like fields.
6. Added history/fallback comparison support in the settings workflow without new database tables.
7. Added `/api/admin/analytics_registry_add_event` for one-click addition of unknown analytics events.
8. Added Admin Analytics “Add to registry” buttons on unknown event warnings.
9. Added `assets/admin-option-libraries.js` as a shared DB-first dropdown hydrator.
10. Expanded option-library dropdown usage into Admin Booking finance/status/privacy controls.
11. Expanded option-library dropdown usage into Admin Catalog stock and purchase-order controls.
12. Expanded option-library dropdown usage into Admin Leads lead, quote, draft, and media privacy status controls.
13. Fixed Admin App option-library loading to read the current `/api/site_settings_public?key=option_libraries` response shape.
14. Added business-hours warning display support to Admin Booking status saves when warning payloads are returned.
15. Added staff-auth capability aliases for `view_analytics` and `manage_settings` so analytics/settings utilities are not accidentally admin-password-only.
16. Normalized `/admin-site-settings.html` and `/admin-site-settings/` so the routed copy no longer lags behind the root page.
17. Normalized patched admin route copies for Analytics, Booking, Catalog, Leads, and App pages where route folders exist.
18. Added `sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql` documenting that no DDL is required.
19. Added `scripts/build194_diff_preview_option_libraries_check.py` and wired it into `scripts/release_check.py`.
20. Re-ran release/H1/archive checks for the packaged build.

### Next 20 recommended steps

1. Add full JSON Schema validation with field-level UI markers, not only required-path checks.
2. Add a side-by-side visual diff for selected history rows, not only current versus fallback.
3. Add role-scoped enforcement on save per editable domain once the staff role model has dedicated capabilities for content, media, analytics, and settings.
4. Add send-test controls for appointment confirmation, invoice, deposit receipt, refund notice, quote, and proposal templates.
5. Add invoice PDF/export packaging once invoice wording is approved.
6. Add customer-visible policy version stamping to bookings, quotes, invoices, and payment requests.
7. Add admin override reason logging when staff intentionally create or keep bookings on closed/holiday dates.
8. Add sub-day business-hours windows beyond AM/PM for exact arrival windows.
9. Add richer option-library dropdown hydration to finance, media-health, payments, content, and tax-review screens.
10. Add editable landing-page preview cards that render the actual hero, service, town, and FAQ copy.
11. Add broken-link scans for editable navigation/footer links.
12. Add local SEO proof gap reminders to the main dashboard diagnostics card.
13. Add sitemap/robots preview checks when landing-page content changes.
14. Add public structured-data preview for LocalBusiness and service landing pages.
15. Add template token previews with sample customer/booking data.
16. Add an audit export for editable-setting changes and restores.
17. Add scheduled fallback-backed settings reports for the dashboard.
18. Add media requirement diff/preview before restore-from-history.
19. Add automated smoke tests for invoice, confirmation, quote payment, booking availability, and settings APIs.
20. Continue migrating duplicated JSON/page content into DB-first editable settings where it reduces failure points.

---

## Build 195 documentation sync — 2026-06-06

Reviewed for Build 195. Current source of truth is the Build 195 section in `DEVELOPMENT_ROADMAP.md`, the gap update in `KNOWN_GAPS_AND_RISKS.md`, and the no-DDL schema note in `sql/2026-06-06_build195_schema_history_template_export_no_ddl_note.sql`.

> Build 196 documentation sync (2026-06-06): repaired the live Admin Dashboard local SEO proof 405, Admin App `esc` helper crash, and Landing Page Builder add-on fallback hydration. Schema status remains no-DDL; see `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_STRUCTURE_CURRENT.md`, `SUPABASE_SCHEMA.sql`, and `sql/2026-06-06_build196_admin_live_error_repairs_no_ddl_note.sql`.

---

## Build 197 documentation sync

Build 197 was reviewed during the self-healing admin diagnostics pass. Relevant implementation notes now point toward pricing catalog source/repair diagnostics, route-copy parity, independent dashboard fallback handling, landing-page SEO/readiness warnings, and continued one-H1/local-search discipline. No database DDL is required for this pass.

## Build 209 competitive sync — live-detail interaction (2026-06-17)

Current field-service/detailing products commonly emphasize mobile job photos, required checklists, customer portals, progress messaging, damage documentation, approvals, signatures, and proof of work. Build 209 advances Rosie Dazzlers in that direction with customer-now/admin-review/staff-only notes, photos, videos, protected media paths, moderation, and a customer timeline. Next differentiation should come from simple owner workflows, not enterprise complexity.


---

### Build 210 documentation sync — 2026-06-17

Active strategy is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. This file is retained for historical, audit, specialist, or release-check context. Build 210 connects live job interaction to proof, customer decisions, payment handoff, closeout summaries, approved-media reuse, safe review requests, and the owner attention queue.

Build 211 documentation sync: retained for historical context while the active project direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; production reliability, provider setup, hosted payment links, upload/retention diagnostics, and owner simplification were reviewed in this pass.

> **Build 212 documentation sync:** Active direction is maintained in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`. For real-world test instructions, use `docs/PRODUCTION_TEST_GUIDE.md` and `/admin-test-centre.html`; this file is retained for historical, audit, specialist, or release-check context.

## Build 213 documentation sync

Build 213 adds owner action controls in Today Needs Attention, customer price/summary acknowledgements, secure payment-link handoff, summary revision history, and booking-scoped safe interaction audit export. Active direction remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; use `docs/PRODUCTION_TEST_GUIDE.md` for hands-on testing.

---

### Build 214 documentation sync — 2026-06-23

Build 214 prioritizes Supabase containment and owner-task reliability. The active security action is to run `sql/2026-06-23_build214_security_task_orchestration.sql`, refresh Supabase Security Advisor, and test the application through Cloudflare Functions rather than restoring direct browser access to tables. Canonical planning remains in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

### Build 216 synchronization — 2026-07-01

Build 216 synchronized this retained document with the active `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`: public media recovery now uses bounded JPG/JPEG/WebP/PNG health checks and protected recurring alerts after its migration; DAIP remains planning-only behind the documented decision/security gates.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->

<!-- Build 210 documentation sync -->
<!-- Build 211 documentation sync -->
<!-- Build 212 documentation sync -->
<!-- Build 213 documentation sync -->
<!-- Build 214 documentation sync -->

<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
