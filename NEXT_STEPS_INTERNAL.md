> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Next Steps Internal

## Highest-value next build targets
1. **Staff auth/session**
   - finish real staff login/session
   - reduce reliance on shared password bridge
   - make actor resolution the trusted backend source

2. **Identity consistency**
   - unify actor linkage across intake, progress, media, time, signoff, and assignment

3. **Pricing/gift cleanup**
   - finish pricing/add-on convergence on pricing JSON
   - improve gift messaging in customer-facing screens
   - review rare reconciliation edges

4. **Upload / field UX**
   - extend the new signed-upload/session-aware pattern to other field screens
   - harden storage/public/private media strategy
   - improve mobile field workflow around media and progress

5. **Inventory / purchasing**
   - reminders
   - order receive/close states
   - optional notification-backed reorder nudges

6. **Recovery operations**
   - stronger provider dispatch history
   - manual resend/escalation options
   - richer rule validation and testing traces

7. **SEO + security on every pass**
   - continue page-by-page title/H1/meta review
   - keep admin/token/protected pages noindex
   - keep error handling and access controls moving forward each pass

## Newly moved forward
- site-wide public account widget
- client password reset + email verification token flow
- public analytics tracking and live-session visibility foundation

## Move up next
1. complete real staff auth/session across internal screens
2. finish canonical pricing/add-on convergence across every path
3. polish gift messaging across checkout and customer account surfaces
4. finish direct mobile upload flow
5. deepen reorder lifecycle from request to ordered/received/reminded
6. continue page-by-page SEO audit and structured-data cleanup



## March 25, 2026 moved forward
- DB-backed canonical pricing setting added for checkout
- session-aware signed mobile upload page added
- purchase-order lifecycle status actions added in admin catalog


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.


## March 30, 2026 promo compatibility pass
- Admin promo creation now sends the minimal canonical promo payload (`code`, `is_active`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `description`) to reduce schema drift against the live `promo_codes` table.
- This pass specifically removes older create-path dependence on legacy promo fields like `active`, `applies_to`, `percent_off`, and `amount_off_cents` during promo creation.


## March 30, 2026 next-step update
1. Continue converting the remaining duplicate/legacy admin endpoints away from the shared-password bridge.
2. Normalize stale endpoint comments/CORS/header docs that still imply `x-admin-password` is the primary path.
3. Reuse the signed upload pattern on the remaining field screens that still rely on older/manual flows.
4. Continue DB-first cleanup where JSON fallback still exists only as temporary compatibility.

## March 30, 2026 session-first cleanup pass
- Reduced bridge risk again by removing legacy admin fallback from another active set of endpoints, including progress posting/upload, customer-profile save/list, booking customer linking, unblock actions, and app-settings access.
- Tightened browser-side admin calls so active internal pages send `x-admin-password` only when a transitional password is actually present instead of always attaching the header shape.
- Continued doc/schema synchronization and public-page SEO/H1 review for the current build.

## March 30, 2026 next-step update
1. Remove the remaining explicit legacy-bridge endpoints/helpers and normalize their comments/CORS guidance.
2. Continue upload-flow reuse across the remaining field screens.
3. Continue pricing/report convergence and remaining route cleanup after the auth overlap is smaller.

## March 31, 2026 next-step refinement
- Keep the standalone upload helper, but treat the reusable signed-upload pattern on `admin-progress.html` as the new baseline for other field screens.
- Prioritize any remaining detailer/jobsite screens that still force manual URL entry or older media flows.
- Continue removing stale comments/header hints that make the bridge look primary when it is now transitional.
- Continue replacing public JSON catalog reads with DB-first endpoints where coverage already exists.

## April 1, 2026 next-step update
1. Finish the remaining real staff-session conversion on the internal screens that still expose transitional password UX.
2. Normalize actor/session attribution across the last jobsite/progress/time/media edge cases so names stop acting as partial identity.
3. Continue removing stale route/helper/bootstrap behavior that still implies the bridge is a normal operating path.
4. Keep pushing DB-first catalog/public data so legacy JSON becomes fallback only, not a parallel source of truth.
5. Continue production media strategy hardening for public-vs-private job media.

## April 2, 2026 next-step note
- Blocks page date-range closures are now in place.
- Remaining top work stays the same: real staff auth/session completion, full actor consistency, final route/bootstrap cleanup, production media strategy hardening, and more DB-first replacement of duplicated JSON paths.

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
