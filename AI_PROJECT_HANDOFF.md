# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record. The durable forward sequence is `FORWARD_BUILD_ROADMAP_356_377.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 357 — Rebook Catalog & Pricing Revalidation** is implemented and Development GREEN at exact SHA `8c7b438bd12179a68c9be838992318eafe453a66`.
- The same exact SHA was promoted to `main` by non-force fast-forward; `dev` and `main` are synchronized.
- Current Source Gate #486 passed on that exact SHA, including the cumulative completion/rebook guard and release-hygiene authority.
- Cloudflare Development Acceptance #165 passed on that exact SHA, including exact deployment confirmation and protected Admin smoke.
- The public Production homepage and `/book` are responding after promotion. The current repository still exposes no separate Production exact-SHA acceptance workflow or public build-identity endpoint, so do not convert that missing runtime identity evidence into a stronger Production-GREEN claim.
- The accepted release introduced no database migration, historical backfill, provider transaction, pricing change or Production business-data mutation.
- Next sequential scope: **Build 358 — Per-Vehicle Service Timeline**.

## Accepted operating contract

- `functions/api/client/dashboard.js` remains the authenticated customer dashboard and canonical completed-service read authority.
- `assets/my-account-v355.js` remains the current completed-service presentation adapter over the accepted My Account runtime.
- `assets/customer-rebook-v285.js` remains the retained authenticated rebook verifier and performs fail-closed current-catalog revalidation.
- `/api/pricing_catalog_public` is the current public catalog/pricing read authority for revalidation.
- Rebooking carries only historical `rebook_package` and `rebook_date` verification evidence.
- `/book` first verifies that pair against the signed-in customer's dashboard history, then resolves the requested package through the current public catalog before selecting any current booking control.
- Inactive, disabled, non-bookable, retired, missing or currently unpriced package rows fail closed.
- Catalog/API failure fails closed for rebooking; bundled historical catalog data is not treated as current commercial proof.
- A retired or unavailable service is never silently replaced with another package.
- Current vehicle selection/size, availability, add-ons, pricing, deposit and payment rules remain authoritative.
- No customer identity/contact snapshot, old slot, price, add-ons, deposit, payment, booking state or private note is reused.
- No new checkout, availability, provider, scheduler, polling or background loop was introduced.

## Durable authorities

- `functions/api/client/dashboard.js` — authenticated dashboard and canonical `service_history` response.
- `assets/my-account-v355.js` — current completed-service presentation.
- `assets/customer-rebook-v285.js` — authenticated historical package/date verification plus current-catalog revalidation.
- `functions/api/pricing_catalog_public.js` — current public catalog/pricing read authority.
- `functions/api/_lib/pricing-catalog.js` — canonical server-side pricing catalog loader.
- `scripts/my_account_safe_rebook_test.mjs` — focused safe-handoff and current-catalog revalidation behavior proof.
- `scripts/booking_completion_retention_check.py` — cumulative completion/rebooking/service-history guard.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Next build boundary

The next release should add a customer-safe per-vehicle timeline using canonical saved-vehicle identity and the existing completed-service authority. It must not create a second service-history ledger, infer cross-vehicle matches, or expose staff-private notes/checklists.

## Restart point

Start from the exact synchronized `dev`/`main` checkpoint above. Inspect `functions/api/client/dashboard.js`, `assets/my-account-v355.js`, canonical vehicle identity helpers, and existing service-history tests before implementing the next bounded release. Preserve the exact-SHA Source → Development → non-force `main` promotion discipline.
