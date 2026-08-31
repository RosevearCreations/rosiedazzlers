# Rosie Dazzlers Build 281 — Development Alias Propagation Reliability

## Boundary

Builds 277–280 are the accepted Development baseline at `a3e7093b8cdc2cb4556b338368b8b58bef8045fc`. Build 281 changes release acceptance reliability only. It does not change customer pricing, booking rules, public service scope, Production data, or the Production branch.

## Problem closed

Cloudflare Pages can report the exact `dev` deployment successful before the mutable `https://dev.rosiedazzlers.pages.dev` branch alias has converged everywhere. Builds 277–280 exposed this edge: the immutable deployment was successful while the first alias smoke briefly returned the previous landing-page API generation; an unchanged rerun passed.

## Build 281 contract

- Keep the existing exact branch + exact commit SHA lookup and require the matching Cloudflare deployment to reach `success`.
- Smoke the exact deployment URL first. A successful Cloudflare status is not enough if the immutable deployment itself does not serve the required application/API/service/location/sitemap markers.
- Run the same smoke helper against the `dev` branch alias only after the exact deployment passes.
- Give the branch alias a bounded retry window of 12 attempts with 5-second spacing so ordinary propagation lag does not create a false release failure.
- Keep failures fail-closed: if the exact deployment fails, or if the branch alias never converges during the bounded retry window, Development acceptance remains red.
- Use one shared smoke script for both URLs so the exact-deployment and alias evidence cannot drift into different acceptance contracts.

## Evidence retained

The shared smoke still covers the Staff App launcher, protected API non-5xx behavior, Tax Support, I.T. Connections, Build 275 booking retention, Build 278 self-contained water/power finalization, all eight local static fallbacks, and Build 280 sitemap freshness.

## Production boundary

Production remains closed. Build 281 does not move, merge, force-update, deploy, or otherwise mutate `main`. Production promotion remains a later deliberate decision after accepted Development evidence.
