> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 quick context
- Legacy pricing charts now live in the repo under `/assets/brand/CarPrice2025.PNG` and `/assets/brand/CarPriceDetails2025.PNG`.
- Regeneration script: `scripts/generate_pricing_chart_images.py`.
- Current limitation: App Management can still outpace these static PNGs unless they are regenerated after pricing edits.


# Rosie Dazzlers — Project Brain

## April 14, 2026 pass memory
- App Management is the single office entry point for pricing/package governance.
- Checkbox rows were cleaned up for readability.
- Package reporting now separates family count from size-price count.
- Oversize and exotic are still a shared pricing column in the canonical catalog.


## Current guardrails after the April 13, 2026 pass
- Do not alter `book.html` unless there is a direct production defect.
- Treat `_redirects` as complete for the current route model.
- Use App Management as the preferred single entry point for pricing/package/add-on/service-area/travel updates.
- Public social blocks now depend on `functions/api/social_feed_public.js` plus the `social_feeds` setting in App Management.


## April 12 mental-model update
The public pricing contract is now explicit: booking, services, pricing, checkout, shared site helpers, and Admin App Management all revolve around the same canonical pricing catalog shape (packages, add-ons, charts, service areas, booking rules, and public requirements) with bundled JSON only as fallback.


This is the compact mental model for the `dev` branch.

---

## Last synchronized
- March 25, 2026
- Reflects recovery template persistence, provider preview/testing foundations, DB-backed public catalog work, low-stock/reorder foundation, and deeper progress/jobsite moderation UI.

---

## What the system is
Rosie Dazzlers is a mobile detailing operations platform for Southern Ontario service work. It combines:
- a public marketing site
- booking and deposit checkout
- gift certificate sales and redemption support
- customer progress tracking
- internal booking/jobsite/admin workflows
- inventory/catalog management for tools and consumables
- recovery and notification foundations

---

## Main operational pillars
### 1) Booking and payments
- bookings stored in Supabase
- Stripe deposit checkout is active
- PayPal deposit path exists
- promo + gift validation are part of checkout logic
- pricing now prefers `app_management_settings.pricing_catalog`, with the bundled JSON file as fallback
- booking windows, slot labels, public requirement text, and service-area dispatch rules should now be treated as catalog-owned values rather than page-local constants

### 2) Customer progress
- token-based progress is the preferred model
- job updates, media, signoff, comments, and annotations are the future-safe direction
- public progress pages must remain noindex/non-searchable

### 3) Jobsite workflow
- pre-inspection intake
- time tracking
- work notes/media
- owner acknowledgement
- moderation-aware comments and annotations

### 4) Staff/admin workflow
- shared password bridge still exists
- role-aware capability model exists
- real session-auth remains the major unfinished security transition
- internal pages should become more shell-consistent and mobile-friendly

### 5) Catalog / inventory workflow
- public gear/consumables can read DB inventory first, then JSON fallback
- ratings, low-stock alerts, and reorder requests now have a stronger foundation
- full purchasing receive/close workflow is still pending

### 6) Recovery / notifications
- provider-specific rules exist in app settings
- preview/testing endpoints exist
- persisted recovery templates exist
- true provider-backed production dispatch and logging still need hardening

---

## Security model direction
Current state:
- transitional `ADMIN_PASSWORD`
- role-aware access helpers
- partial actor resolution

Target state:
- real staff login/session
- backend trust in resolved current actor
- capability-based admin/detailer/customer separation
- bridge reduced to compatibility only

---

## SEO rule
Every pass should consider:
- title/H1/meta alignment
- canonical/noindex rules
- protected/admin/token pages excluded from indexing
- public service/support pages kept consistent

---

## One-line project summary
The hard part now is not adding isolated features — it is keeping booking, staff identity, moderation, pricing, recovery, inventory, and documentation consistent while the platform grows.

