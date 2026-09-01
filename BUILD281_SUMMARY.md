# Rosie Dazzlers Build 281 — Development Alias Propagation Reliability

## Boundary

Builds 277–280 are the accepted Development baseline at `a3e7093b8cdc2cb4556b338368b8b58bef8045fc`. Build 281 changes release acceptance reliability only. It does not change customer pricing, booking rules, public service scope, Production data, or the Production branch.

## Problems closed

Cloudflare Pages can report the exact `dev` deployment successful before the mutable `https://dev.rosiedazzlers.pages.dev` branch alias has converged everywhere. Builds 277–280 exposed this edge: the first alias smoke briefly returned the previous landing-page API generation; an unchanged rerun passed.

Build 281 also confirmed an important project-specific boundary: the immutable hash deployment URL is suitable for exact static artifact identity, but `/api/landing_pages_public` returned 404 there even though this repository explicitly routes `/api/*` through Pages Functions and the `dev` branch alias serves the dynamic runtime. Acceptance therefore must not confuse immutable static identity with the Development Functions hostname.

## Build 281 contract

- Keep the exact branch + exact commit SHA lookup and require the matching Cloudflare deployment to reach `success`.
- Fetch the exact deployment record and require Cloudflare metadata to report `uses_functions=true`; Rosie Dazzlers depends on `/api/*` Pages Functions.
- Smoke the immutable exact deployment URL in **static artifact** mode. This proves the exact accepted commit serves the Staff App, retained admin pages, Build 275 booking-retention asset, all eight local fallback pages, and current sitemap.
- Run the **full dynamic/API** smoke against the `dev` branch alias only after exact deployment success, Functions metadata, and static artifact identity all pass.
- Give the branch alias a bounded retry window of 12 attempts with 5-second spacing so ordinary propagation lag does not create a false release failure.
- Protected API smoke rejects HTTP 404 as well as 5xx responses, so a missing Functions route can no longer masquerade as an acceptable unauthenticated response.
- Keep failures fail-closed: wrong SHA, unsuccessful deployment, missing Functions metadata, broken exact static artifacts, or alias non-convergence all keep Development red.
- Use one shared smoke script with explicit `static` and `full` scopes so retained markers cannot drift between acceptance paths.

## Evidence retained

The shared smoke covers the Staff App launcher, Tax Support, I.T. Connections, Build 275 booking retention, all eight Build 278 local static fallbacks, and Build 280 sitemap freshness in both applicable scopes. Full alias smoke additionally proves protected API routing plus the Build 278 public landing-page API self-contained water/power finalization and guards against stale customer utility assumptions.

## Production boundary

Production remains closed. Build 281 does not move, merge, force-update, deploy, or otherwise mutate `main`. Production promotion remains a later deliberate decision after accepted Development evidence.
