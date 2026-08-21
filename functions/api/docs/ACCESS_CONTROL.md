> **DOCUMENT STATUS — Build 260:** Historical/specialist reference. Current implementation state lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`. Retained for audit, release compatibility or specialist detail; it does not override those two living authorities.

> Build 173 documentation sync (2026-05-24): Admin Content Center, FAQ editor APIs, expanded Help Articles access/content, public Help nav link, and schema no-DDL note were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `COMPETETIVE_COMPLETION_MATRIX.md`, and `SANITY_CHECK.md` for the active plan.

> Build 172 documentation sync (2026-05-24): Public FAQ page/content access, `/api/public_faqs`, `public_faq_entries` SQL foundation, sitemap/nav/footer links, and competitive-matrix status were updated. See `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and `COMPETETIVE_COMPLETION_MATRIX.md` for the active plan.

> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

# Rosie Dazzlers Access Control Model

## Purpose
This document defines the first structured access model for the Rosie Dazzlers app so future development can safely support:
- Admin users
- Senior Detailers
- Detailers
- Customers
- Customer tiers (random, regular, silver, gold, vip)

This file is the human-readable rulebook that sits beside the database schema.

---

## 1) User groups

### A) Admin
Highest privilege level.

Typical abilities:
- View all bookings
- Edit all bookings
- Assign staff
- Enable or disable progress links
- Post and edit progress
- Post and edit media
- Create or remove date blocks and slot blocks
- Create and disable promo codes
- Override detailer-entered intake information
- Manage staff users and permissions
- View all internal notes
- View override history

Examples:
- Owner
- Business manager
- Lead admin

---

### B) Senior Detailer
High trust operational user.

Typical abilities:
- View assigned bookings
- View job-site intake
- Edit job-site intake
- Post progress and media
- Mark work status changes
- Record arrival / work / break times
- Override lower-level detailer entries when needed
- Add internal notes
- View customer-visible progress link
- Update assigned booking details within allowed scope

Restrictions:
- Should not manage global promo settings
- Should not manage staff accounts unless explicitly granted
- Should not change system-wide configuration unless explicitly granted

Examples:
- Lead mobile detailer
- Trainer
- Experienced trusted operator

---

### C) Detailer
Operational field user.

Typical abilities:
- View assigned bookings
- Fill out pre-job intake
- Post progress updates
- Attach media
- Start / stop / break time tracking
- Record on-site notes
- Record owner acknowledgement details
- Submit work completion updates

Restrictions:
- Cannot override senior detailer or admin changes
- Cannot manage promos
- Cannot manage staff users
- Cannot change blocked dates / slot availability by default
- Cannot edit bookings outside their allowed scope
- Cannot see sensitive admin-only financial controls unless explicitly allowed

Examples:
- Field detailer
- Assistant detailer
- Junior team member

---

### D) Customer
Public-facing user connected to a booking or customer profile.

Typical abilities:
- View booking-specific progress page through token link
- View customer-visible progress notes
- View customer-visible media
- Submit signoff
- View status of their own booking
- Potentially log in later if account system is added

Restrictions:
- Cannot see internal notes
- Cannot see internal-only media
- Cannot see staff notes
- Cannot edit booking pricing or operational controls
- Cannot access admin pages

---

## 2) Staff role codes

Current planned role codes:
- `admin`
- `senior_detailer`
- `detailer`

These are stored in:
- `public.staff_users.role_code`

Permission booleans in `staff_users` control extra privileges:
- `can_override_lower_entries`
- `can_manage_bookings`
- `can_manage_blocks`
- `can_manage_progress`
- `can_manage_promos`
- `can_manage_staff`

This means role + permission flags can work together.

Example:
A senior detailer may normally not manage promos, but could be granted it later without redesigning the entire role system.

---

## 3) Customer tiers

Customer tiers are business/value segments, not security roles.

Current planned tier codes:
- `random`
- `regular`
- `silver`
- `gold`
- `vip`

These tiers are stored in:
- `public.customer_tiers`
- `public.customer_profiles.tier_code`
- optionally copied onto bookings as `customer_tier_code`

### Customer tier meaning
- **random**: one-off / unknown / first-time customer
- **regular**: returning customer
- **silver**: good repeat customer
- **gold**: high-value or priority customer
- **vip**: top-tier preferred customer

### Intended future uses
Customer tiers may affect:
- priority booking windows
- preferred scheduling
- loyalty offers
- manual promo logic
- customer service priority
- reminder / follow-up handling

Important:
Customer tier is **not** the same as access permission.
A VIP customer still remains a customer in the access system.

---

## 4) Override rules

### Detailer
- Can create intake and progress entries
- Can edit their own entries if editing is allowed
- Cannot override senior detailer or admin entries