## March 25, 2026 mental-model update
- the preferred internal auth path is now session-first on more recovery, catalog, and progress/upload endpoints
- the preferred pricing path is now DB settings first, JSON fallback second
- the preferred field-media path is signed upload + media save instead of pasted URLs


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

## March 27, 2026 pass memory
- Booking wizard was reworked for mobile use and clearer per-step validation.
- Public chrome now has a session-aware account widget.
- Customer progress now hides internal-only updates by filtering existing visibility data.



## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Removed duplicate clean-route wrapper folders for `/admin`, `/admin-catalog`, `/admin-accounting`, `/services`, and `/pricing`; `_redirects` remains the working compatibility layer.


## April 8, 2026 accounting memory
Rosie Dazzlers now has a lightweight internal accounting backend with chart of accounts, journal entries/lines, booking-linked invoice records, payable settlement, tax-payable reporting, owner draw/equity reporting, and GL export. Inventory usage can begin posting COGS when unit cost data exists.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 accounting reporting / remittance / cost coverage memory
- Admin Accounting is now intended to be the office-side monthly accounting workspace, not just a booking-ledger viewer.
- The strongest new flow is: review month -> inspect P&L / balance sheet / cash flow -> settle vendor bills -> post remittance -> export CSVs -> clean missing inventory costs.
- Inventory-cost completeness is now tied directly to admin catalog editing because the save path now persists unit cost and related vendor metadata.


## April 9, 2026 brain note
The accounting area is now becoming the office-side operational hub: receivables follow-up, vendor settlements, remittance, month-end statements, stronger exports, and rough profitability all sit in one place. Treat the profitability view as directional operational reporting until deeper labor/overhead costing is finished.


## April 9, 2026 pass snapshot
- Restored the four custom add-on service images to use the Rosie packages R2 path first, with local fallback assets preserved.
- Added DB-backed month-end checklist persistence for Accounting.
- Strengthened booking assignment identity by preferring assignable staff records instead of free-typed names alone.
- Continued actor normalization by storing `staff_user_id` on progress media posts.

## April 10, 2026 mental-model update
- Booking assignment is no longer just a single `assigned_*` tuple on the booking row. The booking row still holds the lead for compatibility, but the real crew model now lives in `booking_staff_assignments`.
- Add-on imagery should now be treated as data, not page-specific decoration: each add-on in the pricing/add-on JSON carries its preferred R2 image plus local fallback.

- 2026-04-11 operational note: keep one physical output per clean public/admin route on Cloudflare Pages. Do not ship both `route.html` and `route/index.html` for the same path.


Route hotfix sync reviewed on 2026-04-11.

## April 11, 2026 project-brain note
Current focus remains: preserve stable Pages routing while continuing the session-first internal app transition. This pass reduced route-risk again, strengthened crew context across operational screens, and improved internal request/error handling without changing schema shape.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 brain update
- Booking is now the heaviest public conversion surface and is being treated as a first-class app screen.
- Service-area precision and analytics depth are both now tied to the same conversion flow.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## Current pass anchor — April 12, 2026
- Treat `book.html` as stable. Do not redesign or rework the booking flow during pricing/admin passes unless a real regression appears.
- Treat `_redirects` as working and complete.
- Use `admin-app.html` as the single preferred pricing entry point.
- Use `admin-accounting.html` as the accounting-side pricing review surface.
- Keep the canonical pricing helper synchronized whenever pricing/admin work changes the catalog contract.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 quick brain refresh
- Booking UI is stable and locked.
- `_redirects` is finished.
- One preferred pricing entry point: App Management pricing control center.
- One preferred office adjustment point: Admin Bookings finance section.
- Customer documents now exist for confirmation, invoice / summary, and printable gift certificates.
- Social content display now expects the latest five links per platform from central settings.

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

## Current high-value internal ops areas
- Booking screen is stable and should not be altered casually.
- App Management remains the pricing/document/source-of-truth office screen.
- Crew Time & Payroll is now the office screen for staff availability, workload limits, logged hours, payroll draft/post actions, and service-time insight review.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.
