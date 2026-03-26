> Last synchronized: March 25, 2026. This file was reviewed during the staff-session, pricing-catalog, upload, reorder, SEO, and docs/schema refresh pass.
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
