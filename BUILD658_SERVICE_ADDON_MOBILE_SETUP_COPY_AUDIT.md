# Build 658 — Service & Add-On Landing-Page Mobile Setup Copy Audit

Rosie Dazzlers brings standard detailing water and power. Customers provide a
safe, permitted work area. Local water-use, runoff, weather and property/site
rules still govern whether exterior work may proceed.

## Scope and delivery

- Reconciled 22 standalone service/add-on HTML landing pages that ambiguously
  referred to “water/power rules”. The clarified text distinguishes
  Rosie-supplied operating utilities from municipal and site constraints.
- Reconciled the corresponding ambiguous setup sentence in 24 bundled
  service/add-on landing entries, keeping both JSON mirrors identical.
- Added bounded service/add-on content classification for the 28 bundled
  landing-page entries, including nested overrides and generated add-on pages.
  Legitimate de-ionized water, extraction, coating water behaviour, municipal
  drainage and runoff guidance are not mistaken for customer utility duties.
- Public `/api/landing_pages_public` now guards contradictory managed service
  and add-on FAQ, list, hero and water-note copy. It adds visible normal mobile
  preparation guidance without silently changing Supabase records or deleting
  official water-use source links.
- Added the authenticated, GET-only `/api/admin/service_addon_mobile_setup_review`
  endpoint and a manual review panel on both Admin Site Settings routes. The
  report includes bundled and managed source names, timestamps, slugs, field
  paths, snippets and unreadable-source warnings. POST is forbidden.

## Owner boundaries

- Review findings are recommendations, not auto-publish actions. No Supabase
  schema/data writes, RLS changes, credentials in the browser, price/booking
  or payment changes, or municipal rule updates occur in this build.
- `/terms` and `/waiver` remain on explicit owner-approval hold.
- Historical customer utility wording in service-area operational metadata
  is a separate source and must be reviewed in its own workflow; this build
  does not silently replace that operational authority.

## Verification and release gate

Run `node scripts/build658_service_addon_mobile_setup_review_test.mjs` and
`bash scripts/current_booking_wizard_regression.sh`; both check the guarded
public API, managed mock records, static-copy parity, admin authorization,
read-only Supabase calls, municipal guidance preservation and legal holds.
Production requires protected source suites, equal `dev` and `main` merged
trees, Cloudflare deployment success and exact-SHA production acceptance.

## Next expected Build 659

**Service-Area Access Rule Metadata Mobile Setup Audit & Owner Reconciliation**
— review older hose/power availability assumptions in the service-area rule
catalogs and their public/booking consumers, while preserving official county
water-use rules and site-access constraints.
