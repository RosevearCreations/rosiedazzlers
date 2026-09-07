# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record. The durable forward sequence is `FORWARD_BUILD_ROADMAP_356_377.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Accepted Development and Production checkpoint: **Build 355 — My Account Completed Service History Convergence** at exact SHA `0df31eacb53ac76e98f4cce07989285b309ef8c8`.
- `dev` and `main` are synchronized on that accepted SHA before the current release starts.
- Active work: **Build 356 — Safe Rebook From Service History**.
- The current release introduces no database migration, historical backfill, provider transaction, pricing change or Production business-data mutation.
- Production promotion is authorized only after the exact current `dev` SHA is Development GREEN.

## Why this release is active

My Account now presents canonical completed-service history, but the older verified rebook handoff was built against an earlier booking-history presentation and older booking control selectors. The current release connects the canonical completed-service cards to that retained authenticated rebook authority and bridges it to the current unified `/book` shell.

## Operating contract

- `functions/api/client/dashboard.js` remains the authenticated customer dashboard and canonical completed-service read authority.
- `assets/my-account-v355.js` remains the current service-history presentation adapter over the accepted underlying My Account runtime.
- `assets/customer-rebook-v285.js` remains the retained authenticated rebook verifier; the current release makes it successor-compatible with canonical completed-service cards and the unified booking service selector.
- `assets/booking-hours.js` loads the retained rebook verifier on `/book` only when the safe rebook package/date evidence is present.
- The account CTA passes only historical package/date verification evidence.
- `/book` must verify that pair against the signed-in customer's current dashboard history before choosing the same still-current service.
- A retired or unavailable service fails closed and is never silently replaced.
- Current vehicle selection/size, availability, add-ons, pricing, deposit and payment rules remain authoritative.
- No customer identity/contact snapshot, old slot, price, add-ons, deposit, payment, booking state or private note is reused.
- No new checkout, availability, provider, scheduler, polling or background loop is introduced.

## Durable authorities

- `functions/api/client/dashboard.js` — authenticated dashboard and canonical `service_history` response.
- `assets/my-account-v355.js` — current completed-service presentation.
- `assets/customer-rebook-v285.js` — authenticated historical package/date verification and fail-closed rebook handoff.
- `assets/booking-hours.js` — booking-facing successor bridge into the current unified `/book` shell.
- `scripts/my_account_safe_rebook_test.mjs` — focused safe-handoff behavior proof.
- `scripts/booking_completion_retention_check.py` — cumulative completion/rebooking/service-history guard.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Release procedure

1. Require the exact current source SHA to pass the cumulative Current Source Gate and all retained focused authorities.
2. Require that synchronized `dev` SHA to pass Cloudflare Development acceptance, including exact SHA/branch identity and retained runtime smoke.
3. Confirm `main` still cleanly fast-forwards from the accepted checkpoint.
4. Fast-forward `main` only to the exact same Development-GREEN SHA.
5. Require Production Cloudflare deployment and exact-SHA checks to succeed before calling the release Production GREEN.

## Next sequential scope

After the current release closes, continue with current-catalog/current-pricing revalidation for rebooking. Historical service history remains context only; current commercial and scheduling rules must be re-resolved.

## Restart point

If interrupted, start from the latest exact `dev` SHA, inspect `assets/customer-rebook-v285.js`, `assets/booking-hours.js`, `scripts/my_account_safe_rebook_test.mjs`, and `scripts/booking_completion_retention_check.py`, then verify exact-SHA Current Source and Cloudflare Development acceptance before further changes.
