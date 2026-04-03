> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Rosie Dazzlers — Handoff for Next Chat

## Branch rule
Use `dev` as source of truth unless explicitly told otherwise.

## Resume prompt
Continue Rosie Dazzlers from the `dev` branch docs. Use `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `KNOWN_GAPS_AND_RISKS.md`, `DEVELOPMENT_ROADMAP.md`, and `NEXT_STEPS_INTERNAL.md` as source of truth.

## Current state in one paragraph
Rosie Dazzlers is now a role-aware detailing operations platform with booking, deposits, gifts, token-based customer progress, jobsite intake/time tracking, customer/staff/admin screens, recovery messaging foundations, and DB-backed catalog/inventory foundations. The newest pass focused on turning backend moderation and recovery foundations into real admin screens, tightening protected-page SEO behavior, and refreshing repo/schema docs.

## Most likely next priorities
1. real staff auth/session completion
2. actor consistency cleanup across jobsite/progress/media/time flows
3. final pricing/add-on convergence
4. customer-facing gift redemption polish
5. upload/mobile media completion
6. reorder workflow receive/close/reminder lifecycle

## Delivery style preference
- one file at a time
- brief description first
- then one complete code block for the entire file

## Newest pass summary
- Shared public login/account widget added through site chrome
- customer password reset and email verification token flows added
- public analytics/event tracking added for page, heartbeat, and cart signals
- admin analytics now surfaces live-online and cart signal views
- docs and schema snapshot refreshed again


## March 25, 2026 late-pass resume note

The latest pass moved checkout pricing onto a DB-backed canonical setting source, turned admin upload into a signed-upload mobile workflow, and added purchase-order receive/cancel actions in admin catalog. Continue next with converting the remaining legacy internal endpoints to real staff sessions, finishing gift/account messaging polish, hardening production media URL strategy, and continuing route-by-route public SEO cleanup.

## New notes from the March 25 vehicle/session pass
- Run `sql/2026-03-25_vehicle_catalog_and_staff_flow.sql`.
- Booking now calls `/api/vehicle_makes` and `/api/vehicle_models` for the year/make/model selectors.
- Progress enable/moderation now accept staff sessions; continue by removing remaining visible password fallbacks from legacy admin screens.
- Next worthwhile follow-up: extend the same shared vehicle catalog controls into the customer garage (`my-account.html`) and any admin booking editor screen.


## 2026-03-26 handoff note
Run `sql/2026-03-26_catalog_admin_vehicle_account_and_auth_cleanup.sql` before testing the new admin catalog fields. Focus next on remaining admin endpoint fallback removal, public structured data, and any leftover JSON duplication.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.

## Latest pass handoff
- Add-on image URLs now live in the canonical pricing/add-on JSON used by the booking page.
- Admin Catalog now includes a low-stock candidate table and Amazon-link helper for creating/updating inventory items.
- Public catalog search inputs were re-hardened, but browser autofill behavior should still be re-tested after deployment in Chrome.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.

### Newest pass summary — March 27, 2026
- rebuilt booking into a more mobile-friendly wizard
- added shared public login / create-account / garage / admin widget
- filtered internal-only updates out of customer progress view
- no new SQL migration required in this pass



## March 30, 2026 promo compatibility pass
- Admin promo creation now sends the minimal canonical promo payload (`code`, `is_active`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `description`) to reduce schema drift against the live `promo_codes` table.
- This pass specifically removes older create-path dependence on legacy promo fields like `active`, `applies_to`, `percent_off`, and `amount_off_cents` during promo creation.


## March 30, 2026 handoff note
- Promo management is now stabilized enough to test create/list/disable behavior against the reconciled live promo table.
- Book page no longer needs to hit the customer dashboard endpoint for guests before auth is confirmed.
- Continue next with the remaining bridge cleanup and route/endpoint retirement work from `KNOWN_GAPS_AND_RISKS.md`.

## March 30, 2026 session-first cleanup pass
- Reduced bridge risk again by removing legacy admin fallback from another active set of endpoints, including progress posting/upload, customer-profile save/list, booking customer linking, unblock actions, and app-settings access.
- Tightened browser-side admin calls so active internal pages send `x-admin-password` only when a transitional password is actually present instead of always attaching the header shape.
- Continued doc/schema synchronization and public-page SEO/H1 review for the current build.

## March 30, 2026 handoff note
The latest pass removed another large set of legacy admin fallback allowances from booking/customer/staff/promo companion/time endpoints. Continue next with the remaining bridge-only bootstrap/helper routes, upload reuse, and any route/comment cleanup that still treats the bridge as primary behavior.

## March 31, 2026 handoff note
- Public catalog loaders now prefer `/api/catalog_public` before bundled JSON fallback, reducing another duplication/drift path on gear and consumables surfaces.
- `admin-progress.html` now supports direct signed file upload as well as URL attach, so upload reuse is no longer isolated to the standalone helper page.
- No new SQL migration was required in this pass. Continue next with the remaining helper/bootstrap cleanup, deeper upload reuse where still missing, and route-by-route SEO/structured-data work.

## April 1, 2026 handoff note
- `admin-jobsite.html` now includes direct signed media upload with append-to-intake behavior for valuables/exterior/interior/damage photo fields, reducing another manual URL-only field workflow.
- `admin-recovery.html` now prefers the signed-in staff session, includes recovery audit visibility, and includes a manual recovery queue tool for resend/escalation use.
- Shared consumables page loaders now try the DB-backed public catalog first and fall back through legacy JSON only when needed.
- No new SQL migration was required in this pass. Continue next with the remaining true staff-auth completion, any leftover helper/bootstrap cleanup, and deeper identity normalization.

## April 2, 2026 handoff note
- Admin Blocks now supports full date-range blocking on the same page, including quick presets for 2 days, 1 week, 2 weeks, 3 weeks, and 1 month.
- The blocks screen now prefers the newer `/api/admin/blocks_list` and `/api/admin/blocks_save` role-aware endpoints instead of continuing the older single-endpoint block pattern.
- Continue next with the same remaining gap list: finish real staff auth/session everywhere, keep normalizing actor identity across every workflow, retire the last bridge/helper leftovers, and keep replacing duplicate JSON fallbacks where DB-backed public data already exists.

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
