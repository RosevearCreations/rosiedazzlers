# Booking Recovery & Failure Handling

This authority defines the bounded customer-safety work for the current booking-recovery release. It strengthens recovery around the existing booking and payment flow without replacing the canonical pricing, availability, acknowledgement, booking, or provider rules.

## Recovery contract

- The canonical `/api/checkout` endpoint remains the source of truth for price, package/add-on eligibility, service-area rules, acknowledgements, slot conflicts, booking creation, deposits, gifts/promos, and provider checkout creation.
- `/api/checkout_recovery` is a narrow recovery wrapper. When there is no safe recovery candidate, it delegates to the canonical checkout unchanged.
- A recovery candidate must be a recent `pending` booking for the same service date, overlapping slot, customer email, package, and vehicle size, still inside the configured booking hold window.
- A different confirmed or still-active pending booking on the same slot wins. Recovery then fails closed as stale availability instead of overriding the server-authoritative conflict.
- Recovery never creates a second booking. It only reuses an already attached Stripe Checkout session or PayPal approval order for the matching pending booking.
- If a provider session is still attaching, provider lookup fails, or the prior payment session is no longer open, the customer receives an explicit retry/review state. The wrapper does not silently cancel, overwrite, or mutate the existing booking to manufacture a new payment path.

## Browser/session behavior

`assets/booking-recovery.js` is loaded only through the shared public policy hook on booking/payment-return surfaces.

- In-progress booking form state is saved to `sessionStorage`, not durable `localStorage`, and expires after six hours.
- Refresh, browser back/forward, iframe reload, or a payment cancel return can restore the customer’s selections and typed details in the same tab.
- Explicit booking-link query parameters take precedence over a saved draft so a shared/rebooking link is not silently overwritten.
- File objects are never persisted. Only existing photo-estimate links and ordinary form values can be restored.
- A customer can discard the saved booking and start clean.
- The checkout button’s existing disabled state remains intact. The recovery fetch wrapper additionally retries one network interruption once through the recovery endpoint, which makes a lost response safe because the server first checks for the matching pending booking.
- A 409 stale-availability collision sends the customer back to Step 1, refreshes availability through the existing planner event path, preserves the rest of the draft, and requires a new available slot before retry.

## Payment/deposit recovery

- Stripe recovery performs a read-only lookup of the already stored Checkout Session. An open session returns its original checkout URL; a completed session routes through the normal completion surface.
- PayPal recovery performs a read-only order lookup. A resumable order returns its existing approval URL; a completed order routes through the normal completion surface.
- Gift-covered canonical checkout responses are normalized by the browser enhancement to the normal completion surface instead of being misclassified as missing a checkout URL.
- No fake provider success, payment evidence, booking confirmation, refund, capture, or settlement state is created by this recovery layer.

## Failure families

Customer-facing recovery distinguishes at least these states:

- `stale_availability` — another active booking owns the requested slot;
- `pending_session_attach` — the booking exists but its provider session is not visible yet;
- `provider_lookup_failed` — provider verification could not be completed;
- `payment_session_expired` — the prior provider payment page is no longer resumable;
- `provider_configuration` — required provider configuration is unavailable.

Each state preserves the canonical booking conflict/payment boundary and provides a safe retry or review path instead of encouraging repeated duplicate submissions.

## Release and data boundary

- No database migration is required for this release.
- No new background polling is introduced; the browser uses event-driven listeners, a bounded `MutationObserver`, and a single timeout safety stop for draft restoration.
- The recovery wrapper reads the existing booking rows and provider session/order state. It delegates normal booking/payment creation to the canonical checkout endpoint and performs no direct booking-table mutation itself.
- Feature/source authority, exact feature preview, Development exact-SHA runtime acceptance, non-force `main` promotion, and exact-SHA Production acceptance remain mandatory release boundaries.
