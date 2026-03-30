> Last synchronized: March 30, 2026. Reviewed during the promo create compatibility fix, guest-booking auth noise cleanup, and docs/schema synchronization pass.

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

