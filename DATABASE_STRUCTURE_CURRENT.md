> Documentation synchronized April 23, 2026: live vehicle-size SVG guide, App Management chart preview/download helper, no-DDL schema sync, and continued public SEO/static-check direction.

## April 23, 2026 live vehicle-size guide + chart helper pass
- Added live SVG vehicle size guide generation beside the existing live price and package-details charts.
- /pricing and /services now prefer live chart renders for price, details, and size guidance, with packaged image assets retained only as fallback/reference.
- App Management now has a staff-facing helper to preview/download SVG charts from the current pricing editor JSON.
- No database DDL was added in this pass; schema docs were synchronized to state that the change is frontend/helper logic only.
- Next: deploy-test the admin chart helper, validate structured data on rendered pages, and continue the vehicle-media crop/editor hardening path.

> Last synchronized: April 22, 2026. Reviewed during the live SVG pricing-chart, structured-data local SEO, static-check hardening, and docs/schema synchronization pass.

## April 22, 2026 schema-state note
No relational schema change landed in this pass. The work moved the main public pricing charts to live SVG rendering from the canonical pricing catalog, strengthened structured-data coverage on core local pages, and hardened static SEO checks.

> Last synchronized: April 16, 2026. Reviewed during the App Management checkbox-alignment repair, package family/size-price clarification pass, pricing catalog UI polish, and docs/schema synchronization pass.

## April 15, 2026 schema-state note
No relational schema change landed in this pass. The work was a chart-asset carry-forward pass that keeps legacy PNG outputs aligned with the canonical bundled pricing catalog and local static asset paths.


March 28, 2026 sync note: no new tables were required for this pass; this refresh mainly aligns UI readability, catalog presentation, and documentation with the current build.

> Last synchronized: March 28, 2026. Reviewed during the image-fit, booking-slot readability, dark-text contrast, and current-build documentation/schema sync pass.


> Last synchronized: March 28, 2026. Reviewed during the pricing chart zoom/modal, manufacturer callout, local SEO metadata, and current-build synchronization pass.


# Database Structure Current

## April 12 schema/contract note
No new tables were required in this pass. The important contract update is that the canonical pricing setting and public pricing API now preserve the full catalog shape instead of trimming fields.

`bookings` still includes structured service-area dimensions:
- `service_area_county`
- `service_area_municipality`
- `service_area_zone`

These fields allow admin filtering/reporting without parsing the single public `service_area` text value.


> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

## Snapshot note
This file is the human-readable companion to `SUPABASE_SCHEMA.sql`.
Last synchronized: March 25, 2026.
No new tables were introduced in this UI/docs pass, but the descriptions below were refreshed to match the current feature set.

---

## bookings
Core operational booking record.
Important fields now include:
- service date / slot / duration
- package code / vehicle size / addons
- price/deposit totals
- Stripe + PayPal references
- progress token + progress enabled
- assigned staff references
- customer profile/tier linkage
- waiver acknowledgements

## app_management_settings
Key/value JSON settings storage used for:
- feature flags
- moderation defaults
- recovery rules
- recovery provider rules
- payment method toggles
- canonical pricing catalog (`pricing_catalog`) including packages, add-ons, charts, service areas, booking rules, and public requirements for the public booking/pricing/services surfaces
- other admin policy settings

## gift_certificates / gift_products
Gift sale and redemption model.
Includes:
- product definitions
- issued gift codes
- remaining balance / status
- purchaser/recipient fields
- payment references

## job_updates / job_media / job_signoffs
Token-based progress model.
Includes:
- visibility
- thread status / moderation metadata
- media URLs/captions
- signoff metadata

## progress_comments
Two-sided threaded comments for booking progress.
Includes:
- parent_type / parent_id
- author type/name/email
- visibility
- thread status
- moderation metadata

## observation_annotations
Picture-first observation markers tied to media.
Includes:
- booking/media linkage
- x/y coordinates
- title / note / category / severity / pin color
- visibility
- thread status
- moderation metadata

## jobsite_intake / job_time_entries
Field workflow tables for:
- pre-inspection intake
- acknowledgements
- valuables/conditions/prep notes
- time tracking and work state history

## recovery_message_templates
Persisted message templates for recovery flows.
Includes:
- template key
- channel
- provider
- active state
- subject/body templates
- variables
- per-template rules
- notes

## notification_events
Queue/dispatch table for outbound notifications.
Includes:
- event type/channel
- recipient targets
- subject/body payloads
- retry state
- provider response/error tracking

## catalog_inventory_items
DB-backed public/admin inventory for tools and consumables.
Includes:
- item key/type/name/category
- public/active flags
- image/Amazon links
- quantity / reorder point / reorder qty
- vendor and cost data
- public rating fields
- notes

