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
> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

# Build 171 documentation sync note

**Updated:** 2026-05-24

This Markdown file was reviewed during the Build 171 pass. Current source of truth remains `DEVELOPMENT_ROADMAP.md`. Build 171 adds the Admin Leads quote-starter workflow and no new DDL.

---
# Build 167 update

Build 167 sanity note: the public competitor journey now includes structured quote/maintenance forms and direct upload foundation; remaining gaps are admin leads, quote builder, media review, DB content, and proof filtering.

---

# Build 166 sync — COMPETETIVE.md completion pass

**Updated:** 2026-05-23

Build 166 attempts to complete the public-facing items from `COMPETETIVE.md` by adding public routes for specials, gift cards, fleet, maintenance, and education, expanding the add-on catalog, adding sticky CTAs, updating Services/Homepage routing, and documenting status in `COMPETETIVE_COMPLETION_MATRIX.md`. `DEVELOPMENT_ROADMAP.md` remains the source of truth.


---

# Build 165 sync — Booking photo-estimate link capture

**Updated:** 2026-05-22

Build 165 adds a public Booking Step 4 photo-estimate link field, sends the links through checkout, stores them in notes as a fallback, writes to optional `bookings.photo_estimate_links` when migrated, and shows clickable links in Admin Booking intake review. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 164 sync — Admin booking intake review actions

**Updated:** 2026-05-22

Build 164 adds staff action controls to Admin Booking for photo-estimate status, condition-review status, media/privacy status, privacy checklist flags, blur/crop flags, and a staff intake-review note. The action writes directly to optional booking fields when the Build 162/163/164 migrations are applied and falls back to booking notes if the optional columns are not live yet. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 163 sync — booking intake admin review

**Updated:** 2026-05-21

Build 163 adds fallback-safe direct booking intake field storage and a staff-facing Admin Booking panel for estimate intake, condition-helper recommendations, media-consent preference, and privacy-review status hints. Continue from `DEVELOPMENT_ROADMAP.md`, which remains the source of truth.

---

# Build 161 competitor sanity-check follow-up

Build 161 implements the next conversion-path step from the Build 160 sanity check: clearer package aliases, a Booking service chooser, and stronger photo-estimate guidance. The remaining competitor-aligned priorities are condition-based recommendations, photo upload/lead capture, consent/privacy workflow, FAQ/proof expansion, and DB-first service content.

---

# Competitor Sanity Check — Build 160

**Updated:** 2026-05-21  
**Source document reviewed:** `COMPETETIVE.md`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

## Purpose

This file captures the sanity check requested before continuing feature work. `COMPETETIVE.md` describes the target website/app experience: a clearer local service hub, stronger service/category pages, easier booking decisions, proof/reviews, gift cards, specials, social proof, and admin controls. Build 160 turns that into a prioritized implementation plan and keeps `DEVELOPMENT_ROADMAP.md` as the one source of truth.

## Current website/app position

### Strong or mostly present

| Area | Current state | Build 160 decision |
| --- | --- | --- |
| Local service foundation | Homepage, Services, Pricing, Booking, Gallery, About, Contact, town pages, and key service landing pages exist. | Keep improving local wording and proof blocks rather than rebuilding from scratch. |
| One-H1 SEO habit | Release check guards against exposed HTML pages with more than one H1. | Continue every pass. |
| Core service pages | Paint correction, ceramic coating, pet hair removal, odor removal, headlight restoration, clay/sealant/polish add-on pages exist. | Add missing FAQ/proof/expectation details before expanding more pages. |
| Booking/pricing engine | Live planner, vehicle size, add-ons, availability, service-area logic, and admin pricing/catalog foundations exist. | Improve package recommendation and photo-estimate guidance next. |
| Admin app | Admin catalog, app settings, service/page editing, social queue, job/progress, accounting, payroll, booking blocks, and media tools exist. | Consolidate public service content into DB/admin-managed source over time. |
| Social workflow | Draft queue, review gates, planned publish time, template/hashtag pickers, duplicate warnings, and publish/webhook attempt path exist. | Add consent capture, media privacy/blur status, and platform previews next. |
| Proof assets | Before/after gallery, recent work mount, reviews fallback, local pages, and media library foundations exist. | Make proof service/town-aware and admin-managed. |

