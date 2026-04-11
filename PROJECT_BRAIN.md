> Last synchronized: April 10, 2026. Reviewed during the session-first admin recovery/live/progress app-shell pass, recovery audit visibility pass, static stress-check pass, and docs/schema synchronization pass.

> Last synchronized: April 10, 2026. Reviewed during the canonical add-on media recovery, crew assignment/senior detailer workflow, responsive app-shell tightening, stability checks, and docs/schema synchronization pass.

> Last synchronized: April 9, 2026. Reviewed during the add-on image restore, assignment identity normalization, month-end checklist, and docs/schema synchronization pass.

> Last synchronized: April 8, 2026. Reviewed during the accounting backend, payable/expense, month-end reporting, and docs/schema synchronization pass.

> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

<!-- PROJECT_BRAIN.md -->

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

# Rosie Dazzlers — Project Brain

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
- Kept compatibility folder `index.html` files for `/admin/`, `/admin-catalog/`, `/admin-accounting/`, `/services/`, and `/pricing/` while leaving direct `.html` links as the stable path for this build.


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
