# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 330 — Maintenance Retention Review & Follow-up** is GREEN and closed at exact SHA `89aeab07d9e8f88fa020e3713649e21aa4a4a875`. At active-work start, `dev == main` on that SHA.

## Active — Build 331

Branch: `build331-durable-booking-vehicle-identity`

Scope: **Durable Booking Vehicle Identity**.

The accepted maintenance workflow still has to reconstruct completed-booking vehicle identity from snapshots. This release adds a nullable durable booking→saved-vehicle authority and an explicit staff resolution workflow. It does not auto-link historical data and does not trust anonymous browser-supplied saved-vehicle IDs.

### Acceptance checklist

- Add nullable `bookings.customer_vehicle_id uuid`.
- Add FK to `customer_vehicles(id)` with `ON DELETE SET NULL` plus a partial index.
- Require a booking customer profile whenever `customer_vehicle_id` is non-null.
- Do not auto-backfill any historical booking during migration.
- Add staff-only `/api/admin/booking_vehicle_identity` using `manage_bookings` authority.
- Verify the selected saved vehicle belongs to the booking's existing `customer_profile_id` before linking.
- Permit explicit unlinking without changing customer ownership or any other booking field.
- Add authenticated `/admin-booking-vehicle-identity.html` with unresolved/all views and saved-vehicle candidates scoped to the booking profile.
- Keep booking status, job status, date/slot, pricing, payment, membership and recurring scheduling out of this write path.
- Keep guest checkout valid and nullable; do not trust a client-supplied saved-vehicle UUID.
- Add release-number-independent Booking Vehicle Identity Authority for every `build*`, `dev`, and `main` push.
- Exact feature SHA must pass Current Source Gate, Booking Vehicle Identity Authority and Cloudflare feature deployment.
- Apply and verify the additive schema as a separate deliberate migration step; source promotion alone does not apply it.
- Fast-forward `dev` only after feature/source/schema evidence is GREEN; require source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development is GREEN; require source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, re-inspect the maintenance reader and checkout ownership path. A likely next slice is to make completed-history grouping prefer the durable booking vehicle key and, only where authenticated ownership can be proved server-side, persist the saved vehicle prospectively at booking time.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
