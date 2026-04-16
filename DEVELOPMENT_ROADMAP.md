> Last synchronized: April 14, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 generated pricing-chart asset pass
Completed in this pass:
- generated new `CarPrice2025.PNG` and `CarPriceDetails2025.PNG` from the canonical bundled pricing catalog
- rewired chart fallbacks and default chart URLs to local `/assets/brand` assets instead of hard-coded external brand-image paths
- added `scripts/generate_pricing_chart_images.py` so future legacy chart refreshes can be rebuilt from the pricing source instead of manually redrawing screenshots
- refreshed Markdown and schema notes to match the current repo state

Next highest-value roadmap items after this pass:
- move the remaining legacy price-chart dependency off static PNGs and toward live HTML or SVG rendering from the current pricing catalog
- decide whether App Management should expose a chart-regenerate/download helper for office staff
- continue public-page SEO tightening and mobile admin polish without altering the locked booking screen


# Rosie Dazzlers — Development Roadmap

## April 14, 2026 admin-app pricing clarity pass
Completed in this pass:
- aligned the non-catalog checkbox rows in `admin-app.html` so the checkbox column and label column stay visually consistent
- preserved the add-on quote checkbox layout that was already working well
- clarified package reporting so App Management now shows package families separately from size-priced entries
- relabeled the package pricing columns to `Oversize / exotic` where the current catalog intentionally shares that price path
- refreshed Markdown and schema notes to match the current repo state

Next highest-value roadmap items after this pass:
- keep App Management as the single entry point for package, add-on, service-area, and travel-charge changes
- decide whether exotic pricing should stay coupled to oversize or be promoted to a distinct canonical price column in a future schema/catalog pass
- continue office-document polish, especially refund / credit memo output and live notification delivery verification


## April 13, 2026 build-stability + social feed API pass
Completed in this pass:
- added the missing `/api/social_feed_public` endpoint used by the home page, videos page, and App Management reload button
- kept `book.html` stable and unchanged by design
- kept `_redirects` as the complete current route compatibility layer
- removed duplicate GL actor keys from `functions/api/_lib/accounting-gl.js` so Pages builds stop surfacing avoidable warnings
- refreshed Markdown and schema notes to match the current repo state

Next highest-value roadmap items after this pass:
- manually verify the public social blocks on `/` and `/videos` after deploy with live App Management data
- keep moving pricing, travel, and package governance through the App Management control center only
- add a dedicated credit memo / refund document so office adjustments have a printable companion record
- continue route-by-route public SEO tightening with the booking screen left locked unless a production bug forces a repair


## April 12, 2026 canonical pricing/source-of-truth pass
Completed in this pass:
- finish the public canonical pricing contract so booking, services, pricing, checkout, and shared public helpers all read the same normalized catalog shape
- preserve charts, service areas, booking rules, and public requirements through `/api/pricing_catalog_public`
- repair checkout service-area dimension resolution so county / municipality / zone are saved from the live catalog rather than undefined locals
- remove duplicate clean-route wrapper folders and keep only trailing-slash compatibility redirects
- rerun and pass `python3 scripts/stress_static_checks.py` after the cleanup

Next highest-value roadmap items after this pass:
- extend canonical pricing/service-area labels into any remaining admin analytics/report summaries
- add comparison/smoke coverage that intentionally validates partial app-setting catalog payloads against bundled fallback merge rules
- continue the session-first admin migration and mobile upload hardening

## April 11 booking + analytics pass
- repaired booking form layout drift so public boxes stop colliding on phone/tablet/laptop widths
- strengthened date input contrast and kept the 21-day availability view, now with previous/next paging windows
- upgraded service-area records from simple labels to structured county/municipality/zone/bylaw guidance metadata
- next target: finish town-level admin reporting and live post-deploy checks against the production build


This is the practical implementation order for the `dev` branch after the March 25, 2026 documentation and UI refresh.

---

## Immediate priorities

