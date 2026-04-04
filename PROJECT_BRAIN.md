> <!-- Last synchronized: April 4, 2026. Reviewed during the add-on image / mobile-fit / docs pass. -->

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



## March 30, 2026 promo compatibility pass
- Admin promo creation now sends the minimal canonical promo payload (`code`, `is_active`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `description`) to reduce schema drift against the live `promo_codes` table.
- This pass specifically removes older create-path dependence on legacy promo fields like `active`, `applies_to`, `percent_off`, and `amount_off_cents` during promo creation.


## March 30, 2026 working note
Recent work continues to focus on operational convergence rather than net-new features: promo schema alignment, session-first internal tools, guest-state noise cleanup on booking, and keeping docs/schema notes synchronized with the real code path.

## March 30, 2026 session-first cleanup pass
- Reduced bridge risk again by removing legacy admin fallback from another active set of endpoints, including progress posting/upload, customer-profile save/list, booking customer linking, unblock actions, and app-settings access.
- Tightened browser-side admin calls so active internal pages send `x-admin-password` only when a transitional password is actually present instead of always attaching the header shape.
- Continued doc/schema synchronization and public-page SEO/H1 review for the current build.

## March 30, 2026 current focus
The repo is still in the role-aware convergence phase. This pass specifically reduced another large batch of booking/customer/staff/promo companion/time endpoint fallback overlap so more internal flows depend on the signed-in staff session model.

## March 31, 2026 project-brain sync
- Public catalog delivery is moving further toward DB-first behavior; gear and consumables loaders now prefer `/api/catalog_public` and use bundled JSON as fallback only.
- Upload reuse progressed again: signed media upload is now available directly in `admin-progress.html`, not only in the standalone upload helper.
- No new schema objects were introduced in this pass; the focus remained operational convergence and risk reduction.

## April 2, 2026 project note
- Operations/admin scheduling now supports multi-day closure windows directly in the Blocks screen, which is useful for vacations, downtime, travel, or shop maintenance periods.

> Last reviewed in the April 2, 2026 blocks/risk convergence pass.


## April 3, 2026 mobile booking / finance / inventory pass
- Admin booking workflow now supports manual staff-created detailing records from phone or desktop through `admin-booking.html` and `/api/admin/booking_save`.
- Added booking finance ledger tracking through `/api/admin/booking_finance` using `booking_events` so deposits, final payments, tips, refunds, and other manual collection entries can be recorded immediately without waiting for a dedicated payments table.
- Admin catalog intake is more phone-friendly again: supplier entry remains free-form, consumables can keep `estimated_jobs_per_unit` for multi-detail usage, and barcode-assisted intake now helps capture UPC/EAN codes into the item notes while drafting an Amazon search link.
- This pass moves the known gaps forward, especially UI cohesion, mobile operations, and operational payment/tip tracking, but it does not honestly finish the full auth/session and workflow identity gaps yet.

## April 3, 2026 UI / session / video pass
- Continued route-by-route UI cleanup by moving more admin pages toward signed-in staff session usage instead of password-only page flows.
- Tightened global CSS for dark-mode form usability, including calendar-icon visibility and better wrapping for row-based inputs/buttons on smaller screens.
- Refreshed the public video/social experience so YouTube remains the main playback surface while Instagram supports reels, work photos, and single-image proof-of-work posting.
- Continued docs/schema synchronization for the current build; no new schema migration was required in this pass.



## April 4, 2026 mobile shell / security / cleanup pass
- Tightened shared CSS again for mobile form wrapping, input/button crowding, and dark-mode date-picker visibility so calendar icons remain visible on dark surfaces.
- Added a real installable app shell foundation with `manifest.webmanifest`, `service-worker.js`, and an install banner so the field/detailer workflow feels more complete on phones.
- Continued mobile-first field direction by linking admins and detailers into the same live job workflow path; admins can still act as detailers and work through arrival, evidence capture, sign-off, and billing from the phone side.
- Reduced duplicate-route/file clutter slightly by renaming clearly unlinked legacy block endpoints and one accidental duplicate notes file with an `RM_` prefix for safe removal review.
- Still not honestly complete: full role-aware auth/session convergence on every remaining internal route, final actor normalization everywhere, and total retirement of all transitional bridge assumptions.


## April 4, 2026 accounting / password / roadmap pass
- Added an `accounting_records` table + migration so bookings now seed a basic accounting interface record immediately and finance updates can keep that record in sync for future revenue/tax/inventory-cost expansion.
- Added an internal Accounting screen and continued moving Admin tooling toward a session-first operational workflow.
- Added Admin-side password reset controls for staff users, including other Admins, through the existing session-aware password endpoint.
- Continued CSS/mobile polish and docs/schema synchronization for the current build.


## April 4, 2026 add-on image / mobile-fit / docs pass
- Replaced the four previously missing add-on image paths with local PNG assets for `full_clay_treatment`, `high_grade_paint_sealant`, `two_stage_polish`, and `uv_protectant_applied_on_interior_panels` so booking/services/add-on cards no longer depend on missing artwork references.
- Tightened add-on/service card CSS again for mobile and website use by reducing overflow risk, enforcing safer image sizing, and forcing one-column card layouts on narrower screens.
- Continued DB-first/catalog consistency work by updating both public and API-side pricing catalog fallbacks to use the same local add-on image asset paths.
- Continued docs/schema synchronization for the current build while keeping the remaining true open items narrowed to auth/session convergence, actor normalization, final duplicate-route cleanup, and deeper production hardening.

