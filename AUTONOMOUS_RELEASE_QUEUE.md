# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 332 — Durable Maintenance Vehicle Identity Preference** is GREEN and closed at exact SHA `53efa5d2b616ab0694a5ea9e3165119856b15953`. At active-work start, `dev == main` on that SHA.

## Active — Build 333

Branch: `build333-authenticated-booking-vehicle-persistence`

Scope: **Authenticated Booking Vehicle Persistence**.

The signed-in booking wizard already exposes saved garage vehicles, but checkout currently drops their durable identity. This release persists the authenticated customer profile and, when a garage vehicle is selected, persists the saved vehicle only after server-side same-profile ownership verification.

### Acceptance checklist

- Keep guest checkout valid with both ownership IDs null.
- Derive authenticated `customer_profile_id` only from the HttpOnly customer session.
- Reject any browser-supplied `customer_profile_id`.
- Treat the booking garage vehicle UUID as an untrusted selector only.
- Reload the selected saved vehicle using both vehicle UUID and authenticated profile UUID before persistence.
- Reject anonymous saved-vehicle selection, cross-profile selection and conflicting selector sources.
- Persist authenticated profile-only identity when no saved garage vehicle is selected.
- Clear stale booking selector state on booking-page entry.
- Clear saved-vehicle selection when year/make/model/size is manually changed after a garage choice.
- Do not create or modify `customer_vehicles` during checkout.
- Do not backfill historical bookings.
- Do not change package/add-on pricing, appointment capacity, booking/job status, payment settlement, membership or recurring-service behavior.
- Extend Booking Vehicle Identity Authority with executable guest/authenticated/injection tests and source guards.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development is GREEN; require source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, re-inspect the customer garage and booking completion paths for a bounded post-service vehicle update slice: mileage/last-service metadata may be synchronized only where the completed booking has durable same-profile vehicle identity. Otherwise keep the saved vehicle unchanged and fail closed. Fleet lead-to-quote handoff remains another candidate after this customer-vehicle lifecycle is coherent.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
