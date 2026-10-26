# Build 657 — Town Landing-Page Mobile Setup Copy Audit & Owner-Safe Reconciliation

Rosie Dazzlers brings standard detailing water and power. Customers provide a
safe, permitted work area. Real municipal outdoor-water, runoff, drainage,
weather and parking rules still govern whether exterior work can proceed.

## Shipped

- Audited all eight Oxford and Norfolk town pages in both mirrored bundled
  landing-page JSON files. Replaced outdated household electricity pricing,
  customer hose/outlet, power availability and customer-supplied water wording.
  Town-level municipal notices and official links remain in the copy.
- Extended the final `/api/landing_pages_public` guard to inspect town FAQ
  questions/answers and local water notes, not just list items and hero copy.
  Known conflicting managed text is suppressed or replaced for public viewing;
  no managed database record is silently rewritten. The separate editable
  water-restriction source stays authoritative for current local limits.
- Added the staff-protected, GET-only endpoint
  `/api/admin/town_mobile_setup_review`. It identifies conflicting fields in
  bundled pages and the independently managed `landing_pages_content` and
  `landing_pages` settings, retaining source names and update timestamps.
  Missing or unreadable source checks require owner review.
- Added **Town landing-page setup copy audit** to both mirrored Admin Site
  Settings routes, with a manual check, precise field/source findings, links
  to the landing-page editor and the local water-rules review. There is no
  background correction, POST, sync or forced publish.

## Preserved boundaries

- No Supabase schema/data writes, RLS changes, credentials exposed to the
  browser, water-rule edits, pricing changes or payment/booking changes.
- `/terms` and `/waiver` retain their pre-existing water/power wording until
  owners explicitly approve any contractual revision.
- Official municipal information must be checked against current notices;
  the copy audit is not an authority for new municipal rules.

## Verification

`node scripts/build657_town_mobile_setup_reconciliation_test.mjs` covers
the eight bundled towns, JSON mirror parity, sample contradictory managed
records, FAQ guarding, independent local water rules, staff authentication,
the read-only boundary and legal holds. The test is also wired into
`scripts/current_booking_wizard_regression.sh`.

The production gate requires protected source suites, equal merged `dev` and
`main` trees, a successful Cloudflare exact-`main` SHA acceptance, and a
read-only live town-page smoke.

## Next expected Build 658

**Service & Add-On Landing-Page Mobile Setup Copy Audit** — extend the same
owner-reviewed water/power consistency work to standalone service and add-on
landing pages, without altering municipal water rules or legal agreements.