## catalog_low_stock_alerts
Operational low-stock tracking.
Includes:
- item linkage
- qty/reorder snapshots
- resolution fields

## catalog_purchase_orders
Purchasing/reorder workflow foundation.
Includes:
- item linkage
- vendor / qty / cost
- status
- reminder / ordered / received timestamps
- purchase URL / note

## Newer auth + tracking structures
### customer_profiles
Customer account/profile record now also carries password + verification-adjacent fields used by the public account widget and recovery flows.

### customer_auth_sessions
Cookie/session backing table for logged-in customer sessions.

### customer_auth_tokens
Short-lived token store for password reset and email verification links.

### site_activity_events
Public analytics event stream for page views, heartbeats, referrers, session journeys, cart signals, and checkout progress.

### notification_events
Queued notification log used by customer/recovery communication flows.


## Analytics note

The current public tracking implementation continues to use `site_activity_events` as the raw event stream. Historical daily traffic, live-online session estimates, cart signals, and checkout-state summaries are now computed from that table inside the admin analytics layer rather than through a separate reporting table.


## catalog_purchase_orders
Tracks reorder and purchasing workflow for tools/consumables.
Important fields include:
- item link fields (`item_id`, `item_key`, `item_name`)
- vendor name / purchase URL
- ordered quantity / unit cost
- status (`draft`, `requested`, `ordered`, `received`, `cancelled`)
- reminder date plus ordered/received timestamps

## staff_auth_sessions
Opaque staff session table used by internal pages and newer role-aware endpoints.
This is now the preferred auth model for internal workflows, while the shared admin password remains a temporary bridge.

## March 25, 2026 additions
- `bookings` now tracks normalized vehicle fields such as `vehicle_year`, `vehicle_make`, `vehicle_model`, `vehicle_body_style`, `vehicle_category`, `vehicle_plate`, `vehicle_mileage_km`, and `vehicle_photo_url`.
- `customer_vehicles` now carries richer operational and communication fields plus `vehicle_size`, `body_style`, `vehicle_category`, and `is_exotic`.
- `vehicle_catalog_cache` stores year/make/model rows fetched from NHTSA vPIC for later DB-backed reuse.


## Catalog inventory additions (2026-03-26)
- `catalog_inventory_items.subcategory` — second-level display/type label for admin and public filtering.
- `catalog_inventory_items.sort_key` — saved manual sort order.
- `catalog_inventory_items.reuse_policy` — `reorder`, `single_use`, or `never_reuse`.


## March 26, 2026 inventory/review/layout pass
- Added DB-backed inventory movement logging for adjustments, receive events, and detail-product usage.
- Added after-detail checklist persistence for keys/water/power/debrief and suggested next-service cadence.
- Extended customer garage vehicles with next-cleaning due date, interval days, and auto-schedule preference.
- Added in-app customer review capture plus a Google review handoff link.
- Hardened Gear/Consumables search inputs against browser email autofill and expanded sorting/filter controls.
- Updated logo references to use brand/untitled.png.
- Continue removing legacy admin-password fallback and continue route-by-route SEO cleanup with one H1 per exposed page.


## March 26, 2026 note
No new table was required in this pass. The operational focus moved to UI coverage over the existing catalog inventory, movement, and booking-linked usage tables while continuing the JSON-to-DB reduction direction.

## Pass note — March 26, 2026
No new tables were required in this pass. The current work was focused on using the existing inventory, movement, and pricing structures more consistently in the UI and documentation.


## March 26, 2026 customer-flow and advanced inventory pass
- fixed booking add-on image sizing so package assets no longer blow out the add-ons grid.
- continued customer journey coverage by surfacing account/feed/signoff entry points more clearly and exposing checklist + products-used data on customer-facing progress/completion pages.
- extended inventory admin for purchase date and estimated jobs-per-unit so the team can track longevity of bulk supplies and hardware.
- continued DB-first inventory direction while keeping one-H1 public pages and local SEO focus on Oxford County and Norfolk County.

## March 27, 2026 note
No new table or column was required in this pass. The main change was behavioral: customer progress views now rely on existing visibility data to suppress internal-only updates, and booking now uses the existing vehicle / pricing / availability structures in a more mobile-friendly way.



## 2026-03-28 note
No new schema objects were required in this pass. This pass focused on frontend/admin-shell stabilization, asset-path repair, and staff-auth build compatibility.


March 29, 2026 sync note: no new tables were required for this pass; the main changes were endpoint/session hardening and actor-attribution improvements using the existing schema.


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

<!-- Last synchronized: April 8, 2026. Reviewed during the accounting access/admin dashboard/menu pass. -->

