# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries.

## Accepted checkpoint

Development `dev` and Production `main` were synchronized at **Build 354 — Customer + Vehicle + Service History Convergence** exact SHA `c48646ffe807fce9d85c7448e7bb6436420fcd67` before the current release began.

## Active — Build 355

Scope: **My Account Completed Service History Convergence**.

Preserve the accepted My Account runtime, separate current/upcoming bookings from completed services, render completed work only from the authenticated `service_history` dashboard contract, show canonical saved-vehicle identity where available, and use the latest completed service only as non-authoritative maintenance context.

### Acceptance checklist

- `functions/api/client/dashboard.js` remains the single authenticated customer dashboard/service-history read authority.
- The current release creates no service-history table, duplicate service-history endpoint or maintenance scheduler.
- `assets/my-account-v296.js` remains the accepted underlying My Account runtime.
- `assets/my-account-v355.js` observes the retained dashboard request and must not issue a second `/api/client/dashboard` fetch.
- Current/upcoming booking cards exclude completed bookings and preserve progress access.
- Completed-service cards consume `service_history` rather than rebuilding completed history from generic bookings in the browser.
- Canonical saved-vehicle name/year/make/model is shown when available, with a safe vehicle-size fallback when no saved vehicle link exists.
- The latest completed service may be shown in Maintenance Interest as historical context only.
- No due date, cadence, pricing, discount, priority, appointment, subscription or recurring billing is inferred from history.
- No polling/background loop is introduced.
- Focused behavior proof covers completed/current separation, canonical vehicle labeling and maintenance-history context.
- The cumulative completion/retention authority fails closed if the adapter bypasses the retained dashboard or introduces a mutation path.
- No database migration, historical backfill or Production business-data mutation is introduced.
- Exact `dev` SHA must pass Current Source and all retained focused gates.
- Exact `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Production promotion is by fast-forwarding `main` to the same exact Development-GREEN SHA only.
- Exact `main` SHA must pass Production Cloudflare deployment/checks before the release closes.

## Next

After the current release is GREEN on Production, re-read current source and continue the customer retention sequence. Prefer a bounded rebook-from-history improvement only if it reuses the existing verified rebooking authority and carries no stale price, customer identity, schedule, payment or booking-state data.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as a separate acceptance boundary.
