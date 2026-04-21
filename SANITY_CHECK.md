> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 sanity sync
- Confirm `/pricing` and `/services` open the new local `/assets/brand/CarPrice2025.PNG` and `/assets/brand/CarPriceDetails2025.PNG` assets.
- Confirm the chart helpers still open `CarSizeChart.PNG` from the package asset path.
- Confirm static chart assets visually match the current package/add-on/service-matrix data in the bundled pricing JSON.


# Rosie Dazzlers — Sanity / Health Check

## April 14, 2026 sanity note
- `admin-app.html` checkbox rows aligned
- add-on quote checkbox layout preserved
- package family count vs size-price count clarified
- no booking-screen edits made


## April 11 pass sanity additions
- verify booking field boxes do not overlap at desktop, tablet, or phone widths
- verify date picker text/icon contrast remains readable in dark mode
- verify the booking calendar can page forward/backward in 21-day windows
- verify the selected service area shows municipality-specific parking/noise/runoff/access guidance and source links
- verify admin bookings can filter by service area
- verify admin analytics shows top service areas, booking funnel rows, and CSV exports


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


## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Removed duplicate clean-route wrapper folders for `/admin`, `/admin-catalog`, `/admin-accounting`, `/services`, and `/pricing`; `_redirects` remains the working compatibility layer.


## April 8, 2026 sanity reminders
- Run `sql/2026-04-08_general_ledger_accounting.sql` and `sql/2026-04-08_accounting_settlement_tax_exports.sql` before testing Admin Accounting settlement/report/export features.
- For COGS posting tests, ensure the inventory item has `cost_cents` populated before recording product usage on a booking.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 sanity check additions
- Confirm `/admin-accounting.html` loads the monthly reports, payables, and booking records without syntax errors.
- Confirm vendor-bill settlement posts update payable balance and history immediately after refresh.
- Confirm tax remittance posting reduces the payable amount shown by the relevant tax account view.
- Confirm inventory save now keeps cost, vendor SKU, purchase date, and estimated jobs/unit values.
- Confirm `robots.txt`, `sitemap.xml`, and homepage structured data point to the production domain.


## April 9, 2026 sanity update
- Public H1 count still checks out at one H1 per public page.
- Auth shell cohesion improved on several internal routes.
- Accounting has broader reporting/export coverage, but live deployed runtime validation is still required.


## April 9, 2026 sanity items
- Confirm the four custom add-on cards render from R2 on `/services` and `/book`, then confirm they still fall back locally if the remote image fails.
- Confirm Admin Booking and Admin Assign can save a booking with a real staff profile and that the booking row now carries `assigned_staff_user_id` / `assigned_staff_email`.
- Confirm Admin Accounting month-end checklist can save and reload for the selected month.
- Confirm progress media posts continue to save successfully and now carry `staff_user_id`.

## April 10, 2026 local verification notes
- `node --check` passed on the changed function files and shared site scripts.
- Inline script syntax checks passed for `admin-assign.html`, `book.html`, `services.html`, `services/index.html`, and `admin-booking.html`.
- Public exposed pages still validate at one H1 each in local checks.
- Add-on coverage check confirmed that every add-on code now has image handling in `assets/site.js` and in the bundled pricing/add-on JSON.
- Crew workflow still requires live deployment verification after running the new SQL migration.

## April 10, 2026 pass sanity additions
- check Admin Recovery loads templates and audit rows with a signed-in session before using the fallback password bridge
- check Admin Live can load a booking with a signed-in session and auto-refresh without entering the password bridge
- check Admin Progress can load a token, post updates/media, and moderate entries with a signed-in session
- run `python scripts/stress_static_checks.py` after major internal UI changes


- 2026-04-11 hotfix verification target: confirm `/services`, `/pricing`, `/book`, `/admin`, `/admin-accounting`, and `/admin-catalog` open without redirect loops after deploy, then purge cache if stale redirects persist.


Route hotfix sync reviewed on 2026-04-11.

## April 11, 2026 verification note
- `node --check` passed on the changed admin runtime, crew helper, and updated API files.
- `python scripts/stress_static_checks.py` passed after route-collision folders and temporary check artifacts were removed.
- Public one-H1 coverage and add-on coverage checks remain part of the stress script.

## Verify after each build

- Confirm the packaged zip does not contain duplicate clean routes such as `services.html` + `services/index.html`.
- Smoke-check live dev Pages routes: `/`, `/services`, `/pricing`, `/book`.
- Confirm Blocks, Staff, Promos, and Jobsite load with signed-in staff session before relying on any fallback bridge.
- In Accounting, verify profitability rows now show labor and contribution figures where time logs and hourly rates exist.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 verification focus
- Confirm no page.html + page/index.html collisions remain in the zip.
- Confirm booking step 1 has no overlapping boxes at mobile/tablet widths.
- Confirm date picker remains visible in dark mode and the 21-day booking snapshot shows unavailable days.
- Confirm analytics events appear for page view, click, step view, package selection, add-on toggle, and checkout start/error.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 sanity-check additions
- Confirm `book.html` remains unchanged/stable after deploy.
- Confirm `_redirects` handles the intended route behavior without duplicate folder-wrapper regressions.
- Confirm `admin-app.html` loads the structured pricing control center and can save `pricing_catalog`.
- Confirm `admin-accounting.html` loads the pricing review window from `/api/pricing_catalog_public`.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 sanity check additions
- Confirm booking screen is unchanged and still functional.
- Confirm selected booking loads finance summary and can record discount/refund entries.
- Confirm order confirmation and invoice links open for bookings with a progress token.
- Confirm gift lookup offers a printable certificate link.
- Confirm App Management loads/saves `document_templates` and `social_feeds`.
- Confirm home and videos pages render the social-feed section without breaking layout.

