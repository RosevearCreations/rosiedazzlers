# Rosie Dazzlers 808 — Mobile Checkout and Confirmation

## Customer experience

- Step 5 describes the three stages: fresh server verification, secure provider checkout (if a deposit remains), and verified confirmation.
- Gift-covered deposits succeed **in place** only when the canonical checkout POST returns `ok`, `gift_only_confirm`, an exact `confirmed` status, a valid booking reference, and zero payable cents. The browser neither redeems a gift nor reuses a stale checkout URL.
- External checkout redirects are restricted to HTTPS Stripe or PayPal checkout hosts; malformed or unexpected URLs lock further submission for review.
- Definite validation / capacity conflicts may be corrected with fresh availability checks. Ambiguous errors, network failures, unexpected provider responses and unknown conflicts remain locked in the current tab against accidental duplicate payment.
- A return to `/book?booking_id=...` displays cautious guidance without pretending to know whether a charge settled. The identifier is never fetched or shown back to an unauthenticated visitor.
- `/booking-confirmed?provider=gift` is **not** proof of payment or booking status. It now explicitly refuses to show a confirmed state. Stripe/PayPal keep their existing server-side provider verification and settlement checks.

## Boundaries

- No database, authorization, Stripe/PayPal credentials, live provider calls, or payment/booking server mutations were changed in this build.
- No automatic payment retry, automatic new hold, background notification, or customer communications were activated.
- Production acceptance requires all existing protected gates, `scripts/build808_mobile_checkout_confirmation_test.mjs` and `scripts/current_booking_wizard_regression.sh` to pass. Synthetic tests do not prove a real customer provider checkout.

## Manual owner acceptance after deployment

1. On a phone, start `/book`, choose a vehicle/service and reach Step 5. Check the deposit summary, three-stage explanation and full-width actions.
2. In the approved Stripe/PayPal sandbox, confirm that the real provider return shows pending until the server confirms settlement, and confirmed only after that verification. Do not make a live charge as a smoke test.
3. Use a safely configured test gift to confirm zero-deposit checkout stays in the planner and does not redirect to a query-based confirmation page. Do not test with a customer's real gift balance.
4. Confirm a canceled or uncertain provider return does not invite a second charge; verify booking status via the authorized operator workflow before retry.
