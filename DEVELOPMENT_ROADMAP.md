<!-- DEVELOPMENT_ROADMAP.md -->

> Last synchronized: March 25, 2026. Reviewed during the public account widget, reset/verification, analytics, SEO, security, and docs/schema refresh pass.

> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

# Rosie Dazzlers — Development Roadmap

This is the practical implementation order for the `dev` branch after the March 25, 2026 documentation and UI refresh.

---

## Immediate priorities

### 1) Real staff auth/session completion
Finish the transition away from shared-password dependence.
- continue converting older endpoints/screens to session-aware auth
- keep the legacy bridge as fallback only
- resolved actor trusted across all internal screens

### 2) Staff identity consistency cleanup
Ensure the same actor model is used across:
- jobsite intake
- progress updates
- media
- comments / annotations
- time entries
- signoff / assignment

### 3) Gift redemption polish
Booking checkout is much better, but still needs:
- consistent customer-facing gift balance messaging
- account-side gift checker/history
- final webhook-safe reconciliation review

### 4) Canonical pricing and add-ons
Continue removing pricing drift.
- booking checkout
- admin reporting references
- future invoices / summaries
- tests against `data/rosie_services_pricing_and_packages.json`

### 5) Mobile upload completion
Complete direct upload flow.
- signed upload URLs or direct storage flow
- mobile-friendly jobsite/progress upload UX
- save media cleanly into operational tables

---

## Secondary priorities

### 6) Recovery operations hardening
- provider-backed send logging
- retry/test history visibility
- provider-specific template/rule validation
- optional recovery audit trail in admin

### 7) Catalog purchasing workflow
- reorder reminders
- ordered / received / cancelled states surfaced clearly
- low-stock alert resolution flow
- optional vendor reminder notifications

### 8) Internal shell cohesion
- unify admin/detailer navigation
- reduce screen-to-screen fragmentation
- improve field/mobile usage

### 9) Route and endpoint cleanup
- finalize canonical public route structure
- retire duplicate/legacy endpoint patterns
- document preferred replacements clearly

### 10) Ongoing SEO pass
On every build:
- review page title/H1/meta
- keep admin/token/private pages noindex
- continue public support-page cleanup
- maintain sitemap/robots consistency


## Newly moved forward

- public/client login flow now hands off to staff auth when the credentials belong to staff
- public account widget now recognizes staff sessions as well as customer sessions
- admin dashboard has a live analytics summary surface again
- analytics view has stronger historical + live monitoring detail


## March 25, 2026 update
- moved forward: canonical pricing now has a DB-backed setting source with JSON fallback
- moved forward: mobile-friendly direct upload page now uses the signed-in staff session
- moved forward: purchase-order receive/cancel workflow now exists in admin catalog
- move up next: finish the same session-aware conversion on the remaining legacy admin endpoints and screens


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.


## Newly moved forward (2026-03-26)
- Admin-side gear/consumables editing for rating, stock, reorder rules, vendor, category, and saved order.
- Receive/close purchase workflow now updates inventory quantities.
- My Account vehicle editor upgraded to live year/make/model lookups.
- Book page booking-data error fixed.

## Move up next
- Remove the final legacy fallback flags from the remaining admin endpoints now that the env gate is in place.
- Continue moving public catalog content from JSON fallback into DB-first inventory content.
- Add structured-data coverage route by route after the remaining content cleanup pass.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.
