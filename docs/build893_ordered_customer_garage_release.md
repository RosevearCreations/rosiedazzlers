# Rosie Dazzlers Build 893 — Ordered customer account and vehicle garage software release

This *software* release follows 892 and builds upon the already-existing Build 742/809 customer profile, saved vehicle, booking history, change-request and staff approval backend. It hardens the original booking garage selector; no shadow customer or booking database is created.

## Delivered source behavior
- A customer must have a signed-in dashboard and a valid, unique saved vehicle ID before the booking form may set a garage-selection hint. Invalid/tampered index is rejected, stale cookies are cleared before async refresh, and editable vehicle fields invalidate the hint.
- The checkout server independently verifies the HttpOnly customer session and the saved vehicle's actual `customer_profile_id` against that signed-in account. Forged browser IDs/cookies, cross-account rows and stale garage selections fail closed.
- The existing self-service history and reschedule/cancel **request** remain staff-reviewed. A customer's change request cannot autonomously change bookings, reserved capacity, deposits or customer messages.
- Source regression covers UI indexing, forged ID, missing session, mismatched owner, stale cookie and legacy self-service tests.
- Synthetic test identities are **SIMULATED**; no real customer account or device was used, no payment made.

## Gates
Protected PR checks + Cloudflare preview -> reviewed merge to `main` -> exact Cloudflare Production deployment, Source/Business suites, Release Health GREEN and queue WITHIN_BUDGET determine **software release GREEN**. Owner-supervised real customer phone/tablet/desktop, genuine identity/RLS and request resolution acceptance remain **BUSINESS HOLD** until original evidence is supplied. This is not a general customer booking/payment launch signoff.

## Coordination
Protocol 1.1 remains backward-compatible with 1.0. No peer app deployments, shared universal secret, original Windows owner receiver or fake CONNECTED claim.
