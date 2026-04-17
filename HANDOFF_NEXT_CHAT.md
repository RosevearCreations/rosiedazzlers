> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 handoff note
This pass generated local replacements for the legacy `CarPrice2025.PNG` and `CarPriceDetails2025.PNG` tables from the bundled pricing catalog and rewired the known chart fallbacks to `/assets/brand`. If the next pass touches pricing governance again, the safest continuation is to decide whether those chart assets stay static-with-regeneration or move to live-rendered chart pages from the canonical pricing source.


# Rosie Dazzlers — Handoff for Next Chat

## Fresh handoff note — April 14 admin-app pricing clarity pass
1. Deploy this build and verify `/admin-app.html` visually on desktop and mobile widths.
2. In App Management, confirm the checkbox rows align in two clean columns and the add-on quote checkboxes still read correctly.
3. Confirm the summary now shows package families and package price points separately.
4. Keep `book.html` locked unless a direct production defect forces a repair.
5. Decide in a future pass whether `oversize / exotic` should remain a shared price column or become a distinct canonical price field.


## Fresh handoff note — April 13 build-stability + social feed endpoint pass
1. Deploy this build and verify `/`, `/videos`, `/admin-app.html`, and one saved social-feed reload action end to end.
2. Keep `book.html` locked unless there is a direct production defect.
3. Treat `_redirects` as complete for the current route model.
4. Continue pricing/travel/package governance only through the App Management control center.
5. Strongest next document task: add a printable credit-memo / refund document tied to the booking finance workflow.


## Fresh handoff note — April 12 canonical pricing/source-of-truth pass
1. Deploy the cleaned build and purge cache.
2. Run both smoke scripts: `python3 scripts/stress_static_checks.py` and `python3 scripts/deployed_booking_analytics_smoke_check.py --base-url https://rosiedazzlers.ca`.
3. Manually verify `/book`, `/services`, `/pricing`, `/admin-app.html`, and one live checkout attempt so the canonical catalog, service-area note panel, and fallback messaging all match the same pricing source.
4. In Admin App Management, open the Pricing Catalog editor and confirm charts, service areas, booking rules, and public requirements are visible and saveable from one place.


## Branch rule
Use `dev` as source of truth unless explicitly told otherwise.

## Resume prompt
Continue Rosie Dazzlers from the `dev` branch docs. Use `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `KNOWN_GAPS_AND_RISKS.md`, `DEVELOPMENT_ROADMAP.md`, and `NEXT_STEPS_INTERNAL.md` as source of truth.

## Current state in one paragraph
Rosie Dazzlers is now a role-aware detailing operations platform with booking, deposits, gifts, token-based customer progress, jobsite intake/time tracking, customer/staff/admin screens, recovery messaging foundations, and DB-backed catalog/inventory foundations. The newest pass finished the public canonical pricing/source-of-truth repair so booking, services, pricing, checkout, and shared public helpers all consume the same pricing catalog shape with clean fallback behavior.

## Most likely next priorities
1. real staff auth/session completion
2. actor consistency cleanup across jobsite/progress/media/time flows
3. final admin/report pricing label convergence
4. customer-facing gift redemption polish
5. upload/mobile media completion
6. reorder workflow receive/close/reminder lifecycle

## Delivery style preference
- one file at a time
- brief description first
- then one complete code block for the entire file

## Newest pass summary
- repaired the public canonical pricing pipeline so charts, service areas, booking rules, and public requirements survive from app setting → API → client pages
- fixed checkout service-area dimension resolution for county / municipality / zone persistence
- removed duplicate clean-route wrapper folders for `/admin`, `/admin-accounting`, `/admin-catalog`, `/pricing`, and `/services`
- reran and passed the static stress-check package
- refreshed docs and schema snapshot again


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



## April 7, 2026 membership / mobile / deploy hardening pass
- Standardized the four missing Services add-on images onto local bundled asset paths and added real PNG copies so the service cards stop depending on fragile external image URLs.
- Added route-safe admin folder entry points and stronger Pages Functions helper shims so Cloudflare deploys are less sensitive to mixed helper import paths.
- Moved customer segmentation toward a scalable membership model by seeding Bronze, Silver, and Gold tiers and making new customer creation default to Bronze instead of a legacy placeholder tier.
- Continued mobile-fit and CSS hardening by tightening service-card/select sizing, overlap handling, and installable-app support through a shared install prompt + service worker path.


## April 8, 2026 admin route stabilization pass
- Repaired the current build by standardizing active admin navigation back to direct `.html` routes instead of mixed pretty-route/admin-folder assumptions.
- Restored the shared admin shell from the richer canonical copy so pages that call `window.AdminShell.boot(...)` load again.
- Removed duplicate clean-route wrapper folders for `/admin`, `/admin-catalog`, `/admin-accounting`, `/services`, and `/pricing`; `_redirects` remains the working compatibility layer.


## Latest accounting state — April 8, 2026
- Payable settlement flow exists in Admin Accounting.
- Tax payable and owner draw/equity reports exist for the selected month.
- General ledger CSV export exists.
- Inventory usage to COGS posting exists when `cost_cents` is populated on the inventory item.
- Best next accounting work: remittance posting workflow, payable history polish, balance-sheet style statements, and stronger cost completeness across inventory.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 handoff note
- The current strongest accounting pass is now in place: reporting, remittance posting, payable settlement history, export expansion, and inventory-cost persistence.
- Resume from testing the new Admin Accounting screen first, then validate inventory cost-entry/save behavior, then move back to auth/session convergence and deeper accounting polish.
- When continuing, treat `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `KNOWN_GAPS_AND_RISKS.md`, `DEVELOPMENT_ROADMAP.md`, `NEXT_STEPS_INTERNAL.md`, and `DATABASE_STRUCTURE_CURRENT.md` as the main source-of-truth set.