### 1) Real staff auth/session completion
Finish the transition away from shared-password dependence.
- moved forward again: blocks, promos, staff, and jobsite now initialize through the shared signed-in admin shell first
- keep the legacy bridge only where the endpoint still genuinely needs it
- continue retiring bridge-only endpoints once deployed route checks stay clean
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
- moved forward: recent recovery audit visibility now exists directly on the Recovery screen
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
- moved forward: older recovery/live/progress screens now use the shared internal app shell
- unify admin/detailer navigation
- reduce screen-to-screen fragmentation
- improve field/mobile usage

### 9) Route and endpoint cleanup
- moved forward: duplicate clean-route folders were removed again from the current build before packaging
- verify dev Pages clean routes live before each larger pass
- retire duplicate/legacy endpoint patterns
- document preferred replacements clearly

### 10) Ongoing SEO pass
On every build:
- review page title/H1/meta
- keep admin/token/private pages noindex
- continue public support-page cleanup
- maintain sitemap/robots consistency


## Newly moved forward

- recovery/admin live/admin progress now behave as session-first internal app screens instead of password-first screens
- recovery now exposes recent audit visibility directly in the admin UI
- internal menu cohesion is better because Assign Crew and Recovery are now in the shared internal menu
- added a reusable static stress-check script for H1, add-on coverage, and script syntax coverage

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


## March 26, 2026 search/inventory/admin UX pass
- Continued DB-first inventory work by extending public sorting/filtering and admin movement-history visibility.
- Added booking-level product usage recording UI in admin progress and admin catalog.
- Continued session-aware progress tooling so signed-in staff can work without depending on the fallback password on newer flows.
- Continued local SEO work for Norfolk County and Oxford County with structured-data and page-metadata cleanup.
- Move up next: gift/account polish, final legacy fallback removal, broader structured-data coverage route by route, and a fuller purchase reminder lifecycle.

## March 26, 2026 booking/catalog/local SEO pass
- moved forward: booking add-on images now come from the canonical pricing/add-on JSON source instead of a separate page-only map.
- moved forward: admin catalog now has a stronger low-stock and reorder candidate surface plus Amazon-link draft intake.
- moved forward: public catalog filters now expose category/type sorting more clearly.
- move up next: finish the detailer-side products-used picker polish and continue DB-first replacement of remaining JSON fallback content.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.


## March 27, 2026 booking wizard + detailer workflow pass
- moved forward: booking now has a visible 5-step wizard flow for date/slot, main service, add-ons, vehicle verification, and final review/payment.
- moved forward: add-on imagery now uses local packaged assets so the remaining missing cards no longer render blank.
- moved forward: detailer jobs now have a dedicated signed-in screen for accept/decline, dispatch, arrival, start/pause/resume, and complete-to-billing actions.
- moved forward: customer progress now shows a clearer workflow timeline in addition to photos, comments, signoff, checklist, and products used.
- move up next: final legacy fallback removal, customer-facing checklist/signoff history in My Account, invoice/receipt design, and fuller notification delivery wiring.

## March 27, 2026 mobile booking + public account widget pass
- moved forward: booking now uses a more phone-friendly wizard with step validation, quick available-date choices, and smoother scroll behavior.
- moved forward: public site chrome now shows a real login / create account / garage / admin widget depending on the resolved session.
- moved forward: customer progress feed now filters out internal-only updates so admin/detailer private notes stay private.
- move up next: finish session-only cleanup on the last legacy admin screens, complete end-to-end notification delivery, and continue DB-first inventory consolidation.


## March 27, 2026 wizard cleanup + two-way communication pass
- moved forward: booking wizard header is now non-sticky so step fields remain reachable on mobile.
- moved forward: step transitions now scroll to the active content panel instead of the wizard header.
- moved forward: customer progress now supports customer-posted live messages through the progress token path.
- moved forward: detailer jobs now supports posting customer-visible updates and internal staff notes directly from the assigned-jobs screen.
- move up next: notification fan-out for new notes, richer customer history in My Account, and final removal of shared-password compatibility on the oldest internal screens.


## 2026-03-28 late pass moved forward
- Stabilize deploy/build path by finishing the shared staff auth helper normalization.
- Continue admin UX polish with persistent return navigation and cleaner loading states.
- Continue route-by-route visual QA for asset path drift, contrast drift, and mobile layout regressions.

