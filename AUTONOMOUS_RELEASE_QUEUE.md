# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 331 — Durable Booking Vehicle Identity** is GREEN and closed at exact SHA `491b79da69f1f23a0b733cf9e6a34159811715de`. At active-work start, `dev == main` on that SHA.

## Active — Build 332

Branch: `build332-durable-maintenance-vehicle-identity`

Scope: **Durable Maintenance Vehicle Identity Preference**.

The booking schema now carries an optional staff-confirmed saved-vehicle UUID, but maintenance/reminder grouping still starts from vehicle snapshots. This release makes the durable booking link primary authority and keeps the older matching path only for unlinked legacy history.

### Acceptance checklist

- Read `bookings.customer_vehicle_id` with completed booking history.
- Resolve a present durable vehicle ID before year/make/model/size or plate matching.
- Resolve that durable ID only inside the booking profile's saved-vehicle set.
- Treat a missing/mismatched durable vehicle link as unreliable and fail closed; do not rescue it using snapshot or plate heuristics.
- Report valid durable identity as `booking_vehicle_link` and invalid durable identity as `booking_vehicle_link_invalid`.
- Keep the stable internal saved-vehicle key so linked and older unlinked evidence for the same saved vehicle converge into one maintenance history.
- Upgrade grouped identity authority to the durable source whenever valid linked evidence is present.
- Preserve the accepted legacy fallback for rows without a durable link: unique saved-vehicle match, then opaque plate identity, then isolated/unreliable history.
- Keep reminder eligibility fail-closed through `vehicle_identity_required` for invalid/ambiguous identities.
- Extend executable synthetic tests for durable precedence, convergence and invalid-link fail-closed behavior.
- Extend the cumulative maintenance source checker so these rules cannot regress silently.
- No database migration or historical data mutation is introduced.
- Do not create bookings, quotes, appointments, payments, membership enrollment or recurring billing.
- Exact feature SHA must pass Current Source Gate, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority, Fleet Account Pipeline Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development is GREEN; require source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, re-inspect authenticated customer/booking ownership paths. Prospective saved-vehicle persistence at checkout is a candidate only where the server can prove the signed-in customer owns the selected saved vehicle; anonymous browser-supplied UUIDs must remain untrusted.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
