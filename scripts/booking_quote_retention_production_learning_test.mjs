import assert from "node:assert/strict";
import { buildBookingQuoteRetentionProductionLearning } from "../functions/api/_lib/booking-quote-retention-production-learning.js";

const result = buildBookingQuoteRetentionProductionLearning({
  generated_at: "2026-09-19T20:00:00.000Z",
  source_status: {
    booking_rebooking_funnel: { available: true },
    retention_rebooking_learning: { available: true },
    quote_pipeline_list: { available: true }
  },
  funnel: {
    window: { days: 90 },
    booking_funnel: {
      funnel_start_sessions: 100,
      checkout_started_sessions: 50,
      checkout_completed_sessions: 40,
      start_to_checkout_completion_pct: 40,
      checkout_completion_pct: 80,
      abandoned_after_checkout_start: 10,
      stages: [
        { key: "step_1", label: "Date + vehicle", sessions: 100, drop_from_previous: null, drop_from_previous_pct: null },
        { key: "step_2", label: "Package", sessions: 70, drop_from_previous: 30, drop_from_previous_pct: 30 },
        { key: "step_3", label: "Add-ons", sessions: 60, drop_from_previous: 10, drop_from_previous_pct: 14.3 }
      ]
    },
    repeat_booking_outcomes: {
      observed_linked_customers: 20,
      observed_repeat_customers: 6,
      observed_repeat_customer_pct: 30,
      customers_rebooked_in_window: 4,
      completed_repeat_services_in_window: 3,
      median_days_previous_to_repeat_booking: 75
    },
    coverage: { analytics_possibly_truncated: false, booking_history_possibly_truncated: false }
  },
  retention: {
    learning: {
      repeat_booking: { status: "ready", exact_profile_rows: 30, completed_jobs_with_later_booking: 6 },
      maintenance_interest: { status: "partial", total: 5, vehicles_requested: 7, preferred_cycle_counts: { monthly: 2 }, exact_profile_linkage: "unavailable_from_current_source" },
      communication: { status: "partial", event_count: 12, provider_dependent_events: 2, definitive_delivered_events: 7, current_explicit_opt_in_profiles: 8 }
    }
  },
  quote_rows: [
    { customer_name: "Private A", customer_email: "a@example.test", status: "sent", quoted_amount_cents: 30000, sent_at: "2026-09-10T00:00:00Z" },
    { customer_name: "Private B", customer_email: "b@example.test", status: "accepted", quoted_amount_cents: 40000, accepted_amount_cents: 40000, sent_at: "2026-09-11T00:00:00Z", accepted_at: "2026-09-12T00:00:00Z" },
    { customer_name: "Private C", customer_email: "c@example.test", status: "declined", quoted_amount_cents: 25000, sent_at: "2026-09-12T00:00:00Z", declined_at: "2026-09-13T00:00:00Z" }
  ]
});

assert.equal(result.evidence_status, "partial");
assert.equal(result.booking.largest_observed_stage_drop.stage, "Package");
assert.equal(result.quotes.rows_observed, 3);
assert.equal(result.quotes.accepted_quotes, 1);
assert.equal(result.repeat_booking.observed_repeat_customers, 6);
assert.equal(result.communication.provider_dependent_events, 2);
assert.equal(result.boundaries.correlation_only, true);
assert.equal(result.boundaries.automatic_outreach_allowed, false);
assert.equal(result.boundaries.pricing_mutation_allowed, false);
assert.equal(result.boundaries.automatic_booking_allowed, false);
assert.equal(result.boundaries.provider_mutation_allowed, false);
const serialized = JSON.stringify(result);
assert.equal(serialized.includes("Private A"), false);
assert.equal(serialized.includes("a@example.test"), false);
assert.equal(serialized.includes("customer_name"), false);
assert.equal(serialized.includes("customer_email"), false);
assert.ok(result.priorities.some((row) => row.area === "communication_delivery" && row.evidence_state === "provider_dependent"));

console.log("BUILD 441 BOOKING QUOTE RETENTION PRODUCTION LEARNING TEST: PASS");
