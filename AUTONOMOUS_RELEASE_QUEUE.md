# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 333 — Authenticated Booking Vehicle Persistence** is GREEN and closed at exact SHA `c87c66786be8d24a1883109f6f84efa4ed3f6a84`. At active-work start, `dev == main` on that SHA.

## Active — Build 334

Branch: `build334-durable-vehicle-service-history-sync`

Scope: **Durable Completed-Service Vehicle History Sync**.

Authoritative staff completion now has enough durable booking/customer/vehicle identity to synchronize verified service facts back to the owned saved vehicle without snapshot guessing.

### Acceptance checklist

- Run only after the booking has successfully transitioned to `job_status = completed`.
- Require non-null `customer_profile_id` and `customer_vehicle_id`.
- Reload the saved vehicle using both IDs before any write.
- Leave the saved vehicle untouched when durable identity is missing or mismatched.
- Never fall back to year/make/model/plate matching.
- Persist `last_package_code` and normalized `last_addons` from the completed booking.
- Advance `last_wash_at` only for current packages that include an exterior hand wash.
- Advance `mileage_km` only when completed-booking mileage is valid and not lower than the saved value.
- Never write `service_interval_days`, `next_cleaning_due_at`, `next_service_mileage_km`, or `auto_schedule_opt_in` from completion.
- Do not create saved vehicles or backfill historical bookings.
- Record sync outcome in the completion event/response for operational visibility.
- Keep payment, pricing, appointment capacity, membership, recurring-service and final-balance behavior unchanged.
- No database migration is introduced.
- Extend durable Booking Vehicle Identity and booking-completion authorities with executable behavior proof.
- Exact feature SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require exact-SHA source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development is GREEN; require exact-SHA source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, inspect controlled fleet lead → quote/customer-account handoff and the stale fleet mini-CRM surfaces. Prefer a bounded convergence slice that reuses the accepted fleet pipeline rather than creating a second competing lead authority.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
