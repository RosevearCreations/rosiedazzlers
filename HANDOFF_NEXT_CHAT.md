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


## April 5, 2026 Cloudflare Functions import-compatibility pass
- Added compatibility `_lib` shim files under `functions/_lib` and `functions/api/client/_lib` so Pages Functions builds do not fail when older or mixed relative import patterns are encountered during bundling.
- Surfaced Inventory and Accounting more clearly through Admin dashboard/menu routing and added pretty-route redirects for `/admin-catalog` and `/admin-accounting`.
- Continued docs/schema synchronization for the current build.
