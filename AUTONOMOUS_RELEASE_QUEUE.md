# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries. The durable forward sequence is recorded in `FORWARD_BUILD_ROADMAP_356_377.md`.

## Accepted checkpoint

The accepted predecessor checkpoint is exact SHA `6ab62823c9b995bb8a9968bd1d9ba7ed15573961`, synchronized on `dev` and `main` before the current release began. `main` remains there until the current exact `dev` SHA is Development GREEN. The live site is responding on that promoted boundary, but no separate exact Production runtime SHA identity endpoint/workflow is currently exposed.

## Active — Build 357

Scope: **Rebook Catalog & Pricing Revalidation**.

A previous service is historical context only. Before the current `/book` shell selects that service, the historical package/date pair must first match authenticated customer history and the package must then resolve through the current public pricing catalog.

### Acceptance checklist

- Completed-service cards continue to consume authenticated `service_history`; no second service-history table or endpoint is created.
- The rebook handoff continues to carry only `rebook_package` and `rebook_date` verification evidence.
- `/book` re-authenticates that pair against the signed-in customer's current dashboard history.
- After history verification, `/book` reads `/api/pricing_catalog_public` with `no-store` semantics and requires a valid current package row before selecting a booking control.
- Missing current catalog, failed current-catalog read, missing package, explicitly inactive/disabled/non-bookable/retired package, or a package with no current vehicle-size price fails closed.
- The rebook helper does not silently use bundled fallback data to declare stale historical commercial terms current when the live catalog cannot be verified.
- A retired or unavailable service is never silently substituted with another service.
- Historical price, deposit, payment state, appointment/slot, add-ons, customer identity/contact fields, booking state and private notes remain excluded from the handoff.
- Current vehicle choice/size, availability, add-ons, package price, deposit and payment rules remain authoritative after service revalidation.
- The existing unified booking shell remains the pricing/selection presentation authority; the current release does not create a parallel booking, checkout, availability or payment engine.
- No database migration or Production business-data mutation is introduced.
- Focused behavior proof covers active current package, disabled/retired/missing/unpriced package failure, exact safe query construction, and forbidden stale-state fields.
- Existing `scripts/booking_completion_retention_check.py` must continue to execute the focused rebook proof as part of Current Source Gate.
- Exact `dev` SHA must pass Current Source and all retained focused gates.
- Exact `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Production promotion is by fast-forwarding `main` to the same exact Development-GREEN SHA only.
- Verify all Production evidence actually exposed; do not infer exact runtime SHA identity when the platform does not expose it through the current repo workflow.

## Next

After **Build 357** closes, continue with the per-vehicle service timeline from the durable forward roadmap.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as a separate acceptance boundary. When Production exact-SHA runtime identity is not externally exposed, report that limitation rather than weakening the evidence standard.
