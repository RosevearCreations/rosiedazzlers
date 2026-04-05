> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

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


## April 4, 2026 booking/query/vehicle/CSS fix pass
- Fixed the admin booking search query so it no longer requests a non-existent `bookings.updated_at` column on the live schema.
- Cleaned internal dashboard links away from `/admin.html` to `/admin` and added a safer admin redirect path.
- Tightened public/mobile UI again by shrinking the Services vehicle-size selector footprint, reducing the Pricing vehicle size chart preview, and forcing date/time inputs onto a light control surface for better picker visibility.
- Upgraded Book vehicle entry so year, make, and model now accept typed input with suggestion lists while still supporting default size/category/body inference and manual overrides.
- Continued docs/schema synchronization for the current build.


## April 4, 2026 booking/query/admin-route/mobile-fit follow-up
- Repaired the booking/admin search path again by removing another live reference to the non-existent `bookings.updated_at` column and continuing to normalize booking reads/writes against the live schema shape.
- Cleaned the admin dashboard pathing again so active internal links prefer `/admin` while static fallback routing still resolves to `admin.html` safely on Cloudflare Pages.
- Backed out automatic size/category forcing from Year/Make/Model guesses on Book so customers can type/select the vehicle and then confirm size/category manually when the guessed class is unreliable.
- Tightened Services/Pricing/date-input CSS again for smaller controls, visible date pickers on dark surfaces, smaller chart previews, and steadier mobile layout behavior.
- Continued Admin inventory workflow clarity by making add/reorder actions more explicit on the Admin Catalog screen.


## April 5, 2026 booking/admin-route/date-picker/inventory follow-up
- Continued fixing the booking/admin management pass by removing another stale `updated_at` assumption from active booking-path code and keeping internal dashboard navigation on `/admin` instead of broken `admin.html` links.
- Tuned Services/Pricing UI again by shrinking the vehicle-size selector vertically, increasing chart previews, and keeping date inputs dark while brightening the picker icon instead of forcing white boxes.
- Backed out automatic size/category assignment on Book so customers still get Year/Make/Model suggestions but confirm size and category manually when vehicle-class inference is unreliable.
- Surfaced Inventory more clearly for Admins through dashboard/menu wording and continued docs/schema synchronization for the current build.
<!-- Last synchronized: April 5, 2026. Reviewed during the bookings/admin-route/date-picker/inventory/menu/CSS/mobile-fit pass. -->
