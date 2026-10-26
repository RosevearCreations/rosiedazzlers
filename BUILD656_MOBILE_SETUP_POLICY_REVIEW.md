# Build 656 — Mobile Setup Policy Drift Guard & Owner Review

The owner-established operating model is Rosie-supplied standard detailing
water and power. Build 655 aligned the bundled public copy, but the live footer
could still inherit contradictory `site_policies.water_power` from a managed
database record.

## Changes

- The public footer and runtime site-policy renderer prevent known legacy
  customer-supplied-utility wording from resurfacing in rendered copy. They
  use the canonical bundled copy only when a managed value is absent or
  explicitly contradicts the owner operating model. Other managed policy copy
  remains unchanged.
- A protected, GET-only Admin review at
  `/api/admin/mobile_setup_policy_review` reports the currently loaded
  `site_policies` source, whether its water/power text agrees, and summaries
  of active relevant `public_faq_entries` statuses. It never writes to either
  table, creates migrations, modifies permissions, or exposes private keys.
- `/admin-site-settings` adds an explicit **Check managed copy** button and
  links to the existing Site Policies editor, Content Center, Terms, and
  Waiver. There is no background polling or automatic correction.
- The protected review reports missing/fallback data sources as requiring
  owner review, never as proof of a healthy production database.

## Holds

The old utility clauses in `/terms` and `/waiver` remain pending explicit
owner approval and legal review. This release does not amend contractual
language, rewrite live Supabase records or change pricing, eligibility,
booking/payment acknowledgement semantics, deposits, or scheduling.

## Acceptance

`node scripts/build656_mobile_setup_policy_review_test.mjs` verifies both
public runtime guards, preserved legitimate site-access requirements, aligned
Admin page mirrors, protected review, no writes, and legal holds. It is wired
into `scripts/current_booking_wizard_regression.sh`.

Production proof requires successful protected source suites, matching
`dev`/`main` release trees, Cloudflare Pages exact `main` SHA acceptance, and
a read-only live footer smoke.

## Proposed Build 657

**Town Landing-Page Mobile Setup Copy Audit & Owner-Safe Reconciliation** —
review and correct static town/service guidance that still suggests customers
supply water/power, preserve locally applicable runoff rules, and identify
database-managed local landing content requiring separate owner approval.
