> Last synchronized: March 27, 2026. Reviewed during the booking wizard sticky-fix, mobile layout cleanup, two-way active-job communication pass, and docs/schema refresh.


> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.
# Current Implementation State

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
- full add-on/pricing convergence in admin reporting and every remaining legacy path
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
