<!-- README.md -->

> Last synchronized: March 25, 2026. Reviewed during the public account widget, reset/verification, analytics, SEO, security, and docs/schema refresh pass.

> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

# Rosie Dazzlers — Mobile Auto Detailing Platform
Cloudflare Pages + Supabase + Stripe/PayPal + R2

Rosie Dazzlers is now more than a brochure site. On the `dev` branch it is a role-aware operations platform for mobile detailing in Norfolk and Oxford Counties, with booking, gift certificates, customer progress, jobsite intake, staff/admin tools, recovery messaging, and catalog/inventory workflows.

---

## Last synchronized
- March 25, 2026
- This pass added session-aware internal workflow upgrades, DB-backed canonical pricing for checkout, mobile-friendly direct media upload, purchase-order receive/close actions, and another SEO/H1/doc/schema refresh.

---

## Stack
- Cloudflare Pages — static hosting + Pages Functions
- Supabase Postgres — core database
- Cloudflare R2 — media/assets
- Stripe — booking deposits and gift purchases
- PayPal — deposit checkout path
- DB-backed app settings now hold the canonical pricing catalog (`pricing_catalog`), with JSON still kept as the bundled fallback source

---

## Core customer flows
- Marketing pages: `/`, `/services`, `/pricing`, `/about`, `/contact`
- Booking flow: `/book`
- Gift certificates: `/gifts`
- Client account: `/login`, `/my-account`
- Customer progress page: `/progress.html?token=...`
- Public operational catalogs: `/gear`, `/consumables`

---

## Core admin flows
- Dashboard: `/admin.html`
- Bookings / scheduling: `/admin-booking.html`, `/admin-blocks.html`, `/admin-assign.html`
- Progress + moderation: `/admin-progress.html`
- Jobsite intake + moderation: `/admin-jobsite.html`
- Recovery rules/templates/testing: `/admin-recovery.html`, `/admin-app.html`, `/admin-analytics.html`
- Catalog / low stock / reorder workflow: `/admin-catalog.html`
- Staff / customer management: `/admin-staff.html`, `/admin-customers.html`, `/admin-account.html`

---

## Current architecture
Browser  
↓  
Cloudflare Pages static HTML  
↓  
Pages Functions in `/functions/api`  
↓  
Supabase Postgres  
↓  
Stripe / PayPal / provider dispatch integrations  
↓  
Cloudflare R2 assets + uploaded media

---

## Current direction
Highest-value work is no longer basic feature creation. The main need is consistency:
- real staff auth/session completion
- consistent staff identity across jobsite/progress/media/time flows
- gift redemption polish across all customer/account screens
- canonical pricing/add-on behavior everywhere
- stronger upload/mobile workflow
- continued SEO cleanup without exposing protected flows to indexing

---

## Source-of-truth docs
Read these first:
- `PROJECT_BRAIN.md`
- `CURRENT_IMPLEMENTATION_STATE.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DEVELOPMENT_ROADMAP.md`
- `REPO_GUIDE.md`
- `SUPABASE_SCHEMA.sql`

---

## Branch rule
Use `dev` as the active source of truth unless explicitly told otherwise.

## Last synchronized
- March 25, 2026
- This pass added a site-wide public account widget through the shared chrome, customer password reset + email verification token flows, lightweight public analytics tracking, and refreshed risk/docs/schema snapshots.

## Newly advanced in this pass
- public login/account status widget injected across public pages
- forgot password + email verification resend + token verification flows
- analytics tracking for page views, heartbeats, cart snapshots, and simple live-session reporting
- stronger public login/reset screen
- docs/schema refresh aligned to the current dev branch


### March 25, 2026 late-pass notes

This build now includes a dual-path public sign-in experience (client first, staff fallback in the UI), a restored signed-in identity panel on the main admin dashboard, and a stronger analytics screen for live online activity, daily traffic, countries, referrers, carts, and abandoned checkout review.

## Latest pass summary
This pass focused on staff-session consistency in progress flows, booking vehicle catalog normalization, form/layout cleanup, richer public gear/consumables filtering, and another schema/doc refresh. Vehicle year/make/model selection is now designed around official NHTSA vPIC data with an internal cache path for future DB-first use.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.
