> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 generated chart-assets pass
This repo now includes generated local legacy pricing charts at `/assets/brand/CarPrice2025.PNG` and `/assets/brand/CarPriceDetails2025.PNG`, plus `scripts/generate_pricing_chart_images.py` to rebuild them from the bundled canonical pricing JSON.


# Rosie Dazzlers — Mobile Auto Detailing Platform

## Latest pass highlight — April 14, 2026
This pass focused on finishing the App Management pricing editor so it reads more clearly for office use. Checkbox rows are now aligned in a cleaner two-column layout, add-on quote checkboxes retain their current aligned presentation, package reporting now distinguishes package families from size-based price points, and the package editor now explains that one package family can contain multiple size prices while still remaining a single source of truth.


## Latest pass highlight — April 13, 2026
This pass tightened build stability instead of broadening the public workflow surface. The repo now includes a real `functions/api/social_feed_public.js` endpoint for both the public site and App Management reload flow, the duplicate accounting GL object keys were removed to eliminate avoidable Pages warnings, booking remains intentionally locked/stable, and `_redirects` remains the complete compatibility layer for the current route model.


## Latest pass highlight — April 12, 2026
This pass completed the public pricing/source-of-truth repair: booking, services, pricing, checkout, and shared public helpers now read the same canonical pricing catalog shape first, preserve service-area rules and charts, and fall back cleanly to the bundled catalog when the API or app setting is incomplete.

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
- canonical pricing/add-on behavior everywhere, including booking windows, service-area rules, and public requirement labels
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


### March 26, 2026 pass highlights
- Fixed public brand references to the new `brand/Untitled.png` logo asset.
- Continued local SEO cleanup for Oxford County and Norfolk County public pages.
- Added stronger admin catalog movement-history and booking usage UI on top of the existing inventory movement endpoints.
- Continued reducing shared-password dependence by letting newer progress tooling trust the signed-in staff session first.


### Latest pass
This pass repaired booking add-on imagery, continued local SEO tuning for Oxford and Norfolk counties, hardened public catalog search inputs against credential autofill, and expanded Admin Catalog with low-stock reorder visibility and Amazon-link draft intake.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.

## Latest pass note
This build continues the mobile-first booking, staff workflow, inventory, and local SEO direction. The newest user-facing changes are the mobile booking wizard, shared public account widget, and tighter customer/private progress separation.


## Latest pass summary
This pass focused on booking wizard usability, two-way live job communication, mobile-safe layout behavior, and documentation/schema synchronization.

## March 29, 2026 update
This pass focused on reducing the biggest active operational risks rather than adding new data tables: more admin/detailer endpoints now trust the signed-in staff session first, actor attribution is stronger across booking/time/intake/media flows, and several internal pages now load from session state instead of demanding a password-first workflow.


## March 29, 2026 gift / upload / endpoint pass
- moved more admin endpoints off direct shared-password checks and onto session-aware `requireStaffAccess`, including customer-profile tooling, booking customer linking, and unblock date/slot actions.
- improved customer gift/account polish by adding dashboard gift summary totals and a signed-in gift balance checker on My Account.
- hardened the signed upload endpoint with media-type and file-size validation plus customer-visible/public-url handling guidance.
- continued DB-first cleanup and doc/schema synchronization for the current dev build.


## March 29, 2026 promo / blocks / purchase reminder pass
- promo list/create/disable and block date/slot actions now prefer signed-in staff session access through the shared role-aware auth helper instead of direct shared-password checks.
- booking_update and assign now log actor-attributed booking events while using the resolved current staff actor.
- purchase-order reminder lifecycle moved forward with reminder logging fields, a reminder action endpoint, and overdue reminder reporting in the purchase-order list endpoint.
- this reduced more of the old/new endpoint overlap and shared-password bridge risk, but did not fully eliminate every remaining legacy-only admin path yet.


## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Removed duplicate clean-route wrapper folders for `/admin`, `/admin-catalog`, `/admin-accounting`, `/services`, and `/pricing`; `_redirects` remains the working compatibility layer.


## April 8, 2026 accounting note
The repo now includes a first-pass general-ledger workflow for a small auto-detailing company: operational invoice records, manual expense/vendor bill entries, payable settlement, tax payable reporting, owner draw/equity reporting, inventory usage to COGS linkage, and monthly general-ledger CSV export.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 accounting reporting / remittance / cost coverage pass
- Admin Accounting now includes monthly profit-and-loss, balance-sheet, and cash-flow views in one screen, plus tax remittance posting, settlement history on vendor bills, and broader CSV exports.
- Inventory admin now persists `cost_cents`, `vendor_sku`, `purchase_date`, and `estimated_jobs_per_unit`, which makes missing-cost cleanup actionable instead of only visible.
- Internal compatibility routing for `/admin-accounting/` now redirects to the primary screen to reduce page drift.
- Public SEO housekeeping moved forward again: `robots.txt` and `sitemap.xml` now point to the production domain and the home page now carries `AutoDetailing` structured data.
- Still not complete: full auth/session convergence, actor normalization across all remaining internal routes, deeper A/R and statement polish, fuller overhead allocation, and stronger reconciliation workflows.


## Current build emphasis (April 9, 2026)
This build is stronger on office-side accounting and internal-route cohesion. The current admin accounting screen now covers payables, remittance, statements, receivables aging, inventory cost completeness, and estimated booking profitability from one workflow.