---

## Pass sync — 2026-04-14 (pass 16)

- Booking screen remains locked and stable.
- `_redirects` remains the working route layer and includes the admin-app trailing-slash compatibility line.
- App Management was repaired in this pass: the page now restores its missing helper functions, shows a proper internal menu mount, includes clearer feature descriptions, and exposes document/social defaults without crashing.
- Admin navigation now includes a visible path to App Management from the dashboard, shared admin menu, and return bar.
- No new database table or column changes were introduced in this pass; schema files were refreshed to reflect a no-DDL stability/documentation pass.
- Strongest next steps remain the single-entry pricing/accounting workflow, refund-credit memo document polish, and provider-tested email sending.

> Pass sync April 15, 2026: generated local price-chart PNG assets from the canonical bundled pricing catalog, rewired chart fallbacks to `/assets/brand`, added a regeneration script, and refreshed docs/schema notes for the legacy price-image carry-forward pass.

Update note — 2026-04-16 pass20: Added explicit admin route wrappers for social feed and vehicle catalog endpoints to stop Pages Function import-resolution failures on /api/admin routes. Booking remains stable; no schema DDL change in this pass.

- Pass 21 sanity: booking left stable; admin payroll screen added; staff editor extended with pay/work-cap fields; schema/docs synced for availability + payroll tables.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.

- Pass 22 sync: fixed admin-accounting date/input layout, moved admin-staff to a left-side internal menu layout, normalized admin login redirects to .html, and added clean admin route rewrites for payroll/staff/accounting/app/login.

## April 16, 2026 admin-nav and growth-direction pass

- standardized the top admin navigation so pages that boot through the shared admin shell now overwrite incomplete page-level nav link lists with one consistent internal menu bar plus account/logout controls.
- added new App Management sections for:
  - stronger self-serve quote + booking emphasis
  - scheduled e-gift delivery settings
  - maintenance / membership plan settings
- extended app settings loading so those three new settings keys are part of the shared office configuration pull.
- moved the public direction forward with:
  - stronger quote-first CTA messaging on the home and pricing pages
  - richer gift checkout inputs for recipient name and preferred send date
  - gift checkout metadata capture for recipient name, preferred send date, and gift message
- no schema DDL change was required for this pass; this was a workflow/settings/UI pass.

Pass sync: April 16, 2026 — top admin navigation standardized, app-management growth settings added, booking-led self-serve direction restored, and gift checkout now collects recipient name plus preferred send date.

---

## Pass 24 Sync — 2026-04-17

This pass focused on three areas:
- normalized the shared top admin navigation and repaired the off-pattern `admin-assign` header so the top menu matches the other admin screens more closely
- shifted the public self-serve direction back to a booking-led planner on the pricing page by embedding the live booking experience so customers keep the exact service-area restrictions, 21-day availability windows, slot logic, and booking aesthetics instead of using a separate quote-builder path
- continued the scheduled e-gift direction by exposing public growth settings, improving the gift message/send-date experience, and adding live recipient/delivery preview boxes on the gifts page

Schema impact for this pass: no new tables or columns. Existing `app_management_settings` is reused for public quote, e-gift, and membership display settings.

Pass sync: April 17, 2026 — pricing now restores the booking page as the first self-serve step by embedding the live booking planner on /pricing so service-area restrictions, 21-day availability windows, add-on logic, and booking aesthetics stay in one source of truth.
- 2026-04-17 pass26: extended booking-led self-serve with live embedded planner summaries on pricing and service-gift redemption preview, plus richer gift delivery metadata (sender name, preferred send date, message) through checkout, webhook, receipt, and printable certificate.

### April 17, 2026 pass27 note
- moved the next public growth step forward with a new `/maintenance-plan` page, recurring-plan waitlist capture, admin visibility for recurring reminder candidates, and stronger booking-link carry-forward from the live embedded planner.

---
Pass 28 sync — 2026-04-20
- Continued the booking-led self-serve direction instead of replacing it with a separate quote-only tool.
- Added scheduled e-gift delivery automation groundwork and live processor routes, plus printable gift lookup by code.
- Moved recurring maintenance reminders from interest-list based to customer-history based, so reminder timing now keys off completed bookings and real last-service dates while the interest list stays available for demand tracking.
- Strengthened visible live-booking / availability prompts and refreshed the documentation/schema trail for this pass.


<!-- pass29-sync: customer-history recurring maintenance reminders -->


> Pass sync April 20, 2026: customer screen raw JSON blocks were replaced with readable summaries and a visual garage layout, App Management social feeds gained a structured editor with the raw JSON moved into an advanced block, booking-led maintenance interest now requires Complete Detail selection before schedule interest capture, and customer-facing print/email correspondence styling was refined.


<!-- pass31-sync: booking overflow polish, maintenance conversion from complete detail, fleet handoff path -->
> Pass sync April 20, 2026: booking vehicle inputs and service cards were tightened to prevent text overflow, My Account now uses a real garage-bay view plus a fleet handoff path after 6 vehicles, and maintenance conversion now begins only after a completed Complete Detail with repeat-booking guidance tied to actual service history.

> Pass sync April 21, 2026: added mileage and next-service mileage capture, customer vehicle image/video library groundwork, garage-bay photo support, a public before/after slider gallery, admin vehicle-media override/delete tools, and detailer arrival geolocation capture groundwork.
