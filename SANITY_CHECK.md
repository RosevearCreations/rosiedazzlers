> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 28, 2026. Reviewed during the pricing chart zoom/modal, manufacturer callout, local SEO metadata, and current-build synchronization pass.


<!-- SANITY_CHECK.md -->

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

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


### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.


## 2026-03-26 sanity update
- Admin catalog screen now supports editing core inventory fields instead of only viewing and reordering.
- Book page JS error for `escapeHtml` was repaired.
- Garage editing now uses live vehicle lookups instead of plain text year/make/model entry.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.


## Latest pass sanity notes
- Verify the new logo loads from https://assets.rosiedazzlers.ca/brand/Untitled.png across public and admin pages.
- Verify Gear and Consumables search inputs no longer invite saved email credentials and remain blank after refresh/focus.
- Verify admin catalog movement history loads and job-use entries reduce inventory quantities immediately.
- Verify admin progress can record products used for the loaded booking and refresh the usage history panel.

## Latest pass quick check
- booking add-on imagery repaired from canonical add-on data
- public catalog search inputs hardened again against browser email autofill
- admin catalog now shows low-stock reorder candidates and Amazon-link draft intake
- schema/docs refreshed with no new migration required in this pass


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.

## March 27, 2026 sanity update
- Booking flow is substantially easier to test on phones.
- Public site now exposes account entry points more clearly.
- Internal-only progress notes are now separated from the customer feed.
- Continue testing: booking date/slot selection, garage prefill, package selection by vehicle size, and checkout handoff.


## Current smoke-test focus
1. Booking wizard on phone width: header should stay in normal flow and not cover inputs.
2. Step navigation: next/back should scroll to the visible step card, not the wizard header.
3. Customer progress: post a message and confirm it appears in admin progress.
4. Detailer jobs: post one public update and one internal note, then confirm the customer feed only shows the public note.


## 2026-03-28 late pass quick check
- Staff note endpoint now builds cleanly against the shared auth helper.
- Pricing size chart path corrected to the packages bucket.
- Shared dark buttons now render light text.
- Admin loaders now hide after shell boot, and pages without a full admin header get a return bar.

## March 29, 2026 sanity update
- Pages build blocker remains repaired.
- Internal auth/session coverage is broader than the prior pass because time/intake/media/booking/staff flows now accept the real signed-in staff actor first.
- Legacy bridge risk is reduced but not gone; continue converting the remaining shared-password-only admin endpoints and pages.
- No new DDL required in this pass.


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

## March 29, 2026 pricing/session/recovery/moderation pass
- public pricing pages now have a DB-first `/api/pricing_catalog_public` endpoint so services, pricing, gifts, and booking can reduce hard-coded JSON drift while keeping bundled fallback behavior.
- more legacy fallback use was removed from signoff, recovery, notification, moderation, and low-stock endpoints by preferring session-only role-aware access.
- admin recovery now has a recovery audit list endpoint, and jobsite/progress detail endpoints now support visibility filtering to make moderation review more practical.
- purchase-order reminder logging now also creates an internal notification-event trail, moving reminder lifecycle closer to a fuller operational audit path.
- this pass continues to reduce the gaps, but the remaining work is still the final elimination of the last legacy-only screens/endpoints, broader mobile upload reuse, and complete operational convergence.


## March 30, 2026 promo compatibility pass
- Admin promo creation now sends the minimal canonical promo payload (`code`, `is_active`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `description`) to reduce schema drift against the live `promo_codes` table.
- This pass specifically removes older create-path dependence on legacy promo fields like `active`, `applies_to`, `percent_off`, and `amount_off_cents` during promo creation.


## March 30, 2026 additional pass check
- Promo create/list behavior is now aligned with the reconciled live promo schema and no longer leaves the main promo list area as raw JSON.
- Book page guest-state console noise is reduced by checking auth before optional dashboard prefill calls.
- Shared-password bridge reduction continues on active list/save/comment/moderation endpoints, but full endpoint retirement is still not complete.

## March 30, 2026 session-first cleanup pass
- Reduced bridge risk again by removing legacy admin fallback from another active set of endpoints, including progress posting/upload, customer-profile save/list, booking customer linking, unblock actions, and app-settings access.
- Tightened browser-side admin calls so active internal pages send `x-admin-password` only when a transitional password is actually present instead of always attaching the header shape.
- Continued doc/schema synchronization and public-page SEO/H1 review for the current build.

## March 30, 2026 sanity note
- Verified another session-first cleanup pass across booking/customer/staff/time related admin endpoints.
- Verified exposed public pages still present a single H1 each in this build.
- Verified docs and schema snapshot were refreshed again after the code changes in this pass.


## March 30, 2026 pass check
- Session-first admin cleanup advanced again by removing another batch of bridge-enabled endpoint options.
- Promo stabilization remains in place after the live schema reconciliation work.
- Public H1 review should still remain part of every pass; no public multi-H1 issue was found during this build check.

## March 31, 2026 sanity snapshot
- public gear/consumables pages: still working, now closer to DB-first catalog delivery with JSON kept as fallback
- admin progress media flow: stronger, because direct signed file upload is now available on the progress screen
- schema state: unchanged from the March 30 pass
- remaining honest risks: final auth/session convergence, remaining bridge/helper cleanup, deeper production media strategy, and route-by-route SEO polish

## April 1, 2026 sanity update
- Verified: exposed pages still keep a single H1.
- Verified: no new SQL migration is required for this pass.
- Moved forward: recovery audit/manual queue UI, jobsite direct upload reuse, and more DB-first catalog fallback reduction.
- Still open: full staff-auth completion everywhere and final operational convergence/bridge retirement.

## April 2, 2026 sanity update
- Verify `admin-blocks.html` can load current blocks, create a single blocked date, create an AM/PM slot block, and create a multi-day range block such as 14 or 30 days.
- Confirm unblock actions still work after the page moved onto `/api/admin/blocks_list` and `/api/admin/blocks_save`.
- Confirm exposed/public pages still keep one H1 each.

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

## April 4, 2026 mobile fit / session cleanup / closeout pass
- Continued mobile-app fit work with safer wrapping, safe-area spacing, sticky field-action support, and smoother button/input behavior on smaller screens.
- Moved more internal workflow toward session-first behavior by cleaning Admin Staff loading wording/behavior and removing another obvious password-first assumption from the live monitor screen.
- Improved the phone/detailer job screen with stronger quick links into Jobsite, Progress, and Accounting so the field workflow is more complete from one mobile surface.
- Continued docs/schema synchronization for the current build while narrowing the remaining truly-open items to auth/session convergence, actor normalization, final duplicate-route cleanup, and deeper production hardening.

<!-- Last synchronized: April 4, 2026. Reviewed during the mobile fit / session cleanup / closeout pass. -->
