# Build 399 — Customer Communication, Self-Service & Booking Funnel

Build 399 advances the customer journey after service selection while retaining the proven booking, payment, consent, notification, privacy, and responsive authorities.

## Customer communication and self-service

- The secure confirmation page links customers to preparation, status, and aftercare guidance without weakening provider-backed confirmation.
- My Account presents phone-usable paths for preparation questions, appointment status, reschedule/cancellation review, aftercare, reviews, and rebooking.
- Self-service links are navigation and requests for review only. They do not silently change or cancel bookings, promise a refund, send a message, or claim staff acceptance.
- A new booking always revalidates current price, scope, availability, policies, and payment.
- Communication remains permission-aware and provider/delivery-evidence gated. Build 399 introduces no automatic outreach or background polling.

## Booking funnel quality evidence

- New protected Admin surface: `/admin-customer-booking-funnel.html`.
- New protected read-only endpoint: `/api/admin/customer_booking_funnel_quality`.
- Anonymous interaction telemetry and canonical booking status totals are reported as separate evidence layers.
- No session/customer identity join is performed. Counts are not presented as a person-level cohort.
- Both sources use bounded windows and row limits. Reaching either limit marks the result partial; unavailable evidence is not reported as zero.
- No customer identity, session identifier, IP address, User-Agent, postal code, or contact detail is selected or returned.

## Responsive and mutation boundary

All new customer and Admin surfaces use stacked phone layouts and 44–46px touch targets while retaining Build 397 responsive authority. Build 399 is schema-neutral and authorizes no database migration, Production business-data mutation, booking mutation, customer charge/refund, provider mutation, message dispatch, accounting posting, period-close mutation, inventory mutation, R2 write/delete, DNS mutation, or secret rotation.

## Release sequence

The candidate must pass the focused Build 399 authority, retained Build 398 and responsive authorities, Current Source Gate, and feature-preview acceptance. Development must accept the exact candidate SHA before a protected-main pull request. The resulting `main` merge SHA must then pass exact Production deployment/runtime/business acceptance. Build 400 is next only after Build 399 is fully GREEN.