## April 9, 2026 add-on image restore / month-end checklist / assignment identity pass
- Restored the four custom add-on service cards to the Rosie packages R2 path first, with bundled local assets kept as fallback so the cards do not go blank if the remote asset is unavailable.
- Admin Booking and Admin Assign now prefer real assignable staff records so booking assignment can store `assigned_staff_user_id` and `assigned_staff_email`, not only a display name.
- Added a month-end checklist workflow to Admin Accounting plus a new `accounting_month_end_checklists` table and API endpoint so office-side close steps can be tracked per month.
- Progress media posting now stores `staff_user_id`, continuing actor normalization outside accounting.
- Continued local-search hygiene: keep one clear H1 per public page, use search-language terms in titles/headings, and keep sitemap / robots / structured-data alignment clean.

## April 10, 2026 pass update
- Add-on imagery is now back on a canonical path: every add-on in `data/rosie_services_pricing_and_packages.json` now carries a primary R2 `image_url` plus a local `image_fallback_url` so booking, services, and future app-style surfaces can converge on one data source instead of maintaining separate maps.
- Crew assignment now exists on `/admin-assign.html`: one booking can carry multiple detailers with one marked as the lead / senior-on-job while the older single-assignee booking fields stay synchronized for backward compatibility.
- A new operational table, `booking_staff_assignments`, now supports multi-detailer scheduling without overloading the legacy `bookings.assigned_*` columns.
- Detailer work-scope checks now honor crew assignments, so supporting crew members can see and work jobs assigned to them even when they are not the lead.
- Internal mobile/tablet fit was tightened again with more compact shared spacing and a more app-like assignment screen.

## Latest internal operations pass
This build moved Admin Recovery, Admin Live, and Admin Progress toward a stronger session-first internal app model, added recovery audit visibility, and added a reusable static stress-check script for syntax/H1/add-on coverage checks.


- 2026-04-11 route hotfix: removed duplicate clean-route collisions such as `services.html` plus `services/index.html`, added a real `404.html`, and kept only trailing-slash compatibility redirects to stop Cloudflare Pages redirect loops.


Route hotfix sync reviewed on 2026-04-11.

## Latest pass summary — April 11, 2026
This pass keeps the route hotfix structure intact and adds stronger internal workflow consistency:
- removed duplicate clean-route folder outputs from the shipped build
- improved crew summary propagation across internal workflow screens and APIs
- hardened admin runtime request handling with timeout and text-response fallbacks
- expanded static packaging checks so route collisions and leftover debug artifacts fail before packaging
- April 12, 2026 canonical pricing/source-of-truth completion: `/api/pricing_catalog_public` now preserves charts, service areas, booking rules, and public requirements from `app_management_settings.pricing_catalog`, while booking/services/pricing/site helpers share one client normalizer and fallback path
- April 12, 2026 routing hardening: removed duplicate clean-route wrapper folders for `/admin`, `/admin-accounting`, `/admin-catalog`, `/pricing`, and `/services`; trailing-slash redirects remain in `_redirects`
- April 12, 2026 booking contract repair: checkout now resolves `service_area_county`, `service_area_municipality`, and `service_area_zone` from the canonical catalog before creating the booking/payment session

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 highlights
- Booking UI and analytics were both deepened in this pass.
- A new analytics index migration was added for richer payload-driven rollups.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.
### Pricing catalog source of truth
Public pricing surfaces now read `/api/pricing_catalog_public` first. That endpoint now preserves the full canonical catalog contract from `app_management_settings.pricing_catalog` — packages, add-ons, charts, service-area rules, booking rules, and public requirements — and falls back to the bundled catalog JSON when needed. Use **Admin App Management → Pricing Catalog** to keep package prices, booking windows, included services, add-ons, and service-area rules aligned.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 build note
- Booking is now treated as stable and should not be altered during ongoing admin pricing work.
- `_redirects` is considered working and complete for the current Pages-safe route structure.
- `admin-app.html` now contains the preferred pricing control center for package pricing, add-ons, service-area travel tiers, travel-charge defaults, and shared pricing-control values.
- `admin-accounting.html` now includes a pricing review window for office-side accounting oversight.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 highlighted changes
- Booking page is now a protected stable screen and should be treated as locked.
- App Management remains the preferred control center for pricing, packages, add-ons, service-area travel tiers, travel charges, and related booking pricing controls.
- Admin Bookings now includes an office workflow for on-site discounts, refunds, and finance notes tied back to the booking/accounting trail.
- New printable customer documents were added for order confirmation, invoice / service summary, and gift certificates.
- Social-feed content can now be managed centrally and rendered on the public site using the latest five links per platform.

---

## Pass sync — 2026-04-14 (pass 16)

- Booking screen remains locked and stable.
- `_redirects` remains the working route layer and includes the admin-app trailing-slash compatibility line.
- App Management was repaired in this pass: the page now restores its missing helper functions, shows a proper internal menu mount, includes clearer feature descriptions, and exposes document/social defaults without crashing.
- Admin navigation now includes a visible path to App Management from the dashboard, shared admin menu, and return bar.
- No new database table or column changes were introduced in this pass; schema files were refreshed to reflect a no-DDL stability/documentation pass.
- Strongest next steps remain the single-entry pricing/accounting workflow, refund-credit memo document polish, and provider-tested email sending.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.

Update note — 2026-04-16 pass20: Added explicit admin route wrappers for social feed and vehicle catalog endpoints to stop Pages Function import-resolution failures on /api/admin routes. Booking remains stable; no schema DDL change in this pass.
