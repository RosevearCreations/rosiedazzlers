# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 329 — Live Fleet Account Intake & Pipeline** is GREEN and closed at exact SHA `7a498b084b5f777418b8974517017be39bfb89c0`. At active-work start, `dev == main` on that SHA.

## Active — Build 330

Branch: `build330-maintenance-retention-followup`

Scope: **Maintenance Retention Review & Follow-up**.

The current Value Additions page can display maintenance waitlist and reminder-candidate evidence but cannot operate a controlled staff follow-up workflow. The live database already supplies suitable schema authorities, so this release remains schema-free.

### Acceptance checklist

- Add authenticated `/admin-maintenance-retention.html` with live waitlist and vehicle-aware reminder-candidate review.
- Permit maintenance-interest writes only to `new`, `contacted`, `interested`, `closed`, or `unsubscribed`.
- Explicitly block `scheduled` and `converted`; those states require approved booking/conversion evidence.
- Fix the active staff workflow to align with the live membership-interest database status constraint.
- Derive reminder review targets server-side from the current vehicle-aware candidate engine; never trust client-supplied customer/vehicle identity.
- Record review evidence only in existing `vehicle_history_events` with `customer_visible=false`.
- Allow internal review outcomes only: `reviewed`, `contacted`, `no_contact_needed`.
- Block `contacted` when vehicle identity is unresolved.
- Do not write to `notification_events`, send email/SMS, suppress the reminder engine, create bookings, reserve capacity, mark conversion, touch payment providers, or enable recurring billing.
- Add release-number-independent Maintenance Retention Follow-up Authority for every `build*`, `dev`, and `main` push.
- Executable synthetic tests must prove safe status transitions, forbidden conversion/scheduling, internal-only review events, and metrics because the live database currently has no completed bookings.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate, Maintenance Retention Follow-up Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require both source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development GREEN; require both source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, re-inspect current fleet/maintenance evidence. Historical booking-to-saved-vehicle identity resolution remains a likely next candidate, but it requires explicit schema authority because bookings currently do not carry a durable `customer_vehicle_id` link.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Source promotion never authorizes a database migration.