### Partial or needs tightening

| Area | Gap | Desired outcome |
| --- | --- | --- |
| Service hub clarity | Services page has package cards, but the competitor roadmap wants a simpler decision path first. | Add “which service should we choose?” guidance above package cards. |
| Package naming | Current packages do not exactly map to Express Interior Refresh / Full Interior Detail / Interior Detail Pro / Exterior Wash & Protect / Full Detail. | Add display aliases or service tiers without breaking existing pricing codes. |
| Photo estimate path | Booking supports media/progress pieces, but public “send photos for estimate” needs stronger CTA and routing. | Add clear quote/photo estimate CTA across Services, Booking, and Contact. |
| Specials | Seasonal/multi-vehicle/senior/fleet/headlight special ideas exist in roadmap, but not as a mature content module. | Add admin-managed specials/promos cards tied to public pages. |
| Gift cards | Gifts exist, but service-specific gift merchandising needs stronger public copy. | Add Interior Detail, Full Detail, and custom amount gift cards as clear cards. |
| FAQ and customer education | Some landing pages include educational copy, but FAQ coverage is inconsistent. | Add structured FAQ blocks to high-value pages. |
| Reviews/proof | Recent work and gallery exist, but not automatically filtered by town/service. | Filter reviews/recent work by town, service, and add-on where possible. |
| Admin content authority | Some public content still comes from static JSON/HTML. | Move high-change service, add-on, proof, and specials content toward DB-first admin controls. |

### Missing or future work

| Area | Missing capability | Why it matters |
| --- | --- | --- |
| Package recommender | Customer answers do not yet generate a clear recommended package/add-on bundle. | Reduces confusion and improves conversion. |
| Consent-driven public media | Social queue has staff review gates, but booking/progress consent capture still needs completion. | Protects customer privacy before social or gallery use. |
| Media privacy status | No full plate/face/address blur/crop workflow yet. | Needed before scaling social and public gallery automation. |
| Social performance reporting | Schema exists for metrics snapshots, but dashboards/forms need completion. | Lets Rosie Dazzlers learn which posts drive bookings. |
| GBP/Search Console reporting | Not connected into admin analytics yet. | Helps measure local relevance/prominence work. |
| Clean repo replacement | GitHub web uploads can leave stale files. | A clean/orphan branch replacement should happen after deploy stability. |

## Competitor-roadmap priority ranking

1. **Highest conversion impact:** Service chooser, quote/photo CTA, clearer package aliases, booking recommender.
2. **Highest local SEO impact:** Town/service proof filtering, FAQ blocks, specials/gifts pages, GBP/Search Console reporting.
3. **Highest operational impact:** DB-first service content, admin-managed specials/gifts/proof, stronger fallback/error health panels.
4. **Highest safety/compliance impact:** consent capture, media privacy/blur status, owner approval roles for social publishing.
5. **Highest long-term cleanup impact:** clean repo branch, stale file retirement, JSON-to-DB migration for duplicated service content.

## Build 160 completed actions

