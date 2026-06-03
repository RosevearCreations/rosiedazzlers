
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
