<!-- SANITY_CHECK.md -->

> Last synchronized: March 25, 2026. Reviewed during the public account widget, reset/verification, analytics, SEO, security, and docs/schema refresh pass.

> Last synchronized: March 25, 2026. This file was reviewed during the recovery/moderation/docs/schema refresh pass.

# Rosie Dazzlers — Sanity / Health Check

## What is working well
- Public site, booking, gifts, and customer account/public progress foundations exist.
- Stripe and PayPal deposit paths exist.
- Gift redemption logic has advanced meaningfully inside booking checkout.
- Admin/customer/staff data model is much richer than the earlier brochure-site phase.
- Jobsite intake and time-tracking foundations are in place.
- Progress/media/comments/annotations moderation foundations are in place.
- Recovery settings, provider rules, preview/testing endpoints, and persisted templates now exist.
- Public gear/consumables can connect to DB inventory with ratings, with JSON fallback.
- Low-stock alerts and reorder request foundations exist.

## What improved in this pass
- checkout pricing now has a DB-backed canonical source instead of another duplicated hard-coded map
- direct mobile upload now has a signed-upload path and real session-aware admin screen
- purchase-order workflow can now move through requested / ordered / received / cancelled states
- key recovery/catalog/progress endpoints now accept the signed-in staff session
- duplicate H1 issues were removed from the exposed booking page
- docs/schema snapshots were refreshed together again

## Biggest remaining risks
1. no real staff auth/session yet
2. actor identity can still drift across some workflows
3. gift redemption is stronger but still not fully polished everywhere
4. add-on/pricing consistency still needs full enforcement
5. direct upload/mobile media flow is still incomplete
6. older and newer endpoint patterns still overlap in places

## Must-haves next
- real staff session/auth
- actor consistency cleanup
- final pricing/add-on unification
- upload flow completion
- reorder workflow completion
- continued SEO and security hardening on every pass


## Latest pass — March 25, 2026 (late)

Completed now:
- fixed public login so admin credentials can route through staff auth instead of failing on client-only login
- restored visible signed-in identity controls on the main admin dashboard
- expanded analytics screen with daily traffic and live monitoring summaries
- kept SEO/security/error handling in scope for touched pages

Next strongest moves:
1. finish deeper staff session consistency on all internal screens
2. complete gift/account messaging polish
3. complete mobile upload flow
4. finish reorder receive/close/reminder lifecycle
5. continue public SEO route audit
