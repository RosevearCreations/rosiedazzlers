> Documentation synchronized April 24, 2026: analytics rollup foundation, admin rollup refresh path, live route-loop repair for /services and /pricing, sanity-check refresh, and local visibility review added.

## April 24, 2026 analytics rollup + visibility review pass
- Added pre-aggregated analytics rollup tables plus a new `/api/admin/analytics_rollups_refresh` path.
- `/api/admin/analytics_overview` now prefers rollups for daily / weekly / monthly / yearly reporting and falls back to raw-event reporting when rollups are empty.
- `admin-analytics.html` now includes a rollup refresh button and reports which source mode was used.
- `_redirects` was rewritten to explicit html-backed clean-route rewrites after a live sanity check found redirect loops on `/services` and `/pricing`.
- Added `LOCAL_VISIBILITY_REVIEW_2026-04-24.md` with competitor review notes and the next local-search visibility moves.

## April 23, 2026 live vehicle-size guide + chart helper pass
- Added live SVG vehicle size guide generation beside the existing live price and package-details charts.
- /pricing and /services now prefer live chart renders for price, details, and size guidance, with packaged image assets retained only as fallback/reference.
- App Management now has a staff-facing helper to preview/download SVG charts from the current pricing editor JSON.
- No database DDL was added in this pass; schema docs were synchronized to state that the change is frontend/helper logic only.
- Next: deploy-test the admin chart helper, validate structured data on rendered pages, and continue the vehicle-media crop/editor hardening path.

> Last synchronized: April 22, 2026. Reviewed during the live SVG pricing-chart, structured-data local SEO, static-check hardening, and docs/schema synchronization pass.

## April 22, 2026 state update
- `assets/pricing-catalog-client.js` now includes live SVG chart builders for the main pricing table and service-details matrix, plus reusable JSON-LD helpers for pricing/services pages.
- `pricing.html` now renders the vehicle price chart and package-details chart from the current canonical pricing catalog instead of depending on static PNGs first.
- `services.html` now opens those same live chart renders in the modal helpers while still retaining the packaged size-chart asset as fallback/reference.
- `about.html`, `contact.html`, `pricing.html`, and `services.html` received another local SEO/structured-data refresh.
- No relational DDL change landed in this pass; schema files were refreshed to reflect a no-DDL application/SEO pass.

> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 state update
- Legacy price chart assets now exist locally at `/assets/brand/CarPrice2025.PNG` and `/assets/brand/CarPriceDetails2025.PNG`.
- Chart URLs in bundled pricing JSON and fallback helpers now point to the local generated assets instead of remote brand paths for those two legacy tables.
- `scripts/generate_pricing_chart_images.py` can rebuild both chart PNGs from `data/rosie_services_pricing_and_packages.json`.
- Booking remains locked/stable and was not altered in this pass.


# Current Implementation State

## April 14, 2026 App Management pricing clarity pass
- Adjusted `admin-app.html` checkbox-row CSS so settings blocks read like a cleaner two-column office form.
- Preserved the add-on quote checkbox alignment while improving the rest of the screen.
- Added package-family vs. package-price-point reporting to the Pricing Control Center summary.
- Clarified the package and add-on size-column labels to `Oversize / exotic` to match the current shared pricing model.
- No new SQL table shape was required in this pass; schema notes were refreshed to reflect the UI clarification work.


## April 13, 2026 build-stability + social feed endpoint pass
- Added `functions/api/social_feed_public.js` as the canonical public/social-feed read path for the home page, videos page, and App Management reload action.
- Removed duplicate `created_by_staff_user_id` / `last_recorded_by_staff_user_id` keys from `functions/api/_lib/accounting-gl.js`.
- Preserved the booking screen as locked/stable and left `_redirects` as the current complete compatibility layer.
- No new SQL table shape was required in this pass; schema notes were refreshed to reflect the build-stability and endpoint-completion work.


## Completed / strengthened in the April 12 canonical pricing pass
- public booking, services, pricing, checkout, and the shared public site helper now consume the same client/server pricing-catalog normalizer instead of drifting field-by-field
- `/api/pricing_catalog_public` now returns the full public catalog contract: charts, packages, service matrix, add-ons, service areas, booking rules, and public requirements
- checkout now resolves structured service-area county / municipality / zone fields from the canonical catalog before the booking/payment session is created
- booking now reads hold minutes, default service area, and slot labels from `booking_rules` instead of hidden local constants
- duplicate clean-route wrapper folders were removed again for `/admin`, `/admin-accounting`, `/admin-catalog`, `/pricing`, and `/services`, while trailing-slash redirects remain handled in `_redirects`
- static stress checks now pass against the repaired pricing contract and clean-route package