### Senior Detailer
- Can override detailer-entered intake/progress/media
- Override action should be logged in `staff_override_log`

### Admin
- Can override any lower-level operational entry
- Override action should be logged in `staff_override_log`

### Override logging
Whenever a higher-trust staff member changes another staff member’s protected entry, log:
- booking id
- source table
- source row id
- previous staff user
- overriding staff user
- reason
- summary of change

---

## 5) Visibility levels

Current main visibility values:
- `customer`
- `internal`

Used in:
- `job_updates.visibility`
- `job_media.visibility`

### Customer visibility
Visible to:
- customer progress page
- admin
- appropriate staff

### Internal visibility
Visible to:
- admin
- permitted staff only

Never visible to customer progress page.

---

## 6) Booking access model

### Admin
Can access all bookings.

### Senior Detailer
Should be able to access:
- assigned bookings
- optionally unassigned bookings if granted
- bookings they are supervising

### Detailer
Should be able to access:
- assigned bookings only
- maybe temporarily shared bookings if explicitly assigned

### Customer
Can access:
- only the booking tied to their progress token or future account link

---

## 7) Job-site intake ownership

The `jobsite_intake` record belongs to:
- one booking
- usually one active detailer or senior detailer session
- but may later be updated by a higher role

Important fields:
- `detailer_name`
- `last_updated_by_staff_user_id`

Future rule:
- track who last edited intake
- prevent silent overwrites by lower-trust users

---

## 8) Time tracking access

Planned rules:
- Detailer can record arrival/start/stop/break
- Senior Detailer can correct or override detailer time logs
- Admin can correct all time logs
- All overrides should be auditable

Time data should eventually support:
- arrival time
- work start time
- work stop time
- break start / stop
- weather breaks
- unscheduled breaks
- total paid work time
- total paused time

---

## 9) Live progress model

As a job runs:
- Detailer posts progress notes
- Detailer attaches photos/media
- Customer sees customer-visible items
- Admin sees everything
- Senior Detailer sees assigned and permitted jobs
- Internal notes never appear on customer page

This should support:
- real-time admin visibility
- customer visibility
- field updates without exposing internal details publicly

---

## 10) Future authentication path

Current state:
- admin pages use shared admin password in page/API flow
- customer progress uses token link

Future recommended direction:
- staff login system
- role-based session management
- customer login / profile access
- per-user audit trail
- per-action authorization checks
- token + session hybrid for customer progress

### Recommended implementation order
1. keep shared admin password working
2. add staff user records
3. add staff login/session layer
4. enforce role-based page/API access
5. add customer profile/account layer later

---

## 11) Practical development rules

When building future pages/endpoints:

### Rule 1
Never assume all staff are admins.

### Rule 2
Never expose internal notes or internal media to customer pages.

### Rule 3
Customer tier is business segmentation, not staff privilege.

### Rule 4
Any override by a higher role should be auditable.

### Rule 5
Assigned detailers should only see the bookings they are supposed to work on unless explicitly granted wider access.

### Rule 6
Do not remove the current token-based customer progress system while building staff authentication.

### Rule 7
Prefer additive changes over destructive rewrites.

---

## 12) Immediate next implementation targets

After this document, the best next build steps are:

1. create `admin-staff.html`
2. create `/functions/api/admin/staff_list.js`
3. create `/functions/api/admin/staff_save.js`
4. update job-site intake save/load to include `staff_user_id`
5. add role-aware restriction checks to admin/jobsite/progress endpoints
6. build time-tracking tables and endpoints
7. build live job-site dashboard view for admin

---

## 13) Summary

This system has three main layers:

### Staff permissions
Who can do operational work and who can override it

### Customer visibility
What the customer can see during booking progress

### Customer business tier
How valuable / recurring the customer is from a service and loyalty perspective

These must remain separate concepts so the system stays clean and flexible.


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.

- Pass 22 sync: fixed admin-accounting date/input layout, moved admin-staff to a left-side internal menu layout, normalized admin login redirects to .html, and added clean admin route rewrites for payroll/staff/accounting/app/login.

---

## Pass 24 Sync — 2026-04-17

This pass focused on three areas:
- normalized the shared top admin navigation and repaired the off-pattern `admin-assign` header so the top menu matches the other admin screens more closely
- shifted the public self-serve direction back to a booking-led planner on the pricing page by embedding the live booking experience so customers keep the exact service-area restrictions, 21-day availability windows, slot logic, and booking aesthetics instead of using a separate quote-builder path
- continued the scheduled e-gift direction by exposing public growth settings, improving the gift message/send-date experience, and adding live recipient/delivery preview boxes on the gifts page

