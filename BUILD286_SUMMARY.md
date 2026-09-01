# Build 286 — Completed-Job Customer Review Authority

## Status

Build 286 closes the authenticated customer review-authority gap on Development. Production remains closed until a separate deliberate promotion decision.

## Completed-job review boundary

A customer review must now reference one genuinely completed Rosie booking that belongs to the signed-in customer account. The server re-reads the booking through the authenticated customer email and accepts only rows whose booking status or job status is `completed`.

A caller-supplied booking identifier is evidence to verify, not authority. Missing, foreign, future, cancelled, in-progress, or otherwise non-completed bookings fail closed with the same customer-facing validation response.

## Customer account experience

The existing My Account review form is retained. Build 286 adds a small account-only helper that replaces the old optional/all-bookings selector with **Completed booking** choices returned by the authenticated review endpoint.

If there are no completed bookings, review submission is disabled and the account explains that reviews unlock after a Rosie booking is genuinely completed. The helper does not pre-fill praise or review text.

## Write authority and privacy

The direct customer review endpoint no longer trusts browser-supplied `vehicle_id`, `review_source`, or arbitrary Google review URLs. The server records the existing Rosie app source and trusted Rosie Google-review destination itself.

The customer may still explicitly choose **Allow public reuse after approval**. That boolean is consent to later review, not publication authority: new rows remain `submitted` and require the existing later approval/public-proof process before reuse.

Build 286 does not turn `customer_reviews` into the public review renderer and does not fabricate a verified Google review.

## Analytics

Build 286 emits bounded, fail-open `customer_review_prompt_view` and `customer_review_submit_attempt` evidence through the existing analytics client/event convention. No parallel analytics endpoint or storage authority is introduced.

## Referral boundary

No referral reward, loyalty discount, credit, payout, or recurring economics are introduced. Those business rules remain blocked on explicit business approval.

## Architecture / safety

- Reuses the existing authenticated customer session and `bookings` authority.
- Reuses the existing `customer_reviews` table; no parallel review store is added.
- Reuses the existing My Account form; the large account page is not rewritten.
- No schema migration is required.
- No pricing, availability, deposit, checkout, Stripe, PayPal, payment, maintenance-cadence, or referral-economics authority is added.
- Production remains closed.

## Release boundary

Build 286 may be called Development GREEN only after the exact feature SHA passes its focused source gate and Cloudflare preview, `dev` fast-forwards to that accepted SHA, the cumulative Development source/Cloudflare checks remain green, and the Build 286 Development runtime smoke confirms the account helper and authenticated review route are deployed. Production remains untouched.