## Completed / strengthened in the April 11 booking + analytics pass
- booking page now includes paged 21-day availability windows, stronger mobile-safe field layout, and a more visible date picker
- service areas now carry structured county / municipality / zone metadata plus parking / noise / runoff / access reminders and official municipal links
- checkout now persists structured service-area dimensions for stronger admin filtering and future reporting
- admin bookings now filter by service area and show visible area summaries
- admin analytics now adds service-area mix, booking funnel metrics, and CSV export buttons for traffic and funnel data
- added a deployed booking + analytics smoke-check script to support safer post-publish verification


## Completed / strengthened in this pass
- Checkout now reads canonical package/add-on pricing from `app_management_settings.pricing_catalog`, with the bundled JSON file as fallback.
- Added `functions/api/_lib/pricing-catalog.js` so pricing drift can converge on one source instead of repeated hard-coded maps.
- `admin-upload.html` is now a real mobile-friendly signed upload page using the current staff session rather than a pasted shared password.
- `progress_upload_url`, `progress_post`, `progress_list`, and `media_save` now work with the resolved staff session and keep the legacy admin bridge only as a fallback.
- Catalog admin flow now includes purchase-order list and status updates (requested → ordered → received/cancelled) through the admin UI.
- Recovery and catalog management endpoints now accept the signed-in staff session instead of requiring only the legacy admin password.
- Public/booking SEO cleanup continued and duplicate H1 issues were removed from the exposed booking page.

## Already present before this pass and still active
- PayPal deposit path foundation
- persisted recovery template table + endpoints
- provider-specific recovery rules/settings
- catalog inventory table + public DB feed
- rating fields for tools/consumables
- public analytics tracking and live-session visibility foundation
- two-sided progress comments/annotation foundations

## Still partial / still open
- some older internal/admin endpoints still rely on the legacy bridge and need the same session-aware conversion pattern
- broader gift redemption messaging across customer account screens
- admin/reporting copy still needs one more audit so every legacy summary uses the newer canonical labels and service-area dimensions
- provider-backed reorder reminder sending is still not automated yet
- signed upload flow is now present, but customer-facing/private media URL strategy still needs final hardening for production buckets
- remaining public route-by-route SEO cleanup and structured-data pass

## March 25, 2026 vehicle/session/layout pass
- Booking now uses live year/make/model dropdowns backed by NHTSA vPIC through server-side proxy endpoints and caches results into `vehicle_catalog_cache` when available.
- Progress moderation and progress enable flows now accept real staff sessions instead of requiring only the shared admin password.
- Gear and consumables search/filter UI was cleaned up to reduce bad browser autofill and add richer category/sort controls.
- Checkbox/card alignment was tightened in shared CSS for admin/jobsite/staff style forms.
- Schema/docs now reflect booking vehicle fields, richer customer vehicle fields, and the vehicle catalog cache table.


## 2026-03-26 pass
- Book page vehicle make/model loading fixed by restoring local HTML escaping in the booking script.
- Admin catalog now edits stock, rating, category, subcategory, vendor, sort order, public visibility, and reuse policy from one screen.
- Purchase orders now update inventory when marked received and resolve open low-stock alerts.
- Public gear and consumables pages now expose more sort/filter signals and use stronger search-field autofill suppression.
- My Account garage editor now uses the live year/make/model selectors and saves vehicle size/category/body style/exotic flags.
- Legacy admin password fallback is now disabled unless ALLOW_LEGACY_ADMIN_FALLBACK=true is explicitly set in env.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.


## March 26, 2026 current implementation update
- Public Gear/Consumables pages now have stronger anti-autofill search behavior, richer category/type/vendor sorting, and corrected logo-path handling.
- Admin catalog now exposes movement-history review and can record products used on a booking directly from inventory.
- Admin progress now includes booking-level product-usage recording and relies on signed-in staff sessions first on newer actions.
- LocalBusiness structured data is now injected on exposed public pages to support local search understanding for Oxford and Norfolk coverage.

## March 26, 2026 booking/catalog/local SEO pass
- Book page add-ons now read image URLs from the canonical pricing/add-on JSON so the booking page and service pages can share the same add-on image source.
- Gear and Consumables public search inputs were hardened again against browser credential autofill and moved toward generic text-search behavior.
- Admin Catalog now surfaces low-stock items, movement history, Amazon-link draft intake, and easier reorder creation from current inventory levels.
- Local search emphasis continues to target Oxford County and Norfolk County through page titles, descriptions, and structured-data support.
- No schema migration was required in this pass.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.

