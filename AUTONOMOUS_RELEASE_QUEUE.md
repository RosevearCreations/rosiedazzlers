# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries. The durable forward sequence is recorded in `FORWARD_BUILD_ROADMAP_356_377.md`.

## Accepted checkpoint

Development `dev` and Production `main` are synchronized at **Build 355 — My Account Completed Service History Convergence** exact SHA `0df31eacb53ac76e98f4cce07989285b309ef8c8` before the current release begins.

## Active — Build 356

Scope: **Safe Rebook From Service History**.

Expose a customer-safe rebook action from the canonical completed-service presentation while reusing the retained authenticated rebook verification authority and the current unified booking shell.

### Acceptance checklist

- Completed-service cards continue to consume authenticated `service_history`; no second service-history table or endpoint is created.
- The rebook action is offered only when a usable historical `package_code` and `service_date` exist.
- The handoff carries only `rebook_package` and `rebook_date` verification evidence.
- Historical price, deposit, payment state, appointment/slot, add-ons, customer identity/contact fields, booking state and private notes are not carried into the new booking.
- `/book` re-authenticates the requested package/date pair against the signed-in customer's current dashboard history.
- The current unified booking shell recognizes the retained rebook authority and its current `data-choose-package` service control.
- Retired/unavailable services fail closed; no silent substitution occurs.
- Current vehicle choice/size, availability, add-ons, price, deposit and payment rules remain authoritative.
- The build creates no parallel booking engine, checkout path, availability authority or provider transaction.
- No database migration or Production business-data mutation is introduced.
- Focused behavior proof covers safe query construction, canonical completed-service integration, current unified booking-shell bridging and forbidden stale-state fields.
- Exact `dev` SHA must pass Current Source and all retained focused gates.
- Exact `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Production promotion is by fast-forwarding `main` to the same exact Development-GREEN SHA only.
- Exact `main` SHA must pass Production Cloudflare deployment/checks before the release closes.

## Next

After the current release is Production GREEN, continue with current-catalog/current-pricing revalidation for rebooking as defined in the durable forward roadmap.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as a separate acceptance boundary.