Schema impact for this pass: no new tables or columns. Existing `app_management_settings` is reused for public quote, e-gift, and membership display settings.

Pass sync: April 17, 2026 — pricing now restores the booking page as the first self-serve step by embedding the live booking planner on /pricing so service-area restrictions, 21-day availability windows, add-on logic, and booking aesthetics stay in one source of truth.
- 2026-04-17 pass26: extended booking-led self-serve with live embedded planner summaries on pricing and service-gift redemption preview, plus richer gift delivery metadata (sender name, preferred send date, message) through checkout, webhook, receipt, and printable certificate.

### April 17, 2026 pass27 note
- moved the next public growth step forward with a new `/maintenance-plan` page, recurring-plan waitlist capture, admin visibility for recurring reminder candidates, and stronger booking-link carry-forward from the live embedded planner.

---
Pass 28 sync — 2026-04-20
- Continued the booking-led self-serve direction instead of replacing it with a separate quote-only tool.
- Added scheduled e-gift delivery automation groundwork and live processor routes, plus printable gift lookup by code.
- Moved recurring maintenance reminders from interest-list based to customer-history based, so reminder timing now keys off completed bookings and real last-service dates while the interest list stays available for demand tracking.
- Strengthened visible live-booking / availability prompts and refreshed the documentation/schema trail for this pass.


<!-- pass29-sync: customer-history recurring maintenance reminders -->


<!-- pass31-sync: booking overflow polish, maintenance conversion from complete detail, fleet handoff path -->
> Pass sync April 20, 2026: booking vehicle inputs and service cards were tightened to prevent text overflow, My Account now uses a real garage-bay view plus a fleet handoff path after 6 vehicles, and maintenance conversion now begins only after a completed Complete Detail with repeat-booking guidance tied to actual service history.

> Pass sync April 21, 2026: added mileage and next-service mileage capture, customer vehicle image/video library groundwork, garage-bay photo support, a public before/after slider gallery, admin vehicle-media override/delete tools, and detailer arrival geolocation capture groundwork.

## 2026-04-22 doc sync

- reviewed during the merchandising / SEO / geofence refinement pass
- no file-specific workflow changes were required beyond the centralized roadmap, schema, repo-guide, and handoff updates

<!-- Build 145 sync 2026-05-15: reviewed during catalog DB import/admin workflow/local SEO pass. Active release discipline remains one-H1, local wording, fallback safety, and schema/Markdown synchronization. -->

<!-- Build 146 sync 2026-05-15: Amazon CSV catalog matching/enrichment pass; docs/schema reviewed; keep one-H1, local SEO, CSS overflow, privacy-safe generated data, and DB-first inventory migration discipline. -->

## Build 152 synchronization note

Reviewed during the 2026-05-18 Cloudflare Pages Functions deploy hotfix. No content-specific workflow change was required here; active handoff/schema docs carry the detailed Build 152 notes.

---
> Build 174 documentation sync (2026-05-24): persistent quote/proposal drafts were added to Admin Leads with save/load APIs, SQL table foundation, schema notes, and release guard coverage. Quote starters remain copy-ready before the SQL is applied, but saved drafts require sql/2026-05-24_build174_quote_proposal_drafts.sql.
> Build 177 documentation sync (2026-05-25): added protected conversion-draft review queue, catalog-backed final price reconciliation, local SEO proof coverage reporting, public gallery privacy badges, SQL/schema notes, and release guard coverage.

---

### Build 180 update — accepted quote deposit/payment request and final booking confirmation

Build 180 connects the accepted quote workflow to a tracked deposit/payment request and final booking confirmation foundation. Staff can create a deposit request from an accepted quote, share the private `/quote-payment.html` page, record deposits paid, and link/confirm the final booking when available.
---

> Build 181 documentation sync (2026-05-26): Added verified Stripe/PayPal webhook settlement for `quote_deposit_payment_requests`, PayPal quote-deposit order/capture support, automatic deposit-paid updates, booking confirmation linking, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard and local service/town wording rules remain required on every pass.

> Build 182 documentation sync (2026-05-26): Added quote-deposit webhook event history, verified-event replay controls, customer receipt email queueing, manual/provider refund and partial-refund tracking, `/admin-payments.html`, SQL/schema tracking, and release guard coverage. The one-H1 SEO guard, local service/town wording, fallback-safe APIs, and Markdown/schema synchronization remain required on every pass.

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

## Build 188 documentation sync — 2026-06-04

Build 188 replaces hard-coded municipal water-rule wording with a DB-first editable authority and one stable JSON fallback. The immediate `landing_pages_public.js` Worker startup crash is fixed without reintroducing mutable rule text into JavaScript. See `EDITABLE_CONTENT_SANITY_CHECK.md` and `data/editable_content_registry_build188.json` for the broader hard-coding audit.



