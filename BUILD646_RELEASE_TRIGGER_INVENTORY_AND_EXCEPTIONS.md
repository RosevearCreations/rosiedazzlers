# Build 646 — Release Trigger Inventory & Protected Exceptions

## Repository-wide inventory

Scanned 203 tracked GitHub Actions workflow files after Builds 633–645. Exactly three workflows retain the literal broad `build*` selector under push branches:

1. `it-readiness-release-control-authority.yml` — retained due to a release governance audit asserting this selector.
2. `production-business-acceptance-authority.yml` — protected Production business acceptance and exact-SHA policy.
3. `release-governance-authority.yml` — owner release governance policy.

`cloudflare-feature-preview-acceptance.yml` separately uses `build**` for preview behavior; it is **not** the literal `build*` selector and is retained as-is.

## Change

Add `scripts/build646_optional_authority_inventory_test.mjs` to the stable fail-closed optional trigger suite, including an exhaustive scan of GitHub workflows. It detects any unexpected literal broad feature selector, missing protected exceptions, lost dev/main PR/push coverage, changed feature preview SHA contract, or missing source check name. No workflow triggers are changed in Build 646.

## Promotion safeguards

- No business logic, pricing, customers, booking, database, media, payment or Cloudflare configuration change.
- Protected source suites A–D and aggregate must all pass before `dev` and `main` PR mergers.
- Verify exact main Production commit successful in Cloudflare Pages and live homepage + health before GREEN.