## April 9, 2026 schema / reporting support note
- No new core accounting tables were required in this pass.
- Reporting/remittance/export expansion uses the April 8 accounting tables plus one new reference index for `accounting_journal_entries(reference_type, entry_date, status)` and one inventory-cost coverage index for `catalog_inventory_items(is_active, item_type, cost_cents, qty_on_hand)`.
- Inventory-cost cleanup in this pass depends on already-existing columns that are now actively used by the UI: `cost_cents`, `vendor_sku`, `purchase_date`, and `estimated_jobs_per_unit`.


## April 9, 2026 schema note
- `accounting_journal_entries` now includes optional `created_by_staff_user_id` and `last_recorded_by_staff_user_id` references for cleaner audit trails.
- Added support indexes for accounting actor/date lookup and receivables service-date/balance scanning.

- 2026-04-11 note: no database shape change in this hotfix pass; schema files were resynced while the deploy issue was isolated to static route output.


Route hotfix sync reviewed on 2026-04-11.

## 2026-04-11 pass 9 sync
- Booking flow now uses a clearer service-area selector with town-level choices across Oxford and Norfolk communities.
- Booking availability shows open, partial, and unavailable dates in the next 21-day snapshot, and the date picker contrast was tightened for dark mode.
- Year / Make / Model on booking is now typeable with datalist-assisted lookup and validation against the existing vehicle catalog.
- Public analytics was deepened with richer action tracking, viewport/session details, and location/device enrichment stored inside event payloads.
- Route-collision folders and temporary check artifacts were removed again to keep Pages routing stable.
### Pass 9 schema note
- No table shape changed in this pass.
- Added optional expression indexes for analytics payload lookups on city, region, and device type.

## 2026-04-11 pass 11 sync note
- Tightened the booking preferred-date control so it no longer stretches wider than needed and added a visible white picker button.
- Public booking, services, and pricing pages now read the canonical pricing catalog API first and only fall back to bundled JSON if the API is unavailable.
- App Management now includes a pricing catalog editor so package prices, included services, add-ons, service-area rules, and chart links can be maintained from one source of truth.
- No schema shape change landed in this pass; `SUPABASE_SCHEMA.sql` was refreshed to note the pricing-catalog consolidation and booking UI tightening work.

> Pass update 2026-04-12: Re-synced the current uploaded build to the latest safe route structure. Removed duplicate clean-route folders that were reintroducing Cloudflare Pages redirect loops, preserved the newer booking experience already present in `book.html`, refreshed the deployed booking smoke check to recognize the shared `chrome.js` analytics bootstrap, and cleaned the login form autocomplete attributes. Immediate next step after deploy: verify `/`, `/services`, `/pricing`, `/book`, and `/admin` on the active branch before resuming larger feature work.

## April 12, 2026 pricing-control-center note
- No new SQL table was required in this pass.
- The canonical pricing source remains `app_management_settings.key = 'pricing_catalog'`.
- The expected catalog JSON now explicitly includes not only packages, add-ons, charts, service areas, booking rules, and public requirements, but also:
  - `booking_rules.travel_pricing`
  - `booking_rules.price_controls`
- This keeps travel-charge defaults, shared price controls, and future checkout/reporting inputs in the same entry point as package pricing.

## 2026-04-13 Pass 14 Sync
- Booking screen remains stable and should not be altered in future passes unless a critical bug appears.
- `_redirects` is working and treated as complete for the current route layout.
- Pricing/packages/add-ons/service areas/travel charges continue to flow through the App Management pricing control center as the preferred single entry point.
- This pass added office-facing finance adjustments for discounts/refunds plus customer-facing document work for order confirmation, invoice / summary, gift certificate printing, and social feed management.

## Pass 14 data notes
- `accounting_records.discount_cad` is now part of the active schema plan so office-issued credits and scope/weather/detailing-error discounts can be represented directly in accounting rollups.
- `app_management_settings` is now actively expected to serve these keys in production: `pricing_catalog`, `document_templates`, and `social_feeds`.
- Customer-facing document URLs continue to use the existing booking `progress_token` instead of introducing a second document token column.
- Notification delivery for order confirmations still queues through `notification_events`; delivery-provider execution remains a separate step.

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

## staff_users
Internal staff directory for admins, senior detailers, and detailers. Includes permission flags plus pay schedule, hourly rate, work-cap fields, and payroll notes.

## staff_availability_blocks
Crew availability windows used for vacation, sick time, training, and light-duty planning.

## staff_payroll_runs / staff_payroll_run_lines
Payroll-period snapshots for total hours, gross pay, workload flags, and optional accounting journal linkage.
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