---

## Build 189 — Editable site settings and hard-coding reduction (2026-06-04)

Build 189 adds the DB-first / JSON-fallback editable-settings foundation for landing-page fallback content, business profile, policies, document templates, hours/holidays, navigation/footer, option libraries, analytics labels, and media requirements. See `/admin-site-settings.html`, `/api/admin/editable_site_settings`, `/api/site_settings_public`, and `sql/2026-06-04_build189_editable_site_settings_foundation.sql`.

## Build 190 - Editable settings live rendering and diagnostics

Build 190 continues the editable-content migration by rendering public business profile, contact details, social links, navigation/footer links, policy notes, LocalBusiness structured data, analytics labels, and media requirements from DB-first editable settings with bundled JSON fallback. It adds validation, sync-from-bundle controls, DB/fallback diagnostics, and setting history support through `/admin-site-settings.html` and the Build 190 SQL migration.

---

## Build 197 documentation sync

This Markdown file was checked during the Build 197 self-healing admin diagnostics pass. No schema DDL is required for the pricing diagnostics, route-copy parity, independent dashboard fallback handling, or landing SEO/readiness warning work.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->

<!-- Build 245 synchronized 2026-08-06: current authority remains AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md; go-live authority is STARTUP_GO_LIVE_BLOCKERS.md. -->

Build 210 documentation sync
Build 211 documentation sync
Build 212 documentation sync
Build 213 documentation sync
Build 214 documentation sync
<!-- BUILD240_SYNC: Build 240 transactional inventory posting/reversal documentation authority retained. -->

<!-- Build 246 synchronization: current authorities are AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, and STARTUP_GO_LIVE_BLOCKERS.md; historical content retained for audit. -->

<!-- BUILD247_SYNC: 2026-08-07 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | DAIP media: /admin-daip-media.html | Private R2 binding: DAIP_MEDIA_BUCKET -->

<!-- BUILD248_SYNC: 2026-08-09 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | STARTUP_GO_LIVE_BLOCKERS.md is specialist runbook | Supplier review + private DAIP story evidence + content-package gate -->

<!-- BUILD249_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Specialist runbook: STARTUP_GO_LIVE_BLOCKERS.md | Inventory recovery: reviewed existing-row Amazon refresh -->

<!-- BUILD250_SYNC: 2026-08-10 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public services clarity + rosie-assets/CarPhotos runtime manifest -->

<!-- BUILD253_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Photo Studio: /admin-photo-studio.html | Public manifest: /api/public_website_images | Migration: sql/2026-08-12_build253_photo_management_studio.sql -->

<!-- BUILD251_SYNC: 2026-08-11 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Gate C dark-theme readability + approved rosie-assets/CarPhotos context -->
<!-- BUILD252_SYNC: 2026-08-12 | Living authorities: AI_PROJECT_HANDOFF.md + MASTER_VALUE_ROADMAP.md | Public packages/landing_pages/CarPhotos R2 assignment -->
<!-- BUILD254_SYNC: 2026-08-12 | Existing authored images protected; explicit Photo Studio override only; automatic R2 matching fallback-only; Photo Studio reflow hotfix. -->

<!-- BUILD255_SYNC: 2026-08-12 | Photo Studio click-to-edit drawer + explicit grouped website target dropdown; no automatic image reassignment. -->
<!-- BUILD256_SYNC: 2026-08-12 | Photo assignment labels + checked occupied targets + explicit Before/After pairs; no automatic image reassignment. -->

<!-- BUILD257_SYNC: 2026-08-13 | Cloudflare 1102 hotfix: database-first photo reads; bounded explicit R2 sync; compact public manifest; no image reassignment. -->
<!-- BUILD258_SYNC: 2026-08-13 | Public photo consistency + Gallery expansion + safe unassigned cleanup; Build257 resource boundary retained. -->

<!-- BUILD259_SYNC: 2026-08-13 | Comprehensive explicit public image targets + owner-editable add-on/maintenance content + vehicle-size review + editable quote pipeline | Migration: sql/2026-08-13_build259_vehicle_size_review.sql -->

<!-- BUILD260_SYNC: 2026-08-18 | Cursor-paged Photo Studio R2 sync + batched exact-key upsert; multi-placement/reset; current Startup evidence/cache/UI health; database-first Media Health; clarified DAIP project/Dry Run/Gate C roles; two living Markdown authorities. -->

<!-- BUILD262_SYNC: 2026-08-20 | P0 Worker CPU stabilization + browser-local diagnostics + observability setup. -->
