# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record. The durable forward sequence is `FORWARD_BUILD_ROADMAP_356_377.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Accepted predecessor checkpoint: exact SHA `6ab62823c9b995bb8a9968bd1d9ba7ed15573961` on both `dev` and `main` before the current release began.
- Active release: **Build 357 — Rebook Catalog & Pricing Revalidation**.
- Current `dev` implementation SHA before the documentation-hygiene repair: `429ff9bae3d398bb89310fa0978005042d25e8bf`.
- `main` remains on the accepted predecessor checkpoint until the exact current `dev` SHA passes both source and Cloudflare Development acceptance.
- The public Production site is responding on the promoted predecessor boundary, but the repository currently exposes no separate Production exact-SHA acceptance workflow or public build-identity endpoint. Do not convert that missing identity evidence into a stronger Production-GREEN claim.
- The current release introduces no database migration, historical backfill, provider transaction, pricing change or Production business-data mutation.

## Current scope

A previous service is historical context only. Before the current `/book` shell selects that service, the historical package/date pair must first match authenticated customer history and the package must then resolve through the current public pricing catalog.

## Operating contract

- `functions/api/client/dashboard.js` remains the authenticated customer dashboard and canonical completed-service read authority.
- `assets/my-account-v355.js` remains the current completed-service presentation adapter over the accepted My Account runtime.
- `assets/customer-rebook-v285.js` remains the retained authenticated rebook verifier and now also performs fail-closed current-catalog revalidation.
- `/api/pricing_catalog_public` is the current public catalog/pricing read authority for revalidation.
- The account CTA continues to pass only historical `rebook_package` and `rebook_date` verification evidence.
- `/book` must first verify that pair against the signed-in customer's dashboard history.
- The requested historical `package_code` must then resolve through the current public catalog before any current booking control is selected.
- Explicitly inactive, disabled, non-bookable, retired, missing or currently unpriced package rows fail closed.
- Catalog/API failure fails closed for rebooking; the helper does not silently fall back to bundled historical catalog data as commercial proof.
- A retired or unavailable service is never silently replaced with another package.
- Current vehicle selection/size, availability, add-ons, pricing, deposit and payment rules remain authoritative after the current service is verified.
- No customer identity/contact snapshot, old slot, price, add-ons, deposit, payment, booking state or private note is reused.
- No new checkout, availability, provider, scheduler, polling or background loop is introduced.

## Durable authorities

- `functions/api/client/dashboard.js` — authenticated dashboard and canonical `service_history` response.
- `assets/my-account-v355.js` — current completed-service presentation.
- `assets/customer-rebook-v285.js` — authenticated historical package/date verification plus current-catalog revalidation.
- `functions/api/pricing_catalog_public.js` — current public catalog/pricing read authority.
- `functions/api/_lib/pricing-catalog.js` — canonical server-side pricing catalog loader.
- `assets/booking-hours.js` — booking-facing bridge into the current unified `/book` shell.
- `scripts/my_account_safe_rebook_test.mjs` — focused safe-handoff and current-catalog revalidation behavior proof.
- `scripts/booking_completion_retention_check.py` — cumulative completion/rebooking/service-history guard; it executes the focused rebook proof.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Release procedure

1. Require the exact current source SHA to pass the cumulative Current Source Gate and all retained focused authorities.
2. Require that synchronized `dev` SHA to pass Cloudflare Development acceptance, including exact SHA/branch identity and retained runtime smoke.
3. Confirm `main` still cleanly fast-forwards from the accepted checkpoint.
4. Fast-forward `main` only to the exact same Development-GREEN SHA.
5. Verify all Production evidence that is actually exposed. If exact Production runtime SHA identity remains unavailable, state that limitation explicitly rather than claiming stronger proof.

## Next sequential scope

After **Build 357** closes, continue with the per-vehicle service timeline from the durable forward roadmap, using canonical saved-vehicle identity and existing completed-service history without creating a second service-history ledger.

## Restart point

If interrupted, start from the latest exact `dev` SHA, inspect `assets/customer-rebook-v285.js`, `functions/api/pricing_catalog_public.js`, `scripts/my_account_safe_rebook_test.mjs`, and `scripts/booking_completion_retention_check.py`, then verify exact-SHA Current Source and Cloudflare Development acceptance before further changes.
