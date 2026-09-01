# Build 287 — Customer Review Follow-Up + Referral Sharing Mechanics

## Status

Build 287 extends the accepted Build 286 completed-job review authority on Development. Production remains closed until a separate deliberate promotion decision.

## Review follow-up

The authenticated review eligibility endpoint remains the source of truth for whether a customer has a genuinely completed Rosie booking. It now also returns the server-owned Rosie Google review destination so browser code does not invent or accept an arbitrary provider URL.

The My Account page keeps the existing customer-written review form. After a completed service is available, a small isolated Build 287 helper offers two neutral follow-up actions:

- **Review Rosie on Google** — opens the server-returned Rosie Google destination. Build 287 does not pre-fill praise, claim that a Google review was returned, or mark any provider review verified.
- **Share Rosie** — uses native device sharing when available and falls back to copying a Rosie booking link.

Sharing is explicitly not a discount, credit, reward, payout or loyalty promise.

## Referral-origin measurement

The shared URL is same-origin and contains only:

- `utm_source=customer_share`
- `utm_campaign=customer_referral`

The existing `public-analytics.js` authority already records UTM source/campaign. A small `/book` adapter emits `customer_share_booking_entry` only when those exact markers are present and shows a neutral attribution notice.

The adapter does **not** modify package, vehicle, size, availability, add-ons, price, deposit, checkout, Stripe, PayPal or payment fields. Referral-origin traffic is measurable; Build 287 does not claim a successful referral or reward-eligible conversion.

## Analytics

Build 287 reuses `/api/analytics/ingest` through the existing fail-open browser analytics client. It adds bounded events for review/share prompt visibility, Google-review opening, share start/completion/cancellation and customer-share booking entry.

No parallel analytics store or endpoint is introduced.

## Referral boundary

No referral reward, loyalty discount, credit, payout, recurring economics or commercial referral promise is introduced. Those business rules remain blocked on explicit business approval.

## Architecture / safety

- Reuses Build 286 authenticated completed-booking review eligibility.
- Reuses the existing `customer_reviews` table.
- Reuses the existing booking engine without adding acquisition fields to the booking row.
- Reuses existing UTM analytics rather than placing marketing data in booking notes.
- No schema migration is required.
- No review is auto-approved or auto-published.
- No referral/loyalty economics are introduced.
- Production remains closed.

## Release boundary

Build 287 may be called Development GREEN only after the exact feature SHA passes its focused source gate and Cloudflare preview, `dev` fast-forwards to that accepted SHA, the cumulative Development source/Cloudflare checks remain green, and the Build 287 Development runtime smoke confirms the account/share assets and protected review authority are deployed. Production remains untouched.
