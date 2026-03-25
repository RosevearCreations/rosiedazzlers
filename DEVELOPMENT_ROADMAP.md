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
