import assert from "node:assert/strict";
import { buildRetentionRebookingLearning } from "../functions/api/_lib/retention-rebooking-learning.js";

const learning = buildRetentionRebookingLearning({
  bookings: [
    {
      id: "b1",
      customer_profile_id: "p1",
      status: "completed",
      completed_at: "2026-01-10T12:00:00Z",
      created_at: "2026-01-01T12:00:00Z",
      package_code: "basic",
      vehicle_size: "medium"
    },
    {
      id: "b2",
      customer_profile_id: "p1",
      status: "confirmed",
      created_at: "2026-03-11T12:00:00Z",
      package_code: "complete",
      vehicle_size: "medium"
    },
    {
      id: "b3",
      customer_profile_id: "p2",
      status: "completed",
      completed_at: "2026-02-01T12:00:00Z",
      created_at: "2026-01-20T12:00:00Z",
      package_code: "premium",
      vehicle_size: "small"
    },
    {
      id: "b4",
      status: "completed",
      completed_at: "2026-02-02T12:00:00Z",
      created_at: "2026-01-21T12:00:00Z",
      package_code: "premium",
      vehicle_size: "small"
    }
  ],
  maintenance_interest: [
    { status: "interested", preferred_cycle: "monthly", vehicle_count: 1 },
    { status: "new", preferred_cycle: "monthly", vehicle_count: 2 }
  ],
  customer_profiles: [
    { id: "p1", notification_opt_in: true, notification_channel: "email" },
    { id: "p2", notification_opt_in: false, notification_channel: "email" }
  ],
  notification_events: [
    { customer_profile_id: "p1", channel: "email", status: "sent", sent_at: "2026-03-01T12:00:00Z" },
    { customer_profile_id: "p2", channel: "email", status: "cancelled", processed_at: "2026-03-01T12:05:00Z" },
    { customer_profile_id: "missing", channel: "email", status: "queued" }
  ]
});

assert.equal(learning.build, 429);
assert.equal(learning.mode, "retention_rebooking_learning");
assert.equal(learning.evidence_status, "partial");
assert.equal(learning.repeat_booking.repeat_customers, 1);
assert.equal(learning.repeat_booking.completed_jobs_with_later_booking, 1);
assert.equal(learning.repeat_booking.rows_missing_exact_profile_id, 1);
assert.equal(learning.repeat_booking.elapsed_days.count, 1);
assert.equal(learning.repeat_booking.elapsed_days.average, 60);
assert.equal(learning.repeat_booking.package_transitions[0].transition, "basic → complete");
assert.equal(learning.maintenance_interest.total, 2);
assert.equal(learning.maintenance_interest.preferred_cycle_counts.monthly, 2);
assert.equal(learning.maintenance_interest.followup_eligibility_inferred, false);
assert.equal(learning.communication.current_explicit_opt_in_profiles, 1);
assert.equal(learning.communication.current_not_opted_in_profiles, 1);
assert.equal(learning.communication.provider_dependent_events, 2);
assert.equal(learning.communication.events_missing_current_profile, 1);
assert.equal(learning.boundaries.marketing_consent_inferred, false);
assert.equal(learning.boundaries.automatic_outreach_allowed, false);
assert.equal(learning.boundaries.automatic_booking_allowed, false);
assert.equal(learning.boundaries.customer_identity_exposed, false);
assert.equal(learning.boundaries.causation_claimed_from_counts, false);

const unavailable = buildRetentionRebookingLearning({});
assert.equal(unavailable.evidence_status, "unavailable");
assert.equal(unavailable.repeat_booking.status, "unavailable");
assert.equal(unavailable.maintenance_interest.status, "unavailable");
assert.equal(unavailable.communication.status, "unavailable");

console.log("RETENTION & REBOOKING LEARNING TEST: PASS");
console.log(" - repeat booking evidence uses exact canonical customer_profile_id only");
console.log(" - counts and elapsed-time evidence remain correlation, not causal proof");
console.log(" - maintenance interest is aggregate and does not infer consent or enrollment");
console.log(" - provider acceptance remains distinct from final delivery");
console.log(" - no outreach, booking, discount, provider or schema mutation is authorized");