1. Reviewed `COMPETETIVE.md` against the current file/app structure.
2. Identified current strong areas: local pages, service pages, booking/pricing, social queue, admin app, and release checks.
3. Identified partial areas: service hub clarity, package aliases, photo-estimate CTA, specials, gifts, FAQ/proof filtering, and admin content authority.
4. Identified future work: recommender logic, consent capture, media privacy status, social metrics dashboards, GBP/Search Console reporting, and clean branch replacement.
5. Added a competitor sanity check section to `DEVELOPMENT_ROADMAP.md` as the top source of truth.
6. Added this companion `COMPETITOR_SANITY_CHECK.md` for traceability.
7. Added `COMPETITOR.md` and `COMPETETOR.md` aliases so future chats can find the competitor document even with spelling variations.
8. Updated `KNOWN_GAPS_AND_RISKS.md` with competitor-aligned open risks.
9. Updated `CURRENT_IMPLEMENTATION_STATE.md` with the Build 160 current-vs-target summary.
10. Updated `SANITY_CHECK.md` with the Build 160 release/sanity result.
11. Updated `README.md`, `NEW_CHAT_STATUS.md`, and `HANDOFF_NEXT_CHAT.md` so the next chat starts from the competitor-aligned roadmap.
12. Added a no-DDL SQL note for Build 160.
13. Added `scripts/competitor_roadmap_check.py`.
14. Wired the competitor roadmap check into `scripts/release_check.py`.
15. Updated Services page with a plain-language “which service should we choose?” decision guide.
16. Added a stronger photo estimate / quote CTA section on Services.
17. Kept Services page at one H1.
18. Synced `/services.html` and `/services/index.html`.
19. Preserved Build 156–159 social workflow and review gates.
20. Preserved existing SEO/H1 and Cloudflare release checks.

## Recommended next 20 steps

1. Apply any pending SQL migrations through Build 159 before testing social queue workflows.
2. Deploy Build 160 and confirm Cloudflare Pages Functions build succeeds.
3. Confirm Services page decision guide displays correctly on desktop and mobile.
4. Add matching service chooser guidance to the Booking page step flow.
5. Add package display aliases: Express Interior Refresh, Full Interior Detail, Interior Detail Pro, Exterior Wash & Protect, Full Detail, Paint Enhancement, Paint Correction Quote, Ceramic Protection Quote.
6. Add photo-estimate upload guidance to Booking and Contact.
7. Add a simple package-recommendation engine based on vehicle type, service type, condition, add-ons, and photos.
8. Add customer-facing consent capture for public/social before-after usage.
9. Add media privacy fields: plate reviewed, face reviewed, address reviewed, blur/crop required, blur/crop complete.
10. Add FAQ blocks to Paint Correction, Ceramic Coating, Pet Hair Removal, Odor Removal, Headlight Restoration, and Services.
11. Add admin-managed specials/promos cards for seasonal salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh offers.
12. Improve gift-card merchandising with service-specific gift cards and custom amount cards.
13. Add public proof filtering by service and town.
14. Add admin controls for which reviews/recent work appear on each service/town page.
15. Move high-change service/add-on page copy from static HTML/JSON toward DB-first admin-managed content.
16. Add Search Console and Google Business Profile reporting notes into admin analytics.
17. Add social performance entry/reporting using `social_post_metrics_snapshots`.
18. Add platform preview cards in Admin Social Queue.
19. Plan a clean/orphan branch replacement after deploy stability to remove stale GitHub files.
20. Keep `DEVELOPMENT_ROADMAP.md` as the single source of truth and treat older roadmap files as historical references.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.


## Build 175 update — lead conversion, pricing suggestions, content expansion, gallery privacy, and analytics

- Added safe lead → draft booking/quote conversion using `public.lead_conversion_drafts` instead of creating live scheduled bookings too early.
- Added catalog-backed package/add-on price suggestions for Admin Leads from the current pricing catalog.
- Added quote draft status workflow controls: draft, needs review, ready to send, sent, accepted, declined, archived.
- Expanded Admin Content Center beyond FAQ with reusable content blocks for specials, service blurbs, homepage cards, help articles, trust proof, fleet, and maintenance copy.
- Added service/town filtering for the public before/after gallery and enforced public reuse only for approved-public/sample media.
- Added FAQ/help/lead/quote conversion analytics summary endpoint for admin reporting.
- Added SQL/schema sync in `sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql`.