## Roadmap movement — March 29, 2026
- Advanced the auth/session completion track by converting another batch of admin endpoints away from direct shared-password-only checks.
- Advanced the identity-consistency track by using the resolved signed-in actor in time/intake/media and booking-event flows.
- Advanced UI cohesion by making Bookings, Blocks, and Staff pages load from the real staff session instead of requiring a password-first flow.
- Move up next: remaining legacy-only admin endpoints (`bookings/assign/blocks` companion actions, intake edge routes, and any pages still hard-coded around `x-admin-password`) plus notification delivery and upload hardening.


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


## April 8, 2026 accounting settlement / tax / export pass
- moved forward: payable settlement flow now exists through Admin Accounting so open vendor bills can be partially or fully settled into Cash while reducing Accounts Payable.
- moved forward: tax remittance reporting now has a dedicated reporting endpoint and Admin Accounting summary card built from the Sales Tax Payable account activity for the selected month.
- moved forward: owner draw / equity reporting now has a dedicated reporting endpoint and Admin Accounting summary card so owner withdrawals and equity movement are easier to review month over month.
- moved forward: inventory cost linkage into COGS now begins at the product-usage step; when an inventory item has `cost_cents`, recording usage on a booking can create a journal entry that debits Cost of Goods Sold and credits Inventory & Supplies.
- moved forward: deeper accounting exports now include a general-ledger CSV export for the selected month from Admin Accounting.
- move up next: payable settlement history UX polish, remittance posting workflow, balance-sheet style reporting, and stronger inventory cost completeness coverage for items that still do not have `cost_cents` populated.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 accounting reporting / remittance / cost coverage pass
- moved forward: Admin Accounting is no longer only a record list; it now acts as a working monthly accounting workspace with P&L, balance sheet, cash flow, remittance posting, settlement history, and export coverage.
- moved forward: inventory-cost completeness is now operationally fixable because inventory save now persists unit cost, vendor SKU, purchase date, and estimated jobs per unit from the admin form.
- moved forward: stronger exports now include profit-and-loss, balance-sheet, cash-flow, payables, and missing-inventory-cost CSV outputs in addition to general ledger export.
- moved forward: local-search hygiene improved again through production robots/sitemap cleanup and home-page structured data.
- move up next: accounts-receivable workflow depth, month-end checklist UI, vendor quick-add during bill entry, and full reconciliation/statement polish tied to consistent staff session handling.


## April 9, 2026 accounting + auth convergence pass
- moved forward: internal auth/session cohesion improved by normalizing page access keys for My Account, Inventory, Upload, Accounting, and Detailer Jobs screens.
- moved forward: Accounting now includes receivables aging and an estimated booking profitability view/export.
- moved forward: accounting journal entries now store optional staff-user actor ids for cleaner audit trails and future reconciliation.
- move up next: finish the same actor-id normalization on remaining non-accounting operational tables and route handlers.


## April 9, 2026 add-on image restore / month-end checklist / assignment identity pass
- moved forward: the four custom add-on cards now prefer the canonical Rosie packages R2 assets again, with bundled fallbacks so the images do not disappear if the remote asset is missing.
- moved forward: booking assignment now has a stronger path toward actor normalization because admin assignment screens can send `assigned_staff_user_id`, `assigned_staff_email`, and `assigned_staff_name` instead of only `assigned_to`.
- moved forward: Admin Accounting now has a real month-end checklist panel backed by DB persistence, which makes settlement/remittance/export close work easier to track from one office-side screen.
- moved forward: progress media now records `staff_user_id`, closing one more non-accounting identity gap.
- move up next: extend the same resolved staff-user-id pattern into the remaining live/jobsite/progress compatibility screens that still expose manual fallback labels more heavily than structured assignment.

## April 10, 2026 pass moved forward
- moved forward: add-on imagery is now canonicalized again through shared JSON + R2-first media, reducing service-page/booking-page drift.
- moved forward: booking assignment can now support a lead plus additional crew members through `booking_staff_assignments`, while keeping the existing single-assignee booking fields in sync.
- moved forward: detailer work-scope checks now recognize crew membership, not just the single lead assignment.
- moved forward: internal assignment UI is more app-like on phone/tablet and has stronger fallbacks when media or crew tables are missing.
- move up next: extend crew-aware summaries and filters across the rest of live ops, jobsite, time, media, and dashboard views so the whole internal shell matches the new scheduling model.

