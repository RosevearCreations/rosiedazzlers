# Build 659 — Service-Area Access Rule Metadata Mobile Setup Audit & Owner Reconciliation

Rosie Dazzlers supplies normal mobile detailing water and power. Customers
provide a safe, permitted work location. Local parking, weather, runoff,
water-use and building rules still govern safe service eligibility.

## Delivered

- Corrected legacy hose/power availability text in all **56** bundled
  service-area rows and **55** pricing-catalog service-area rows, including the
  Cloudflare Function JSON mirror, plus the booking planner's two county
  fallback rows and the Admin App new-area default.
- Applied a bounded final public guard in `/api/service_area_rules_public`
  after independently verified water restrictions are enriched. Stale managed
  table/setting access rules are replaced for *display only*; matching safe
  owner-specific site notes and all municipal water keys/sources stay intact.
- Added the authenticated, GET-only endpoint
  `/api/admin/service_area_mobile_setup_review`: audits two bundled sources,
  the `service_area_rules` table, and independently managed
  `app_management_settings.service_area_rules` and `.pricing_catalog` rows.
  Reports count, source, field, excerpt, timestamps when available, and
  unreadable-source warnings. No automatic update, sync or forced publish.
- Added an owner-triggered source-review panel to both Admin Site Settings
  routes, linking to the existing Admin App service-area editor and separate
  municipal water-rules workflow.
- Rejects an explicit Admin service-area save with contradictory access-rule
  wording (HTTP 422, field findings), before either Supabase destination is
  written. Safe owner-approved edits remain possible through the existing UI.

## Unchanged authorities and controls

- No Supabase writes or schema/RLS changes during audit, no customer billing,
  booking/availability/pricing or local water-rule mutations.
- `/terms` and `/waiver` retain prior wording until explicitly approved by
  the business owners.
- Legacy Build 275 correction detector remains in place for persisted browser
  content but is not published as customer-facing instructions.

## Verification and release gate

Run `node scripts/build659_service_area_mobile_setup_reconciliation_test.mjs`
and `bash scripts/current_booking_wizard_regression.sh`. Tests validate all
seed rows, mirror parity, booking fallback, table and managed override audit,
read-only authentication, final public guard, water-rule source retention,
write-rejection and owner-held legal agreements.

Promotion requires passing protected source suites, identical merged `dev`
and `main` trees, Cloudflare deployment, exact-main-SHA acceptance and a live
service-area public API smoke.

## Next expected Build 660

**Appointment Preparation Email/SMS & Customer Checklist Mobile Setup Audit**
— review booking confirmation, reminders and customer-facing preparation
messages for remaining hose/outlet requirements, while preserving consent,
STOP/HELP, local water-rule and legal-approval boundaries.