## March 27, 2026 pass update
- Booking is now mobile-friendlier with a step-driven wizard, date availability strip, saved garage vehicle prefill, and per-step validation.
- Shared public chrome now renders a session-aware account widget for guest, customer, and staff states.
- Customer progress/feed view now filters internal-only updates instead of exposing every staff note.


## March 27, 2026 current-state note
- Booking wizard header no longer overlays step content.
- Booking step changes now scroll to the active step card.
- Customer progress feed remains customer-only, while new customer comment posting is now supported through the progress token flow.
- Detailers can now post either public or internal notes from the assigned jobs screen.


## 2026-03-28 late pass
- Fixed the staff-auth deploy blocker by standardizing `job_note_post.js` on `requireStaffAccess` and adding a compatibility export in `functions/api/_lib/staff-auth.js`.
- Fixed missing package/service imagery for the vehicle size chart and add-on asset references that were still using the wrong base path.
- Fixed dark button text contrast so button labels render in light text consistently across the site.
- Fixed lingering admin loading banners by forcing `hidden` states to win and by hiding stale loader nodes after AdminShell boot completes.
- Added a small return menu for admin pages that do not already have a full admin nav header.

## March 29, 2026 pass
- Converted more internal workflows to trust the signed-in staff actor first: booking list/update, assignment, blocks listing, time entries, time summary, jobsite intake get/save, progress media post, and staff list/save.
- Reduced shared-password-only behavior in the admin UI by auto-loading Bookings, Blocks, and Staff screens from the staff session where available.
- Improved identity consistency by writing actor-derived names and staff IDs into time/media/intake responses and booking events where possible.
- No new database tables were required; this pass primarily reduced auth drift and endpoint overlap.


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


## April 8, 2026 accounting backend extension
- Admin Accounting now supports manual expense/vendor bill posting, open payable settlement, monthly revenue/expense/net reporting, tax payable summary, owner draw/equity summary, and general-ledger CSV export.
- Booking product usage can now post first-pass COGS journal entries when the inventory item includes `cost_cents`.

## April 8, 2026 accounting access and admin workflow pass
- Accounting access is now surfaced directly in the Admin dashboard, shared admin menu, and shared return toolbar so office-side accounting work is no longer hidden behind direct URL knowledge alone.
- This pass moves the roadmap and known gaps forward again by improving internal shell cohesion and operational discoverability without changing the underlying accounting schema.
- Suggested next mobile/operations features: quick expense entry from phone with receipt photo attachment, vendor quick-add during payable entry, and a month-end checklist panel for settlement, remittance, and report export.

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->


## April 9, 2026 accounting screen syntax fix
- Fixed a JavaScript syntax error in `admin-accounting.html` that prevented the Accounting screen from booting past the “Loading Accounting Records” state.
- Continued docs/schema synchronization for the current build.

## April 9, 2026 accounting reporting / remittance / cost coverage pass
- Admin Accounting now loads booking accounting records, payables, monthly P&L, balance sheet, cash flow, tax report, inventory cost completeness, and remittance actions from one screen.
- Vendor bills now show settlement history inline and can be partially or fully settled from the same page.
- Tax remittance posting is now implemented as a journal-entry action against `sales_tax_payable` and the chosen payment account.
- Inventory admin now stores unit-cost and vendor-SKU data needed for better COGS and cleanup reporting.
- Public SEO state improved through production-domain sitemap/robots cleanup and homepage `AutoDetailing` structured data.


## April 9, 2026 implementation state addendum
- Accounting now has payable settlement history, remittance posting, P&L, balance sheet, cash flow, receivables aging, inventory cost completeness, and estimated booking profitability in the main office workflow.
- Journal entries now support optional staff-user actor ids in addition to actor names.
- Protected-route cohesion improved by aligning more internal pages with the shared auth shell page-access model.


## April 9, 2026 add-on image restore / month-end checklist / assignment identity pass
- Services and booking add-on cards now point back to the Rosie packages R2 image path first, with bundled local fallbacks so the four custom service images do not render as blank placeholders.
- `admin-booking.html` and `admin-assign.html` now prefer assignable staff records during assignment so `assigned_staff_user_id` and `assigned_staff_email` can travel with the booking more reliably.
- Added `functions/api/admin/accounting_month_end_checklist.js` and `public.accounting_month_end_checklists` so month-end close work can be saved by month with actor attribution and notes.
- `progress_media_post` now writes `staff_user_id` into `job_media`, reducing another remaining actor-normalization gap outside accounting.