- Immediate stability pass completed on 2026-04-11: route-collision hotfix for Cloudflare Pages, 404 page restored, and future deploys should keep one deploy artifact per clean route before broader feature work resumes.


Route hotfix sync reviewed on 2026-04-11.

## April 11, 2026 route safety + crew summary pass
- moved forward: removed duplicate clean-route folder outputs again so this build stays aligned with the Pages route hotfix structure
- moved forward: booking, progress, live monitor, jobsite, and detailer jobs now carry crew summary / lead + crew context more consistently
- moved forward: admin runtime now handles request timeouts and non-JSON/text error responses more gracefully for internal app screens
- moved forward: static stress checks now fail when temporary check artifacts or route-collision outputs are present
- moved forward: static stress checks now also cover the repaired public catalog-helper path after the April 12 canonical pricing/source-of-truth pass
- move up next: continue true session-first cleanup on jobsite/time/media screens and then do deployed route-by-route verification after publish

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Added in pass 9
- Booking UI polish for mobile and tablet overlap issues.
- Town-level service-area precision for Oxford / Norfolk bookings.
- Booking analytics depth for actions, clicks, scroll, viewport, and inferred location/device detail.
- Next strongest step: carry the same precise service-area data into pricing/services copy blocks and into admin booking filters.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.
### Pass 11 follow-through
- Move the new pricing catalog editor from raw JSON only to a safer form-driven package/add-on editor in App Management.
- Add catalog validation warnings before save (duplicate codes, missing service-area fields, missing image URLs, missing price maps).
- Add a booking-page preview inside Admin App Management so pricing/inclusion changes can be checked before they reach the public booking flow.
- Continue tightening public booking CSS around the remaining summary/review rows on narrow phone widths.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 pricing control center / booking lock / redirects complete pass

- Marked the public booking screen as **stable** for the current phase. Continue testing it, but do not alter its UX or flow during pricing/admin work unless a production break forces a hotfix.
- Marked `_redirects` as **working and complete** for the current safe route structure. Keep redirects stable and avoid reintroducing duplicate folder wrappers or route-collision experiments.
- Moved pricing administration forward from a raw JSON-only box to a stronger **Pricing Control Center** in `admin-app.html`.
- Added structured controls for package prices, deposits, add-ons, service-area travel tiers, public requirements, travel charges, and shared pricing-control values.
- Added an **Accounting pricing window** in `admin-accounting.html` so office-side users can review the current pricing scope without splitting the editing surface across multiple admin screens.
- Re-synced the canonical pricing helper again so service areas, booking rules, public requirements, travel-pricing controls, and price-control values stay available through the shared catalog path.

### Move up next
- Wire travel-charge controls into checkout totals only after office review confirms the tiers and wording.
- Replace the remaining advanced JSON-only parts of pricing maintenance, especially chart rows, deep package service inclusions, and richer service-area notes, with dedicated form controls.
- Add pricing change history / audit notes inside App Management so office-side edits are easier to reconcile later.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 roadmap update
### Completed this pass
- Lock booking screen and treat it as stable.
- Treat `_redirects` as working/complete.
- Keep pricing changes flowing through one preferred entry point in App Management.
- Add office discount/refund adjustment workflow on the selected-booking screen.
- Add printable order confirmation, invoice / service summary, and gift certificate documents.
- Add central social-feed management plus public rendering hooks for the latest five links per platform.

### Next recommended steps
- Connect queued order-confirmation notifications to the live outbound provider so they actually send without manual intervention.
- Apply travel-charge controls directly in checkout math once office values are fully approved.
- Add a dedicated refund/credit memo print template for bookkeeping and customer-service handoffs.
- Expand admin accounting exports so discounts/refunds can be filtered by reason code and date range.
- Add a lightweight admin helper for updating the latest five social links per platform without editing raw JSON.

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