## April 9, 2026 continuation note
The newest pass pushed Accounting further by adding receivables aging, estimated booking profitability, stronger exports, and accounting actor-id support. It also fixed internal protected-route page-key drift so My Account, Inventory, Upload, and Detailer Jobs align better with the shared auth shell.

### Best next live tests
1. Sign in as admin and verify Admin, Accounting, Inventory, Upload, and My Account all open without redirect drift.
2. Sign in as a non-admin detailer/senior detailer and verify Detailer Jobs opens while Staff/Accounting remain blocked.
3. Post one payable settlement and one tax remittance, then confirm the actor name shows in settlement history.
4. Export receivables aging and profitability CSVs and verify the month filters match expectations.


## April 9, 2026 handoff note
- Run `sql/2026-04-09_accounting_month_end_checklist.sql`.
- The newest pass restored the four custom add-on cards to the Rosie packages R2 path first, with bundled fallbacks still present.
- Booking assignment now prefers real staff records from the assignable-staff endpoint, and `assign_booking` now resolves missing staff identity fields more defensively.
- Accounting now includes a persistent month-end checklist panel and endpoint.
- Progress media now stores `staff_user_id`; continue next with the remaining live/jobsite/progress legacy screens that still need the same session-first cleanup pattern.

## April 10, 2026 handoff note
- The latest pass fixed the broader add-on image regression by moving every add-on back to a canonical R2-first image path with local fallbacks, not just the four custom PNG cards.
- `data/rosie_services_pricing_and_packages.json` now stores `image_url` and `image_fallback_url` for every add-on.
- New crew scheduling support now exists through `public.booking_staff_assignments`, `functions/api/admin/assign_booking.js`, and `functions/api/admin/booking_assignment_map.js`.
- `/admin-assign.html` is now the preferred multi-detailer assignment screen. It supports assigning a crew and marking one person as the lead / senior on the job.
- `functions/api/_lib/staff-auth.js` and `functions/api/detailer/jobs.js` now honor crew assignments for work scope.
- Run `sql/2026-04-10_booking_crew_assignments_and_app_shell_hardening.sql` before testing the new crew workflow.
- Best next pass: propagate crew-aware summaries into the remaining admin live/jobsite/time/media screens and do live runtime verification against the deployed environment.