## April 10, 2026 pass
- Restored the full add-on image set by moving all add-on cards back to R2-first media with local bundled fallbacks, instead of only fixing the four custom PNG cards.
- Added canonical `image_url` and `image_fallback_url` fields to each add-on inside `data/rosie_services_pricing_and_packages.json`, which reduces page-by-page image drift and gives future DB/app surfaces one shared fallback structure.
- Added `booking_staff_assignments` plus new admin endpoints so one booking can carry a lead plus a crew.
- `admin-assign.html` is now a multi-detailer assignment screen with lead selection, crew checkboxes, and a responsive layout that fits mobile/tablet better than the older one-line assignment flow.
- `requireStaffAccess(... work_booking ...)` and `detailer/jobs` now respect crew assignments so non-lead detailers can still see and work their assigned jobs.
- Local automated checks were rerun for JS syntax, inline page scripts, add-on coverage, and one-H1 public-page validation.

## Still partial after this pass
- `admin-booking.html` still behaves mostly as a single-lead quick-assignment tool; the richer crew workflow currently lives on `admin-assign.html`.
- Several admin operational list endpoints still display the legacy single-assignee summary even though booking access now honors crew membership.
- Live deployed end-to-end verification against Pages + Supabase is still required after running the new SQL migration.

## April 10, 2026 internal app-shell pass
- Admin Recovery, Admin Live, and Admin Progress now behave as session-first internal screens with the legacy password bridge demoted to optional fallback.
- Recovery now includes a recent audit surface powered by `recovery_audit_list`.
- Shared internal menu now includes Assign Crew and Recovery for stronger app cohesion.
- Static stress-check coverage now exists in `scripts/stress_static_checks.py`.


- 2026-04-11 deployment hotfix: removed duplicate route pairs that mapped the same clean URLs (`/services`, `/pricing`, `/admin`, `/admin-accounting`, `/admin-catalog`) and added a top-level `404.html` so Pages no longer treats the site like a catch-all SPA.


Route hotfix sync reviewed on 2026-04-11.

## April 11, 2026 implementation update
- The build is back to a single-file canonical clean-route structure for `services`, `pricing`, `admin`, `admin-accounting`, and `admin-catalog`.
- Crew assignment context now propagates through booking/admin APIs more consistently, including bookings list, jobsite detail, progress list, and detailer jobs.
- Internal runtime helper now surfaces timeout and text-body failures more clearly for session-first screens.
- Static stress tooling now blocks leftover debug artifacts and duplicate-route outputs before packaging.

## Internal app status

- Dev Pages clean-route verification succeeded this pass for `/`, `/services`, `/pricing`, and `/book` before deeper code work continued.
- The packaged build again strips duplicate `page.html` + `page/index.html` route collisions before release.
- Admin Blocks, Staff, Promos, and Jobsite now initialize through the shared session-first admin shell and menu.
- Accounting profitability now exposes estimated direct labor and contribution-after-labor in addition to direct COGS and allocated overhead.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 implementation state
- Public booking flow now tracks service-area selection, package/add-on choices, step changes, slot picks, and checkout start/error events.
- Analytics overview now surfaces top cities, regions, devices, actions, and recent tracked events using payload enrichment.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.
### Pass 11 implementation state
- Booking, services, pricing, checkout, and shared public helpers now share the same pricing catalog read path first: `/api/pricing_catalog_public`, which is backed by `app_management_settings.pricing_catalog` with bundled JSON fallback.
- App Management now includes a pricing catalog editor so prices, booking windows, included services, add-ons, charts, service-area guidance, and public requirement text can be updated from one place.
- Booking preferred-date control is now compact with a dedicated visible picker button rather than relying only on the browser icon.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## Completed / strengthened in the April 12 pricing control center pass
- Booking is now explicitly treated as a **stable public screen** and should not be altered during ongoing admin pricing work unless a break/regression requires a targeted fix.
- `_redirects` is now the accepted working route shim for this phase and is considered **complete** for the current Pages-safe structure.
- App Management now acts as the **single preferred entry point** for package pricing, add-on pricing, service-area travel tiers, travel-charge defaults, and shared pricing-control values.
- Admin Accounting now includes a **pricing window** so the office side can review the active pricing scope, travel tiers, and default service area without leaving the accounting workflow.
- The canonical pricing helper was re-synchronized again so travel-pricing and shared price-control values stay in the same catalog alongside packages, add-ons, service areas, booking rules, and public requirements.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 implementation state
- `book.html` is stable, verified, and intentionally locked against feature churn.
- `_redirects` is functioning and considered complete for the current Pages routing approach.
- `admin-booking.html` now exposes finance adjustments (discount/refund/tip/manual entries) and customer-document links for the selected booking.
- `order-confirmation.html`, `invoice.html`, and `gift-certificate-print.html` provide printable customer-facing documents.
- `functions/api/document_booking_public.js` and `functions/api/_lib/booking-documents.js` now drive customer document payloads from the booking record plus finance summary.
- Stripe, PayPal, and admin confirm flows now queue an order-confirmation notification event after a booking is confirmed.
- Public social sections are now ready to render the latest five links per platform from centrally managed `social_feeds` data.

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

