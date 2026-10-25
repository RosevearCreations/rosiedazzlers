# Build 645 — Local SEO Optional Trigger Closure

## Scope

Continue Builds 633–644 by narrowing the broad `build*` push trigger on the legacy Local SEO Service Landing Proof Authority workflow, while retaining `main` and `dev` pushes and pull requests, its original path filters and proof checks. The workflow has no manual dispatch event; its event contract is unchanged.

This explicitly does **not** touch release governance, I.T. readiness, or Production business acceptance feature selectors, which can carry independent protected release policy contracts.

## Verification

- `scripts/build645_optional_authority_local_seo_test.mjs` fail-closes on selector regressions, lost path guards, any weakening of three release-policy selectors, lost source-gate tests, or changed underlying job.
- The stable `scripts/current_optional_authority_triggers.sh` now runs Builds 633–645; protected Source Gate suite A executes it.
- No customer-facing copy, prices, service availability, payment, provider integration, database or deployment configuration changes.
- Run required checks A–D and aggregate before dev and main protected PR merges. Confirm exact Cloudflare Production commit and live site health before GREEN.