## Latest pass summary (April 10, 2026)
- moved older recovery/live/progress screens onto the shared internal app shell
- added recovery audit visibility in the Recovery screen
- added notification-event indexes to support recovery audit lookups
- added a local static stress-check script and ran it before packaging
- move up next: broader session-first conversion on the remaining password-bridge screens like jobsite/blocks/staff, plus deeper live deployed runtime testing


- Most urgent completed item on 2026-04-11: repair Cloudflare Pages route collisions that produced ERR_TOO_MANY_REDIRECTS. Next chat should verify the deployed routes first before resuming broader roadmap work.


Route hotfix sync reviewed on 2026-04-11.

## Fresh-chat handoff update — April 11, 2026
This pass focused on keeping the route hotfix intact while still moving the app forward:
- duplicate clean-route folders were removed again from the uploaded build before packaging
- crew summaries were pushed deeper into booking, live, progress, jobsite, and detailer workflows
- admin runtime error handling now includes timeout and text-response fallback behavior
- static checks now fail if temporary check artifacts or duplicate clean-route outputs are present

Next strongest pass after deployment:
- verify live Pages routes immediately after publish
- continue session-first cleanup on the remaining older internal screens
- keep actor normalization and accounting/profitability work moving

## Suggested next pass

1. Deploy this cleaned build and re-run the route smoke check on the dev/prod Pages target.
2. Continue shrinking the legacy bridge only after deployed internal route checks stay stable.
3. Extend the direct-labor profitability view into exports or dashboards that need fully loaded job-cost rollups.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Start here after pass 9
1. Deploy the cleaned build and run the static stress checks again.
2. Run the analytics payload index migration if deeper analytics queries are desired at scale.
3. Verify booking UI on mobile width, tablet width, and desktop width, especially the date snapshot and service-area selector.
4. Continue the services/pricing/local-copy SEO pass using the new town-level service-area list.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.
### Pass 11 handoff
- Verify the new compact preferred-date control on live mobile, tablet, and desktop widths after deployment.
- Test a pricing catalog change in Admin App Management and confirm it appears on `/book`, `/services`, `/pricing`, and checkout totals.
- Build the next safer layer for pricing maintenance: form-driven package/add-on editing plus validation/rollback.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## Fresh-chat handoff for this pass
- Booking is stable. Do not alter it unless a break is confirmed.
- `_redirects` is working and complete.
- Continue future pricing work from the App Management pricing control center first.
- The new travel-pricing and price-control values live inside the canonical `pricing_catalog` JSON in `app_management_settings`.
- Next best follow-up is wiring approved travel-charge logic into checkout totals only after office review confirms the tiers and amounts.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 handoff
- Do not alter `book.html` unless there is a critical booking bug.
- Treat `_redirects` as complete.
- Use `admin-app.html` as the preferred pricing/package/add-on/service-area/travel-charge control center.
- Use `admin-booking.html` for on-site discounts, refunds, finance notes, and customer-document actions.
- Customer-facing docs now live at `order-confirmation.html`, `invoice.html`, and `gift-certificate-print.html`.
- Confirmation notifications are queued from Stripe, PayPal, and admin confirm flows through `notification_events` via `functions/api/_lib/booking-documents.js`.
- Social feed content is centrally managed via the `social_feeds` setting and rendered on the home page and videos page using `assets/social-feed.js`.

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

## Latest pass handoff
- Crew/staff now tie into a documented availability + payroll workflow.
- New admin page: `admin-payroll.html`.
- New API: `admin/payroll_summary`, `admin/payroll_run_save`, `admin/staff_availability_list`, `admin/staff_availability_save`, `admin/staff_availability_delete`.
- New schema coverage added for `staff_users`, `job_time_entries`, `staff_availability_blocks`, `staff_payroll_runs`, and `staff_payroll_run_lines`.
- Strongest next move: show availability/overtime warnings directly in crew assignment and optionally tie payroll settlement into payables/accounting close-out.
- Pass sync 2026-04-16 (pass 21): added crew time/payroll workflow, staff availability blocks, payroll runs + accounting-post option, staff pay/work-cap settings, and service-time insight reporting; booking screen remains stable.