## Crew time / payroll state
- `admin-payroll.html` is now the internal screen for staff availability, crew workload, logged-hours review, payroll draft/post actions, and service-time insights.
- Staff records now expose pay setup and work-cap fields used by the payroll/workload view: `pay_schedule`, `hourly_rate_cents`, `max_hours_per_day`, `max_hours_per_week`, `payroll_enabled`, `preferred_work_hours`, `tips_payout_notes`, and `payroll_notes`.
- Time tracking still uses `job_time_entries`; payroll summary combines manual minute entries plus work-state event history where available.
- Booking remains stable and unchanged in this pass.
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

## 2026-04-22 merchandising pass — local image scoring / SEO / geofence refinement

- upgraded customer vehicle media from the older rule-only score into a stronger local merchandising score that now blends file presence, dimensions, orientation, alt text, crop history, brightness, contrast, sharpness, background consistency, subject fill, duplicate-angle penalty, and a later-image lifestyle bonus
- `my-account.html` now analyzes images in-browser before upload using EXIF-aware decode, local canvas sampling, and preview guidance so customers get stronger front-end feedback before save
- the upload preview now shows a local preflight summary with background, subject fill, sharpness, brightness, contrast, and duplicate-angle hints while still allowing videos to remain a manual-review media type
- `functions/api/client/vehicle_media_save.js` now persists `media_analysis` and passes existing rows into `functions/api/_lib/vehicle-media-scoring.js` so duplicate-angle penalties can be applied at save time too
- `functions/api/_lib/booking-location.js` now prefers explicit service-area coordinates when they exist in the pricing/service-area metadata, then falls back to local service-area lookup keys and county fallback centroids
- public SEO copy was tightened again on `services.html`, `pricing.html`, `contact.html`, and `gallery.html` with clearer local-search wording while preserving a single H1 per exposed page
- schema/migration sync for this pass lives in `sql/2026-04-22_vehicle_media_merchandising_score.sql`, `sql/2026-04-21_vehicle_media_gallery_geofence.sql`, and `SUPABASE_SCHEMA.sql`
- next-step direction is still the same operational split: local scoring + EXIF-aware orientation + guide-led framing now, optional cloud smart-assist later only if you want object recognition or damage-style analysis

## Pass 27 sync — 2026-04-24
- `admin-accounting.html` now uses more resilient auto-fit form grids and wrapped button rows so date inputs, search boxes, and remittance controls no longer crowd each other on common desktop and laptop widths.
- `admin-live.html` and `admin-blocks.html` now share the same sidebar-style internal shell behavior through global `assets/site.css` support for `.app-shell` and related layout helpers.
- `admin-analytics.html` now exposes daily, weekly, monthly, and yearly reporting lists plus CSV export buttons. The underlying endpoint still reads `site_activity_events` directly and now returns grouped `reports.daily`, `reports.weekly`, `reports.monthly`, and `reports.yearly` payloads.
- `/api/admin/block_date` and `/api/admin/block_slot` were repaired to match the current legacy schedule schema and no longer try to write unsupported `updated_at` fields.

## April 24, 2026 state update
- admin analytics can now be fed by pre-aggregated rollup tables instead of only by raw event scans
- a new admin endpoint rebuilds rollups from `site_activity_events` for the selected reporting window
- `_redirects` was converted to explicit html-backed clean-route rewrites after the live sanity check surfaced looping on `/services` and `/pricing`
- the next public growth wave is now documented in `LOCAL_VISIBILITY_REVIEW_2026-04-24.md`
