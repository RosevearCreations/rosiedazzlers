# Build 285 — Customer History → Repeat/Rebook Handoff

## Status

Build 285 closes the customer-history rebook handoff on Development. Production remains closed until a separate deliberate promotion decision.

## Customer History

Authenticated customers now receive a **Book this service again** action beside genuinely repeatable past bookings in My Account. Cancelled, refunded, failed, declined, void, future, malformed, or package-less records do not receive the action.

The handoff URL carries only the previous `package_code` and previous `service_date` as verification evidence. It does not carry the old slot, vehicle size, add-ons, old price, deposit, payment state, or checkout state.

## Current booking authority

On `/book`, Build 285 re-reads `/api/client/dashboard` with the authenticated customer session. The requested package/date pair must match a repeatable row in that authenticated history. The current booking UI must also still expose the exact package code before it can be selected.

When those checks pass the page shows **Using your previous booking as a starting point**. The previous service is only a starting choice: current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from the current booking authority.

If the prior service has been retired or is no longer exposed by the current catalogue, Build 285 fails closed and asks the customer to choose a current service. It never silently substitutes another service.

If exactly one saved Garage vehicle is still resolvable by the current booking UI, that current Garage vehicle may be selected. With multiple saved vehicles, the customer must choose the correct one.

## Architecture / safety

- Reuses the existing Build 274/275 booking presentation chain; no parallel booking engine was added.
- Reuses the existing authenticated `/api/client/dashboard`; no parallel history API was added.
- No schema migration is required.
- No pricing, availability, deposit, checkout, Stripe, PayPal, or payment authority was added.
- No maintenance cadence, automatic recurrence, discount, review, or recommendation authority was added.
- The existing Build 275 `Next available slots` and `booking_funnel_exit` contracts remain retained.
- Build 285 source and HTTP guards are added to the cumulative Development release path.

## Release boundary

Build 285 may be called GREEN only after the exact feature SHA passes its source gate and Cloudflare preview, is fast-forwarded to `dev`, and that same SHA passes Development Source Gate plus Cloudflare Development Acceptance. Production remains closed.
