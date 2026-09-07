# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- Accepted Development and Production checkpoint: **Build 354 — Customer + Vehicle + Service History Convergence** at exact SHA `c48646ffe807fce9d85c7448e7bb6436420fcd67`.
- `dev` and `main` are synchronized on that exact accepted SHA before Build 355 starts.
- Active work: **Build 355 — My Account Completed Service History Convergence**.
- Build 355 introduces no database migration, historical backfill, provider transaction, pricing change or Production business-data mutation.
- Production promotion is authorized only after the exact Build 355 `dev` SHA is Development GREEN.

## Why this release is active

Build 354 added the authenticated `service_history` dashboard contract by deriving completed services from the existing booking-completion authority and linking them to canonical saved vehicles where possible. The retained My Account runtime still presents generic booking-history cards, so completed work is not yet shown through that new canonical customer-facing contract.

Build 355 closes that presentation gap without creating another service-history table, API, scheduler or maintenance authority.

## Operating contract

- `functions/api/client/dashboard.js` remains the authenticated customer dashboard and completed-service read authority.
- `service_history` remains read-only, customer-scoped, deduplicated and canonical-vehicle-linked when a saved vehicle exists.
- `assets/my-account-v296.js` remains the accepted underlying My Account runtime and is not rewritten merely to land this bounded presentation change.
- `assets/my-account-v355.js` is a thin presentation adapter that observes the retained dashboard request rather than issuing a second dashboard fetch.
- Current/upcoming bookings continue to retain progress access.
- Completed bookings are removed from the current/upcoming presentation and shown only in the completed-service section.
- Maintenance presentation may use the latest completed service as historical context only.
- No due date, cadence, price, discount, priority, appointment, subscription or recurring billing is created from service history.
- Loading My Account introduces no polling or background monitoring loop.

## Durable authorities

- `functions/api/client/dashboard.js` — authenticated customer dashboard and canonical `service_history` response.
- `functions/api/detailer/job_action.js` — authoritative staff completion transition.
- `functions/api/_lib/customer-vehicle-service-history.js` — same-profile durable saved-vehicle service-fact synchronization.
- `my-account.html` — customer account surface.
- `assets/my-account-v296.js` — retained accepted My Account runtime.
- `assets/my-account-v355.js` — Build 355 service-history presentation adapter.
- `scripts/my_account_service_history_test.mjs` — focused Build 355 behavior proof.
- `scripts/booking_completion_retention_check.py` — cumulative completion/rebooking/service-history guard.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Release procedure

1. Require the exact Build 355 source SHA to pass the cumulative Current Source Gate and all retained focused authorities.
2. Confirm `dev` starts from accepted Build 354 SHA `c48646ffe807fce9d85c7448e7bb6436420fcd67`.
3. Require the exact synchronized `dev` SHA to pass Cloudflare Development acceptance, including exact SHA/branch identity and retained runtime smoke.
4. Confirm `main` still cleanly fast-forwards from the accepted Build 354 checkpoint.
5. Fast-forward `main` only to the exact same Development-GREEN Build 355 SHA.
6. Require Production Cloudflare deployment and exact-SHA checks to succeed before calling Build 355 Production GREEN.

## Next sequential scope

After Build 355 closes, re-read current source and continue the customer retention sequence. A likely next slice is a safe rebook action from canonical completed-service history, but it must reuse the existing verified rebooking authority and must not carry stale pricing, scheduling, customer identity or prior-payment state.

## Restart point

If interrupted, start from the latest exact `dev` SHA, inspect `assets/my-account-v355.js`, `scripts/my_account_service_history_test.mjs`, and `scripts/booking_completion_retention_check.py`, then verify the exact-SHA Current Source and Cloudflare Development acceptance state before making further changes.
